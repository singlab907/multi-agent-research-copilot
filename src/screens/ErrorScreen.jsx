import Layout from '../components/Layout'

/** Content only — no Layout wrapper. Used by App.jsx. */
export function ErrorContent({
  errorCode = 'ERR_CORE_TIMEOUT_042',
  subsystem = 'WRITER_AGENT_V1',
  onRetry   = () => {},
}) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-56px)] p-8 overflow-hidden">

        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #FF702E 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Coordinates — top right */}
        <div className="absolute top-6 right-8 hidden lg:block font-mono text-[9px] text-on-surface/20 uppercase tracking-widest">
          RES // ERR // 500_SYSTEM_FAILURE
        </div>

        {/* Error pulse bar — bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-surface-container">
          <div className="h-full bg-error w-1/3 animate-pulse" />
        </div>

        <div className="relative z-10 max-w-xl w-full text-center space-y-8">

          {/* Warning icon */}
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute inset-0 bg-error/10 blur-3xl rounded-full" />
            <div className="relative w-24 h-24 flex items-center justify-center border border-error/30 bg-surface-container-lowest">
              <svg fill="none" width={48} height={48} viewBox="0 0 24 24">
                <path
                  d="M12 5.99L19.53 19H4.47L12 5.99ZM12 2L1 21H23L12 2ZM13 16H11V18H13V16ZM13 10H11V14H13V10Z"
                  fill="#ffb4ab"
                />
              </svg>
              {/* Corner accents */}
              <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-error/60" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-error/60" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-headline font-light tracking-tight">
              Something went{' '}
              <span className="text-error italic">wrong</span>
            </h1>
            <div className="flex items-center justify-center gap-3">
              <div className="h-[1px] w-12 bg-outline-variant" />
              <p className="font-mono text-[11px] tracking-widest text-on-surface/50 uppercase">
                The Research Agent encountered an error. Please try again.
              </p>
              <div className="h-[1px] w-12 bg-outline-variant" />
            </div>
          </div>

          {/* Retry button */}
          <div className="flex flex-col items-center gap-6 pt-4">
            <button
              onClick={onRetry}
              className="group relative px-10 py-4 border border-primary bg-transparent overflow-hidden hover:[box-shadow:0_0_15px_rgba(255,112,46,0.4)] transition-all duration-300"
            >
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
              <span className="relative flex items-center gap-3 font-mono text-sm font-bold tracking-[0.2em] text-primary">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
                RETRY_OPERATION
              </span>
            </button>

            {/* Error metadata */}
            <div className="flex items-center gap-8 pt-4">
              <div className="flex flex-col items-start gap-1">
                <span className="text-[9px] font-mono text-on-surface/30 uppercase">Error Code</span>
                <span className="text-[11px] font-mono text-error">{errorCode}</span>
              </div>
              <div className="h-8 w-[1px] bg-outline-variant/30" />
              <div className="flex flex-col items-start gap-1">
                <span className="text-[9px] font-mono text-on-surface/30 uppercase">Subsystem</span>
                <span className="text-[11px] font-mono text-on-surface">{subsystem}</span>
              </div>
            </div>
          </div>
        </div>

        {/* System data — bottom left */}
        <div className="absolute bottom-8 left-8 hidden lg:block font-mono text-[9px] text-on-surface/20 space-y-1">
          <div>SYSTEM_STABILITY: 84.2%</div>
          <div>UPTIME: 142:04:22:11</div>
          <div>MEMORY_DUMP: ATTACHED_LOGS_A1</div>
        </div>
      </div>
  )
}

/** Standalone screen with its own Layout. */
export default function ErrorScreen({
  errorCode = 'ERR_CORE_TIMEOUT_042',
  subsystem = 'WRITER_AGENT_V1',
  onRetry   = () => {},
}) {
  return (
    <Layout activeNav="Research" activeTopNav="Workspace">
      <ErrorContent errorCode={errorCode} subsystem={subsystem} onRetry={onRetry} />
    </Layout>
  )
}
