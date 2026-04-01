import { useState, useEffect } from 'react'
import Layout from '../components/Layout'

const SUGGESTIONS = [
  { id: '01', label: 'Impact of AI on healthcare diagnostics' },
  { id: '02', label: 'Climate change policy analysis 2024' },
  { id: '03', label: 'Blockchain applications in supply chain' },
  { id: '04', label: 'Quantum cryptography & post-quantum security' },
]

/** Content only — no Layout wrapper. Used by App.jsx. */
export function WelcomeContent({ onSubmit = () => {} }) {
  const [query,           setQuery]           = useState('')
  const [backendDown,     setBackendDown]     = useState(false)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/health`, { signal: AbortSignal.timeout(3000) })
      .then(r => { if (!r.ok) setBackendDown(true) })
      .catch(() => setBackendDown(true))
  }, [])

  function handleSubmit() {
    const q = query.trim()
    if (q) onSubmit(q)
  }

  function handleSuggestion(label) {
    setQuery(label)
    onSubmit(label)
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-8 py-16">

      {/* Backend connection error banner */}
      {backendDown && (
        <div className="absolute top-0 left-0 right-0 flex items-center gap-3 px-5 py-3 bg-error/10 border-b border-error/20">
          <span className="material-symbols-outlined text-error shrink-0" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>warning</span>
          <p className="font-mono text-[10px] text-error uppercase tracking-wider">
            Cannot connect to backend server. Please ensure the server is running on port 8000.
          </p>
        </div>
      )}

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Top pulse bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary/20">
        <div className="h-full bg-primary w-1/4" />
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center">

        {/* Icon assembly */}
        <div className="mb-10 relative inline-block">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-75 pointer-events-none" />
          <div className="relative bg-surface-container-lowest border border-outline-variant/30 p-8 inline-flex items-center justify-center">
            <div className="relative">
              <span
                className="material-symbols-outlined text-primary/40"
                style={{ fontSize: 96, lineHeight: 1 }}
              >
                description
              </span>
              <div className="absolute -bottom-2 -right-2 bg-surface p-2 border border-primary/40">
                <span
                  className="material-symbols-outlined text-primary"
                  style={{ fontSize: 32, lineHeight: 1 }}
                >
                  manage_search
                </span>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-1 h-1 bg-primary" />
            <div className="absolute bottom-0 left-0 w-1 h-1 bg-primary" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-5xl font-headline font-bold mb-4 tracking-tighter leading-tight">
          Start Your <span className="text-primary italic">Research</span>
        </h1>
        <p className="text-on-surface/60 text-lg mb-12 max-w-lg mx-auto font-body font-light leading-relaxed">
          Enter a question and our multi-agent system — Planner, Researcher,
          Writer, Evaluator — will generate a comprehensive, evaluated
          report in real-time.
        </p>

        {/* Query input */}
        <div className="relative mb-8 group">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20 opacity-50 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative bg-surface-container border border-outline-variant/30 group-focus-within:border-primary/40 transition-colors">
            <div className="flex items-start p-4 gap-3">
              <span className="material-symbols-outlined text-primary/60 mt-0.5" style={{ fontSize: 20 }}>
                psychology
              </span>
              <textarea
                className="w-full bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-on-surface/20 font-body text-base resize-none outline-none"
                placeholder="Ask a research question..."
                rows={3}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
                }}
              />
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-surface-container-lowest/50 border-t border-outline-variant/20">
              <div className="flex gap-2">
                {['attach_file', 'language', 'data_object'].map((icon) => (
                  <button
                    key={icon}
                    className="p-1.5 hover:bg-surface-container-high text-on-surface/40 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={handleSubmit}
                disabled={!query.trim()}
                className="flex items-center gap-2 bg-primary hover:bg-[#ff8a52] disabled:opacity-40 disabled:cursor-not-allowed text-on-primary font-headline font-bold px-5 py-2 text-sm uppercase tracking-tight transition-colors active:scale-[0.98]"
              >
                Generate Report
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* Suggestion chips */}
        <div className="flex flex-wrap justify-center gap-2">
          <span className="text-[10px] font-mono text-on-surface/30 uppercase tracking-widest self-center mr-1">
            Suggestions:
          </span>
          {SUGGESTIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleSuggestion(label)}
              className="px-3 py-1.5 bg-surface-container border border-outline-variant/20 text-[11px] font-mono text-on-surface/60 hover:text-primary hover:border-primary/30 transition-all"
            >
              <span className="text-primary/40 mr-1">{id}_</span>
              {label}
            </button>
          ))}
        </div>

        {/* Status coordinates */}
        <div className="mt-20 flex justify-center items-center gap-8 text-[10px] font-mono text-on-surface/20 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
            System_Ready
          </div>
          <span>RES // EMPTY // 000</span>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>sensors</span>
            Coordinates_Locked
          </div>
        </div>
      </div>
    </div>
  )
}

/** Standalone screen — wraps content in its own Layout. */
export default function WelcomeScreen() {
  return (
    <Layout activeNav="Research" activeTopNav="Workspace">
      <WelcomeContent />
    </Layout>
  )
}
