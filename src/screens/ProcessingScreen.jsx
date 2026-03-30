import Layout from '../components/Layout'

const AGENTS = [
  { label: 'Planner',   icon: 'psychology',    doneTime: '0.8s'  },
  { label: 'Research',  icon: 'search',        doneTime: '4.2s'  },
  { label: 'Writer',    icon: 'edit_note',     doneTime: '6.1s'  },
  { label: 'Evaluator', icon: 'verified_user', doneTime: '8.0s'  },
]

// Each entry: { time, text } — one object per log line, always in sync
const LOG_ENTRIES = [
  // agentStep 0 – Planner running
  { time: '14:20:01', text: 'SYS: Research query received.' },
  { time: '14:20:03', text: 'PLANNER: Analyzing query structure...' },
  // agentStep 1 – Research running
  { time: '14:20:08', text: 'PLANNER: Outline complete. 4 research vectors identified.' },
  { time: '14:20:10', text: 'RESEARCH: Querying knowledge base...' },
  // agentStep 2 – Writer running
  { time: '14:20:18', text: 'RESEARCH: 14 sources retrieved and ranked.' },
  { time: '14:20:21', text: 'WRITER: Drafting Section 1 (Executive Summary)...' },
  { time: '14:20:25', text: 'WRITER: Synthesizing analytical conclusions...' },
  // agentStep 3 – Evaluator running
  { time: '14:20:29', text: 'WRITER: Report draft complete.' },
  { time: '14:20:33', text: 'EVALUATOR: Running quality checks...' },
  { time: '14:20:38', text: 'EVALUATOR: Verifying factual accuracy against sources...' },
  // agentStep 4 – complete
  { time: '14:20:41', text: 'EVALUATOR: All metrics within threshold.' },
  { time: '14:20:44', text: 'SYS: Report generation complete.' },
]

// How many log lines are visible per agentStep
const LOG_VISIBLE = [2, 4, 7, 10, 12]

function getStatus(index, agentStep) {
  if (index < agentStep) return 'done'
  if (index === agentStep && agentStep < 4) return 'processing'
  return 'waiting'
}

