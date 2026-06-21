'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Upload,
  Search,
  MessageSquare,
  FileText,
  ShieldCheck,
  Quote,
  Sparkles,
  Layers,
  Zap,
} from 'lucide-react';
import FAQ from '@/components/landing/FAQ';

const FEATURES = [
  { icon: Upload, title: 'Upload anything', body: 'PDF, Markdown, text and code. Documents are parsed, chunked and embedded automatically.' },
  { icon: Search, title: 'Semantic retrieval', body: 'Find answers by meaning, not keywords, using vector similarity search over your content.' },
  { icon: Quote, title: 'Cited answers', body: 'Every response links back to the exact source passages, so you can trust and verify.' },
  { icon: Layers, title: 'Collections', body: 'Organize documents into workspaces and scope your questions to just what matters.' },
  { icon: Zap, title: 'Streaming chat', body: 'Answers stream token-by-token for a fast, responsive conversation.' },
  { icon: ShieldCheck, title: 'Grounded & honest', body: 'If the answer is not in your documents, DocuMind says so instead of hallucinating.' },
];

const STEPS = [
  { icon: Upload, title: 'Add documents', body: 'Create a collection and upload your files. They are indexed in seconds.' },
  { icon: MessageSquare, title: 'Ask questions', body: 'Chat naturally. DocuMind retrieves the most relevant passages for each query.' },
  { icon: FileText, title: 'Get cited answers', body: 'Read a grounded answer with clickable citations to the original text.' },
];

const TECH = ['Next.js 15', 'React 19', 'TypeScript', 'Tailwind v4', 'Framer Motion', 'Vector search', 'OpenAI-compatible LLM', 'Streaming'];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative hero-glow pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-soft border border-accent/20 text-accent text-xs font-medium mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Retrieval-Augmented AI workspace
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight"
          >
            Chat with your documents.<br />
            <span className="gradient-text">Get answers you can trust.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto"
          >
            DocuMind turns your PDFs and notes into a searchable knowledge base. Ask anything
            and get concise, cited answers grounded in your own files.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              Start chatting <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 px-6 py-3 glass rounded-xl font-medium hover:bg-white/5 transition-colors"
            >
              See how it works
            </a>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">Everything you need to reason over documents</h2>
          <p className="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
            A complete RAG pipeline, from ingestion to grounded, cited answers.
          </p>
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
                  className="glass rounded-2xl p-6"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent-soft border border-accent/20 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-1.5">{f.title}</h3>
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
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="relative glass rounded-2xl p-6">
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                  <Icon className="w-6 h-6 text-accent mb-4" />
                  <h3 className="font-semibold mb-1.5">{s.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{s.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tech */}
      <section id="tech" className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-3">Built on a modern stack</h2>
          <p className="text-text-secondary mb-10">Production-grade tools, free-tier friendly.</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {TECH.map((t) => (
              <span key={t} className="px-4 py-2 glass rounded-full text-sm text-text-secondary">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-bg-secondary/40 scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">FAQ</h2>
          <FAQ />
        </div>
      </section>

      {/* CTA + Footer */}
      <footer className="border-t border-border py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to talk to your documents?</h2>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Open DocuMind <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="mt-10 text-sm text-text-muted">
            DocuMind - Free &amp; open - Built with Next.js
          </p>
        </div>
      </footer>
    </>
  );
}
