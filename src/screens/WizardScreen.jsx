import { useState } from 'react'

// ── Mock evaluation data (read-only, used in step 4) ──────────────────────────
const MOCK_EVALUATION = {
  accuracy:     { score: 4.2, max: 5, reasoning: 'Sources are credible and findings align with established research. Minor discrepancies in market projection figures noted.' },
  completeness: { score: 4.5, max: 5, reasoning: 'All requested subtopics covered thoroughly. Edge deployment section could benefit from additional technical depth.' },
  clarity:      { score: 4.6, max: 5, reasoning: 'Report is well-structured and accessible. Technical jargon is appropriately contextualised for enterprise audiences.' },
  hallucinationRisk: 'LOW',
  confidence: 85,
  tokenUsage: 1402,
  tokenMax: 4096,
  latencyMs: 284,
}

const CIRC = 2 * Math.PI * 54 // ~339.3

// ── Download helpers ──────────────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}

function triggerDownload(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function buildReportMarkdown(report, researcherOutput) {
  let md = `# ${report.title}\n\n`
  for (const section of report.sections) {
    md += `## ${section.heading}\n\n${section.content}\n\n`
  }
  // Collect all sources from researcher output
  const allSources = researcherOutput.flatMap(t => t.sources)
  if (allSources.length > 0) {
    md += `## Sources\n\n`
    allSources.forEach((src, i) => {
      md += `${i + 1}. ${src.title} — ${src.publication} (${src.year})\n`
    })
    md += '\n'
  }
  return md
}

function buildEvaluationJSON(query) {
  const { accuracy, completeness, clarity, hallucinationRisk, confidence, tokenUsage, tokenMax, latencyMs } = MOCK_EVALUATION
  return JSON.stringify({
    query,
    generatedAt: new Date().toISOString(),
    scores: {
      accuracy:     { score: accuracy.score,     max: accuracy.max,     reasoning: accuracy.reasoning     },
      completeness: { score: completeness.score, max: completeness.max, reasoning: completeness.reasoning },
      clarity:      { score: clarity.score,      max: clarity.max,      reasoning: clarity.reasoning      },
    },
    hallucinationRisk,
    confidence,
    tokenUsage: { used: tokenUsage, max: tokenMax },
    latencyMs,
  }, null, 2)
}

// ── Stepper ───────────────────────────────────────────────────────────────────
const STEP_LABELS = [
  { label: 'Agent Planner',    icon: 'psychology'    },
  { label: 'Agent Researcher', icon: 'search'        },
  { label: 'Agent Writer',     icon: 'edit_note'     },
  { label: 'Agent Evaluator',  icon: 'verified_user' },
]

function Stepper({ currentStep }) {
  return (
    <div className="flex items-center px-6 py-4 bg-surface border-b border-white/5 overflow-x-auto">
      {STEP_LABELS.map(({ label, icon }, i) => {
        const stepNum  = i + 1
        const isDone   = stepNum < currentStep
        const isActive = stepNum === currentStep
        return (
          <div key={label} className="flex items-center shrink-0">
            {i > 0 && (
              <span
                className="material-symbols-outlined mx-1 sm:mx-2 shrink-0"
                style={{
                  fontSize: 14,
                  color: isDone ? '#4ade80' : 'rgba(226,226,235,0.12)',
                }}
              >
                chevron_right
              </span>
            )}
            <div className="flex items-center gap-2">
              <div
                className={[
                  'w-6 h-6 flex items-center justify-center text-[11px] font-mono font-bold border shrink-0 transition-all duration-200',
                  isDone   ? 'bg-emerald-400/10 border-emerald-400 text-emerald-400' :
                  isActive ? 'bg-primary/10 border-primary text-primary' :
                             'bg-surface-container border-outline-variant/20 text-on-surface/20',
                ].join(' ')}
                style={isActive ? { boxShadow: '0 0 0 3px rgba(255,112,46,0.15)' } : undefined}
              >
                {isDone
                  ? <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>check</span>
                  : stepNum}
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <span
                  className="material-symbols-outlined shrink-0"
                  style={{
                    fontSize: 12,
                    color: isDone   ? '#4ade80' :
                           isActive ? '#FF702E' :
                                      'rgba(226,226,235,0.2)',
                  }}
                >
                  {icon}
                </span>
                <span className={[
                  'text-[11px] font-mono uppercase tracking-wider',
                  isDone   ? 'text-emerald-400' :
                  isActive ? 'text-primary' :
                             'text-on-surface/20',
                ].join(' ')}>{label}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Shared loading state ──────────────────────────────────────────────────────
function LoadingState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-6">
      {/* Layered spinner rings */}
      <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
        <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <div className="absolute inset-[5px] border border-primary/10 rounded-full" />
        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
      </div>
      {/* Staggered pulsing dots */}
      <div className="flex items-center gap-1.5">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-1 h-1 bg-primary/60 rounded-full animate-pulse"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
      <p className="font-mono text-xs text-on-surface/40 uppercase tracking-[0.2em]">
        {message}
      </p>
    </div>
  )
}

// ── Shared proceed button ─────────────────────────────────────────────────────
function ProceedButton({ onClick, disabled = false, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bg-primary hover:bg-[#ff8a52] disabled:opacity-40 disabled:cursor-not-allowed text-on-primary font-label font-bold text-[11px] px-8 py-3 uppercase tracking-widest transition-colors active:scale-[0.98]"
    >
      {children}
    </button>
  )
}

// ── "Back to current step" banner (shown when viewing a past step) ────────────
function ReadOnlyBanner({ currentStep, onBack }) {
  return (
    <div className="flex items-center gap-3 px-6 py-2.5 bg-surface-container-low border-b border-outline-variant/15">
      <span className="material-symbols-outlined text-primary/60" style={{ fontSize: 15 }}>visibility</span>
      <p className="font-mono text-[10px] text-on-surface/40 uppercase tracking-wider flex-1">
        Viewing past output — read only
      </p>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 font-mono text-[10px] text-primary hover:text-primary/80 uppercase tracking-wider transition-colors"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>arrow_forward</span>
        Back to {STEP_LABELS[currentStep - 1]?.label ?? `Step ${currentStep}`}
      </button>
    </div>
  )
}

// ── Step 1: Agent Planner ─────────────────────────────────────────────────────
function PlannerStep({ loading, subtopics, onChange, onProceed, readOnly }) {
  if (loading) return <LoadingState message="Agent Planner is analyzing your query…" />

  function update(i, val) {
    const next = [...subtopics]
    next[i] = val
    onChange(next)
  }

  function remove(i) {
    onChange(subtopics.filter((_, idx) => idx !== i))
  }

  function add() {
    onChange([...subtopics, ''])
  }

  if (readOnly) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-6 pb-20">
        <div className="mb-8">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary/60 mb-2">
            Agent Output — Agent Planner
          </div>
          <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">Report Outline</h2>
          <p className="font-body text-on-surface/50 text-sm">
            Subtopics proposed by Agent Planner. This output is read-only when viewing past steps.
          </p>
        </div>
        <ol className="space-y-2">
          {subtopics.filter(Boolean).map((topic, i) => (
            <li key={i} className="flex items-center gap-3 py-2.5 px-3 bg-surface-container-low border border-outline-variant/10">
              <span className="text-primary/50 font-mono text-[11px] shrink-0 w-5 text-right select-none">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-sm text-on-surface/80 font-body">{topic}</span>
            </li>
          ))}
        </ol>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-6 pb-20">
      <div className="mb-8">
        <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary/60 mb-2">
          Agent Output — Agent Planner
        </div>
        <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">
          Report Outline
        </h2>
        <p className="font-body text-on-surface/50 text-sm">
          Agent Planner has proposed the following sections. Edit, remove, or add subtopics before Agent Researcher begins.
        </p>
      </div>

      <div className="space-y-2 mb-5">
        {subtopics.map((topic, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-primary/50 font-mono text-[11px] shrink-0 w-5 text-right select-none">
              {String(i + 1).padStart(2, '0')}
            </span>
            <input
              value={topic}
              onChange={(e) => update(i, e.target.value)}
              className="flex-1 bg-surface-container border border-outline-variant/15 px-3 py-2.5 text-sm text-on-surface font-body cursor-text hover:border-outline-variant/40 focus:outline-none focus:border-primary/50 focus:bg-surface-container-low transition-colors"
              placeholder="Subtopic title…"
            />
            <button
              onClick={() => remove(i)}
              title="Remove subtopic"
              className="text-on-surface/20 hover:text-error transition-colors shrink-0"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={add}
        className="flex items-center gap-1.5 border border-dashed border-outline-variant/20 hover:border-primary/30 text-on-surface/30 hover:text-primary/70 font-mono text-[10px] uppercase tracking-wider transition-colors mb-12 px-3 py-2 w-full justify-center"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>
        Add subtopic
      </button>

      <div className="flex justify-end">
        <ProceedButton onClick={onProceed} disabled={subtopics.filter(Boolean).length === 0}>
          Proceed to Agent Researcher →
        </ProceedButton>
      </div>
    </div>
  )
}

// ── Step 2: Agent Researcher ──────────────────────────────────────────────────
function ResearcherStep({ loading, research, onChange, onProceed, readOnly }) {
  const [newSourceUrls, setNewSourceUrls] = useState(() => research.map(() => ''))

  if (loading) {
    return <LoadingState message={`Agent Researcher is researching ${research.length} subtopic${research.length !== 1 ? 's' : ''}…`} />
  }

  function updateFinding(ti, fi, val) {
    onChange(research.map((t, i) =>
      i !== ti ? t : { ...t, findings: t.findings.map((f, j) => j === fi ? val : f) }
    ))
  }

  function updateNote(ti, val) {
    onChange(research.map((t, i) => i === ti ? { ...t, personalNote: val } : t))
  }

  function removeSource(ti, si) {
    onChange(research.map((t, i) =>
      i !== ti ? t : { ...t, sources: t.sources.filter((_, j) => j !== si) }
    ))
  }

  function addSource(ti) {
    const url = newSourceUrls[ti]?.trim()
    if (!url) return
    onChange(research.map((t, i) =>
      i !== ti ? t : { ...t, sources: [...t.sources, { title: url, publication: 'User-added', year: String(new Date().getFullYear()) }] }
    ))
    setNewSourceUrls(prev => prev.map((u, i) => i === ti ? '' : u))
  }

  function updateNewUrl(ti, val) {
    setNewSourceUrls(prev => prev.map((u, i) => i === ti ? val : u))
  }

  if (readOnly) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-6 pb-20">
        <div className="mb-8">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary/60 mb-2">
            Agent Output — Agent Researcher
          </div>
          <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">Research Findings</h2>
          <p className="font-body text-on-surface/50 text-sm">
            Findings gathered by Agent Researcher. This output is read-only when viewing past steps.
          </p>
        </div>
        <div className="space-y-6">
          {research.map((topic, ti) => (
            <div key={ti} className="bg-surface-container border-l-2 border-primary/30 p-6">
              <h3 className="font-headline text-sm font-semibold text-primary mb-4 uppercase tracking-tight">
                <span className="text-primary/40 mr-2">{String(ti + 1).padStart(2, '0')} —</span>
                {topic.heading}
              </h3>
              <ul className="space-y-2 mb-4">
                {topic.findings.map((f, fi) => (
                  <li key={fi} className="flex items-start gap-2 text-sm text-on-surface/70 font-body leading-relaxed">
                    <span className="mt-2 shrink-0 w-1 h-1 bg-primary/40 block" />
                    {f}
                  </li>
                ))}
              </ul>
              {topic.personalNote && (
                <div className="mb-4 pl-3 border-l border-outline-variant/20">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface/30 block mb-1">Personal Note</span>
                  <p className="text-sm text-on-surface/60 font-body leading-relaxed">{topic.personalNote}</p>
                </div>
              )}
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface/30 block mb-2">Sources</span>
                {topic.sources.map((src, si) => (
                  <div key={si} className="flex items-center gap-2">
                    <span className="text-primary font-mono text-[10px] shrink-0">[{si + 1}]</span>
                    <span className="font-body text-xs text-on-surface/50 truncate">{src.title}</span>
                    <span className="font-mono text-[10px] text-on-surface/25 shrink-0">{src.year}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 pb-20">
      <div className="mb-8">
        <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary/60 mb-2">
          Agent Output — Agent Researcher
        </div>
        <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">
          Research Findings
        </h2>
        <p className="font-body text-on-surface/50 text-sm">
          Review and edit the findings for each subtopic. Add personal notes or additional sources before Agent Writer begins.
        </p>
      </div>

      <div className="space-y-6 mb-10">
        {research.map((topic, ti) => (
          <div key={ti} className="bg-surface-container border-l-2 border-primary/30 p-6">
            <h3 className="font-headline text-sm font-semibold text-primary mb-4 uppercase tracking-tight">
              <span className="text-primary/40 mr-2">{String(ti + 1).padStart(2, '0')} —</span>
              {topic.heading}
            </h3>

            <div className="space-y-2 mb-5">
              {topic.findings.map((finding, fi) => (
                <div key={fi} className="flex items-start gap-2">
                  <span className="mt-3 shrink-0 w-1 h-1 bg-primary/40 block" />
                  <textarea
                    value={finding}
                    onChange={(e) => updateFinding(ti, fi, e.target.value)}
                    rows={2}
                    className="flex-1 bg-surface-container border border-outline-variant/10 px-3 py-2 text-sm text-on-surface/80 font-body cursor-text hover:border-outline-variant/35 focus:outline-none focus:border-primary/40 focus:bg-surface-container-low resize-none transition-colors leading-relaxed"
                  />
                </div>
              ))}
            </div>

            <div className="mb-5">
              <label className="block font-mono text-[10px] uppercase tracking-widest text-on-surface/30 mb-1.5">
                Personal Note
              </label>
              <textarea
                value={topic.personalNote}
                onChange={(e) => updateNote(ti, e.target.value)}
                placeholder="Add your own analysis or notes for this subtopic…"
                rows={2}
                className="w-full bg-surface-container-lowest border border-dashed border-outline-variant/15 px-3 py-2 text-sm text-on-surface/70 font-body cursor-text hover:border-outline-variant/30 focus:outline-none focus:border-primary/30 focus:border-solid resize-none transition-colors placeholder:text-on-surface/20 leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-on-surface/30 mb-2">
                Sources
              </label>
              <div className="space-y-1.5 mb-2">
                {topic.sources.map((src, si) => (
                  <div key={si} className="flex items-center gap-2 group">
                    <span className="text-primary font-mono text-[10px] shrink-0">[{si + 1}]</span>
                    <span className="flex-1 font-body text-xs text-on-surface/50 truncate">{src.title}</span>
                    <span className="font-mono text-[10px] text-on-surface/25 shrink-0">{src.year}</span>
                    <button
                      onClick={() => removeSource(ti, si)}
                      className="text-on-surface/20 hover:text-error transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  value={newSourceUrls[ti] || ''}
                  onChange={(e) => updateNewUrl(ti, e.target.value)}
                  placeholder="Paste source URL or title…"
                  onKeyDown={(e) => { if (e.key === 'Enter') addSource(ti) }}
                  className="flex-1 bg-surface-container-lowest border border-outline-variant/10 px-3 py-1.5 text-xs text-on-surface/60 font-mono focus:outline-none focus:border-primary/30 transition-colors placeholder:text-on-surface/20"
                />
                <button
                  onClick={() => addSource(ti)}
                  className="px-3 py-1.5 border border-primary/30 text-primary/70 hover:border-primary hover:text-primary font-mono text-[10px] uppercase tracking-wider transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <ProceedButton onClick={onProceed}>
          Proceed to Agent Writer →
        </ProceedButton>
      </div>
    </div>
  )
}

// ── Step 3: Agent Writer ──────────────────────────────────────────────────────
function WriterStep({ loading, report, onChange, onProceed, readOnly }) {
  if (loading) return <LoadingState message="Agent Writer is composing your report…" />

  function updateTitle(val) {
    onChange({ ...report, title: val })
  }

  function updateHeading(i, val) {
    onChange({ ...report, sections: report.sections.map((s, j) => j === i ? { ...s, heading: val } : s) })
  }

  function updateContent(i, val) {
    onChange({ ...report, sections: report.sections.map((s, j) => j === i ? { ...s, content: val } : s) })
  }

  if (readOnly) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-6 pb-20">
        <div className="mb-8">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary/60 mb-2">
            Agent Output — Agent Writer
          </div>
          <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">Draft Report</h2>
          <p className="font-body text-on-surface/50 text-sm">
            Draft composed by Agent Writer. This output is read-only when viewing past steps.
          </p>
        </div>
        <div className="mb-6 px-4 py-3 bg-surface-container border border-outline-variant/10">
          <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface/30 block mb-1">Report Title</span>
          <p className="text-xl font-headline font-bold text-on-surface">{report.title}</p>
        </div>
        <div className="space-y-4">
          {report.sections.map((section, i) => (
            <div key={i} className="bg-surface-container border border-outline-variant/10 p-5">
              <p className="text-base font-headline font-semibold text-on-surface mb-3 border-b border-outline-variant/15 pb-2">
                {section.heading}
              </p>
              <p className="text-sm text-on-surface/75 font-body leading-relaxed whitespace-pre-wrap">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 pb-20">
      <div className="mb-8">
        <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary/60 mb-2">
          Agent Output — Agent Writer
        </div>
        <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">
          Draft Report
        </h2>
        <p className="font-body text-on-surface/50 text-sm">
          Review and edit Agent Writer's draft. All sections are editable before evaluation.
        </p>
      </div>

      <div className="mb-6">
        <label className="block font-mono text-[10px] uppercase tracking-widest text-on-surface/30 mb-2">
          Report Title
        </label>
        <input
          value={report.title}
          onChange={(e) => updateTitle(e.target.value)}
          className="w-full bg-surface-container border border-outline-variant/15 px-4 py-3 text-xl font-headline font-bold text-on-surface cursor-text hover:border-outline-variant/40 focus:outline-none focus:border-primary/50 focus:bg-surface-container-low transition-colors"
        />
      </div>

      <div className="space-y-4 mb-10">
        {report.sections.map((section, i) => (
          <div key={i} className="bg-surface-container border border-outline-variant/10 p-5">
            <input
              value={section.heading}
              onChange={(e) => updateHeading(i, e.target.value)}
              className="w-full bg-transparent border-b border-outline-variant/15 pb-2 mb-3 text-base font-headline font-semibold text-on-surface cursor-text hover:border-outline-variant/40 focus:outline-none focus:border-primary/50 transition-colors"
            />
            <textarea
              value={section.content}
              onChange={(e) => updateContent(i, e.target.value)}
              rows={5}
              className="w-full bg-surface-container-low border border-outline-variant/10 px-3 py-2.5 text-sm text-on-surface/75 font-body leading-relaxed cursor-text hover:border-outline-variant/30 focus:outline-none focus:border-primary/30 resize-none transition-colors"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <ProceedButton onClick={onProceed}>
          Get Final Report →
        </ProceedButton>
      </div>
    </div>
  )
}

// ── Step 4: Agent Evaluator ───────────────────────────────────────────────────
function EvaluatorStep({ loading, report, researcherOutput, query, onNewResearch }) {
  if (loading) return <LoadingState message="Agent Evaluator is assessing report quality…" />

  const { accuracy, completeness, clarity, hallucinationRisk, confidence, tokenUsage, tokenMax, latencyMs } = MOCK_EVALUATION

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 pb-24">

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary/60 mb-2">
            Agent Output — Agent Evaluator
          </div>
          <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">
            Evaluation Results
          </h2>
          <p className="font-body text-on-surface/50 text-sm">
            Quality assessment by Agent Evaluator. Read-only.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-1">
          <button
            onClick={() => triggerDownload(
              `research-report-${slugify(query)}.md`,
              buildReportMarkdown(report, researcherOutput),
              'text/markdown'
            )}
            className="flex items-center gap-1.5 border border-outline-variant/30 text-on-surface/50 hover:text-on-surface hover:border-outline-variant font-label font-bold text-[11px] px-4 py-2 uppercase tracking-widest transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>download</span>
            Report
          </button>
          <button
            onClick={() => triggerDownload(
              `evaluation-${slugify(query)}.json`,
              buildEvaluationJSON(query),
              'application/json'
            )}
            className="flex items-center gap-1.5 border border-outline-variant/30 text-on-surface/50 hover:text-on-surface hover:border-outline-variant font-label font-bold text-[11px] px-4 py-2 uppercase tracking-widest transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>download</span>
            Evaluation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Accuracy',     ...accuracy },
          { label: 'Completeness', ...completeness },
          { label: 'Clarity',      ...clarity },
        ].map(({ label, score, max, reasoning }) => (
          <div key={label} className="bg-surface-container border border-outline-variant/10 p-5">
            <div className="flex items-end justify-between mb-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface/40">{label}</span>
              <span className="font-headline text-2xl font-bold text-on-surface">
                {score}<span className="text-xs font-mono text-on-surface/30">/{max}</span>
              </span>
            </div>
            <div className="h-[3px] bg-surface-container-high mb-3 overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{
                  width: `${(score / max) * 100}%`,
                  boxShadow: '0 0 8px rgba(255,112,46,0.6)',
                  transition: 'width 1s ease',
                }}
              />
            </div>
            <p className="font-body text-[11px] text-on-surface/40 leading-relaxed">{reasoning}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <div className="bg-surface-container border border-outline-variant/10 p-6 flex items-center gap-6">
          <svg width="110" height="110" viewBox="0 0 120 120" className="shrink-0">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,112,46,0.08)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54" fill="none"
              stroke="#FF702E" strokeWidth="8"
              strokeLinecap="square"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - confidence / 100)}
              transform="rotate(-90 60 60)"
              style={{ filter: 'drop-shadow(0 0 6px rgba(255,112,46,0.5))' }}
            />
            <text x="60" y="56" textAnchor="middle" fill="#e2e2eb" fontSize="22" fontFamily="Space Grotesk" fontWeight="700">
              {confidence}%
            </text>
            <text x="60" y="72" textAnchor="middle" fill="rgba(226,226,235,0.3)" fontSize="8" fontFamily="Space Mono" letterSpacing="2">
              CONFIDENCE
            </text>
          </svg>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-on-surface/30 mb-2">
              Hallucination Risk
            </div>
            <span className={[
              'inline-block px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider border',
              hallucinationRisk === 'LOW'    ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30' :
              hallucinationRisk === 'MEDIUM' ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30' :
                                               'bg-error/10 text-error border-error/30',
            ].join(' ')}>
              {hallucinationRisk}_LEVEL / Verified
            </span>
          </div>
        </div>

        <div className="bg-surface-container border border-outline-variant/10 p-6 space-y-5">
          <div>
            <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-on-surface/30 mb-1.5">
              <span>Token Usage</span>
              <span>{tokenUsage.toLocaleString()} / {tokenMax.toLocaleString()}</span>
            </div>
            <div className="h-[3px] bg-surface-container-high overflow-hidden">
              <div className="h-full bg-primary/60" style={{ width: `${(tokenUsage / tokenMax) * 100}%` }} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface/30">Total Latency</span>
            <span className="font-mono text-sm text-primary">
              {latencyMs}<span className="text-on-surface/30 text-xs font-mono"> ms</span>
            </span>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="font-headline text-xl font-bold text-on-surface mb-1">Final Report</h2>
        <p className="font-body text-on-surface/40 text-sm mb-6">Your edited draft, as submitted to Agent Evaluator.</p>
        <article className="bg-surface-container border-l-2 border-primary p-8 lg:p-12 relative">
          <div
            className="absolute inset-0 opacity-[0.025] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(#FF702E 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          />
          <h1 className="text-2xl lg:text-4xl font-headline font-bold text-on-surface leading-tight mb-8 relative">
            {report.title}
          </h1>
          {report.sections.map((section, i) => (
            <section key={i} className="mb-8 relative">
              <h2 className="font-headline text-lg font-semibold text-on-surface mb-3 border-b border-white/5 pb-2">
                {section.heading}
              </h2>
              <p className="font-body text-on-surface/70 text-sm leading-relaxed whitespace-pre-wrap">
                {section.content}
              </p>
            </section>
          ))}
        </article>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNewResearch}
          className="bg-primary hover:bg-[#ff8a52] text-on-primary font-label font-bold text-[11px] px-6 py-3 uppercase tracking-widest transition-colors active:scale-[0.98]"
        >
          + New Research
        </button>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function WizardScreen({
  step,
  stepLoading,
  query,
  plannerOutput,
  researcherOutput,
  writerOutput,
  onPlannerChange,
  onResearcherChange,
  onWriterChange,
  onProceedFromPlanner,
  onProceedFromResearcher,
  onProceedFromWriter,
  onNewResearch,
  displayStep,          // null → use `step`; a past step number → read-only view
  onBackToCurrentStep,  // called to dismiss the read-only view
}) {
  const shownStep = displayStep ?? step
  // read-only when explicitly viewing a past step
  const isReadOnly = displayStep !== null && displayStep !== undefined && displayStep < step

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)]">

      {/* ── Sticky header: query strip + stepper ── */}
      <div className="sticky top-0 z-30 bg-surface border-b border-white/5">
        <div className="px-6 pt-3 pb-1 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary/60" style={{ fontSize: 15 }}>route</span>
          <p className="font-mono text-[11px] text-on-surface/40 truncate max-w-2xl">
            <span className="text-primary/60 mr-2">QUERY:</span>
            {query}
          </p>
          <span className="ml-auto font-mono text-[9px] text-on-surface/25 shrink-0 hidden sm:block">
            STEP {step} OF 4
          </span>
        </div>
        {/* Stepper always shows the real wizard progress, not the viewed step */}
        <Stepper currentStep={step} />
      </div>

      {/* ── Read-only banner when viewing a past step ── */}
      {isReadOnly && (
        <ReadOnlyBanner currentStep={step} onBack={onBackToCurrentStep} />
      )}

      {/* ── Step content — keyed so each shown step and read-only toggle fades in ── */}
      <div key={`${shownStep}-${isReadOnly}`} className="flex-1" style={{ animation: 'fadeSlideIn 0.25s ease both' }}>
        {shownStep === 1 && (
          <PlannerStep
            loading={!isReadOnly && stepLoading}
            subtopics={plannerOutput}
            onChange={onPlannerChange}
            onProceed={onProceedFromPlanner}
            readOnly={isReadOnly}
          />
        )}
        {shownStep === 2 && (
          <ResearcherStep
            loading={!isReadOnly && stepLoading}
            research={researcherOutput}
            onChange={onResearcherChange}
            onProceed={onProceedFromResearcher}
            readOnly={isReadOnly}
          />
        )}
        {shownStep === 3 && (
          <WriterStep
            loading={!isReadOnly && stepLoading}
            report={writerOutput}
            onChange={onWriterChange}
            onProceed={onProceedFromWriter}
            readOnly={isReadOnly}
          />
        )}
        {shownStep === 4 && (
          <EvaluatorStep
            loading={!isReadOnly && stepLoading}
            report={writerOutput}
            researcherOutput={researcherOutput}
            query={query}
            onNewResearch={onNewResearch}
          />
        )}
      </div>
    </div>
  )
}
