import Layout from '../components/Layout'

const METRICS = [
  {
    id: 'accuracy',
    label: 'Accuracy',
    score: 4.2,
    max: 5,
    pct: 84,
    noteId: 'ACC_NOTE_01',
    note: 'Factual accuracy verified against Vector DB source #12. Small discrepancy noted in RISC-V clock cycle prediction (delta: 0.04).',
  },
  {
    id: 'completeness',
    label: 'Completeness',
    score: 4.5,
    max: 5,
    pct: 90,
    noteId: 'CMP_NOTE_02',
    note: 'All five required sections present. Market analysis depth exceeds baseline benchmark by 18%.',
  },
  {
    id: 'clarity',
    label: 'Clarity',
    score: 4.6,
    max: 5,
    pct: 92,
    noteId: 'CLR_NOTE_05',
    note: 'Syntactic complexity remains low. Subject-predicate alignment is optimal for technical documentation ingestion.',
  },
]

const CONFIDENCE = 85
// SVG circle: r=54, circumference = 2π*54 ≈ 339.3
const CIRC = 2 * Math.PI * 54
const OFFSET = CIRC * (1 - CONFIDENCE / 100)

/** Content only — no Layout wrapper. Used by App.jsx and ResultsScreen. */
export function EvaluationContent() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">

        {/* Page header */}
        <div className="mb-8 border-b border-outline-variant/20 pb-5 flex justify-between items-end">
          <div>
            <div className="text-primary font-mono text-xs tracking-widest uppercase mb-1">
              Evaluation // Run_ID_042
            </div>
            <h1 className="text-3xl font-headline font-bold tracking-tight">
              Quality Analysis Report
            </h1>
          </div>
          <button className="flex items-center gap-2 border border-outline-variant/40 px-4 py-2 text-[10px] font-label uppercase tracking-[0.2em] text-on-surface/50 hover:border-primary hover:text-primary transition-all">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>database_upload</span>
            Export Telemetry
          </button>
        </div>

        <div className="grid grid-cols-12 gap-6">

          {/* ── Left: metric cards ──────────────────────────── */}
          <div className="col-span-12 xl:col-span-8 space-y-6">

            {METRICS.map((m) => (
              <div
                key={m.id}
                className="bg-surface-container p-6 border-l border-primary/30"
              >
                {/* Score row */}
                <div className="flex justify-between items-end mb-3">
                  <span className="font-label text-xs uppercase tracking-[0.15em] text-on-surface/50">
                    {m.label}
                  </span>
                  <span className="font-headline font-bold text-2xl text-primary">
                    {m.score}
                    <span className="text-xs text-on-surface/30 font-normal">/{m.max}</span>
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1 w-full bg-surface-container-highest mb-4">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${m.pct}%`,
                      boxShadow: '0 0 8px rgba(255,112,46,0.5)',
                    }}
                  />
                </div>

                {/* Evaluation note */}
                <div className="p-3 bg-surface-container-lowest border-l-2 border-primary/30">
                  <span className="font-label text-[10px] text-primary uppercase block mb-1">
                    {m.noteId}
                  </span>
                  <p className="text-xs text-on-surface/50 leading-relaxed font-body">
                    {m.note}
                  </p>
                </div>
              </div>
            ))}

            {/* Token / latency mini-cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container p-5 border-b border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>memory</span>
                  <span className="font-label text-xs uppercase tracking-widest text-on-surface/40">Token Usage</span>
                </div>
                <div className="font-headline font-bold text-2xl">
                  1,402{' '}
                  <span className="text-xs text-on-surface/30 font-normal">/ 4,096</span>
                </div>
              </div>
              <div className="bg-surface-container p-5 border-b border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>speed</span>
                  <span className="font-label text-xs uppercase tracking-widest text-on-surface/40">Latency</span>
                </div>
                <div className="font-headline font-bold text-2xl">
                  284{' '}
                  <span className="text-xs text-on-surface/30 font-normal">ms</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: summary sidebar ──────────────────────── */}
          <aside className="col-span-12 xl:col-span-4 space-y-4">

            {/* Hallucination risk */}
            <div className="bg-surface-container-low p-5 border border-outline-variant/10 flex items-center justify-between">
              <div>
                <span className="font-label text-[10px] uppercase tracking-widest text-on-surface/40 block mb-1">
                  Hallucination Risk
                </span>
                <span className="font-headline font-bold text-primary tracking-widest">
                  LOW_LEVEL
                </span>
              </div>
              <div
                className="px-3 py-1 bg-primary/10 border border-primary/30 text-primary font-label text-[10px] uppercase tracking-tighter"
                style={{ boxShadow: '0 0 20px rgba(255,112,46,0.15)' }}
              >
                Verified
              </div>
            </div>

            {/* Confidence gauge */}
            <div className="bg-surface-container-high/40 p-6 flex flex-col items-center">
              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface/40 mb-5 w-full text-center">
                Confidence Score
              </span>
              <div className="relative flex items-center justify-center">
                <svg
                  width={136} height={136}
                  viewBox="0 0 136 136"
                  className="-rotate-90"
                >
                  {/* Track */}
                  <circle
                    cx={68} cy={68} r={54}
                    fill="transparent"
                    stroke="#33343b"
                    strokeWidth={8}
                  />
                  {/* Progress */}
                  <circle
                    cx={68} cy={68} r={54}
                    fill="transparent"
                    stroke="#FF702E"
                    strokeWidth={8}
                    strokeDasharray={CIRC}
                    strokeDashoffset={OFFSET}
                    strokeLinecap="butt"
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-headline font-bold text-3xl text-on-surface">{CONFIDENCE}%</span>
                  <span className="text-[8px] font-label text-on-surface/30 uppercase tracking-wide">
                    Threshold +12%
                  </span>
                </div>
              </div>
            </div>

            {/* Metric summary table */}
            <div className="bg-surface-container-low p-5 border border-outline-variant/10">
              <h4 className="font-label text-[10px] uppercase tracking-widest text-on-surface/40 mb-4">
                Score Summary
              </h4>
              <div className="space-y-3">
                {METRICS.map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className="flex-1 h-[3px] bg-surface-container-highest">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${m.pct}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-primary w-8 text-right shrink-0">
                      {m.pct}%
                    </span>
                    <span className="font-label text-[10px] text-on-surface/40 uppercase tracking-tight w-24 shrink-0">
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status coordinates */}
            <div className="font-mono text-[9px] text-on-surface/20 uppercase tracking-widest space-y-1 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                EVAL_COMPLETE
              </div>
              <div>RES // EVAL // 042</div>
            </div>
          </aside>
        </div>
    </div>
  )
}

/** Standalone screen with its own Layout. */
export default function EvaluationScreen() {
  return (
    <Layout activeNav="Research" activeTopNav="Workspace">
      <EvaluationContent />
    </Layout>
  )
}
