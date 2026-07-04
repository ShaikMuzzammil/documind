'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight, BookOpen, CheckCircle2, ChevronDown, Clock, Database,
  FileSearch, FileText, FolderOpen, Key, Layers, Lock, MessageSquare,
  Quote, Search, Shield, Sparkles, Upload, UserRound, Zap,
} from 'lucide-react';
import Logo from '@/components/shared/Logo';

/* ── Animated counter ─────────────────────────────────────────────── */
function Counter({ to, suffix = '', decimals = 0 }: { to: number; suffix?: string; decimals?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const steps = 50;
    const step = to / steps;
    let current = 0;
    const t = setInterval(() => {
      current = Math.min(current + step, to);
      setVal(current);
      if (current >= to) clearInterval(t);
    }, 25);
    return () => clearInterval(t);
  }, [inView, to]);
  return (
    <span ref={ref}>
      {decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString()}
      {suffix}
    </span>
  );
}

/* ── Floating document card ───────────────────────────────────────── */
function DocCard({ name, type, delay, x, y }: { name: string; type: string; delay: number; x: string; y: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
      transition={{
        opacity: { delay, duration: 0.5 },
        scale: { delay, duration: 0.5 },
        y: { delay: delay + 0.5, duration: 4, repeat: Infinity, ease: 'easeInOut' },
      }}
      className="absolute hidden lg:flex items-center gap-2.5 rounded-xl border border-border bg-bg-card/90 px-3.5 py-2.5 backdrop-blur shadow-xl"
      style={{ left: x, top: y }}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
        <FileText className="h-4 w-4 text-accent" />
      </div>
      <div>
        <p className="text-xs font-medium">{name}</p>
        <p className="text-[10px] text-text-muted">{type} · indexed</p>
      </div>
      <div className="ml-1 h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
    </motion.div>
  );
}

/* ── Terminal demo ────────────────────────────────────────────────── */
const TERMINAL_LINES = [
  { prefix: 'you', text: 'What are the key payment obligations in the Q3 agreement?' },
  { prefix: 'sys', text: 'Searching 4 documents across 312 chunks…' },
  { prefix: 'dm',  text: 'Based on Section 4.2 of agreement-q3.pdf: (1) payment within 30 days of invoice, (2) quarterly performance reviews, (3) data confidentiality provisions per Annex B.' },
  { prefix: 'cite', text: '[Sources: agreement-q3.pdf §4.2, nda-2024.pdf p.3] · 3 citations · 94% confidence' },
];

function TerminalDemo() {
  const [step, setStep] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || step >= TERMINAL_LINES.length) return;
    const delays = [700, 500, 1400, 400];
    const t = setTimeout(() => setStep(s => s + 1), delays[step]);
    return () => clearTimeout(t);
  }, [step, inView]);

  return (
    <div ref={ref} className="rounded-2xl border border-white/10 bg-[#060810] overflow-hidden shadow-2xl shadow-accent/10">
      <div className="flex items-center gap-1.5 border-b border-white/8 px-4 py-2.5 bg-[#0b0d15]">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-[11px] text-text-muted font-mono">DocuMind — Document Intelligence</span>
      </div>
      <div className="px-5 py-5 space-y-3.5 font-mono text-[13px] min-h-[200px]">
        {TERMINAL_LINES.slice(0, step).map((line, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}
            className={`leading-relaxed ${
              line.prefix === 'you' ? 'text-accent' :
              line.prefix === 'sys' ? 'text-text-muted italic text-xs' :
              line.prefix === 'cite' ? 'text-text-muted text-[11px] border-l-2 border-success/40 pl-3' :
              'text-success'
            }`}
          >
            {line.prefix !== 'sys' && line.prefix !== 'cite' && (
              <span className="font-bold mr-1.5">{line.prefix === 'you' ? 'you' : 'dm'} &gt;</span>
            )}
            {line.text}
          </motion.div>
        ))}
        {step < TERMINAL_LINES.length && (
          <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}
            className="inline-block w-2 h-4 bg-accent align-middle"
          />
        )}
      </div>
    </div>
  );
}

