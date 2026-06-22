'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const ITEMS = [
  {
    q: 'What file types can I upload?',
    a: 'PDF, Markdown (.md), plain text (.txt), CSV, JSON, and most code/text files. PDFs are parsed with pdf-parse; all other files are read as UTF-8 text. Binary files like images and video are not supported.',
  },
  {
    q: 'Do I need a Gemini API key?',
    a: 'For AI-powered answers, yes — get a free key at aistudio.google.com. Without a key, the local embedding fallback still lets you upload documents and see retrieval results. The chat will show a helpful message prompting you to add your key.',
  },
  {
    q: 'How are answers kept accurate and grounded?',
    a: 'DocuMind uses Retrieval-Augmented Generation (RAG). It only answers from retrieved passages in your documents and cites them with inline [1] markers. If the answer is not in your files, it says so clearly instead of hallucinating.',
  },
  {
    q: 'Where is my data stored?',
    a: 'Locally: in a git-ignored ./data directory (JSON). In production: your own Postgres + pgvector database (Neon and Supabase both have generous free tiers with pgvector). Your data never leaves the infrastructure you control.',
  },
  {
    q: 'How do collections work?',
    a: 'Collections are isolated workspaces (e.g., "Legal Contracts", "Research Papers", "Product Specs"). Each collection has its own documents and vector index. You can scope any chat to a specific collection to keep answers relevant.',
  },
  {
    q: 'What is the difference between local and Gemini embeddings?',
    a: 'Local embeddings use a deterministic bag-of-hashed-tokens approach (384-dim) that works offline with no API key. Gemini text-embedding-004 produces high-quality 768-dim semantic vectors for much better retrieval accuracy. Re-indexing is required when switching.',
  },
  {
    q: 'Can I self-host DocuMind?',
    a: 'Absolutely. It is a standard Next.js application deployable on Vercel, Railway, Fly.io, or any VPS. The only runtime dependencies are your Gemini API key and a Postgres database. No Docker required for Vercel deployments.',
  },
  {
    q: 'Is it free?',
    a: 'The source code is MIT licensed and free to run. Your costs depend on usage: Gemini API (generous free quota at Google AI Studio), Postgres (Neon/Supabase free tiers), and hosting (Vercel Hobby is free). Light usage runs at effectively zero cost.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-2.5">
      {ITEMS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="glass card-glow rounded-xl overflow-hidden transition-all duration-200">
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-medium text-sm">{item.q}</span>
              <ChevronDown
                className={`w-4 h-4 text-text-muted shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="px-5 pb-4 text-sm text-text-secondary leading-relaxed">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
