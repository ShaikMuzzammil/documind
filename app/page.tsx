import Link from 'next/link';
import {
  ArrowRight, Bot, FileText, Layers, MessageSquare,
  Search, Shield, Zap, BarChart2, Code2, Globe,
  CheckCircle2, Download, FolderOpen, Lock,
  Sparkles, ChevronRight, Upload, BookOpen,
  Terminal, Database, Star, Brain, FileSearch,
} from 'lucide-react';
import FAQ from '@/components/landing/FAQ';

const FEATURES = [
  { icon: Zap,           title: 'Instant RAG pipeline',    desc: 'Upload → chunk → embed → vector search in seconds. Fully automatic.',             color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  { icon: MessageSquare, title: 'Cited AI answers',         desc: 'Every response shows the exact document chunk and relevance score.',               color: 'text-accent bg-accent/10 border-accent/20' },
  { icon: Globe,         title: 'General AI mode',          desc: 'Toggle between RAG mode and free-form AI chat — no documents required.',           color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  { icon: Layers,        title: 'Session memory',           desc: 'Conversations persist across reloads. Rename and revisit past chats.',             color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  { icon: FileSearch,    title: 'Semantic search',          desc: 'Vector similarity finds the right passage even when keywords don\'t match.',       color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { icon: FolderOpen,    title: 'Collections',              desc: 'Namespace documents and scope chat queries to a single collection.',                color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  { icon: BarChart2,     title: 'Analytics dashboard',      desc: 'Track upload velocity, index health, chunks, and per-collection storage.',        color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
  { icon: Download,      title: 'Export center',            desc: 'Export docs, chunks, or chat history as JSON, CSV, Markdown, or JSONL.',           color: 'text-pink-400 bg-pink-400/10 border-pink-400/20' },
  { icon: Code2,         title: 'OpenAI-compatible',        desc: 'Plug in Gemini, OpenAI, Groq, Ollama, or any OpenAI-compatible provider.',         color: 'text-teal-400 bg-teal-400/10 border-teal-400/20' },
  { icon: Lock,          title: 'Self-hostable',            desc: 'Vercel + Neon with zero vendor lock-in. Your data stays in your database.',        color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  { icon: Shield,        title: 'HMAC auth',                desc: 'Signed session tokens with no third-party auth service or OAuth dependency.',      color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20' },
  { icon: Brain,         title: 'Embedding fallback',       desc: 'Local bag-of-words embedder means upload and search work even without an AI key.',  color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' },
];

const STEPS = [
  { n: '01', icon: Upload,        title: 'Upload',    desc: 'PDF, MD, TXT, CSV, JSON, code — drag and drop up to 15 MB. Auto-chunked and embedded.' },
  { n: '02', icon: MessageSquare, title: 'Ask',       desc: 'Ask anything in natural language. Cosine similarity retrieves the best passages.' },
  { n: '03', icon: Download,      title: 'Export',    desc: 'Semantic search, analytics, collection management, and 4-format data export.' },
];

const FORMATS = ['PDF', 'MD', 'TXT', 'CSV', 'JSON', 'JS/TS', 'Python', 'YAML', 'SQL', 'HTML', 'XML', 'LOG'];

const USE_CASES = [
  {
    icon: BookOpen,
    title: 'Research & academia',
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    steps: ['Upload papers and datasets', 'Ask about methodology and findings', 'Get cited answers with exact sources', 'Export summaries for literature reviews'],
  },
  {
    icon: FileText,
    title: 'Legal & contracts',
    color: 'text-green-400 bg-green-400/10 border-green-400/20',
    steps: ['Upload contracts, NDAs, compliance docs', 'Ask about specific clauses and terms', 'Semantic search surfaces clauses instantly', 'Scope queries to individual contract sets'],
  },
  {
    icon: Terminal,
    title: 'Developer knowledge base',
    color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    steps: ['Index codebase, READMEs, and API docs', 'Ask about implementation details', 'Code-aware answers with chunk previews', 'Collections per project for clean separation'],
  },
  {
    icon: Database,
    title: 'Business intelligence',
    color: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    steps: ['Upload reports, CSVs, and meeting notes', 'Switch to General AI for open analysis', 'Ask cross-document strategic questions', 'Export as JSONL for LLM fine-tuning'],
  },
];

const STAT_CARDS = [
  { val: '12',  unit: 'formats',  label: 'File types supported' },
  { val: '4',   unit: 'providers',label: 'LLM integrations' },
  { val: '15MB',unit: 'per file', label: 'Max upload size' },
  { val: '4',   unit: 'formats',  label: 'Export formats' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary overflow-x-hidden">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-16 sm:pb-24 overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-accent/6 blur-[100px]" />
          <div className="absolute right-0 top-20 h-64 w-64 rounded-full bg-cyan-500/5 blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/8 px-4 py-1.5 text-xs font-semibold text-accent mb-7">
            <Sparkles className="h-3.5 w-3.5" /> Fully open-source RAG platform · pgvector + Next.js
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.05]">
            Your documents,{' '}
            <span className="bg-gradient-to-r from-accent via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              intelligently<br className="hidden sm:block" /> answered
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Upload any file. DocuMind embeds it with vector AI, then answers your questions
            with precise citations — every claim traced back to the source.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth?mode=signup"
              className="flex items-center gap-2 rounded-2xl bg-accent px-8 py-4 text-base font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-accent/30"
            >
              Start for free <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/auth?mode=login"
              className="flex items-center gap-2 rounded-2xl border border-border bg-bg-card px-8 py-4 text-base font-semibold text-text-secondary hover:text-text-primary hover:border-border/80 transition-colors"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-xs text-text-muted">No credit card required · Self-hostable on Vercel + Neon</p>
        </div>

        {/* Demo window */}
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 mt-14">
          <div className="glass rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-border/70">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-bg-secondary/60">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-400/70" />
                <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
                <span className="h-3 w-3 rounded-full bg-green-400/70" />
              </div>
              <span className="flex-1 text-center text-xs font-mono text-text-muted">DocuMind Chat</span>
              <Bot className="h-3.5 w-3.5 text-accent" />
            </div>
            <div className="px-6 py-5 space-y-4 bg-bg-primary/40">
              <div className="flex justify-end">
                <div className="max-w-xs rounded-2xl rounded-tr-sm bg-accent px-4 py-2.5 text-sm text-white">
                  What are the main risk factors in the Q3 report?
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent/10">
                  <Bot className="h-4 w-4 text-accent" />
                </div>
                <div className="max-w-lg rounded-2xl rounded-tl-sm border border-border bg-bg-card px-4 py-3 text-sm text-text-primary">
                  The report identifies <strong>three key risk factors</strong>:
                  <ol className="mt-2 space-y-1 pl-4 list-decimal text-text-secondary text-sm">
                    <li>Supply chain disruption in Q3 <sup className="text-accent font-bold">[1]</sup></li>
                    <li>Regulatory gaps in APAC markets <sup className="text-accent font-bold">[2]</sup></li>
                    <li>R&D talent retention pressure <sup className="text-accent font-bold">[3]</sup></li>
                  </ol>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {[{n:1,doc:'Q3-Risk-Report.pdf',s:94},{n:2,doc:'Compliance-APAC.pdf',s:87},{n:3,doc:'HR-Analysis.md',s:81}].map(({n,doc,s})=>(
                      <div key={n} className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-bg-secondary/40 px-2 py-1">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent/15 text-[9px] font-bold text-accent">{n}</span>
                        <span className="text-[11px] text-text-secondary">{doc}</span>
                        <span className="text-[10px] font-bold text-success">{s}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border/50 bg-bg-secondary/30">
              <span className="flex-1 text-sm text-text-muted pl-2">Ask anything about your documents…</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────────────── */}
      <section className="py-10 border-y border-border/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STAT_CARDS.map(({ val, unit, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-black text-accent">{val}</div>
                <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mt-0.5">{unit}</div>
                <div className="text-xs text-text-secondary mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────── */}
      <section id="how" className="py-20 scroll-mt-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">How it works</h2>
            <p className="mt-2 text-text-secondary text-sm">Three steps from raw files to cited answers</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {STEPS.map(({ n, icon: Icon, title, desc }) => (
              <div
                key={n}
                className="glass rounded-2xl p-5 relative overflow-hidden group hover:border-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
                    <Icon className="h-4 w-4 text-accent" />
                  </div>
                  <span className="text-xs font-mono font-bold text-accent/70">{n}</span>
                </div>
                <h3 className="font-bold mb-1.5">{title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
                <span className="absolute -bottom-3 -right-1 text-6xl font-black text-border/30 select-none group-hover:text-accent/8 transition-colors">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Supported formats ─────────────────────────────────────── */}
      <section className="py-10 border-t border-border/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">12 supported file formats</p>
          <div className="flex flex-wrap justify-center gap-2">
            {FORMATS.map(f => (
              <span key={f} className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-xs font-mono font-semibold text-text-secondary hover:border-accent/30 hover:text-accent transition-colors">
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features grid ─────────────────────────────────────────── */}
      <section id="features" className="py-20 border-t border-border/30 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Everything you need</h2>
            <p className="mt-2 text-text-secondary text-sm max-w-lg mx-auto">
              A complete RAG stack — from ingestion to export — in a single deployable Next.js app.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="glass rounded-xl p-4 group hover:border-accent/20 transition-colors hover:scale-[1.01]"
              >
                <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border mb-3 ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use Cases ─────────────────────────────────────────────── */}
      <section id="guide" className="py-20 border-t border-border/30 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/8 px-3 py-1 text-xs font-semibold text-accent mb-4">
              <Star className="h-3 w-3" /> Use cases
            </div>
            <h2 className="text-3xl font-bold">Built for every knowledge workflow</h2>
            <p className="mt-2 text-text-secondary text-sm max-w-lg mx-auto">
              From legal contracts to developer docs — DocuMind adapts to how you work with information.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {USE_CASES.map(({ icon: Icon, title, color, steps }) => (
              <div key={title} className="glass rounded-xl p-5 group hover:border-accent/20 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-bold text-sm">{title}</h3>
                </div>
                <ul className="space-y-2">
                  {steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-text-secondary">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                      {step}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth?mode=signup"
                  className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                >
                  Try this workflow <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 border-t border-border/30 scroll-mt-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">Frequently asked questions</h2>
            <p className="mt-2 text-text-secondary text-sm">Everything you need to know before deploying</p>
          </div>
          <FAQ />
          <div className="mt-8 text-center">
            <p className="text-sm text-text-secondary mb-3">Still have questions?</p>
            <Link
              href="/help"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg-card px-5 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:border-accent/30 transition-colors"
            >
              Read the full guide <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="py-20 border-t border-border/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="glass rounded-3xl p-10 sm:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/8 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-tl from-cyan-500/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-cyan-400 text-white mx-auto mb-5 shadow-lg shadow-accent/30">
                <Sparkles className="h-7 w-7" />
              </div>
              <h2 className="text-3xl font-extrabold mb-3">Ready to unlock your documents?</h2>
              <p className="text-text-secondary mb-7 max-w-md mx-auto text-sm leading-relaxed">
                Deploy in minutes. Upload anything. Ask anything.
                Every answer cited. Every source traceable.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/auth?mode=signup"
                  className="flex items-center gap-2 rounded-2xl bg-accent px-7 py-3.5 text-base font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-accent/25"
                >
                  Create free account <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/auth?mode=login"
                  className="flex items-center gap-2 rounded-2xl border border-border bg-bg-card px-7 py-3.5 text-base font-semibold text-text-secondary hover:text-text-primary hover:border-border/80 transition-colors"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-border/30 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-cyan-400 text-white">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <span className="font-bold text-sm">DocuMind</span>
              <span className="text-xs text-text-muted">v8.0</span>
            </div>
            <p className="text-xs text-text-muted">
              Built with Next.js · pgvector · OpenAI-compatible — Deployed on Vercel
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
