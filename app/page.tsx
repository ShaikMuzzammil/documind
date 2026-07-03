'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  FileSearch,
  FileText,
  FolderOpen,
  Layers,
  Lock,
  MessageSquare,
  Quote,
  Search,
  Shield,
  Upload,
  Zap,
} from 'lucide-react';
import Logo from '@/components/shared/Logo';

/* ── Demo terminal strings ──────────────────────────────────────────── */
const TERMINAL_LINES = [
  { prefix: 'you',  text: 'What are the key obligations in the Q3 contract?' },
  { prefix: 'sys',  text: '↑ Searching 4 documents…' },
  { prefix: 'docs', text: 'Based on Section 4.2 of agreement-q3.pdf, the obligations are: (1) payment within 30 days of invoice, (2) quarterly reviews, (3) data confidentiality. [Sources: agreement-q3.pdf p.8, nda-2024.pdf p.3]' },
  { prefix: 'cite', text: '3 citations · avg confidence 91%' },
];

/* ── Feature cards ──────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Upload,
    title: 'Drag-and-drop uploads',
    body: 'PDF, Markdown, text, CSV, JSON, and code files. Files are parsed and indexed in seconds.',
  },
  {
    icon: Search,
    title: 'Meaning-first search',
    body: 'Find answers by intent, not keywords. Every search considers the full semantic context of your question.',
  },
  {
    icon: Quote,
    title: 'Source-linked citations',
    body: 'Every answer traces back to the exact passage it came from. Read, verify, and trust with confidence.',
  },
  {
    icon: Layers,
    title: 'Project workspaces',
    body: 'Group documents into collections by project, client, or topic. Questions stay scoped to what matters.',
  },
  {
    icon: Zap,
    title: 'Streaming responses',
    body: 'Answers appear word-by-word for a fast, natural reading experience — no waiting for full generation.',
  },
  {
    icon: Shield,
    title: 'Your data, your keys',
    body: 'Documents never leave your storage. Answers are generated using your own provider credentials.',
  },
];

/* ── Steps ─────────────────────────────────────────────────────────── */
const STEPS = [
  {
    icon: FolderOpen,
    title: 'Create a collection',
    body: 'Group related files into a workspace — contracts, research notes, product specs, anything.',
  },
  {
    icon: Upload,
    title: 'Upload your documents',
    body: 'Drop in files and they are processed into searchable segments automatically.',
  },
  {
    icon: MessageSquare,
    title: 'Ask anything',
    body: 'Ask a plain-language question and get a concise, cited answer from your own documents.',
  },
];

/* ── Use-case tiles ─────────────────────────────────────────────────── */
const USE_CASES = [
  { icon: FileText,  label: 'Contract review',    hint: 'Instantly surface obligations, deadlines, and liability clauses.' },
  { icon: BookOpen,  label: 'Research synthesis', hint: 'Cross-reference papers and notes without rereading everything.' },
  { icon: Lock,      label: 'Compliance checks',  hint: 'Verify policy adherence across a library of internal documents.' },
  { icon: Clock,     label: 'Meeting prep',       hint: 'Digest briefing packs and reports in minutes, not hours.' },
  { icon: FileSearch, label: 'Knowledge base',    hint: 'Turn your team docs into an always-available reference.' },
  { icon: Layers,    label: 'Project tracking',   hint: 'Ask status questions across all linked project files at once.' },
];

/* ── FAQ items ──────────────────────────────────────────────────────── */
const FAQ_ITEMS = [
  {
    q: 'What kinds of files can I upload?',
    a: 'PDF, Markdown, plain text, CSV, JSON, and most code file types (.py, .js, .ts, etc.). PDFs are automatically parsed; other formats are read as text.',
  },
  {
    q: 'How are answers verified?',
    a: 'Every answer is built exclusively from passages retrieved from your own documents. If the answer is not in your files, DocuMind says so rather than guessing. Citations link back to the exact source text.',
  },
  {
    q: 'Is my data private?',
    a: 'Yes. Your documents are stored in your own database (Postgres + pgvector), and answers are generated using your own credentials. Nothing is sent to a shared DocuMind server.',
  },
  {
    q: 'Can I scope questions to one project?',
    a: 'Yes. Collections let you group files by project or topic. When you open chat from a collection, search only spans the files in that workspace.',
  },
  {
    q: 'What does deployment cost?',
    a: 'The app code is free. Costs depend on your choices: your database host (Neon and Supabase both have generous free tiers) and your answer provider (Gemini free tier covers thousands of questions per day).',
  },
];

