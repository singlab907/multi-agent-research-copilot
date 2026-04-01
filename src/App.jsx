import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import { WelcomeContent } from './screens/WelcomeScreen'
import { ErrorContent }   from './screens/ErrorScreen'
import WizardScreen       from './screens/WizardScreen'

// ── State machine ─────────────────────────────────────────────────────────────
// idle → wizard (steps 1–4) → idle (New Research)
//                          └──→ error → idle (retry)

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [appState,    setAppState]    = useState('idle')
  const [query,       setQuery]       = useState('')
  const [wizardStep,  setWizardStep]  = useState(1)   // 1–4
  const [stepLoading, setStepLoading] = useState(false)

  // Editable agent outputs
  const [plannerOutput,    setPlannerOutput]    = useState([])
  const [researcherOutput, setResearcherOutput] = useState([])
  const [writerOutput,     setWriterOutput]     = useState({ title: '', sections: [] })
  const [viewingStep,      setViewingStep]      = useState(null) // null = current step; 1–3 = past step read-only

  // Skip state
  const [researchSkipped, setResearchSkipped] = useState(false)

  // Planner API state — driven by real API response
  const [plannerSubtopics,          setPlannerSubtopics]          = useState([]) // raw {id,title,description} objects
  const [researchRecommended,       setResearchRecommended]       = useState(true)
  const [researchRecommendedReason, setResearchRecommendedReason] = useState('')
  const [plannerDurationMs,         setPlannerDurationMs]         = useState(null)

  // Researcher API state
  const [researcherDurationMs, setResearcherDurationMs] = useState(null)

  // Writer API state
  const [writerDurationMs, setWriterDurationMs] = useState(null)

  // Evaluator API state
  const [evaluationData,    setEvaluationData]    = useState(null)
  const [evaluatorDurationMs, setEvaluatorDurationMs] = useState(null)

  // History
  const [history, setHistory] = useState([])

  // Error details
  const [errorMessage, setErrorMessage] = useState('')

  // Fetch history on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/history`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setHistory(data))
      .catch(() => {})
  }, [])

  // ── Sidebar pipeline tracker mapping ────────────────────────────────────────
  // agentStep = number of fully-completed agents shown as green in sidebar
  // wizardStep=1 → Planner active (agentStep=0)
  // wizardStep=2 → Researcher active (agentStep=1)
  // wizardStep=3 → Writer active (agentStep=2)
  // wizardStep=4 loading → Evaluator active (agentStep=3)
  // wizardStep=4 done → all complete (appState driven to 'complete')
  const sidebarAgentStep = wizardStep - 1
  const sidebarAppState  =
    appState !== 'wizard'             ? appState :
    wizardStep === 4 && !stepLoading  ? 'complete' :
                                        'processing'

  // Per-agent durations shown in sidebar (index 0–3 = Planner/Researcher/Writer/Evaluator)
  const agentDurations = [
    plannerDurationMs    != null ? (plannerDurationMs    / 1000).toFixed(1) + 's' : null,
    researcherDurationMs != null ? (researcherDurationMs / 1000).toFixed(1) + 's' : null,
    writerDurationMs     != null ? (writerDurationMs     / 1000).toFixed(1) + 's' : null,
    evaluatorDurationMs  != null ? (evaluatorDurationMs  / 1000).toFixed(1) + 's' : null,
  ]

  // ── Handlers ────────────────────────────────────────────────────────────────
  async function handleSubmit(q) {
    setQuery(q)
    setWizardStep(1)
    setStepLoading(true)
    setResearchSkipped(false)
    setPlannerDurationMs(null)
    setResearchRecommendedReason('')
    setAppState('wizard')

    try {
      const res = await fetch(`${API_BASE}/api/agent/planner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setPlannerSubtopics(data.subtopics)
      setPlannerOutput(data.subtopics.map(s => s.title))
      setResearchRecommended(data.research_recommended)
      setResearchRecommendedReason(data.research_recommendation_reason)
      setPlannerDurationMs(data.duration_ms)
      setStepLoading(false)
    } catch (err) {
      const msg = err.message.includes('fetch')
        ? 'Backend not connected. Start the server with: uvicorn main:app --port 8000'
        : err.message
      setErrorMessage(msg)
      setAppState('error')
    }
  }

  // Navigate to step 2 WITHOUT starting research — show pre-decision UI
  function handleProceedFromPlanner() {
    setResearcherOutput([])
    setWizardStep(2)
    setStepLoading(false)
  }

  // Called when user clicks "Run Research →" on the researcher pre-decision screen
  async function handleRunResearch() {
    setStepLoading(true)
    setResearcherDurationMs(null)

    // Merge user-edited titles back into the subtopic objects
    const subtopics = plannerSubtopics.map((s, i) => ({
      ...s,
      title: plannerOutput[i] ?? s.title,
    })).filter((_, i) => plannerOutput[i]?.trim())

    try {
      const res = await fetch(`${API_BASE}/api/agent/researcher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, subtopics }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }
      const data = await res.json()

      // Map API shape → frontend shape
      // API: { subtopic_id, subtopic_title, findings: string, sources: [{title, url}] }
      // Frontend: { heading, findings: string[], personalNote, sources: [{title, publication, year}] }
      const research = data.research.map(item => ({
        heading:      item.subtopic_title,
        findings:     [item.findings],          // single prose block → one editable textarea
        personalNote: '',
        sources:      item.sources.map(s => ({
          title:       s.title,
          publication: s.url,                   // store URL in publication field for display
          year:        '',
        })),
      }))

      setResearcherOutput(research)
      setResearcherDurationMs(data.duration_ms)
      setStepLoading(false)
    } catch (err) {
      const msg = err.message.includes('fetch')
        ? 'Backend not connected. Start the server with: uvicorn main:app --port 8000'
        : err.message
      setErrorMessage(msg)
      setAppState('error')
    }
  }

  async function _callWriter(researchUsed, researchItems) {
    setWizardStep(3)
    setStepLoading(true)
    setWriterDurationMs(null)

    const subtopics = plannerSubtopics.map((s, i) => ({
      ...s,
      title: plannerOutput[i] ?? s.title,
    })).filter((_, i) => plannerOutput[i]?.trim())

    try {
      const res = await fetch(`${API_BASE}/api/agent/writer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          subtopics,
          research: researchItems,
          research_used: researchUsed,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }
      const data = await res.json()
      // API report shape matches frontend writerOutput shape directly
      setWriterOutput(data.report)
      setWriterDurationMs(data.duration_ms)
      setStepLoading(false)
    } catch (err) {
      const msg = err.message.includes('fetch')
        ? 'Backend not connected. Start the server with: uvicorn main:app --port 8000'
        : err.message
      setErrorMessage(msg)
      setAppState('error')
    }
  }

  // Skip researcher — go directly to Writer with no research data
  function handleSkipToWriter() {
    setResearchSkipped(true)
    _callWriter(false, null)
  }

  function handleProceedFromResearcher() {
    // Map frontend researcherOutput back to API ResearchItem shape
    const researchItems = researcherOutput.map((topic, i) => ({
      subtopic_id:    plannerSubtopics[i]?.id ?? String(i + 1),
      subtopic_title: topic.heading,
      findings:       topic.findings.join('\n\n') + (topic.personalNote ? `\n\nPersonal note: ${topic.personalNote}` : ''),
      sources:        topic.sources.map(s => ({ title: s.title, url: s.publication || '' })),
    }))
    _callWriter(true, researchItems)
  }

  // Skip research from the researcher page (pre-decision UI)
  function handleSkipResearch() {
    handleSkipToWriter()
  }

  async function handleProceedFromWriter() {
    setWizardStep(4)
    setStepLoading(true)
    setEvaluationData(null)
    setEvaluatorDurationMs(null)

    try {
      const res = await fetch(`${API_BASE}/api/agent/evaluator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, report: writerOutput }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setEvaluationData(data)
      setEvaluatorDurationMs(data.duration_ms)
      setStepLoading(false)
    } catch (err) {
      const msg = err.message.includes('fetch')
        ? 'Backend not connected. Start the server with: uvicorn main:app --port 8000'
        : err.message
      setErrorMessage(msg)
      setAppState('error')
    }
  }

  function handleNewResearch() {
    setQuery('')
    setWizardStep(1)
    setStepLoading(false)
    setViewingStep(null)
    setResearchSkipped(false)
    setPlannerOutput([])
    setResearcherOutput([])
    setWriterOutput({ title: '', sections: [] })
    setResearchRecommended(true)
    setResearchRecommendedReason('')
    setPlannerDurationMs(null)
    setPlannerSubtopics([])
    setResearcherDurationMs(null)
    setWriterDurationMs(null)
    setEvaluationData(null)
    setEvaluatorDurationMs(null)
    setErrorMessage('')
    setAppState('idle')
  }

  async function handleSaveResult({ report, evaluation, revisionHappened }) {
    try {
      await fetch(`${API_BASE}/api/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          report,
          evaluation,
          research_used: !researchSkipped,
          research_skipped: researchSkipped,
          revision_happened: revisionHappened,
        }),
      })
      // Refresh history list
      const updated = await fetch(`${API_BASE}/api/history`).then(r => r.json()).catch(() => [])
      setHistory(updated)
    } catch (_) {
      // Save failures are silent — don't interrupt the user
    }
  }

  async function handleLoadHistoryEntry(id) {
    try {
      const entry = await fetch(`${API_BASE}/api/history/${id}`).then(r => r.json())
      setQuery(entry.query)
      setWriterOutput(entry.full_report)
      setEvaluationData(entry.full_evaluation)
      setEvaluatorDurationMs(entry.full_evaluation.duration_ms ?? null)
      setResearchSkipped(entry.research_skipped)
      setResearcherOutput([])
      setViewingStep(null)
      setWizardStep(4)
      setStepLoading(false)
      setAppState('wizard')
    } catch (_) {}
  }

  function handleRetry() {
    setErrorMessage('')
    setAppState('idle')
  }

  function handleViewStep(step) {
    setViewingStep(step)
  }

  function handleBackToCurrentStep() {
    setViewingStep(null)
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  const pipelineStatus = { appState: sidebarAppState, agentStep: sidebarAgentStep, researchSkipped }

  return (
    <Layout
      activeNav="Research"
      activeTopNav="Workspace"
      pipelineStatus={pipelineStatus}
      agentDurations={agentDurations}
      onNewResearch={handleNewResearch}
      viewingStep={viewingStep}
      onViewStep={handleViewStep}
      history={history}
      onLoadHistory={handleLoadHistoryEntry}
    >
      <div
        key={appState === 'wizard' ? `wizard-${viewingStep ?? wizardStep}` : appState}
        style={{ animation: 'fadeSlideIn 0.25s ease both' }}
      >
        {appState === 'idle' && (
          <WelcomeContent onSubmit={handleSubmit} />
        )}

        {appState === 'wizard' && (
          <WizardScreen
            step={wizardStep}
            stepLoading={stepLoading}
            query={query}
            plannerOutput={plannerOutput}
            researcherOutput={researcherOutput}
            writerOutput={writerOutput}
            onPlannerChange={setPlannerOutput}
            onResearcherChange={setResearcherOutput}
            onWriterChange={setWriterOutput}
            onProceedFromPlanner={handleProceedFromPlanner}
            onSkipToWriter={handleSkipToWriter}
            onRunResearch={handleRunResearch}
            onProceedFromResearcher={handleProceedFromResearcher}
            onSkipResearch={handleSkipResearch}
            onProceedFromWriter={handleProceedFromWriter}
            onNewResearch={handleNewResearch}
            displayStep={viewingStep}
            onBackToCurrentStep={handleBackToCurrentStep}
            researchRecommended={researchRecommended}
            researchRecommendedReason={researchRecommendedReason}
            plannerDurationMs={plannerDurationMs}
            researcherDurationMs={researcherDurationMs}
            writerDurationMs={writerDurationMs}
            evaluationData={evaluationData}
            evaluatorDurationMs={evaluatorDurationMs}
            researchSkipped={researchSkipped}
            onError={(msg) => { setErrorMessage(msg); setAppState('error') }}
            onSaveResult={handleSaveResult}
          />
        )}

        {appState === 'error' && (
          <ErrorContent
            errorCode={errorMessage || 'ERR_AGENT_PLANNER'}
            subsystem="PLANNER_AGENT_V1"
            onRetry={handleRetry}
          />
        )}
      </div>
    </Layout>
  )
}
