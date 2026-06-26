'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import FeatureShowcase from '@/components/landing/FeatureShowcase';
import {
  BookOpen, Upload, Zap, Layers, ArrowRight, Shield,
  BarChart3, Download, Brain, Search, Sparkles,
  ChevronDown, ChevronUp, MessageSquare, FolderOpen,
  FileText, CheckCircle2, Play, Database, Lock,
  Cpu, RefreshCw, FileJson, Network,
} from 'lucide-react';

/* ── Animated counter ─────────────────────────────────────────────────────── */
function Counter({ to, label }: { to: string; label: string }) {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="text-center">
      <motion.p initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 }}
        className="text-3xl sm:text-4xl font-bold gradient-text">
        {inView ? to : '0'}
      </motion.p>
      <p className="text-xs text-text-muted mt-1">{label}</p>
    </div>
  );
}

/* ── FAQ item ─────────────────────────────────────────────────────────────── */
function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border">
      <button onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-text-primary hover:text-blue-400 transition-colors">
        {q}
        {open ? <ChevronUp className="w-4 h-4 shrink-0 text-blue-400" /> : <ChevronDown className="w-4 h-4 shrink-0 text-text-muted" />}
      </button>
      <motion.div initial={false} animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        className="overflow-hidden">
        <p className="pb-4 text-sm text-text-secondary leading-relaxed">{a}</p>
      </motion.div>
    </div>
  );
}

/* ── Section wrapper ─────────────────────────────────────────────────────── */
function Section({ id, children, className = '' }: { id: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`py-20 sm:py-24 px-4 ${className}`}>
      <div className="max-w-6xl mx-auto">{children}</div>
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-500/25 bg-blue-500/8 text-blue-400 text-xs font-medium mb-4">
      <Sparkles className="w-3 h-3" />{children}
    </span>
  );
}

/* ── Terminal animation ───────────────────────────────────────────────────── */
const DEMO_LINES = [
  { type: 'user',   text: 'What are the key obligations in the Q3 agreement?' },
  { type: 'system', text: '↑  Retrieving semantic context from 3 documents…' },
  { type: 'ai',     text: 'Based on the Q3 agreement (Section 4.2), the key obligations are: (1) payment within 30 days of invoice, (2) quarterly performance reviews, and (3) data confidentiality provisions. [Source: agreement-q3.pdf, p.8]' },
  { type: 'cite',   text: '📎  3 citations · avg confidence 91%' },
];

