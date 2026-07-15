import Link from 'next/link';
import {
  ArrowRight, Bot, FileText, Layers, MessageSquare,
  Search, Shield, Zap, BarChart2, Code2, Globe,
  CheckCircle2, Download, FolderOpen, Lock,
  Sparkles, ChevronRight, Upload, BookOpen,
  Terminal, Database, Star, Brain, FileSearch,
  Cpu, AlignLeft, Workflow,
} from 'lucide-react';
import FAQ from '@/components/landing/FAQ';

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: Zap,           title: 'Instant RAG pipeline',    desc: 'Upload → chunk → embed → vector search in under 10 seconds. Zero configuration needed.',            color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  { icon: MessageSquare, title: 'Cited AI answers',         desc: 'Every response shows the exact document chunk and cosine similarity score — traceable to the source.', color: 'text-accent bg-accent/10 border-accent/20' },
  { icon: Globe,         title: 'General AI mode',          desc: 'Flip between RAG chat grounded in your docs and free-form AI conversation — same interface.',          color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  { icon: Layers,        title: 'Session memory',           desc: 'Conversations persist and reload. Rename, search, and revisit any past chat session.',                 color: 'text-violet-400 bg-violet-400/10 border-violet-400/20' },
  { icon: FileSearch,    title: 'Semantic search',          desc: 'Vector similarity retrieves the right passage even when exact keywords are missing.',                   color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { icon: FolderOpen,    title: 'Collections',              desc: 'Namespace your docs into collections. Scope AI queries to a single project workspace.',                 color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  { icon: BarChart2,     title: 'Analytics dashboard',      desc: 'Track upload velocity, index health, chunk counts, and per-collection storage at a glance.',           color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
  { icon: Download,      title: 'Export center',            desc: 'Export documents, chunks, or full chat history as JSON, CSV, Markdown, or JSONL in one click.',        color: 'text-pink-400 bg-pink-400/10 border-pink-400/20' },
  { icon: Code2,         title: 'OpenAI-compatible',        desc: 'Plug in any provider — Gemini, OpenAI, Groq, Ollama, or any OpenAI-compatible endpoint.',             color: 'text-teal-400 bg-teal-400/10 border-teal-400/20' },
  { icon: Lock,          title: 'Self-hostable',            desc: 'Deploy on Vercel + Neon with zero vendor lock-in. Your vectors, your database, your rules.',           color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  { icon: Shield,        title: 'HMAC session auth',        desc: 'Signed session tokens — no OAuth dependencies, no third-party auth services, no data exposure.',       color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20' },
  { icon: Brain,         title: 'Embedding fallback',       desc: 'A local bag-of-words embedder means uploads and search work even without a configured AI key.',        color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' },
];

const STEPS = [
  {
    n: '01', icon: Upload, title: 'Upload your files',
    desc: 'Drop any PDF, Markdown, code, CSV, or JSON file. DocuMind splits the content into overlapping chunks and generates vector embeddings automatically.',
    detail: 'Multi-file · 15 MB limit · 12 formats',
  },
  {
    n: '02', icon: Cpu, title: 'Vector indexing happens instantly',
    desc: 'Each chunk is embedded with your chosen AI model (or the built-in fallback) and stored in pgvector for sub-second cosine similarity retrieval.',
    detail: 'pgvector · cosine similarity · RAG',
  },
  {
    n: '03', icon: MessageSquare, title: 'Ask questions, get cited answers',
    desc: 'Type any question in plain English. DocuMind retrieves the most relevant passages and sends them to the LLM with your question — every claim is traceable.',
    detail: 'Citations · chunk preview · session memory',
  },
  {
    n: '04', icon: Download, title: 'Search, analyse, and export',
    desc: 'Semantic search across all your indexed content. Run analytics, explore the chunk store, and export your data in four formats for downstream use.',
    detail: 'JSON · CSV · Markdown · JSONL',
  },
];

const FORMATS = ['PDF', 'MD', 'TXT', 'CSV', 'JSON', 'JS/TS', 'Python', 'SQL', 'YAML', 'HTML', 'XML', 'LOG'];

const USE_CASES = [
  {
    icon: BookOpen,
    title: 'Research & academia',
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    desc: 'Index papers and datasets, then interrogate findings with cited answers — perfect for literature reviews.',
    steps: ['Upload papers and research datasets', 'Ask about methodology and key findings', 'Get cited answers with exact passage sources', 'Export summaries as Markdown or JSONL'],
  },
  {
    icon: FileText,
    title: 'Legal & contracts',
    color: 'text-green-400 bg-green-400/10 border-green-400/20',
    desc: 'Surface specific clauses instantly across hundreds of contracts without manual search.',
    steps: ['Upload contracts, NDAs, compliance docs', 'Ask about specific clauses and obligations', 'Semantic search surfaces clauses instantly', 'Scope queries to a single contract collection'],
  },
  {
    icon: Terminal,
    title: 'Developer knowledge base',
    color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    desc: 'Index your codebase, READMEs, and API docs — then ask implementation questions in plain English.',
    steps: ['Index codebase, READMEs, and API docs', 'Ask implementation and architecture questions', 'Code-aware answers with chunk previews', 'Collections per project for clean separation'],
  },
  {
    icon: Database,
    title: 'Business intelligence',
    color: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    desc: 'Turn unstructured reports, meeting notes, and CSVs into a queryable knowledge base.',
    steps: ['Upload reports, CSVs, and meeting notes', 'Switch to General AI for open-ended analysis', 'Ask cross-document strategic questions', 'Export as JSONL for LLM fine-tuning'],
  },
];

const TECH_STACK = [
  { label: 'Next.js 16', sublabel: 'App Router' },
  { label: 'pgvector', sublabel: 'Cosine similarity' },
  { label: 'OpenAI-compatible', sublabel: 'Any LLM provider' },
  { label: 'Vercel + Neon', sublabel: 'Zero-config deploy' },
  { label: 'TypeScript', sublabel: 'Strict mode' },
  { label: 'HMAC auth', sublabel: 'No OAuth' },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary overflow-x-hidden">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-14 overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 hero-glow" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-80px] -translate-x-1/2 h-[420px] w-[700px] rounded-full bg-accent/7 blur-[110px]" />
          <div className="absolute right-0 top-24 h-56 w-56 rounded-full bg-cyan-500/6 blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/8 px-4 py-1.5 text-xs font-semibold text-accent mb-8">
            <Sparkles className="h-3.5 w-3.5" />
            Retrieval-Augmented Generation (RAG) · Open source · pgvector + Next.js
          </div>

          {/* Headline — intentionally restrained sizing */}
          <h1 className="text-[2.2rem] sm:text-[3rem] lg:text-[3.6rem] font-bold tracking-tight leading-[1.1] max-w-3xl mx-auto">
            Your documents,{' '}
            <span className="bg-gradient-to-r from-accent via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              intelligently answered
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="mt-5 text-base sm:text-lg text-text-secondary max-w-xl mx-auto leading-relaxed">
            Upload any file. DocuMind embeds it with vector AI, then answers
            your questions with{' '}
            <span className="text-text-primary font-medium">precise citations</span>
            {' '}— every claim traced back to the exact source chunk.
          </p>

          {/* What is RAG callout */}
          <div className="mt-6 inline-flex items-start gap-2.5 rounded-xl border border-border bg-bg-card/60 px-4 py-3 text-left max-w-md mx-auto">
            <AlignLeft className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary leading-relaxed">
              <span className="text-text-primary font-semibold">What is RAG? </span>
              Retrieval-Augmented Generation grounds LLM answers in your own documents
              — so the AI cites real passages instead of hallucinating facts.
            </p>
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth?mode=register"
              className="flex items-center gap-2 rounded-2xl bg-accent px-7 py-3.5 text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-accent/25"
            >
              Start for free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth?mode=login"
              className="flex items-center gap-2 rounded-2xl border border-border bg-bg-card px-7 py-3.5 text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-border/80 transition-colors"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-3 text-xs text-text-muted">No credit card required · Self-hostable on Vercel + Neon</p>
        </div>

        {/* Demo window */}
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 mt-12">
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
            <div className="px-5 py-5 space-y-4 bg-bg-primary/40">
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

      {/* ── Tech stack strip ─────────────────────────────────────── */}
      <section className="py-8 border-y border-border/30 bg-bg-secondary/20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-5">
            Built on production-grade open-source infrastructure
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {TECH_STACK.map(({ label, sublabel }) => (
              <div key={label} className="text-center">
                <p className="text-sm font-bold text-text-primary">{label}</p>
                <p className="text-[10px] text-text-muted mt-0.5">{sublabel}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────── */}
      <section id="how" className="py-20 scroll-mt-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-accent mb-3">How it works</p>
            <h2 className="text-2xl sm:text-3xl font-bold">From raw files to cited answers in 4 steps</h2>
            <p className="mt-2 text-text-secondary text-sm max-w-md mx-auto">
              The full RAG pipeline runs automatically — upload once, ask forever.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {STEPS.map(({ n, icon: Icon, title, desc, detail }) => (
              <div
                key={n}
                className="glass rounded-2xl p-5 relative overflow-hidden group hover:border-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
                    <Icon className="h-4 w-4 text-accent" />
                  </div>
                  <span className="text-xs font-mono font-bold text-accent/60">{n}</span>
                </div>
                <h3 className="font-bold text-sm mb-1.5">{title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-3">{desc}</p>
                <div className="flex flex-wrap gap-1">
                  {detail.split(' · ').map(tag => (
                    <span key={tag} className="rounded-md border border-border/60 bg-bg-secondary/50 px-1.5 py-0.5 text-[10px] font-mono text-text-muted">
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="absolute -bottom-3 -right-1 text-6xl font-black text-border/20 select-none group-hover:text-accent/6 transition-colors">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── File formats ─────────────────────────────────────────── */}
      <section className="py-10 border-t border-border/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted mb-4">
            12 supported file formats · up to 15 MB per file
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {FORMATS.map(f => (
              <span key={f} className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-xs font-mono font-semibold text-text-secondary hover:border-accent/30 hover:text-accent transition-colors">
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section id="features" className="py-20 border-t border-border/30 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-accent mb-3">Features</p>
            <h2 className="text-2xl sm:text-3xl font-bold">Everything you need in one deployable app</h2>
            <p className="mt-2 text-text-secondary text-sm max-w-lg mx-auto">
              A complete document intelligence stack — from ingestion to export — shipping as a single Next.js application.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="glass rounded-xl p-4 group hover:border-accent/20 transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-accent/5"
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
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/8 px-3 py-1 text-xs font-semibold text-accent mb-4">
              <Star className="h-3 w-3" /> Use cases
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">Built for every knowledge workflow</h2>
            <p className="mt-2 text-text-secondary text-sm max-w-lg mx-auto">
              From legal contracts to developer docs — DocuMind adapts to how you work with information.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {USE_CASES.map(({ icon: Icon, title, color, desc, steps }) => (
              <div key={title} className="glass rounded-xl p-5 group hover:border-accent/20 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-bold text-sm">{title}</h3>
                </div>
                <p className="text-xs text-text-muted mb-3 leading-relaxed">{desc}</p>
                <ul className="space-y-2">
                  {steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-text-secondary">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                      {step}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth?mode=register"
                  className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                >
                  Try this workflow <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RAG Explainer ─────────────────────────────────────────── */}
      <section className="py-16 border-t border-border/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="glass rounded-2xl p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-cyan-500/5 pointer-events-none" />
            <div className="relative grid gap-8 sm:grid-cols-2 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/8 px-3 py-1 text-xs font-semibold text-accent mb-4">
                  <Workflow className="h-3 w-3" /> How RAG works
                </div>
                <h2 className="text-xl sm:text-2xl font-bold mb-3">Why not just use ChatGPT?</h2>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                  Generic LLMs are trained on public data and will confidently hallucinate facts about
                  <em> your</em> documents. RAG grounds every answer in your actual content — the model
                  only sees what you uploaded, and every claim is cited back to the original passage.
                </p>
                <div className="space-y-2">
                  {[
                    'No hallucinations — answers cite real passages',
                    'Your data never leaves your own infrastructure',
                    'Works on private, internal, or proprietary content',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2.5 text-xs text-text-secondary">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { step: '1', label: 'Your question', desc: 'Converted to a vector embedding', color: 'bg-accent/10 border-accent/20 text-accent' },
                  { step: '2', label: 'Vector search', desc: 'pgvector retrieves the top-k passages by cosine similarity', color: 'bg-purple-400/10 border-purple-400/20 text-purple-400' },
                  { step: '3', label: 'Grounded prompt', desc: 'Retrieved passages + your question sent to the LLM', color: 'bg-cyan-400/10 border-cyan-400/20 text-cyan-400' },
                  { step: '4', label: 'Cited answer', desc: 'Response with source citations you can verify', color: 'bg-success/10 border-success/20 text-success' },
                ].map(({ step, label, desc, color }) => (
                  <div key={step} className={`flex items-start gap-3 rounded-xl border p-3 ${color.split(' ').slice(0,2).join(' ')}`}>
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${color}`}>{step}</span>
                    <div>
                      <p className="text-xs font-semibold text-text-primary">{label}</p>
                      <p className="text-[11px] text-text-secondary mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 border-t border-border/30 scroll-mt-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-accent mb-3">FAQ</p>
            <h2 className="text-2xl sm:text-3xl font-bold">Frequently asked questions</h2>
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
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Ready to unlock your documents?</h2>
              <p className="text-text-secondary mb-7 max-w-md mx-auto text-sm leading-relaxed">
                Deploy in minutes on Vercel + Neon. Upload anything.
                Ask anything. Every answer cited. Every source traceable.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/auth?mode=register"
                  className="flex items-center gap-2 rounded-2xl bg-accent px-7 py-3.5 text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-accent/25"
                >
                  Create free account <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/auth?mode=login"
                  className="flex items-center gap-2 rounded-2xl border border-border bg-bg-card px-7 py-3.5 text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-border/80 transition-colors"
                >
                  Sign in
                </Link>
              </div>
              <p className="mt-4 text-xs text-text-muted">No credit card · Self-host on Vercel + Neon in under 10 minutes</p>
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
              <span className="text-xs text-text-muted">v8.4</span>
            </div>
            <p className="text-xs text-text-muted">
              Built with Next.js · pgvector · OpenAI-compatible · Deployed on Vercel
            </p>
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <Link href="/auth?mode=register" className="hover:text-text-secondary transition-colors">Get started</Link>
              <Link href="/help" className="hover:text-text-secondary transition-colors">Help</Link>
              <a href="https://github.com/ShaikMuzzammil/documind" target="_blank" rel="noopener noreferrer" className="hover:text-text-secondary transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
