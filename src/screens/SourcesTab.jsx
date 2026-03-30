const SOURCES = [
  {
    num: '01',
    title: 'LLM Integration in Global Financial Systems',
    publication: 'MIT Technology Review',
    year: '2024',
    type: 'Academic Paper',
    excerpt:
      'Comprehensive analysis of how large language models are reshaping financial data pipelines and compliance workflows across 140+ institutions.',
  },
  {
    num: '02',
    title: 'The Economic Impact of Agentic Workflow Automation',
    publication: 'Harvard Business Review',
    year: '2024',
    type: 'Industry Report',
    excerpt:
      'Cross-sector study quantifying productivity gains from autonomous AI agents, covering 2,300 enterprise deployments across North America and Europe.',
  },
  {
    num: '03',
    title: 'Data Sovereignty in the Age of Generative Intelligence — Legal Frameworks Vol. IV',
    publication: 'Stanford Law Technology Review',
    year: '2023',
    type: 'Legal Analysis',
    excerpt:
      'Examination of emerging regulatory frameworks governing AI-generated intellectual property, with case studies from the EU AI Act and California AB 302.',
  },
]

export function SourcesContent() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-8 border-b border-outline-variant/20 pb-5">
        <div className="text-primary font-mono text-xs tracking-widest uppercase mb-1">
          Sources // Run_ID_042
        </div>
        <h1 className="text-3xl font-headline font-bold tracking-tight">
          Verified References
        </h1>
      </div>

      {/* Source cards */}
      <div className="space-y-4">
        {SOURCES.map((src) => (
          <div
            key={src.num}
            className="bg-surface-container border border-outline-variant/15 p-5 group hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start gap-5">
              {/* Number */}
              <span className="font-headline font-bold text-2xl text-primary/40 shrink-0 leading-none mt-0.5">
                {src.num}
              </span>

              <div className="flex-1 min-w-0">
                {/* Badges */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-[9px] font-mono text-primary uppercase tracking-tighter">
                    {src.type}
                  </span>
                  <span className="text-[9px] font-mono text-on-surface/30 uppercase">{src.year}</span>
                </div>

                {/* Title */}
                <h3 className="font-headline font-semibold text-on-surface text-base mb-1 group-hover:text-primary transition-colors">
                  {src.title}
                </h3>

                {/* Publication */}
                <p className="font-mono text-[10px] text-primary/60 uppercase tracking-wider mb-3">
                  {src.publication}
                </p>

                {/* Excerpt */}
                <p className="font-body text-sm text-on-surface/50 leading-relaxed border-l border-outline-variant/20 pl-3">
                  {src.excerpt}
                </p>
              </div>

              {/* External link icon */}
              <button className="shrink-0 text-on-surface/20 hover:text-primary transition-colors mt-0.5">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>open_in_new</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer coordinates */}
      <div className="mt-12 flex items-center gap-6 text-[9px] font-mono text-on-surface/20 uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-primary" />
          {SOURCES.length} Sources Verified
        </div>
        <span>RES // SRC // 042</span>
      </div>
    </div>
  )
}