function Terminal() {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (shown >= DEMO_LINES.length) return;
    const t = setTimeout(() => setShown((v) => v + 1), 900 + shown * 200);
    return () => clearTimeout(t);
  }, [shown]);

  return (
    <div className="terminal-window rounded-2xl overflow-hidden font-mono text-xs sm:text-sm">
      <div className="flex items-center gap-2 px-4 py-3 bg-white/3 border-b border-white/6">
        <span className="w-3 h-3 rounded-full bg-red-500/70" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
        <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
        <span className="ml-2 text-text-muted text-[10px]">DocuMind — Document Intelligence</span>
      </div>
      <div className="p-5 space-y-3 min-h-[200px]">
        {DEMO_LINES.slice(0, shown).map((line, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="leading-relaxed">
            {line.type === 'user'   && <><span className="text-blue-400">you &gt; </span><span className="text-text-primary">{line.text}</span></>}
            {line.type === 'system' && <span className="text-text-muted italic">{line.text}</span>}
            {line.type === 'ai'     && <><span className="text-emerald-400">ai  &gt; </span><span className="text-text-secondary">{line.text}</span></>}
            {line.type === 'cite'   && <span className="text-blue-300/70 text-[11px]">{line.text}</span>}
          </motion.div>
        ))}
        {shown < DEMO_LINES.length && (
          <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse" />
        )}
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div className="overflow-x-hidden">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 pt-8 pb-16 hero-glow grid-bg">
        <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="relative z-10 text-center max-w-4xl mx-auto">

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/25 bg-blue-500/8 text-blue-400 text-xs font-medium mb-6 badge-glow">
            <Sparkles className="w-3 h-3" />Intelligent Document Workspace
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold leading-tight tracking-tight">
            Turn Any Document Into an<br />
            <span className="gradient-text-warm">Expert You Can Question</span>
          </h1>

          <p className="mt-6 text-text-secondary text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Upload PDFs, research papers, contracts, or code. Ask anything in plain language.
            Get <strong className="text-text-primary">grounded, cited answers</strong> from your own data — nothing hallucinated.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/auth"
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 px-7 py-3.5 text-sm font-semibold text-white transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:scale-[1.02]">
              Start for Free <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#how"
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-bg-card hover:bg-bg-hover px-7 py-3.5 text-sm font-medium text-text-secondary transition-all hover:scale-[1.01]">
              See how it works <Play className="w-3.5 h-3.5" />
            </a>
          </div>
        </motion.div>

        {/* Terminal */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
          className="relative z-10 mt-14 w-full max-w-2xl mx-auto">
          <Terminal />
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.8 }}
          className="relative z-10 mt-14 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-2xl mx-auto">
          <Counter to="768-dim" label="Embedding precision" />
          <Counter to="< 1s"    label="First token latency" />
          <Counter to="99.9%"   label="Source accuracy"     />
          <Counter to="∞"       label="Documents supported" />
        </motion.div>
      </section>

      <hr className="section-divider" />

      {/* ── How it Works ─────────────────────────────────────────────────── */}
      <Section id="how">
        <div className="text-center mb-14">
          <SectionLabel>Process</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-bold">From upload to insight in seconds</h2>
          <p className="mt-3 text-text-secondary max-w-xl mx-auto">
            Three steps from raw files to conversational intelligence with full source traceability.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              step: '01', icon: Upload, title: 'Upload Your Documents',
              desc: 'Drop PDFs, text files, Markdown, CSVs, JSON, or source code. Batch uploads supported with per-file progress tracking.',
              color: 'blue',
            },
            {
              step: '02', icon: Brain, title: 'Intelligent Indexing',
              desc: 'Documents are semantically chunked and embedded into a 768-dimensional vector space for precise similarity retrieval.',
              color: 'emerald',
            },
            {
              step: '03', icon: MessageSquare, title: 'Ask & Extract',
              desc: 'Query across all documents or a specific collection. Every answer is grounded with direct citations and confidence scores.',
              color: 'blue',
            },
          ].map(({ step, icon: Icon, title, desc, color }) => (
            <motion.div key={step} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="glass rounded-2xl p-6 card-glow relative overflow-hidden">
              <div className="absolute top-3 right-4 text-5xl font-black text-white/3 select-none">{step}</div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                color === 'blue' ? 'bg-blue-600/15 border border-blue-500/25 text-blue-400' : 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-400'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold mb-2">{title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      <hr className="section-divider" />

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <Section id="features" className="bg-bg-secondary/20">
        <div className="text-center mb-14">
          <SectionLabel>Features</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-bold">Everything your documents need</h2>
          <p className="mt-3 text-text-secondary max-w-xl mx-auto">Built for researchers, legal professionals, engineers, and analysts.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: Search,       title: 'Semantic Search',       desc: 'Find conceptual matches, not just keywords. Understands meaning and context across all your documents.' },
            { icon: CheckCircle2, title: 'Verified Citations',    desc: 'Every AI response links directly to its source chunk with confidence scores — no unverifiable claims.' },
            { icon: FolderOpen,   title: 'Smart Collections',     desc: 'Organize documents into topic collections. Chat with one collection or search across all at once.' },
            { icon: BarChart3,    title: 'Analytics Dashboard',   desc: 'Track document health, chunk coverage, file type breakdown, and collection-level storage insights.' },
            { icon: FileJson,     title: 'Schema Extraction',     desc: 'Define a JSON schema and batch-extract structured fields from an entire collection automatically.' },
            { icon: Download,     title: 'Multi-Format Export',   desc: 'Export documents as CSV, collections as JSON, chat sessions as Markdown — one click.' },
            { icon: Lock,         title: 'Private Workspace',     desc: 'Every user has a fully isolated data space. No cross-user data leakage, ever.' },
            { icon: Layers,       title: 'Multi-File Upload',     desc: 'Upload multiple files at once with real-time per-file progress tracking and status logs.' },
            { icon: RefreshCw,    title: 'Auto Re-ranking',       desc: 'Retrieved chunks are scored and ranked by true relevance before generating the final answer.' },
          ].map(({ icon: Icon, title, desc }) => (
            <motion.div key={title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="glass rounded-2xl p-5 card-glow transition-all">
              <div className="w-9 h-9 rounded-xl bg-blue-600/12 border border-blue-500/20 flex items-center justify-center mb-3">
                <Icon className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="text-sm font-semibold mb-1.5">{title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>


      {/* ── Feature Showcase ─────────────────────────────────────────────── */}
      <Section id="showcase" className="bg-bg-secondary/20">
        <div className="text-center mb-10">
          <SectionLabel>Interactive Demo</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-bold">See every feature in action</h2>
          <p className="mt-3 text-text-secondary max-w-xl mx-auto">
            Explore the full capabilities of DocuMind — from chat citations to PII scanning.
          </p>
        </div>
        <FeatureShowcase />
      </Section>

      <hr className="section-divider" />

      {/* ── Capabilities ─────────────────────────────────────────────────── */}
      <Section id="capabilities">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionLabel>Advanced Capabilities</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
              Production-grade RAG<br />architecture inside
            </h2>
            <p className="mt-4 text-text-secondary leading-relaxed">
              DocuMind implements a multi-stage retrieval pipeline: semantic chunking → high-dimensional vector embedding → approximate nearest-neighbour search → re-ranking → citation-grounded generation.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                { icon: Cpu,      text: 'Vector similarity search over 768-dimensional embeddings' },
                { icon: Network,  text: 'Semantic chunking respects document structure and boundaries' },
                { icon: Shield,   text: 'Per-user namespace isolation prevents cross-workspace leakage' },
                { icon: Database, text: 'PostgreSQL + pgvector or local JSON store — your choice' },
                { icon: Brain,    text: 'Query expansion improves recall for vague or short questions' },
                { icon: Zap,      text: 'Server-Sent Events for sub-second streaming token delivery' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-sm text-text-secondary">
                  <Icon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />{text}
                </li>
              ))}
            </ul>
            <Link href="/auth"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition-colors">
              Try it now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Pipeline visual */}
          <div className="glass rounded-2xl p-6 space-y-3">
            {[
              { step: 'Ingest',   desc: 'Parse PDF, text, code → extract raw text', color: 'blue'    },
              { step: 'Chunk',    desc: 'Semantic boundary detection → 512-token pieces', color: 'blue' },
              { step: 'Embed',    desc: '768-dim vector per chunk via embedding model', color: 'emerald' },
              { step: 'Index',    desc: 'Store in pgvector with IVFFlat ANN index',    color: 'emerald' },
              { step: 'Retrieve', desc: 'cosine similarity top-K with namespace filter', color: 'blue'  },
              { step: 'Generate', desc: 'LLM with context → cited streamed answer',    color: 'emerald' },
            ].map(({ step, desc, color }, i) => (
              <div key={step} className="flex items-center gap-3">
                <span className={`text-xs font-mono font-bold w-16 shrink-0 ${color === 'blue' ? 'text-blue-400' : 'text-emerald-400'}`}>
                  {String(i + 1).padStart(2, '0')} {step}
                </span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-text-muted text-right max-w-[200px]">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <hr className="section-divider" />

      {/* ── Guide ────────────────────────────────────────────────────────── */}
      <Section id="guide" className="bg-bg-secondary/20">
        <div className="text-center mb-14">
          <SectionLabel>Quick Start Guide</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-bold">Up and running in 4 steps</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              num: 1, icon: BookOpen, title: 'Create Account',
              desc: 'Sign up with your email. No credit card required. Your workspace is created instantly.',
            },
            {
              num: 2, icon: FolderOpen, title: 'Create a Collection',
              desc: 'Group related documents into a named collection — e.g. "Legal Contracts Q3" or "Research Papers".',
            },
            {
              num: 3, icon: Upload, title: 'Upload Documents',
              desc: 'Drag-drop or browse for files. PDF, TXT, Markdown, CSV, JSON, code — all supported simultaneously.',
            },
            {
              num: 4, icon: MessageSquare, title: 'Start Chatting',
              desc: 'Ask questions in plain language. Answers reference specific passages with expandable source previews.',
            },
          ].map(({ num, icon: Icon, title, desc }) => (
            <motion.div key={num} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: num * 0.08 }}
              className="glass rounded-2xl p-6 text-center card-glow">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-xs font-mono text-text-muted mb-2">Step {num}</div>
              <h3 className="text-sm font-semibold mb-2">{title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Use cases */}
        <div className="mt-14">
          <h3 className="text-xl font-bold text-center mb-8">Built for every knowledge workflow</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: FileText,    label: 'Legal',      desc: 'Review contracts, extract clauses, compare obligations across documents.' },
              { icon: Brain,       label: 'Research',   desc: 'Cross-reference papers, surface contradictions, extract citations.' },
              { icon: BarChart3,   label: 'Finance',    desc: 'Analyse reports, extract figures, track covenants across filings.' },
              { icon: Layers,      label: 'Engineering',desc: 'Chat with codebases, API docs, runbooks, and architecture specs.' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="rounded-2xl border border-border bg-bg-card p-4 hover:border-blue-500/25 transition-colors card-glow">
                <Icon className="w-5 h-5 text-blue-400 mb-2" />
                <p className="text-sm font-semibold mb-1">{label}</p>
                <p className="text-xs text-text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <hr className="section-divider" />

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <Section id="faq">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
          </div>
          {[
            {
              q: 'What types of files can I upload?',
              a: 'PDF, plain text (.txt), Markdown (.md), CSV, JSON, TypeScript, JavaScript, Python, HTML, and XML files are all supported. Maximum 20 MB per file.',
            },
            {
              q: 'How accurate are the answers?',
              a: 'Every answer is generated using only text retrieved from your own documents, not from general knowledge. Each citation includes a confidence score so you can verify exactly which passage was used.',
            },
            {
              q: 'Is my data private?',
              a: 'Yes. Every user has a fully isolated data namespace. Your documents, embeddings, and chat history are never shared with or visible to other users.',
            },
            {
              q: 'What is the Schema Extraction feature?',
              a: 'Schema Extraction lets you define a JSON schema (field name + type + description) and automatically extract those fields from every document in a collection — outputting a structured CSV or JSON report.',
            },
            {
              q: 'Do I need a database to use DocuMind?',
              a: 'No. If no database is configured, DocuMind automatically uses a local JSON file store — perfect for development and demos. For production, connect a PostgreSQL database with the pgvector extension for best performance at scale.',
            },
            {
              q: 'Can I export my data?',
              a: 'Yes. You can export your full document index as CSV, all collection metadata as JSON, and individual chat sessions as Markdown files — all from the Export page.',
            },
          ].map((item) => <FAQ key={item.q} {...item} />)}
        </div>
      </Section>

      <hr className="section-divider" />

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <Section id="cta">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="cta-gradient rounded-3xl px-8 py-14 text-center max-w-3xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-7 h-7 text-blue-400" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold">Ready to query your documents?</h2>
          <p className="mt-4 text-text-secondary max-w-md mx-auto leading-relaxed">
            Create your private workspace, upload your first document, and ask your first question — in under two minutes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link href="/auth"
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 px-8 py-3.5 text-sm font-semibold text-white transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:scale-[1.02]">
              Create your workspace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="mt-4 text-xs text-text-muted">No credit card required · Private workspace · All formats supported</p>
        </motion.div>
      </Section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 text-center text-xs text-text-muted">
        <p>DocuMind © {new Date().getFullYear()} — Document Intelligence Platform</p>
        <p className="mt-1">Built with Next.js · Vector Search · Semantic AI</p>
      </footer>
    </div>
  );
}
