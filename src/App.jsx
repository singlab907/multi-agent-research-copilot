import { useState } from 'react'
import Layout from './components/Layout'
import { WelcomeContent } from './screens/WelcomeScreen'
import { ErrorContent }   from './screens/ErrorScreen'
import WizardScreen       from './screens/WizardScreen'

// ── State machine ─────────────────────────────────────────────────────────────
// idle → wizard (steps 1–4) → idle (New Research)
//                          └──→ error → idle (retry)

// ── Mock data generators ──────────────────────────────────────────────────────
function buildPlannerOutput() {
  return [
    'Introduction & Background',
    'Market Drivers & Adoption',
    'Technology Landscape',
    'Risks & Challenges',
    'Future Outlook & Conclusion',
  ]
}

function buildResearcherOutput(subtopics) {
  const data = [
    {
      findings: [
        'Enterprise software is shifting from deterministic rule-based systems toward generative cognitive layers capable of autonomous reasoning.',
        'GenAI adoption in Fortune 500 companies grew 218% between 2022 and 2024, driven by LLM integration into core business operations.',
      ],
      sources: [
        { title: 'Synthesis of LLM Integration in Global Financial Systems (2024)', publication: 'MIT Technology Review', year: '2024' },
        { title: 'GenAI Enterprise Adoption Report', publication: 'Gartner', year: '2024' },
      ],
    },
    {
      findings: [
        'Cost reduction through automation of repetitive knowledge-work tasks is the primary driver, with enterprises reporting 35–60% efficiency gains.',
        '72% of surveyed enterprises are actively shifting from passive software to autonomous AI agents managing cross-departmental workflows.',
      ],
      sources: [
        { title: 'The Economic Impact of Agentic Workflow Automation', publication: 'MIT Technology Review', year: '2024' },
        { title: 'AI-Driven Enterprise Productivity Index', publication: 'McKinsey Global Institute', year: '2023' },
      ],
    },
    {
      findings: [
        'Vertical AI — models fine-tuned on proprietary industry data — is outpacing general-purpose LLMs in enterprise settings for domain-specific accuracy.',
        'Multimodal models capable of processing text, code, images, and structured data simultaneously are becoming standard enterprise infrastructure.',
      ],
      sources: [
        { title: 'Vertical AI and Industry-Specific Model Performance', publication: 'Stanford AI Index', year: '2024' },
        { title: 'Enterprise LLM Benchmark Report', publication: 'Hugging Face Research', year: '2024' },
      ],
    },
    {
      findings: [
        'Hallucination rates in enterprise-grade models remain a critical blocker; accuracy thresholds below 99.5% are unacceptable for financial and legal applications.',
        'Data sovereignty regulations (GDPR, AI Act) create significant legal friction for cloud-hosted model inference on sensitive data.',
      ],
      sources: [
        { title: 'Data Sovereignty in the Age of Generative Intelligence — Legal Frameworks Vol. IV', publication: 'Harvard Law Review', year: '2024' },
        { title: 'AI Hallucination Risk in Regulated Industries', publication: 'NIST', year: '2023' },
      ],
    },
    {
      findings: [
        'GenAI-integrated enterprise software market projected to reach $450B by 2027, with ERP and CRM sectors leading adoption.',
        'Edge deployment architectures are gaining traction to address latency, cost, and data residency concerns at scale.',
      ],
      sources: [
        { title: 'Enterprise AI Market Forecast 2027', publication: 'IDC Research', year: '2024' },
        { title: 'Edge Inference: The Next Frontier for Enterprise AI', publication: 'IEEE Spectrum', year: '2024' },
      ],
    },
  ]

  return subtopics.map((heading, i) => ({
    heading,
    findings:     (data[i] || data[0]).findings,
    personalNote: '',
    sources:      (data[i] || data[0]).sources,
  }))
}