/* ── FAQ ──────────────────────────────────────────────────────────── */
const FAQ_ITEMS = [
  { q: 'Does DocuMind send my documents to any external server?', a: 'No. Documents are stored in your own database (PostgreSQL or local JSON). Only the retrieved text passages from your query are sent to the AI provider you configure — never full documents.' },
  { q: 'What AI providers are supported?', a: 'Any OpenAI-compatible API: Google Gemini (recommended, free tier), OpenAI GPT-4o, Groq (ultra-fast, free tier), Anthropic Claude via OpenRouter, and more. You set the base URL and API key in environment variables.' },
  { q: 'What file types can I upload?', a: 'PDF, TXT, Markdown (.md), CSV, JSON, JavaScript, TypeScript, Python, Rust, Go, and most plain text formats. Scanned PDFs without a text layer are not supported.' },
  { q: 'How does the semantic search work?', a: 'DocuMind splits documents into ~512 token chunks and creates embedding vectors for each. When you search or ask a question, your query is embedded and compared against all stored chunks using cosine similarity to find the most relevant passages.' },
  { q: 'Can I use this without a paid AI subscription?', a: 'Yes. Google Gemini and Groq both offer generous free tiers. You can get an API key for either in minutes without entering a credit card.' },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative hero-glow min-h-screen flex items-center justify-center px-4 pt-24 pb-20">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/8 px-4 py-1.5 text-xs font-medium text-accent mb-8"
          >
            <Sparkles className="h-3.5 w-3.5" />
            RAG-powered document intelligence — self-hosted & private
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6"
          >
            Chat with your<br />
            <span className="gradient-text">documents.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.6 }}
            className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Upload PDFs, notes, and code. Ask questions in plain language.
            Get grounded, cited answers from your own files — with your own AI key, your own database.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link href="/auth?mode=register"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-7 py-3.5 text-base font-semibold text-white hover:brightness-110 transition-all active:scale-[0.98] shadow-lg shadow-accent/25"
            >
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#how"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg-card/50 px-7 py-3.5 text-base font-medium text-text-secondary hover:text-text-primary hover:border-border/80 transition-colors"
            >
              See how it works
              <ChevronDown className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-10 text-center"
          >
            {[
              { value: 12000, suffix: '+', label: 'Documents processed', decimals: 0 },
              { value: 1.2, suffix: 's', label: 'Avg. answer latency', decimals: 1 },
              { value: 98, suffix: '%', label: 'Cited accuracy', decimals: 0 },
            ].map(({ value, suffix, label, decimals }) => (
              <div key={label}>
                <p className="text-3xl font-extrabold gradient-text">
                  <Counter to={value} suffix={suffix} decimals={decimals} />
                </p>
                <p className="text-xs text-text-muted mt-1">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Floating doc cards */}
        <div className="relative max-w-5xl mx-auto hidden lg:block">
          <DocCard name="agreement-q3.pdf" type="PDF" delay={0.9} x="2%" y="30%" />
          <DocCard name="product-spec.md" type="Markdown" delay={1.1} x="75%" y="35%" />
          <DocCard name="dataset.csv" type="CSV" delay={1.3} x="60%" y="55%" />
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
            <ChevronDown className="h-5 w-5 text-text-muted" />
          </motion.div>
        </div>
      </section>

      {/* Terminal demo */}
      <section id="how" className="py-24 px-4 bg-bg-secondary/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-mono font-bold tracking-widest text-text-muted mb-3">HOW IT WORKS</p>
            <h2 className="text-4xl font-extrabold tracking-tight mb-4">
              Upload. Ask. <span className="gradient-text">Get answers.</span>
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto">
              Upload any document, ask a question in plain language, and get a grounded answer with citations pointing back to the source passages.
            </p>
          </div>

          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <TerminalDemo />
            <div className="space-y-6">
              {[
                { icon: Upload, title: 'Upload any document', desc: 'PDF, Markdown, CSV, JSON, code files. DocuMind extracts text, chunks it, and creates semantic embeddings automatically.' },
                { icon: Search, title: 'Semantic retrieval', desc: 'Your question is embedded and matched against all stored chunks using cosine similarity — finds relevant passages even with different wording.' },
                { icon: Sparkles, title: 'Grounded AI answers', desc: 'Only the retrieved passages are sent to the AI. Answers are grounded in your documents and include inline citations.' },
              ].map(({ icon: Icon, title, desc }, i) => (
                <motion.div key={title}
                  initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }} viewport={{ once: true }}
                  className="flex gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">{title}</p>
                    <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-mono font-bold tracking-widest text-text-muted mb-3">FEATURES</p>
            <h2 className="text-4xl font-extrabold tracking-tight mb-4">
              Everything you need to <span className="gradient-text">work smarter</span>
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { Icon: MessageSquare, title: 'Streaming Chat',     desc: 'Real-time streaming answers with inline citations. Ask follow-up questions and export conversations as Markdown.' },
              { Icon: FolderOpen,   title: 'Collections',         desc: 'Organize documents by project, client, or topic. Scope chat retrieval to one collection or search across all.' },
              { Icon: FileSearch,   title: 'Semantic Search',     desc: 'Find relevant passages by meaning, not keywords. Relevance scores and "Ask AI" links on every result.' },
              { Icon: Database,     title: 'pgvector Ready',      desc: 'Production-grade vector storage with PostgreSQL + pgvector. Falls back to local JSON for development.' },
              { Icon: Key,          title: 'Bring Your Key',      desc: 'Use Google Gemini (free), OpenAI, Groq, or any OpenAI-compatible provider. Your keys stay in your environment.' },
              { Icon: Shield,       title: 'Private by Design',   desc: 'Documents never leave your database. HMAC-signed sessions, bcrypt passwords, per-user data isolation.' },
              { Icon: Layers,       title: 'Smart Chunking',      desc: 'Paragraph-aware splitter maintains context across 512-token chunks. Overlapping windows prevent missed context.' },
              { Icon: Zap,          title: 'Fast Indexing',       desc: 'Most documents are chunked, embedded, and ready to query in under 10 seconds after upload.' },
              { Icon: BookOpen,     title: 'Multi-format',        desc: 'PDF, TXT, Markdown, CSV, JSON, JavaScript, TypeScript, Python, and more. File type detected automatically.' },
            ].map(({ Icon, title, desc }, i) => (
              <motion.div key={title}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }} viewport={{ once: true }}
                className="glass rounded-xl p-5 hover:border-accent/20 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/15 flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-semibold mb-1.5">{title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="guide" className="py-24 px-4 bg-bg-secondary/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-mono font-bold tracking-widest text-text-muted mb-3">USE CASES</p>
            <h2 className="text-4xl font-extrabold tracking-tight mb-4">
              Built for <span className="gradient-text">real work</span>
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {[
              { title: 'Legal & Contracts', Icon: Lock,    tags: ['PDF contracts', 'NDA review', 'Clause extraction'],          desc: 'Upload contracts and NDAs. Ask "What are the termination clauses?" or "Find any data retention obligations" with exact citations.' },
              { title: 'Research & Reports', Icon: BookOpen, tags: ['Research papers', 'Literature review', 'Synthesis'],        desc: 'Build a collection of papers and get synthesized answers across multiple sources, with passage citations for verification.' },
              { title: 'Developer Docs',    Icon: Clock,   tags: ['API docs', 'Code search', 'Architecture'],                    desc: 'Index your codebase, API specs, and architecture docs. Ask questions in plain language and get answers from your own documentation.' },
              { title: 'Business Intel',   Icon: Quote,   tags: ['Reports', 'Meeting notes', 'Data analysis'],                  desc: 'Upload quarterly reports, meeting transcripts, and datasets. Extract key metrics, decisions, and action items instantly.' },
            ].map(({ title, Icon, tags, desc }, i) => (
              <motion.div key={title}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }} viewport={{ once: true }}
                className="glass rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="font-bold text-lg">{title}</h3>
                </div>
                <p className="text-sm text-text-secondary mb-4 leading-relaxed">{desc}</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map(t => (
                    <span key={t} className="rounded-full border border-accent/15 bg-accent/6 px-2.5 py-0.5 text-[11px] font-medium text-accent">{t}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-mono font-bold tracking-widest text-text-muted mb-3">FAQ</p>
            <h2 className="text-4xl font-extrabold tracking-tight mb-4">Common questions</h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div key={item.q} className="glass rounded-xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/3 transition-colors"
                >
                  <span className="font-medium">{item.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-text-secondary leading-relaxed border-t border-border/50 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass rounded-2xl p-12 hero-glow">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
              <Logo className="h-8 w-8" animated />
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight mb-4">
              Ready to get started?
            </h2>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">
              Create a free account, upload a document, and ask your first question in under 2 minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/auth?mode=register"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3.5 text-base font-semibold text-white hover:brightness-110 transition-all shadow-lg shadow-accent/25"
              >
                <UserRound className="w-4 h-4" />
                Create free account
              </Link>
              <Link href="/auth"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg-card px-8 py-3.5 text-base font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Sign in
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-text-muted">
              {['No credit card required', 'Self-hosted & private', 'Works with free AI tiers'].map(item => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />{item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Logo className="h-3.5 w-3.5" animated={false} />
            </div>
            <span className="text-sm font-semibold">Docu<span className="gradient-text">Mind</span></span>
            <span className="text-xs text-text-muted">v4</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-text-muted">
            <Link href="/auth" className="hover:text-text-primary transition-colors">Sign in</Link>
            <Link href="/auth?mode=register" className="hover:text-text-primary transition-colors">Register</Link>
            <a href="https://github.com/ShaikMuzzammil/documind" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
