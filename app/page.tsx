'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
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
  Sparkles,
  Upload,
  Zap,
} from 'lucide-react';
import Logo from '@/components/shared/Logo';

/* ─── Animated counter ──────────────────────────────────────────────── */
function Counter({ to, suffix = '', decimals = 0 }: { to: number; suffix?: string; decimals?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const steps = 40;
    const step = to / steps;
    let current = 0;
    const t = setInterval(() => {
      current = Math.min(current + step, to);
      setVal(current);
      if (current >= to) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [inView, to]);
  return (
    <span ref={ref}>
      {decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString()}
      {suffix}
    </span>
  );
}

/* ─── Floating document card ────────────────────────────────────────── */
function DocCard({
  name,
  pages,
  delay,
  x,
  y,
}: {
  name: string;
  pages: number;
  delay: number;
  x: string;
  y: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
      transition={{
        opacity: { delay, duration: 0.5 },
        scale: { delay, duration: 0.5 },
        y: { delay: delay + 0.5, duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
      }}
      className="absolute hidden lg:flex items-center gap-2.5 rounded-xl border border-border bg-bg-card/90 px-3.5 py-2.5 backdrop-blur-md shadow-xl"
      style={{ left: x, top: y }}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
        <FileText className="h-4 w-4 text-accent" />
      </div>
      <div>
        <p className="text-xs font-medium text-text-primary">{name}</p>
        <p className="text-[10px] text-text-muted">{pages} pages · indexed</p>
      </div>
      <div className="ml-1 h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
    </motion.div>
  );
}

/* ─── Terminal demo ─────────────────────────────────────────────────── */
const TERMINAL_LINES = [
  { prefix: 'you', text: 'What are the key obligations in the Q3 agreement?' },
  { prefix: 'sys', text: '↑ Searching 4 documents across 312 chunks…' },
  {
    prefix: 'dm',
    text: 'Based on Section 4.2 of agreement-q3.pdf, the obligations are: (1) payment within 30 days of invoice, (2) quarterly performance reviews, (3) data confidentiality provisions.',
  },
  { prefix: 'cite', text: '[Sources: agreement-q3.pdf p.8, nda-2024.pdf p.3] · 3 citations · 91% confidence' },
];

function TerminalDemo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step >= TERMINAL_LINES.length) return;
    const delays = [900, 600, 1600, 500];
    const t = setTimeout(() => setStep((s) => s + 1), delays[step]);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#080a0f] overflow-hidden shadow-2xl shadow-accent/5">
      <div className="flex items-center gap-1.5 border-b border-white/8 px-4 py-3 bg-[#0c0e14]">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-[11px] text-text-muted font-mono tracking-wide">
          DocuMind — Document Intelligence
        </span>
      </div>
      <div className="px-5 py-5 space-y-3.5 font-mono text-[13px] min-h-[220px]">
        {TERMINAL_LINES.slice(0, step).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`leading-relaxed ${
              line.prefix === 'you'
                ? 'text-accent'
                : line.prefix === 'sys'
                  ? 'text-text-muted italic text-xs'
                  : line.prefix === 'cite'
                    ? 'text-text-muted text-[11px] border-l-2 border-success/40 pl-3'
                    : 'text-success'
            }`}
          >
            {line.prefix !== 'sys' && line.prefix !== 'cite' && (
              <span className="font-bold mr-1">
                {line.prefix === 'you' ? 'you' : 'dm'} &gt;{' '}
              </span>
            )}
            {line.prefix === 'sys' && <span className="text-text-muted">{'↑ '}</span>}
            {line.prefix === 'sys'
              ? line.text.replace('↑ ', '')
              : line.text}
          </motion.div>
        ))}
        {step < TERMINAL_LINES.length && (
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 0.9 }}
            className="inline-block w-2 h-[14px] bg-accent rounded-sm align-middle"
          />
        )}
      </div>
    </div>
  );
}

