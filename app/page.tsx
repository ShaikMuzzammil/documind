'use client';

import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight, Upload, Search, MessageSquare, FileText,
  ShieldCheck, Quote, Sparkles, Layers, Zap, BrainCircuit,
  Database, GitBranch, Globe, Lock, ChevronRight, Star,
  BarChart3, Code2, Cpu, Workflow, CheckCircle, ExternalLink,
  Brain, ScanText, FolderKanban,
} from 'lucide-react';
import FAQ from '@/components/landing/FAQ';
import { useRef } from 'react';

const FEATURES = [
  {
    icon: Upload,
    title: 'Universal File Ingestion',
    body: 'Upload PDF, Markdown, TXT, CSV, JSON, and code files. Auto-parsed, chunked and embedded into your vector store in seconds.',
    badge: 'Core',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
  },
  {
    icon: Brain,
    title: 'Gemini-Powered Reasoning',
    body: 'Backed by Google Gemini 2.0 Flash for fast, accurate reasoning. Embeddings via text-embedding-004 for 768-dim semantic retrieval.',
    badge: 'AI',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
  },
  {
    icon: Search,
    title: 'Semantic Vector Search',
    body: 'Cosine similarity over pgvector embeddings retrieves the most relevant passages by meaning, not just keywords.',
    badge: 'Search',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: Quote,
    title: 'Cited, Verifiable Answers',
    body: 'Every answer links back to exact source passages with similarity scores. No hallucinations — just grounded facts.',
    badge: 'Trust',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: FolderKanban,
    title: 'Collection Workspaces',
    body: 'Organize documents into isolated collections — Legal, Research, Product, Finance. Scope any question to exactly what matters.',
    badge: 'Organize',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/20',
  },
  {
    icon: Zap,
    title: 'Token-by-Token Streaming',
    body: 'Answers stream in real time over Server-Sent Events. First token in under a second. No waiting for full completions.',
    badge: 'Speed',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
  },
  {
    icon: ShieldCheck,
    title: 'Grounded & Honest',
    body: "If the answer isn't in your documents, DocuMind says so — clearly — instead of fabricating a response.",
    badge: 'Safe',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10 border-teal-500/20',
  },
  {
    icon: Database,
    title: 'Dual Storage Mode',
    body: 'Local JSON store for instant development with zero setup. Switch to Postgres + pgvector for production with one env var.',
    badge: 'Infra',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: Lock,
    title: 'User-Isolated Security',
    body: 'Every account has its own scoped collections and documents. HMAC-signed session cookies, bcrypt password hashing.',
    badge: 'Auth',
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
  },
];

const STEPS = [
  {
    icon: Upload,
    step: '01',
    title: 'Upload your documents',
    body: 'Create a collection and drop in your PDFs, notes, or code files. DocuMind extracts text, splits it into chunks, and embeds each one using Gemini text-embedding-004.',
    detail: 'Supports PDF, TXT, MD, CSV, JSON, and most text-based formats',
  },
  {
    icon: Search,
    step: '02',
    title: 'Ask your question',
    body: 'Type any question in natural language. DocuMind embeds your query and runs cosine similarity search across your collection to find the top-5 most relevant passages.',
    detail: 'Semantic search finds meaning, not just keyword matches',
  },
  {
    icon: ScanText,
    step: '03',
    title: 'Get a cited answer',
    body: 'Gemini generates a grounded, structured response using only the retrieved passages. Every claim is backed by a clickable source with its similarity score.',
    detail: 'If the answer is not in your docs, it says so — never hallucinates',
  },
];

const TECH_STACK = [
  { label: 'Next.js 15.3', color: 'text-white bg-white/8' },
  { label: 'React 19', color: 'text-cyan-300 bg-cyan-500/10' },
  { label: 'TypeScript', color: 'text-blue-300 bg-blue-500/10' },
  { label: 'Tailwind v4', color: 'text-sky-300 bg-sky-500/10' },
  { label: 'Gemini 2.0 Flash', color: 'text-violet-300 bg-violet-500/10' },
  { label: 'text-embedding-004', color: 'text-purple-300 bg-purple-500/10' },
  { label: 'Postgres + pgvector', color: 'text-emerald-300 bg-emerald-500/10' },
  { label: 'Framer Motion', color: 'text-pink-300 bg-pink-500/10' },
  { label: 'Streaming SSE', color: 'text-orange-300 bg-orange-500/10' },
  { label: 'bcrypt Auth', color: 'text-red-300 bg-red-500/10' },
  { label: 'PDF Parse', color: 'text-amber-300 bg-amber-500/10' },
  { label: 'Resend Email', color: 'text-teal-300 bg-teal-500/10' },
];

