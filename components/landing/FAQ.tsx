'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const ITEMS = [
  {
    q: 'What file types can I upload?',
    a: 'PDF, Markdown, plain text, and most code/text files. PDFs are parsed automatically; other files are read as text.',
  },
  {
    q: 'Do I need an API key?',
    a: 'For AI answers, yes — any OpenAI-compatible key (Groq has a generous free tier). Without a key, retrieval and citations still work and the app tells you to add one.',
  },
  {
    q: 'How are answers kept accurate?',
    a: 'DocuMind only answers from retrieved passages and cites them inline. If the answer is not in your documents, it says so instead of guessing.',
  },
  {
    q: 'Where is my data stored?',
    a: 'In Phase 1, documents and embeddings are stored locally in a data directory. Phase 2 introduces Postgres + pgvector for multi-user persistence.',
  },
  {
    q: 'Is it free?',
    a: 'Yes. DocuMind is free and open — no login, no pricing, no usage limits in the app itself.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {ITEMS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="glass rounded-xl overflow-hidden">
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-medium">{item.q}</span>
              <ChevronDown
                className={`w-4 h-4 text-text-muted shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