/* ─── Feature cards ─────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Upload,
    title: 'Multi-format uploads',
    body: 'PDF, Markdown, text, CSV, JSON, and code files up to 15 MB. Parsed and indexed in seconds.',
    tag: 'Core',
  },
  {
    icon: Search,
    title: 'Semantic search',
    body: 'Find answers by intent, not just keywords. Every query scans the full meaning of your documents.',
    tag: 'Search',
  },
  {
    icon: Quote,
    title: 'Grounded citations',
    body: 'Every answer links back to the exact passage it came from. Read the source with one click.',
    tag: 'Trust',
  },
  {
    icon: Layers,
    title: 'Project collections',
    body: 'Organise documents by project, client, or topic. Questions stay scoped to what matters.',
    tag: 'Workflow',
  },
  {
    icon: Zap,
    title: 'Streaming responses',
    body: 'Answers appear word-by-word — no waiting for full generation to complete.',
    tag: 'Speed',
  },
  {
    icon: Shield,
    title: 'Private by design',
    body: 'Documents stay in your storage. Nothing is sent to a shared server. Your keys, your data.',
    tag: 'Security',
  },
];

/* ─── Steps ─────────────────────────────────────────────────────────── */
const STEPS = [
  {
    icon: FolderOpen,
    title: 'Create a collection',
    body: 'Group related documents into a workspace — contracts, research, specs, anything.',
  },
  {
    icon: Upload,
    title: 'Upload your files',
    body: 'Drag in PDFs and text files. They are parsed and indexed into searchable segments automatically.',
  },
  {
    icon: MessageSquare,
    title: 'Ask in plain language',
    body: 'Type a question like you would to a colleague. Get a concise, source-linked answer instantly.',
  },
];

/* ─── Use cases ─────────────────────────────────────────────────────── */
const USE_CASES = [
  {
    icon: FileText,
    label: 'Contract review',
    hint: 'Surface obligations, payment terms, and liability clauses instantly.',
    color: 'accent',
  },
  {
    icon: BookOpen,
    label: 'Research synthesis',
    hint: 'Cross-reference papers and notes without rereading everything.',
    color: 'accent-2',
  },
  {
    icon: Lock,
    label: 'Compliance checks',
    hint: 'Verify policy adherence across a library of internal documents.',
    color: 'success',
  },
  {
    icon: Clock,
    label: 'Meeting prep',
    hint: 'Digest briefing packs and reports in minutes, not hours.',
    color: 'accent',
  },
  {
    icon: FileSearch,
    label: 'Knowledge base',
    hint: 'Turn your team docs into an always-available Q&A reference.',
    color: 'accent-2',
  },
  {
    icon: Layers,
    label: 'Project tracking',
    hint: 'Ask status questions across all linked project files at once.',
    color: 'success',
  },
];

/* ─── FAQ ───────────────────────────────────────────────────────────── */
const FAQ_ITEMS = [
  {
    q: 'What file types can I upload?',
    a: 'PDF, Markdown, plain text, CSV, JSON, and most code files (.py, .js, .ts, etc.). PDFs are automatically parsed; all other formats are read as text. Files up to 15 MB are supported.',
  },
  {
    q: 'How are answers kept accurate?',
    a: 'Every answer is built exclusively from passages retrieved from your uploaded documents. If the answer is not in your files, DocuMind says so rather than guessing. Every claim links back to its exact source passage.',
  },
  {
    q: 'Is my data private?',
    a: 'Yes. Your documents are stored in your own database (Postgres + pgvector), and answers are generated using your own API credentials. Nothing goes to a shared DocuMind server.',
  },
  {
    q: 'Can I keep questions scoped to one project?',
    a: 'Absolutely. Collections let you group files by project or topic. When you chat from a collection, search only spans the files inside that workspace.',
  },
  {
    q: 'What does it cost to run?',
    a: 'The app code is free. You pay for your own infrastructure choices — database (Neon and Supabase both have generous free tiers) and AI provider (Gemini free tier covers thousands of questions per day).',
  },
  {
    q: 'Can I export my data?',
    a: 'Yes. The Export page lets you download your entire workspace as structured JSON — documents, collections, and conversation history — so you never face vendor lock-in.',
  },
];

