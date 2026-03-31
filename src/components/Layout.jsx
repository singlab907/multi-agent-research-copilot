const NAV_LINKS = [
  { label: 'Workspace', href: '#' },
]

const SIDEBAR_ITEMS = [
  { label: 'Research', icon: 'biotech' },
]

const SIDEBAR_BOTTOM = [
  { label: 'Support', icon: 'help_outline' },
  { label: 'Docs',    icon: 'description'  },
]

const PIPELINE_AGENTS = [
  { label: 'Agent Planner',    icon: 'psychology',    step: 1 },
  { label: 'Agent Researcher', icon: 'search',        step: 2 },
  { label: 'Agent Writer',     icon: 'edit_note',     step: 3 },
  { label: 'Agent Evaluator',  icon: 'verified_user', step: 4 },
]

/**
 * Returns the pipeline display state for agent at `index`.
 * appState: 'idle' | 'processing' | 'complete' | 'error'
 * agentStep: 0–4  (number of completed agents during processing)
 * researchSkipped: boolean — whether Agent Researcher (index 1) was skipped
 */
function pipelineItemState(index, appState, agentStep, researchSkipped) {
  if (appState === 'idle' || appState === 'error') return 'idle'
  // Researcher (index 1) was skipped
  if (researchSkipped && index === 1) return 'skipped'
  if (appState === 'complete') return 'done'
  // processing
  if (index < agentStep) return 'done'
  if (index === agentStep) return 'active'
  return 'waiting'
}

/**
 * @param {{
 *   children:        React.ReactNode,
 *   activeNav?:      string,
 *   activeTopNav?:   string,
 *   pipelineStatus?: { appState: string, agentStep: number },
 *   onNewResearch?:  () => void,
 *   viewingStep?:    number | null,
 *   onViewStep?:     (step: number) => void,
 * }} props
 */