/** Content only — no Layout wrapper. */
export function ProcessingContent({ agentStep = 0, query = '' }) {
  const visibleCount = LOG_VISIBLE[Math.min(agentStep, LOG_VISIBLE.length - 1)]
  const logLines     = LOG_ENTRIES.slice(0, visibleCount)
  const writerActive = agentStep === 2

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">

      {/* Shimmer progress bar */}
      <div className="w-full h-[2px] bg-outline-variant/20 relative overflow-hidden mb-8">
        <div
          className="absolute inset-0 w-1/3"
          style={{
            background: 'linear-gradient(90deg,#1e1f26 25%,#282a30 50%,#1e1f26 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite linear',
          }}
        />
      </div>

      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 font-label text-[10px] tracking-[0.2em] text-on-surface/40 uppercase">
        <span>RES</span>
        <span className="text-primary/30">//</span>
        <span>GEN_REPORT</span>
        <span className="text-primary/30">//</span>
        <span className="text-primary">RUN_ID_042</span>
      </div>

      {/* Query display */}
      {query && (
        <div className="mb-6 px-4 py-3 bg-surface-container border-l-2 border-primary/40 font-body text-sm text-on-surface/60 italic">
          "{query}"
        </div>
      )}

      {/* Pipeline row */}
      <section className="bg-surface-container-lowest border border-outline-variant/20 p-6 lg:p-8 relative overflow-hidden mb-6">
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#FF702E 0.5px,transparent 0.5px)', backgroundSize: '20px 20px' }}
        />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <span className="text-[10px] font-mono text-primary/80 uppercase tracking-widest">
              Process flow // 001
            </span>
            <span className="text-[10px] font-mono text-on-surface/30">
              ACTIVE_AGENTS: {Math.min(agentStep + 1, 4)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {AGENTS.map((agent, i) => {
              const status = getStatus(i, agentStep)
              const isDone       = status === 'done'
              const isProcessing = status === 'processing'
              const isWaiting    = status === 'waiting'

              return (
                <div key={agent.label} className="flex items-center flex-1 min-w-0">
                  {/* Agent card */}
                  <div
                    className={[
                      'flex-1 p-3 lg:p-4 transition-all duration-300',
                      isDone       && 'bg-surface-container border border-primary',
                      isProcessing && 'bg-surface-container border-2 border-primary',
                      isWaiting    && 'bg-surface-container border border-outline-variant/30 opacity-50',
                    ].filter(Boolean).join(' ')}
                    style={isProcessing ? { animation: 'pulse-border 2s cubic-bezier(0.4,0,0.6,1) infinite' } : {}}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className={`w-8 h-8 flex items-center justify-center border ${
                        isWaiting ? 'bg-surface-container border-outline-variant/20' : 'bg-primary/10 border-primary/30'
                      }`}>
                        <span
                          className={`material-symbols-outlined ${isWaiting ? 'text-on-surface/30' : 'text-primary'}`}
                          style={{ fontSize: 18, fontVariationSettings: isDone ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          {agent.icon}
                        </span>
                      </div>
                      {isDone && (
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>
                          check_circle
                        </span>
                      )}
                      {isProcessing && (
                        <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      )}
                    </div>
                    <div className="font-headline font-bold text-[10px] uppercase tracking-wider mb-0.5 text-on-surface">
                      {agent.label}
                    </div>
                    <div className="font-mono text-[9px] text-primary flex justify-between">
                      <span className={isProcessing ? 'animate-pulse' : ''}>
                        {isDone ? 'Done' : isProcessing ? 'Processing' : 'Waiting'}
                      </span>
                      <span>{isDone ? agent.doneTime : '--'}</span>
                    </div>
                  </div>

                  {/* Connector */}
                  {i < AGENTS.length - 1 && (
                    <div className={`h-[2px] w-4 shrink-0 relative mx-0.5 ${
                      getStatus(i + 1, agentStep) !== 'waiting' ? 'bg-primary/40' : 'bg-outline-variant/30'
                    }`}>
                      {getStatus(i + 1, agentStep) !== 'waiting' && (
                        <div className="absolute inset-0 bg-primary opacity-60 animate-pulse" />
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-6">

        {/* Skeleton report */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-surface-container p-6 lg:p-8 border-l border-primary/20">

            {/* Title skeleton */}
            <div className="flex items-start justify-between mb-8">
              <div className="space-y-2 flex-1">
                <div className="h-6 w-2/3" style={{ background: 'linear-gradient(90deg,#1e1f26 25%,#282a30 50%,#1e1f26 75%)', backgroundSize: '200% 100%', animation: 'shimmer 2s infinite linear' }} />
                <div className="h-3 w-1/3 opacity-40" style={{ background: 'linear-gradient(90deg,#1e1f26 25%,#282a30 50%,#1e1f26 75%)', backgroundSize: '200% 100%', animation: 'shimmer 2s infinite linear' }} />
              </div>
              <div className="w-10 h-10 shrink-0 ml-4" style={{ background: 'linear-gradient(90deg,#1e1f26 25%,#282a30 50%,#1e1f26 75%)', backgroundSize: '200% 100%', animation: 'shimmer 2s infinite linear' }} />
            </div>

            {/* Content skeleton lines */}
            <div className="space-y-3 mb-8">
              {[100, 92, 96, 88, 94, 70].map((w, i) => (
                <div
                  key={i}
                  className="h-3"
                  style={{
                    width: `${w}%`,
                    background: 'linear-gradient(90deg,#1e1f26 25%,#282a30 50%,#1e1f26 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s infinite linear',
                  }}
                />
              ))}
              <div className="pt-4 space-y-3">
                <div className="h-5 w-1/4" style={{ background: 'linear-gradient(90deg,#1e1f26 25%,#282a30 50%,#1e1f26 75%)', backgroundSize: '200% 100%', animation: 'shimmer 2s infinite linear' }} />
                {[100, 85].map((w, i) => (
                  <div
                    key={i}
                    className="h-3"
                    style={{
                      width: `${w}%`,
                      background: 'linear-gradient(90deg,#1e1f26 25%,#282a30 50%,#1e1f26 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2s infinite linear',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Writer status */}
            <div className="flex flex-col items-center justify-center p-6 border border-dashed border-outline-variant/30 bg-surface-container-lowest">
              {writerActive ? (
                <>
                  <div className="relative w-14 h-14 mb-4">
                    <div className="absolute inset-0 border-2 border-primary/20 animate-spin" style={{ animationDuration: '3s' }} />
                    <div className="absolute inset-2 border-2 border-primary/40 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
                    <div className="absolute inset-4 bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary animate-pulse" style={{ fontSize: 18 }}>edit_note</span>
                    </div>
                  </div>
                  <p className="text-primary font-mono text-xs tracking-widest animate-pulse">
                    Writer Agent is composing your report...
                  </p>
                  <p className="mt-1 text-[10px] text-on-surface/30 font-label">ESTIMATED_TIME: 14s</p>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-on-surface/20 mb-2" style={{ fontSize: 32 }}>hourglass_top</span>
                  <p className="text-on-surface/30 font-mono text-xs tracking-widest">
                    {agentStep < 2 ? 'Awaiting writer agent...' : 'Finalising report...'}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: stream + compute */}
        <div className="col-span-12 lg:col-span-4 space-y-4">

          {/* Real-time log */}
          <div className="bg-surface-container-low p-5">
            <h3 className="font-label text-[11px] tracking-widest text-on-surface/40 mb-4 border-b border-outline-variant/20 pb-2 uppercase">
              Real-time Stream
            </h3>
            <div className="space-y-2 font-mono text-xs h-44 overflow-y-auto pr-1">
              {logLines.map(({ time, text }, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-primary shrink-0">[{time}]</span>
                  <span className={`text-on-surface/70 ${i === logLines.length - 1 ? 'animate-pulse' : ''}`}>
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Compute load */}
          <div className="p-5 border border-primary/10 bg-primary/5">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>bolt</span>
              <span className="font-label text-[10px] tracking-tighter text-primary uppercase">Compute_Load: 84%</span>
            </div>
            <div className="w-full h-1 bg-surface-container-highest">
              <div className="h-full bg-primary" style={{ width: '84%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Standalone screen with its own Layout. */
export default function ProcessingScreen() {
  return (
    <Layout activeNav="Research">
      <ProcessingContent agentStep={2} query="Impact of AI on healthcare diagnostics" />
    </Layout>
  )
}
