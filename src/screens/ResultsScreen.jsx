import { ReportContent }     from './ReportScreen'
import { EvaluationContent } from './EvaluationScreen'
import { SourcesContent }    from './SourcesTab'

const TABS = [
  { id: 'report',     label: 'Report',     icon: 'description'  },
  { id: 'evaluation', label: 'Evaluation', icon: 'verified'     },
  { id: 'sources',    label: 'Sources',    icon: 'library_books' },
]

/**
 * Renders inside the shared Layout in App.jsx.
 * @param {{ query: string, activeTab: string, onTabChange: (tab: string) => void }} props
 */
export default function ResultsScreen({ query, activeTab, onTabChange }) {
  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)]">

      {/* ── Sticky tab bar ─────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-surface border-b border-white/5">

        {/* Query context strip */}
        <div className="px-6 pt-4 pb-1 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary/60" style={{ fontSize: 16 }}>manage_search</span>
          <p className="font-mono text-[11px] text-on-surface/40 truncate max-w-2xl">
            <span className="text-primary/60 mr-2">QUERY:</span>
            {query}
          </p>
          <span className="ml-auto flex items-center gap-1.5 font-mono text-[9px] text-emerald-400 shrink-0">
            <span className="material-symbols-outlined" style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            COMPLETE
          </span>
        </div>

        {/* Tab row */}
        <div className="flex items-end gap-0 px-4">
          {TABS.map(({ id, label, icon }) => {
            const isActive = id === activeTab
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={[
                  'flex items-center gap-2 px-5 py-3 text-xs font-label uppercase tracking-wider transition-all duration-150 border-b-2',
                  isActive
                    ? 'text-primary border-primary'
                    : 'text-on-surface/40 border-transparent hover:text-on-surface hover:border-outline-variant/30',
                ].join(' ')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{icon}</span>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tab content — keyed so each switch fades in ─────────── */}
      <div key={activeTab} className="flex-1" style={{ animation: 'fadeIn 0.18s ease both' }}>
        {activeTab === 'report'     && <ReportContent />}
        {activeTab === 'evaluation' && <EvaluationContent />}
        {activeTab === 'sources'    && <SourcesContent />}
      </div>
    </div>
  )
}