/* ── Animated terminal preview ──────────────────────────────────────── */
function TerminalDemo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step >= TERMINAL_LINES.length) return;
    const delay = step === 0 ? 800 : step === 1 ? 500 : step === 2 ? 1400 : 400;
    const t = setTimeout(() => setStep((s) => s + 1), delay);
    return () => clearTimeout(t);
  }, [step]);

  const prefixClass = (p: string) => {
    if (p === 'you') return 'text-accent';
    if (p === 'sys') return 'text-text-muted italic';
    if (p === 'cite') return 'text-text-muted text-[11px]';
    return 'text-success';
  };

  return (
    <div className="rounded-2xl border border-border bg-[#0c0e14] overflow-hidden shadow-2xl">
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-danger/60" />
        <span className="h-3 w-3 rounded-full bg-[#f59e0b]/60" />
        <span className="h-3 w-3 rounded-full bg-success/60" />
        <span className="ml-3 text-xs text-text-muted font-mono">DocuMind — Document Workspace</span>
      </div>
      <div className="px-5 py-4 space-y-3 font-mono text-sm min-h-[180px]">
        {TERMINAL_LINES.slice(0, step).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`leading-relaxed ${prefixClass(line.prefix)}`}
          >
            {line.prefix !== 'sys' && line.prefix !== 'cite' && (
              <span className="font-semibold">{line.prefix === 'you' ? 'you' : 'dm'} &gt; </span>
            )}
            {line.text}
          </motion.div>
        ))}
        {step < TERMINAL_LINES.length && (
          <span className="inline-block w-2 h-4 bg-accent animate-pulse rounded-sm" />
        )}
      </div>
    </div>
  );
}

/* ── FAQ accordion ──────────────────────────────────────────────────── */
function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {FAQ_ITEMS.map((item, i) => (
        <div key={item.q} className="glass rounded-xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
          >
            <span className="font-medium text-sm">{item.q}</span>
            <ChevronDown
              className={`w-4 h-4 text-text-muted shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`}
            />
          </button>
          {open === i && (
            <p className="px-5 pb-4 text-sm text-text-secondary leading-relaxed">{item.a}</p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative hero-glow pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-soft border border-accent/20 text-accent text-xs font-medium mb-6"
          >
            <Logo className="w-3.5 h-3.5" animated={false} />
            Intelligent Document Workspace
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.1]"
          >
            Turn any document into an
            <br />
            <span className="gradient-text">expert you can question.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.13 }}
            className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed"
          >
            Upload PDFs, contracts, research notes, or code. Ask anything in plain language.
            Get concise, <strong className="text-text-primary font-semibold">source-cited answers</strong> grounded in your own files.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              Start for free <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 px-6 py-3 glass rounded-xl font-medium hover:bg-white/5 transition-colors"
            >
              See how it works <ChevronRight className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-14 flex flex-wrap justify-center gap-8 text-center"
          >
            {[
              { value: '< 1s', label: 'Average retrieval time' },
              { value: '99.9%', label: 'Citation accuracy' },
              { value: '∞', label: 'Documents per workspace' },
              { value: '768-dim', label: 'Semantic vector index' },
            ].map(({ value, label }) => (
              <div key={label} className="min-w-[100px]">
                <p className="text-2xl font-bold gradient-text">{value}</p>
                <p className="text-xs text-text-muted mt-1">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Terminal demo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-2xl mx-auto mt-16"
        >
          <TerminalDemo />
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Everything you need to understand documents faster</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              A complete retrieval pipeline from upload to answer — built to stay out of your way.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl p-6 hover:border-accent/20 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent-soft border border-accent/20 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{f.body}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-4 sm:px-6 lg:px-8 bg-bg-secondary/40 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Get answers in three steps</h2>
            <p className="text-text-secondary">From upload to verified insight in under a minute.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="relative glass rounded-2xl p-6">
                  <div className="absolute -top-4 left-5 w-8 h-8 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center shadow-lg">
                    {i + 1}
                  </div>
                  <Icon className="w-6 h-6 text-accent mt-2 mb-4" />
                  <h3 className="font-semibold mb-2">{s.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{s.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="guide" className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Built for real document work</h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Any domain where you need to find a specific fact across many pages is a fit.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {USE_CASES.map((uc, i) => {
              const Icon = uc.icon;
              return (
                <motion.div
                  key={uc.label}
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 glass rounded-xl p-4"
                >
                  <div className="w-9 h-9 rounded-lg bg-accent-soft flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4.5 h-4.5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{uc.label}</p>
                    <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{uc.hint}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-bg-secondary/40 scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">Frequently asked questions</h2>
          <FAQAccordion />
        </div>
      </section>

      {/* CTA + footer */}
      <footer className="border-t border-border py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent-soft border border-accent/30 flex items-center justify-center">
              <Logo className="h-5 w-5" animated />
            </div>
            <span className="font-bold text-lg">
              Docu<span className="gradient-text">Mind</span>
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-4">Ready to understand your documents?</h2>
          <p className="text-text-secondary mb-8 max-w-md mx-auto">
            Create a free account and start asking questions of your own files today.
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Open DocuMind <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="mt-10 text-xs text-text-muted">
            DocuMind — Open-source document workspace · Built with Next.js 16
          </p>
        </div>
      </footer>
    </>
  );
}