function buildWriterOutput(researcherOutput) {
  const intro = `Generative Artificial Intelligence is no longer a peripheral experiment — it represents a foundational architectural shift in how enterprise software is conceived, built, and deployed. This report examines the multi-dimensional impact of GenAI on the enterprise software landscape, drawing on cross-industry data and agent-synthesised research to deliver actionable intelligence for technology leaders navigating this transition.`

  const conclusion = `We are entering the era of cognitive enterprise software. Organisations that proactively integrate agentic AI frameworks into their core stack will define the competitive landscape of the next decade. Those that delay risk structural obsolescence in a market evolving at machine speed. The window for first-mover advantage is narrow — strategic investment in GenAI infrastructure must begin now.`

  const coreSections = researcherOutput.map((topic) => ({
    heading: topic.heading,
    content: topic.findings.join('\n\n') + (topic.personalNote ? `\n\nAdditional Notes: ${topic.personalNote}` : ''),
  }))

  return {
    title: `The Impact of Generative AI on Enterprise Software`,
    sections: [
      { heading: 'Introduction', content: intro },
      ...coreSections,
      { heading: 'Conclusion',   content: conclusion },
    ],
  }
}

// ── Research recommendation logic ─────────────────────────────────────────────
const RESEARCH_KEYWORDS = ['compare', 'impact', 'analysis', 'analyze', 'analyse', 'data', 'statistics', 'statistic', 'research', 'study', 'evidence', 'trend', 'trends', 'report', 'market']

function isResearchRecommended(query) {
  const lower = query.toLowerCase()
  return RESEARCH_KEYWORDS.some(kw => lower.includes(kw))
}

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

  // Derived: whether research is recommended for current query
  const researchRecommended = isResearchRecommended(query)

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

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleSubmit(q) {
    setQuery(q)
    setPlannerOutput(buildPlannerOutput())
    setWizardStep(1)
    setStepLoading(true)
    setResearchSkipped(false)
    setAppState('wizard')
    // Simulate Planner loading (2s)
    setTimeout(() => setStepLoading(false), 2000)
  }

  // Navigate to step 2 WITHOUT starting research — show pre-decision UI
  function handleProceedFromPlanner() {
    setResearcherOutput([])
    setWizardStep(2)
    setStepLoading(false)
  }

  // Called when user clicks "Run Research →" on the researcher pre-decision screen
  function handleRunResearch() {
    setStepLoading(true)
    const research = buildResearcherOutput(plannerOutput.filter(Boolean))
    setResearcherOutput(research)
    // Simulate Researcher loading (3s)
    setTimeout(() => setStepLoading(false), 3000)
  }

  // Skip researcher — go directly to Writer with subtopics-only draft
  function handleSkipToWriter() {
    const draft = buildWriterOutput(
      plannerOutput.filter(Boolean).map(heading => ({
        heading,
        findings: [],
        personalNote: '',
        sources: [],
      }))
    )
    setWriterOutput(draft)
    setResearchSkipped(true)
    setWizardStep(3)
    setStepLoading(true)
    setTimeout(() => setStepLoading(false), 3000)
  }

  function handleProceedFromResearcher() {
    const draft = buildWriterOutput(researcherOutput)
    setWriterOutput(draft)
    setWizardStep(3)
    setStepLoading(true)
    // Simulate Writer loading (3s)
    setTimeout(() => setStepLoading(false), 3000)
  }

  // Skip research from the researcher page (pre-decision UI)
  function handleSkipResearch() {
    handleSkipToWriter()
  }

  function handleProceedFromWriter() {
    setWizardStep(4)
    setStepLoading(true)
    // Simulate Evaluator loading (2s)
    setTimeout(() => setStepLoading(false), 2000)
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
    setAppState('idle')
  }

  function handleRetry() {
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
      onNewResearch={handleNewResearch}
      viewingStep={viewingStep}
      onViewStep={handleViewStep}
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
            researchSkipped={researchSkipped}
          />
        )}

        {appState === 'error' && (
          <ErrorContent
            errorCode="ERR_CORE_TIMEOUT_042"
            subsystem="WRITER_AGENT_V1"
            onRetry={handleRetry}
          />
        )}
      </div>
    </Layout>
  )
}