export default function Layout({
  children,
  activeNav      = 'Research',
  activeTopNav   = 'Workspace',
  pipelineStatus = { appState: 'idle', agentStep: 0, researchSkipped: false },
  onNewResearch  = () => {},
  viewingStep    = null,
  onViewStep     = () => {},
}) {
  const { appState, agentStep, researchSkipped = false } = pipelineStatus

  return (
    <div className="min-h-screen bg-surface-dim text-on-surface font-body flex flex-col">

      {/* ── Top Nav ─────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-surface border-b border-white/5 flex items-center justify-between px-6 font-headline">

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5">
            {/* Multi-agent network SVG icon */}
            <svg
              className="w-5 h-5 shrink-0"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              {/* Connecting lines (behind nodes) */}
              <line x1="10" y1="9" x2="3"  y2="3"  stroke="#FF702E" strokeWidth="1"   strokeOpacity="0.45" />
              <line x1="10" y1="9" x2="17" y2="3"  stroke="#FF702E" strokeWidth="1"   strokeOpacity="0.45" />
              <line x1="10" y1="9" x2="3"  y2="17" stroke="#FF702E" strokeWidth="1"   strokeOpacity="0.45" />
              <line x1="10" y1="9" x2="17" y2="17" stroke="#FF702E" strokeWidth="1"   strokeOpacity="0.45" />
              <line x1="3"  y1="3" x2="17" y2="3"  stroke="#FF702E" strokeWidth="0.5" strokeOpacity="0.2"  />
              <line x1="3"  y1="3" x2="3"  y2="17" stroke="#FF702E" strokeWidth="0.5" strokeOpacity="0.2"  />
              <line x1="17" y1="3" x2="17" y2="17" stroke="#FF702E" strokeWidth="0.5" strokeOpacity="0.2"  />
              {/* Outer nodes */}
              <circle cx="3"  cy="3"  r="1.8" fill="#FF702E" fillOpacity="0.65" />
              <circle cx="17" cy="3"  r="1.8" fill="#FF702E" fillOpacity="0.65" />
              <circle cx="3"  cy="17" r="1.8" fill="#FF702E" fillOpacity="0.65" />
              <circle cx="17" cy="17" r="1.8" fill="#FF702E" fillOpacity="0.65" />
              {/* Center hub node */}
              <circle cx="10" cy="9" r="2.8" fill="#FF702E" />
            </svg>
            <span className="text-sm font-bold uppercase tracking-widest text-on-surface">
              Multi-Agent Research Copilot
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ label, href }) => {
              const isActive = label === activeTopNav
              return (
                <a
                  key={label}
                  href={href}
                  className={[
                    'text-xs uppercase tracking-wider font-medium transition-colors duration-200',
                    isActive
                      ? 'text-primary border-b-2 border-primary pb-0.5'
                      : 'text-on-surface/50 hover:text-primary',
                  ].join(' ')}
                >
                  {label}
                </a>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button className="text-on-surface/50 hover:text-primary transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>settings</span>
          </button>
          <span className="px-2 py-0.5 bg-surface-container-high border border-outline-variant/30 text-[10px] font-mono text-primary uppercase tracking-tighter">
            v1.0
          </span>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="flex flex-1 pt-14">

        {/* ── Left Sidebar ──────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col fixed left-0 top-14 bottom-0 w-[260px] bg-surface-container-lowest border-r border-white/5 z-40">

          {/* User / Session */}
          <div className="px-5 py-4 flex items-center gap-3 border-b border-white/5 shrink-0">
            <div className="w-9 h-9 bg-surface-container flex items-center justify-center border border-outline-variant/40 shrink-0">
              <span
                className="material-symbols-outlined text-primary"
                style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}
              >
                analytics
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-primary font-label font-black text-[11px] uppercase tracking-tight truncate">
                Analyst_01
              </div>
              <div className="text-on-surface/40 text-[10px] font-mono uppercase tracking-tight">
                Active Session
              </div>
            </div>
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
          </div>

          {/* Nav items */}
          <nav className="flex flex-col pt-2 shrink-0">
            {SIDEBAR_ITEMS.map(({ label, icon }) => {
              const isActive = label === activeNav
              return (
                <a
                  key={label}
                  href="#"
                  className={[
                    'flex items-center gap-3 px-4 py-3 text-[11px] uppercase tracking-tight font-label transition-all duration-150',
                    isActive
                      ? 'bg-surface text-primary border-l-2 border-primary'
                      : 'text-on-surface/40 border-l-2 border-transparent hover:bg-surface hover:text-on-surface',
                  ].join(' ')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>
                  {label}
                </a>
              )
            })}
          </nav>

          {/* ── Pipeline Status ─────────────────────────────────── */}
          <div className="mx-4 my-3 border border-outline-variant/15 shrink-0">
            <div className="px-3 py-2 border-b border-outline-variant/15 flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-on-surface/30">
                Pipeline
              </span>
              {appState === 'processing' && (
                <span className="flex items-center gap-1 font-mono text-[9px] text-primary">
                  <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                  ACTIVE
                </span>
              )}
              {appState === 'complete' && (
                <span className="font-mono text-[9px] text-emerald-400">COMPLETE</span>
              )}
              {(appState === 'idle' || appState === 'error') && (
                <span className="font-mono text-[9px] text-on-surface/20">STANDBY</span>
              )}
            </div>

            <div className="py-1">
              {PIPELINE_AGENTS.map(({ label, icon, step }, i) => {
                const state      = pipelineItemState(i, appState, agentStep, researchSkipped)
                const isClickable = state === 'done'
                const isViewing  = viewingStep === step && state === 'done'

                return (
                  <div
                    key={label}
                    onClick={() => isClickable && onViewStep(step)}
                    title={isClickable ? `View ${label} output` : undefined}
                    className={[
                      'flex items-center gap-2.5 px-3 py-1.5 transition-colors duration-150',
                      isClickable ? 'cursor-pointer' : 'cursor-default',
                      isViewing
                        ? 'bg-primary/10'
                        : isClickable
                        ? 'hover:bg-surface-container-low'
                        : '',
                    ].join(' ')}
                  >
                    {/* Status indicator */}
                    {state === 'done' && (
                      <span
                        className="material-symbols-outlined text-emerald-400 shrink-0"
                        style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                    )}
                    {state === 'active' && (
                      <span className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                    )}
                    {state === 'skipped' && (
                      <span
                        className="material-symbols-outlined text-on-surface/25 shrink-0"
                        style={{ fontSize: 14 }}
                      >
                        remove_circle
                      </span>
                    )}
                    {(state === 'idle' || state === 'waiting') && (
                      <span
                        className="material-symbols-outlined text-on-surface/20 shrink-0"
                        style={{ fontSize: 14 }}
                      >
                        radio_button_unchecked
                      </span>
                    )}

                    {/* Agent icon + label */}
                    <span
                      className="material-symbols-outlined shrink-0"
                      style={{
                        fontSize: 12,
                        color: state === 'done'
                          ? '#4ade80'
                          : state === 'active'
                          ? '#FF702E'
                          : 'rgba(226,226,235,0.2)',
                      }}
                    >
                      {icon}
                    </span>
                    <span
                      className={[
                        'font-mono text-[10px] uppercase tracking-tight flex-1',
                        state === 'done'    && 'text-emerald-400',
                        state === 'active'  && 'text-primary',
                        state === 'skipped' && 'text-on-surface/25 line-through',
                        (state === 'idle' || state === 'waiting') && 'text-on-surface/20',
                      ].filter(Boolean).join(' ')}
                    >
                      {label}
                    </span>

                    {/* Inline badge */}
                    {isViewing && (
                      <span className="font-mono text-[8px] text-primary/70 shrink-0">VIEW</span>
                    )}
                    {!isViewing && state === 'active' && (
                      <span className="font-mono text-[8px] text-primary/60 animate-pulse shrink-0">RUN</span>
                    )}
                    {!isViewing && state === 'done' && (
                      <span className="font-mono text-[8px] text-emerald-400/60 shrink-0">OK</span>
                    )}
                    {state === 'skipped' && (
                      <span className="font-mono text-[8px] text-on-surface/25 shrink-0">SKIP</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* NEW RESEARCH button */}
          <div className="px-4 pb-3 shrink-0">
            <button
              onClick={onNewResearch}
              className="w-full bg-primary hover:bg-[#ff8a52] text-on-primary font-label font-bold text-[11px] py-3 uppercase tracking-widest transition-colors duration-200 active:scale-[0.98]"
            >
              + New Research
            </button>
          </div>

          {/* Spacer pushes bottom links down */}
          <div className="flex-1" />

          {/* Bottom links */}
          <div className="border-t border-white/5 py-2 shrink-0">
            {SIDEBAR_BOTTOM.map(({ label, icon }) => (
              <a
                key={label}
                href="#"
                className="flex items-center gap-3 px-4 py-2.5 text-[11px] uppercase tracking-tight font-label text-on-surface/40 hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>
                {label}
              </a>
            ))}
          </div>
        </aside>

        {/* ── Main content ──────────────────────────────────────── */}
        <main className="flex-1 md:ml-[260px] overflow-y-auto bg-surface-dim min-h-[calc(100vh-56px)]">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav ─────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container-highest border-t border-white/5 flex justify-around items-center h-14">
        {SIDEBAR_ITEMS.map(({ label, icon }) => {
          const isActive = label === activeNav
          return (
            <button
              key={label}
              className={[
                'flex flex-col items-center gap-0.5 transition-colors',
                isActive ? 'text-primary' : 'text-on-surface/40',
              ].join(' ')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
              <span className="text-[9px] font-mono uppercase tracking-wider">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