function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-2.5">
      {FAQ_ITEMS.map((item, i) => (
        <motion.div
          key={item.q}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
          className="glass rounded-xl overflow-hidden"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/3 transition-colors"
          >
            <span className="font-medium text-sm text-text-primary">{item.q}</span>
            <ChevronDown
              className={`w-4 h-4 text-text-muted shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
            />
          </button>
          <motion.div
            initial={false}
            animate={{ height: open === i ? 'auto' : 0, opacity: open === i ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-sm text-text-secondary leading-relaxed">{item.a}</p>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden hero-glow pt-36 pb-28 px-4 sm:px-6 lg:px-8">
        {/* Subtle grid lines */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        {/* Floating document cards */}
        <DocCard name="agreement-q3.pdf" pages={24} delay={1.2} x="5%" y="22%" />
        <DocCard name="research-notes.md" pages={8} delay={1.6} x="80%" y="18%" />
        <DocCard name="compliance-2024.pdf" pages={51} delay={2.0} x="76%" y="62%" />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/8 px-4 py-1.5 text-xs font-medium text-accent mb-8">
              <Sparkles className="h-3.5 w-3.5" />
              Intelligent Document Workspace
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08]">
              Turn any document
              <br />
              <span className="gradient-text">into an expert.</span>
            </h1>

            <p className="mt-6 max-w-2xl mx-auto text-lg text-text-secondary leading-relaxed">
              Upload PDFs, research papers, contracts, or code. Ask anything in plain language.
              Get <strong className="text-text-primary font-semibold">grounded, cited answers</strong> from
              your own documents — nothing hallucinated.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/auth?mode=register"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-7 py-3.5 text-sm font-semibold text-white transition-all hover:brightness-110 hover:shadow-[0_0_24px_rgba(99,102,241,0.4)] active:scale-[0.98]"
              >
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg-card/60 px-7 py-3.5 text-sm font-semibold text-text-secondary transition-colors hover:border-accent/40 hover:text-text-primary"
              >
                See how it works
              </a>
            </div>
          </motion.div>
        </div>

        {/* Terminal */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative mt-20 max-w-3xl mx-auto"
        >
          <div className="absolute -inset-4 rounded-3xl bg-accent/5 blur-2xl" />
          <TerminalDemo />
        </motion.div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-bg-secondary/40 py-10 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { label: 'Documents processed', value: 12000, suffix: '+' },
            { label: 'Avg query time', value: 1.2, suffix: 's', decimals: 1 },
            { label: 'Supported formats', value: 20, suffix: '+' },
            { label: 'Citation accuracy', value: 98, suffix: '%' },
          ].map(({ label, value, suffix, decimals = 0 }) => (
            <div key={label}>
              <p className="text-3xl font-extrabold gradient-text tabular-nums">
                <Counter to={value} suffix={suffix} decimals={decimals} />
              </p>
              <p className="mt-1 text-xs text-text-muted">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section id="how" className="py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">Process</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Up and running in three steps</h2>
            <p className="mt-4 text-text-secondary max-w-xl mx-auto">
              No configuration wizards. No long onboarding. Import your documents and start asking questions.
            </p>
          </div>

          <div className="relative grid sm:grid-cols-3 gap-6">
            {/* Connector line */}
            <div className="hidden sm:block absolute top-[3.25rem] left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-accent/40 via-accent-2/40 to-accent/40" />

            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative glass rounded-2xl p-6 text-center hover:border-accent/30 transition-colors"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20 relative z-10">
                  <step.icon className="h-6 w-6 text-accent" />
                </div>
                <span className="absolute top-4 right-4 text-[10px] font-bold text-text-muted tabular-nums">
                  0{i + 1}
                </span>
                <h3 className="font-semibold text-text-primary">{step.title}</h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section id="features" className="py-28 px-4 sm:px-6 lg:px-8 bg-bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">Capabilities</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Everything you need, nothing you don't</h2>
            <p className="mt-4 text-text-secondary max-w-xl mx-auto">
              DocuMind focuses on one job: making your own documents answerable. Every feature serves that goal.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="group glass rounded-2xl p-6 hover:border-accent/30 transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/15 group-hover:bg-accent/15 transition-colors">
                    <f.icon className="h-5 w-5 text-accent" />
                  </div>
                  <span className="rounded-full border border-border bg-bg-secondary px-2 py-0.5 text-[10px] font-medium text-text-muted">
                    {f.tag}
                  </span>
                </div>
                <h3 className="font-semibold text-text-primary mb-2">{f.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use cases ─────────────────────────────────────────────────── */}
      <section id="guide" className="py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">Use cases</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Built for document-heavy work</h2>
            <p className="mt-4 text-text-secondary max-w-xl mx-auto">
              From legal to research to operations — any workflow that involves reading a lot of documents gets faster.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {USE_CASES.map((uc, i) => (
              <motion.div
                key={uc.label}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="group glass rounded-xl p-5 hover:border-accent/30 transition-all cursor-default"
              >
                <div
                  className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${
                    uc.color === 'accent'
                      ? 'bg-accent/10 border border-accent/20'
                      : uc.color === 'accent-2'
                        ? 'bg-cyan-500/10 border border-cyan-500/20'
                        : 'bg-green-500/10 border border-green-500/20'
                  }`}
                >
                  <uc.icon
                    className={`h-4.5 w-4.5 ${
                      uc.color === 'accent'
                        ? 'text-accent'
                        : uc.color === 'accent-2'
                          ? 'text-cyan-400'
                          : 'text-green-400'
                    }`}
                  />
                </div>
                <h3 className="font-semibold text-sm text-text-primary mb-1">{uc.label}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{uc.hint}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What you get checklist ────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-bg-secondary/30">
        <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">Included</p>
            <h2 className="text-3xl font-bold mb-6">A complete workspace, out of the box</h2>
            <p className="text-text-secondary mb-8 leading-relaxed">
              No third-party integrations to wire up. No credits to purchase before you can try it. Deploy with your own keys and start working.
            </p>
            <Link
              href="/auth?mode=register"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(99,102,241,0.35)]"
            >
              Create free account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <ul className="space-y-3">
            {[
              'Multi-format document ingestion (PDF, MD, TXT, CSV, JSON, code)',
              'Semantic vector search with pgvector',
              'Streaming, grounded AI answers',
              'Per-message source citations',
              'Organised project collections',
              'Workspace analytics dashboard',
              'Full data export (JSON)',
              'Secure session-based auth',
            ].map((item) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-start gap-3 text-sm text-text-secondary"
              >
                <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                {item}
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section id="faq" className="py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">FAQ</p>
            <h2 className="text-3xl font-bold">Common questions</h2>
          </div>
          <FAQAccordion />
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 bg-bg-secondary/30">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 mb-6">
              <Logo className="h-8 w-8" animated />
            </div>
            <h2 className="text-4xl font-extrabold mb-5">
              Your documents deserve<br />
              <span className="gradient-text">better answers.</span>
            </h2>
            <p className="text-text-secondary mb-10 text-lg max-w-xl mx-auto leading-relaxed">
              Create an account, connect your own database, and turn any collection of files into an expert you can question.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/auth?mode=register"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-4 text-sm font-bold text-white transition-all hover:brightness-110 hover:shadow-[0_0_28px_rgba(99,102,241,0.45)]"
              >
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Already have an account? Sign in →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-muted">
          <div className="flex items-center gap-2">
            <Logo className="h-4 w-4" animated={false} />
            <span className="font-semibold text-text-secondary">
              Docu<span className="text-accent">Mind</span>
            </span>
            <span className="text-text-muted">· Document Intelligence Platform</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/auth" className="hover:text-text-primary transition-colors">
              Sign in
            </Link>
            <Link href="/auth?mode=register" className="hover:text-text-primary transition-colors">
              Register
            </Link>
            <a
              href="https://github.com/ShaikMuzzammil/documind"
              target="_blank"
              rel="noreferrer"
              className="hover:text-text-primary transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
