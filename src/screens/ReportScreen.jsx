import Layout from '../components/Layout'

const REPORT = {
  runId: 'GEN-AI-2024-X-042',
  title: 'The Impact of Generative AI on Enterprise Software',
  author: 'Multi-Agent Research Copilot',
  classification: 'Level 4 Intelligence',
  sections: [
    {
      id: 'introduction',
      heading: 'Introduction',
      paragraphs: [
        'The landscape of enterprise software is undergoing a seismic shift. No longer just tools for data management or process automation, software systems are evolving into sentient cognitive layers capable of creative reasoning, complex synthesis, and autonomous execution. This report explores the transition from deterministic systems to generative platforms.',
        'Generative Artificial Intelligence (GenAI) is not merely an incremental feature but a foundational architectural paradigm. As enterprise organizations integrate Large Language Models (LLMs) into their core operations, the definition of productivity, user interface, and value delivery is being fundamentally rewritten in real-time.',
      ],
    },
    {
      id: 'key-findings',
      heading: 'Key Findings',
      bullets: [
        {
          label: 'UI Disruption',
          text: 'The traditional "Forms and Buttons" interface is being superseded by natural language "Intent Interfaces" that reduce task friction by 64%.',
        },
        {
          label: 'Agentic Workflows',
          text: '72% of surveyed enterprises are shifting from passive software to autonomous AI agents that can manage entire cross-departmental workflows.',
        },
        {
          label: 'Hyper-Personalization',
          text: 'Software behavior now adapts dynamically to individual user psychographics and organizational historical data in milliseconds.',
        },
      ],
    },
    {
      id: 'market-analysis',
      heading: 'Market Analysis',
      paragraphs: [
        'Current projections indicate that the GenAI-integrated enterprise software market will reach a valuation of $450B by 2027. The most aggressive growth sectors include ERP systems and CRM platforms, where generative capabilities offer immediate ROI through automated customer interaction and supply chain predictive synthesis.',
        'Venture capital flows remain heavily skewed toward "Vertical AI" — specialized models trained on proprietary industry data — rather than general-purpose assistants. This indicates a flight to quality and depth in the professional stack.',
      ],
    },
    {
      id: 'risks',
      heading: 'Risks and Challenges',
      paragraphs: [
        'The primary bottleneck remains the "Accuracy Threshold." Enterprise systems cannot afford the hallucination rates acceptable in consumer-grade AI. Data sovereignty and the legal implications of model-generated intellectual property remain significant friction points for Fortune 500 adoption.',
        'Furthermore, the energy consumption required to sustain real-time inference at scale is driving a new focus on model efficiency and local "edge" deployment architectures.',
      ],
    },
    {
      id: 'conclusion',
      heading: 'Conclusion',
      paragraphs: [
        'We are entering the era of "Post-UI" software. The enterprise stack of the future will not be a collection of applications, but a unified cognitive fabric. Organizations that fail to adopt these agentic frameworks within the next 24 months risk catastrophic obsolescence in a market moving at machine-speed.',
      ],
    },
  ],
  sources: [
    'Synthesis of LLM Integration in Global Financial Systems (2024)',
    'The Economic Impact of Agentic Workflow Automation — MIT Technology Review',
    'Data Sovereignty in the Age of Generative Intelligence — Legal Frameworks Vol. IV',
  ],
}

/** Content only — no Layout wrapper. Used by App.jsx and ResultsScreen. */
export function ReportContent() {
  return (
    <div className="overflow-y-auto">
      <div className="max-w-4xl mx-auto py-14 px-6 lg:px-12">

          {/* Terminal header decor */}
          <div className="mb-10 flex items-center justify-between font-headline text-[10px] tracking-[0.2em] text-primary uppercase opacity-60">
            <span>File Ref: {REPORT.runId}</span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-primary animate-pulse" />
              Decryption Complete
            </span>
          </div>

          {/* Report article */}
          <article className="bg-surface-container border-l-2 border-primary p-8 lg:p-14 relative">
            {/* Dot-grid texture */}
            <div
              className="absolute inset-0 opacity-[0.025] pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(#FF702E 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            />

            {/* Report header */}
            <header className="relative mb-14">
              <h1 className="text-4xl lg:text-6xl font-headline font-bold text-on-surface leading-[1.1] mb-5 tracking-tight">
                {REPORT.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 font-headline text-xs uppercase tracking-widest text-on-surface/40">
                <span>Author: {REPORT.author}</span>
                <span className="text-primary/30">|</span>
                <span>Classification: {REPORT.classification}</span>
              </div>
            </header>

            {/* Sections */}
            {REPORT.sections.map((section) => (
              <section key={section.id} className="mb-14 relative">
                <h2 className="font-headline text-2xl font-semibold text-on-surface mb-6 border-b border-white/5 pb-4">
                  {section.heading}
                </h2>

                {/* Prose paragraphs */}
                {section.paragraphs && (
                  <div className="text-on-surface/70 text-base leading-relaxed space-y-5 font-body">
                    {section.paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                )}

                {/* Bulleted findings */}
                {section.bullets && (
                  <ul className="space-y-5 font-body text-on-surface/70 text-base leading-relaxed">
                    {section.bullets.map((b) => (
                      <li key={b.label} className="pl-7 relative">
                        <span className="absolute left-0 top-[11px] w-4 h-[1px] bg-primary" />
                        <strong className="text-on-surface font-headline">{b.label}:</strong>{' '}
                        {b.text}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            {/* Sources */}
            <footer className="mt-20 pt-10 border-t border-white/10">
              <h3 className="font-headline text-xs uppercase tracking-widest text-on-surface/40 mb-5">
                Verified Sources
              </h3>
              <ol className="space-y-3 font-body text-sm">
                {REPORT.sources.map((src, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="text-primary font-headline font-bold shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <a href="#" className="text-primary hover:underline">{src}</a>
                  </li>
                ))}
              </ol>
            </footer>
          </article>

          {/* Terminal footer */}
          <div className="mt-10 mb-16 flex items-center justify-between font-headline text-[10px] tracking-widest text-on-surface/20 uppercase">
            <span>End of Document</span>
            <span>CRC: 0x9F44E2</span>
            <span>Multi-Agent Research Copilot v1.0</span>
        </div>
      </div>
    </div>
  )
}

/** Standalone screen with its own Layout. */
export default function ReportScreen() {
  return (
    <Layout activeNav="Research" activeTopNav="Workspace">
      <ReportContent />
    </Layout>
  )
}