const STATS = [
  { value: '768', label: 'Embedding dimensions', sub: 'via text-embedding-004' },
  { value: '< 1s', label: 'First token latency', sub: 'Gemini 2.0 Flash' },
  { value: '∞', label: 'Documents per user', sub: 'limited only by your DB' },
  { value: '5', label: 'Citations per answer', sub: 'top-k semantic retrieval' },
];

const DEPLOY_OPTIONS = [
  {
    icon: Globe,
    title: 'Vercel',
    desc: 'One-click deploy. Add env vars from the dashboard. Free tier handles light usage.',
    badge: 'Recommended',
  },
  {
    icon: Database,
    title: 'Neon / Supabase',
    desc: 'Free Postgres + pgvector. Just set DATABASE_URL and you have production-grade vector storage.',
    badge: 'Database',
  },
  {
    icon: GitBranch,
    title: 'Self-hosted',
    desc: 'Docker or bare metal. Full control over your data and infrastructure.',
    badge: 'Advanced',
  },
];

function FadeIn({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function TerminalPreview() {
  const lines = [
    { role: 'system', text: '> Loaded "Q3 Finance Report.pdf" — 48 chunks indexed' },
    { role: 'user', text: '? What were the key risks mentioned in Q3?' },
    { role: 'ai', text: '◆ Based on [1] and [3]: Three critical risks were identified...' },
    { role: 'cite', text: '  [1] Page 7 · score 0.924 · "Market volatility poses..."' },
    { role: 'cite', text: '  [3] Page 12 · score 0.887 · "Supply chain disruptions..."' },
  ];

  return (
    <div className="terminal-window p-4 font-mono text-xs leading-relaxed">
      <div className="flex items-center gap-1.5 mb-4 pb-3 border-b border-white/5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        <span className="ml-2 text-text-muted">documind — workspace</span>
      </div>
      {lines.map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 + i * 0.25, duration: 0.3 }}
          className={`mb-1.5 ${
            line.role === 'user' ? 'text-cyan-400' :
            line.role === 'ai' ? 'text-violet-300' :
            line.role === 'system' ? 'text-emerald-400' :
            'text-text-muted'
          }`}
        >
          {line.text}
        </motion.div>
      ))}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
        className="text-violet-400 animate-blink"
      >
        ▌
      </motion.span>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative hero-glow grid-bg pt-28 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Ambient orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-cyan-500/6 blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300 text-xs font-medium mb-6"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Powered by Gemini 2.0 · Retrieval-Augmented AI
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.07 }}
              className="text-4xl sm:text-5xl xl:text-6xl font-bold tracking-tight leading-[1.08]"
            >
              Your documents,{' '}
              <span className="gradient-text">finally intelligent.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              className="mt-5 text-base sm:text-lg text-text-secondary leading-relaxed max-w-lg"
            >
              DocuMind turns your PDFs, notes, and code files into a searchable AI knowledge base.
              Ask anything — get precise, <em>cited</em> answers grounded in your own documents.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-7 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-violet-900/30"
              >
                Start chatting <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 px-6 py-3 glass rounded-xl font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                How it works
                <ChevronRight className="w-4 h-4" />
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              {[
                { icon: CheckCircle, text: 'No hallucinations' },
                { icon: CheckCircle, text: 'Inline citations' },
                { icon: CheckCircle, text: 'Free to self-host' },
              ].map(({ icon: Icon, text }) => (
                <span key={text} className="flex items-center gap-1.5 text-sm text-text-muted">
                  <Icon className="w-3.5 h-3.5 text-emerald-400" />
                  {text}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right: Terminal */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="animate-float"
          >
            <TerminalPreview />
          </motion.div>
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="glass rounded-xl p-4 text-center">
              <p className="text-2xl font-bold gradient-text">{stat.value}</p>
              <p className="mt-1 text-xs font-medium text-text-secondary">{stat.label}</p>
              <p className="mt-0.5 text-[10px] text-text-muted font-mono">{stat.sub}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how" className="py-24 px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-14">
            <p className="text-xs font-mono font-bold tracking-widest text-violet-400 mb-3">THE RAG PIPELINE</p>
            <h2 className="text-3xl sm:text-4xl font-bold">From document to cited answer</h2>
            <p className="mt-3 text-text-secondary max-w-xl mx-auto">
              DocuMind implements a complete retrieval-augmented generation pipeline in three steps.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-[52px] left-[33%] right-[33%] h-px bg-gradient-to-r from-violet-500/30 via-cyan-500/30 to-violet-500/30" />

            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <FadeIn key={s.title} delay={i * 0.1}>
                  <div className="relative glass card-glow rounded-2xl p-6 transition-all duration-300 h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/12 border border-violet-500/25 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-violet-400" />
                      </div>
                      <span className="font-mono text-xs font-bold text-text-muted">{s.step}</span>
                    </div>
                    <h3 className="font-semibold text-base mb-2">{s.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed mb-3">{s.body}</p>
                    <p className="text-[11px] font-mono text-violet-400/70 border-t border-border pt-3">{s.detail}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-bg-secondary/40 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-14">
            <p className="text-xs font-mono font-bold tracking-widest text-cyan-400 mb-3">CAPABILITIES</p>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Everything you need to reason over documents
            </h2>
            <p className="mt-3 text-text-secondary max-w-2xl mx-auto">
              A production-grade RAG platform — from ingestion to grounded, cited answers.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <FadeIn key={f.title} delay={i * 0.04}>
                  <div className="glass card-glow rounded-2xl p-5 transition-all duration-300 h-full group">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${f.bg}`}>
                        <Icon className={`w-4.5 h-4.5 ${f.color}`} />
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${f.bg} ${f.color}`}>
                        {f.badge}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm mb-1.5">{f.title}</h3>
                    <p className="text-xs text-text-secondary leading-relaxed">{f.body}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Architecture Visual ─── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <p className="text-xs font-mono font-bold tracking-widest text-violet-400 mb-3">ARCHITECTURE</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Built on a transparent RAG stack</h2>
            <p className="mt-3 text-text-secondary max-w-xl mx-auto">
              Every layer is open, auditable, and replaceable. No black boxes.
            </p>
          </FadeIn>

          <FadeIn>
            <div className="glass rounded-2xl p-6 sm:p-8 font-mono text-sm">
              {/* Architecture diagram */}
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    label: 'Ingestion',
                    icon: Upload,
                    color: 'text-emerald-400',
                    borderColor: 'border-emerald-500/25',
                    items: [
                      'PDF Parse → text extraction',
                      'chunkText() → 1000-char chunks',
                      '150-char overlap windows',
                      'Gemini batchEmbedContents',
                      'Store in pgvector / JSON',
                    ],
                  },
                  {
                    label: 'Retrieval',
                    icon: Search,
                    color: 'text-cyan-400',
                    borderColor: 'border-cyan-500/25',
                    items: [
                      'Embed query → 768-dim vector',
                      'Cosine similarity search',
                      'pgvector <=> operator',
                      'Top-5 chunks returned',
                      'Scoped by user + collection',
                    ],
                  },
                  {
                    label: 'Generation',
                    icon: BrainCircuit,
                    color: 'text-violet-400',
                    borderColor: 'border-violet-500/25',
                    items: [
                      'System prompt + context',
                      'Gemini 2.0 Flash streaming',
                      'SSE token-by-token delivery',
                      'Inline citation markers [1]',
                      'Source panel with scores',
                    ],
                  },
                ].map((col) => {
                  const Icon = col.icon;
                  return (
                    <div key={col.label} className={`border ${col.borderColor} rounded-xl p-4`}>
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className={`w-4 h-4 ${col.color}`} />
                        <span className={`text-xs font-bold uppercase tracking-widest ${col.color}`}>
                          {col.label}
                        </span>
                      </div>
                      <ul className="space-y-1.5">
                        {col.items.map((item) => (
                          <li key={item} className="text-xs text-text-secondary flex items-center gap-1.5">
                            <span className={`w-1 h-1 rounded-full ${col.color} opacity-60 shrink-0`} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-5 border-t border-border flex flex-wrap gap-4 text-[11px] text-text-muted">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  JSON store for dev, Postgres + pgvector for prod
                </span>
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-violet-400" />
                  Stateless Next.js API routes — no background workers
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  HMAC-signed sessions · bcrypt passwords · user-scoped data
                </span>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── Gemini Highlight ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-bg-secondary/40">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="cta-gradient rounded-3xl p-8 sm:p-10 grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-300 text-xs font-medium mb-5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Powered by Google Gemini
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                  State-of-the-art AI,{' '}
                  <span className="gradient-text">zero lock-in.</span>
                </h2>
                <p className="text-text-secondary text-sm leading-relaxed">
                  DocuMind uses <strong className="text-text-primary">Gemini 2.0 Flash</strong> for chat and{' '}
                  <strong className="text-text-primary">text-embedding-004</strong> for 768-dimensional semantic embeddings —
                  the same models powering Google&apos;s AI products, now available to you with a single API key.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Gemini 2.0 Flash', desc: 'Fast, multimodal reasoning for document chat' },
                  { label: 'text-embedding-004', desc: '768-dim semantic vectors for precise retrieval' },
                  { label: 'SSE Streaming', desc: 'Real-time token delivery, first word under 1s' },
                  { label: 'One API key', desc: 'Get yours free at aistudio.google.com' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 glass rounded-xl px-4 py-3">
                    <CheckCircle className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-text-muted">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── Deploy Options ─── */}
      <section id="deploy" className="py-24 px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-12">
            <p className="text-xs font-mono font-bold tracking-widest text-emerald-400 mb-3">DEPLOYMENT</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Deploy in under 5 minutes</h2>
            <p className="mt-3 text-text-secondary max-w-xl mx-auto">
              Three env vars, one platform. DocuMind works everywhere Next.js works.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-5">
            {DEPLOY_OPTIONS.map((opt, i) => {
              const Icon = opt.icon;
              return (
                <FadeIn key={opt.title} delay={i * 0.08}>
                  <div className="glass card-glow rounded-2xl p-6 h-full transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/12 border border-violet-500/20 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-violet-400" />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
                        {opt.badge}
                      </span>
                    </div>
                    <h3 className="font-semibold mb-2">{opt.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{opt.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>

          <FadeIn delay={0.3}>
            <div className="mt-8 glass rounded-2xl p-5 font-mono text-xs">
              <p className="text-text-muted mb-3">
                <span className="text-emerald-400"># .env.local</span>
              </p>
              {[
                { key: 'GEMINI_API_KEY', value: 'AIza...', color: 'text-violet-300' },
                { key: 'AUTH_SECRET', value: '$(openssl rand -base64 32)', color: 'text-cyan-300' },
                { key: 'DATABASE_URL', value: 'postgresql://...', color: 'text-emerald-300' },
                { key: 'NEXT_PUBLIC_APP_URL', value: 'https://yourdomain.com', color: 'text-amber-300' },
              ].map((env) => (
                <div key={env.key} className="flex gap-3 mb-1.5">
                  <span className="text-text-secondary">{env.key}=</span>
                  <span className={env.color}>{env.value}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── Tech Stack ─── */}
      <section id="tech" className="py-20 px-4 sm:px-6 lg:px-8 bg-bg-secondary/40 scroll-mt-20">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <p className="text-xs font-mono font-bold tracking-widest text-amber-400 mb-3">TECH STACK</p>
            <h2 className="text-3xl font-bold mb-3">Built on a modern, production-grade stack</h2>
            <p className="text-text-secondary mb-10 max-w-xl mx-auto">
              Every dependency is chosen for correctness and maintainability, not trend-chasing.
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {TECH_STACK.map((t) => (
                <span key={t.label} className={`px-3.5 py-1.5 rounded-full text-xs font-medium border border-white/8 ${t.color}`}>
                  {t.label}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-12">
            <p className="text-xs font-mono font-bold tracking-widest text-cyan-400 mb-3">FAQ</p>
            <h2 className="text-3xl font-bold">Frequently asked questions</h2>
          </FadeIn>
          <FAQ />
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="relative rounded-3xl overflow-hidden p-10 sm:p-14 text-center cta-gradient">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/8 via-transparent to-cyan-600/8 pointer-events-none" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-text-secondary text-xs font-medium mb-6">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  Free & open source
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Ready to talk to your{' '}
                  <span className="gradient-text">documents?</span>
                </h2>
                <p className="text-text-secondary mb-8 max-w-lg mx-auto">
                  Sign up in seconds. Upload your first document. Ask your first question.
                  No credit card required.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/auth"
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-violet-900/40"
                  >
                    Create free account <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="https://github.com/ShaikMuzzammil/documind"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-7 py-3.5 glass rounded-xl font-medium text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <Code2 className="w-4 h-4" />
                    View on GitHub
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
              <BrainCircuit className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <span className="text-sm font-bold">
              Docu<span className="gradient-text">Mind</span>
            </span>
            <span className="text-text-muted text-xs">v2.0</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-text-muted">
            <span>Built with Next.js 15.3 · Gemini AI · pgvector</span>
          </div>
          <p className="text-xs text-text-muted">
            MIT License · Free to use and self-host
          </p>
        </div>
      </footer>
    </>
  );
}
