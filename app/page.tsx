import Link from 'next/link';
import {
  ArrowRight, Bot, FileText, Layers, MessageSquare,
  Search, Shield, Zap, BarChart2, Code2, Globe,
  CheckCircle2, Download, FolderOpen, Lock, Server,
  Sparkles, ChevronRight, Upload, Star, BookOpen,
  Terminal, Database,
} from 'lucide-react';
import FAQ from '@/components/landing/FAQ';

const FEATURES = [
  { icon: Zap,          title: 'Instant RAG pipeline',   desc: 'Upload any file. DocuMind chunks, embeds with ada-002, and stores in pgvector — ready for semantic search in seconds.',      color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  { icon: MessageSquare,title: 'Cited AI answers',        desc: 'Every response shows exactly which document and chunk it came from, with a relevance score you can inspect.',                  color: 'text-accent bg-accent/10 border-accent/20' },
  { icon: Globe,        title: 'General AI mode',         desc: 'Toggle between Document mode (RAG) and General AI mode for free-form conversation — no documents required.',                   color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  { icon: Layers,       title: 'Session memory',          desc: 'Chat sessions persist across reloads. Rename, browse history, and revisit past conversations.',                                 color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  { icon: Search,       title: 'Semantic search',         desc: 'Vector similarity search finds the right passage even when keywords don\'t match — understands meaning.',                       color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { icon: FolderOpen,   title: 'Collections',             desc: 'Organise documents into namespaced collections. Scope chat and search to a single collection.',                                 color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  { icon: BarChart2,    title: 'Analytics dashboard',     desc: 'Track upload velocity, index health, chunk counts, and per-collection storage usage in real time.',                            color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
  { icon: Download,     title: 'Export center',           desc: 'Download your documents, chunks, or chat history as JSON, CSV, Markdown, or JSONL for LLM fine-tuning.',                       color: 'text-pink-400 bg-pink-400/10 border-pink-400/20' },
  { icon: Code2,        title: 'OpenAI-compatible',       desc: 'Plug in any OpenAI-compatible provider — OpenAI, Groq, Ollama, Together, or your own endpoint.',                               color: 'text-teal-400 bg-teal-400/10 border-teal-400/20' },
  { icon: Lock,         title: 'Self-hostable',           desc: 'Runs on Vercel + Neon with zero vendor lock-in. Your data stays in your own database.',                                         color: 'text-red-400 bg-red-400/10 border-red-400/20' },
];

const STEPS = [
  { n: '01', title: 'Upload documents',  desc: 'PDF, Markdown, TXT, CSV, code, JSON — drag-and-drop up to 15 MB. DocuMind splits into chunks and generates embeddings automatically.' },
  { n: '02', title: 'Ask questions',     desc: 'Type any question in natural language. The AI retrieves the most relevant passages with cosine similarity, then drafts a cited answer.' },
  { n: '03', title: 'Explore & export',  desc: 'Search semantically, browse analytics, manage collections, and export everything for ML pipelines or backups.' },
];

const FORMATS = ['PDF', 'MD', 'TXT', 'CSV', 'JSON', 'JS/TS', 'Python', 'YAML', 'SQL', 'HTML', 'XML', 'LOG'];

const USE_CASES = [
  {
    icon: BookOpen,
    title: 'Research & academia',
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    steps: [
      'Upload research papers, theses, and datasets',
      'Ask "What methodology did Smith et al. use?"',
      'Get cited answers tracing back to exact pages',
      'Export structured summaries for literature reviews',
    ],
  },
  {
    icon: FileText,
    title: 'Legal & contracts',
    color: 'text-green-400 bg-green-400/10 border-green-400/20',
    steps: [
      'Upload contracts, NDAs, and compliance docs',
      'Ask "What are the termination clauses?"',
      'Semantic search surfaces relevant clauses instantly',
      'Scope queries to individual contract collections',
    ],
  },
  {
    icon: Terminal,
    title: 'Developer knowledge base',
    color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    steps: [
      'Index your codebase, READMEs, and API docs',
      'Ask "How does the auth middleware work?"',
      'Get code-aware answers with chunk previews',
      'Sync new docs with the collection auto-refresh',
    ],
  },
  {
    icon: Database,
    title: 'Business intelligence',
    color: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    steps: [
      'Upload reports, CSV datasets, and meeting notes',
      'Ask "What were Q3 key risks?"',
      'Switch to General AI for open-ended analysis',
      'Export chat history as JSONL for LLM fine-tuning',
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Navigation.tsx is injected by layout.tsx — no duplicate nav here */}

      {/* Hero — pt-20 offsets the sticky nav from Navigation.tsx */}
      <section className="relative overflow-hidden pt-20 pb-24 sm:pb-32">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-accent/5 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/8 px-4 py-1.5 text-xs font-semibold text-accent mb-8">
            <Sparkles className="h-3.5 w-3.5" /> Fully open-source RAG platform · pgvector + Next.js
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Your documents,{' '}
            <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
              intelligently answered
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Upload any file. DocuMind embeds it with vector AI, then answers your questions
            with precise citations — every claim traced back to the source.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/auth?mode=signup" className="flex items-center gap-2 rounded-2xl bg-accent px-8 py-4 text-base font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-accent/30">
              Start for free <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/auth?mode=login" className="flex items-center gap-2 rounded-2xl border border-border bg-bg-card px-8 py-4 text-base font-semibold text-text-secondary hover:text-text-primary hover:border-border/80 transition-colors">
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-xs text-text-muted">No credit card required · Self-hostable on Vercel + Neon</p>
        </div>
      </section>

      {/* Demo terminal */}
      <section className="py-8 pb-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="glass rounded-2xl overflow-hidden shadow-2xl shadow-black/30 border border-border/60">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-bg-secondary/50">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-400/70" />
                <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
                <span className="h-3 w-3 rounded-full bg-green-400/70" />
              </div>
              <span className="flex-1 text-center text-xs font-mono text-text-muted">DocuMind Chat</span>
              <Bot className="h-3.5 w-3.5 text-accent" />
            </div>
            <div className="px-6 py-6 space-y-5 bg-bg-primary/50">
              <div className="flex justify-end">
                <div className="max-w-xs rounded-2xl rounded-tr-sm bg-accent px-4 py-3 text-sm text-white">
                  What are the main risk factors identified in the report?
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent/10">
                  <Bot className="h-4 w-4 text-accent" />
                </div>
                <div className="max-w-lg rounded-2xl rounded-tl-sm border border-border bg-bg-card px-4 py-3 text-sm text-text-primary">
                  Based on the uploaded report, the <strong>three main risk factors</strong> are:
                  <ol className="mt-2 space-y-1 pl-4 list-decimal text-text-secondary">
                    <li>Supply chain disruption in Q3 <sup className="text-accent font-bold">[1]</sup></li>
                    <li>Regulatory compliance gaps in APAC markets <sup className="text-accent font-bold">[2]</sup></li>
                    <li>Talent retention in R&D divisions <sup className="text-accent font-bold">[3]</sup></li>
                  </ol>
                  <div className="mt-3 space-y-1.5">
                    {[
                      { n: 1, doc: 'Q3-Risk-Report.pdf', score: 94 },
                      { n: 2, doc: 'Compliance-APAC.pdf', score: 87 },
                      { n: 3, doc: 'HR-Analysis.md', score: 81 },
                    ].map(({ n, doc, score }) => (
                      <div key={n} className="flex items-center gap-2 rounded-lg border border-border/50 bg-bg-secondary/40 px-2.5 py-1.5">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent/15 text-[9px] font-bold text-accent">{n}</span>
                        <span className="flex-1 text-[11px] text-text-secondary">{doc}</span>
                        <span className="text-[10px] font-bold text-success">{score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 border-t border-border/50 bg-bg-secondary/30">
              <span className="flex-1 text-sm text-text-muted pl-2">Ask anything about your documents…</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 border-t border-border/30 scroll-mt-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold">How it works</h2>
            <p className="mt-3 text-text-secondary">Three steps from raw files to cited answers</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="glass rounded-2xl p-6 relative overflow-hidden group hover:border-accent/20 transition-colors">
                <span className="absolute -top-4 -right-2 text-7xl font-black text-border/40 select-none group-hover:text-accent/10 transition-colors">{n}</span>
                <div className="relative">
                  <p className="text-xs font-mono font-bold text-accent mb-3">{n}</p>
                  <h3 className="text-base font-bold mb-2">{title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported formats */}
      <section className="py-16 border-t border-border/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-lg font-bold mb-6">12 supported file formats</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {FORMATS.map(f => (
              <span key={f} className="rounded-xl border border-border bg-bg-card px-4 py-2 text-sm font-mono font-semibold text-text-secondary hover:border-accent/30 hover:text-accent transition-colors">{f}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="py-24 border-t border-border/30 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold">Everything you need</h2>
            <p className="mt-3 text-text-secondary max-w-xl mx-auto">A complete RAG stack — from ingestion to export — in a single deployable Next.js app.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="glass rounded-2xl p-6 group hover:border-accent/20 transition-colors hover:scale-[1.01]">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border mb-4 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold mb-2">{title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases — id="guide" matches Navigation.tsx anchor */}
      <section id="guide" className="py-24 border-t border-border/30 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/8 px-4 py-1.5 text-xs font-semibold text-accent mb-5">
              <Star className="h-3.5 w-3.5" /> Use cases
            </div>
            <h2 className="text-3xl font-bold">Built for every knowledge workflow</h2>
            <p className="mt-3 text-text-secondary max-w-xl mx-auto">
              From legal contracts to developer docs — DocuMind adapts to how your team works with information.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {USE_CASES.map(({ icon: Icon, title, color, steps }) => (
              <div key={title} className="glass rounded-2xl p-6 group hover:border-accent/20 transition-colors">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-base">{title}</h3>
                </div>
                <ol className="space-y-2.5">
                  {steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-text-secondary">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      {step}
                    </li>
                  ))}
                </ol>
                <Link
                  href="/auth?mode=signup"
                  className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
                >
                  Try this workflow <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — id="faq" matches Navigation.tsx anchor */}
      <section id="faq" className="py-24 border-t border-border/30 scroll-mt-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Frequently asked questions</h2>
            <p className="mt-3 text-text-secondary">Everything you need to know before deploying</p>
          </div>
          <FAQ />
          <div className="mt-10 text-center">
            <p className="text-sm text-text-secondary mb-4">Still have questions?</p>
            <Link
              href="/help"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg-card px-5 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:border-accent/30 transition-colors"
            >
              Read the full guide <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="glass rounded-3xl p-10 sm:p-14 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/8 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-2 text-white mx-auto mb-6 shadow-lg shadow-accent/30">
                <Sparkles className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-extrabold mb-4">Ready to unlock your documents?</h2>
              <p className="text-text-secondary mb-8 max-w-xl mx-auto leading-relaxed">
                Deploy in minutes. Upload anything. Ask anything.
                Every answer cited. Every source traceable.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/auth?mode=signup" className="flex items-center gap-2 rounded-2xl bg-accent px-8 py-4 text-base font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-accent/25">
                  Create free account <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href="/auth?mode=login" className="flex items-center gap-2 rounded-2xl border border-border bg-bg-card px-8 py-4 text-base font-semibold text-text-secondary hover:text-text-primary hover:border-border/80 transition-colors">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-white">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <span className="font-bold text-sm">DocuMind</span>
              <span className="text-xs text-text-muted">v7.0</span>
            </div>
            <p className="text-xs text-text-muted">
              Built with Next.js · pgvector · OpenAI — Deployed on Vercel
            </p>
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <Link href="/auth?mode=signup" className="hover:text-text-secondary transition-colors">Get started</Link>
              <Link href="/help" className="hover:text-text-secondary transition-colors">Help</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
