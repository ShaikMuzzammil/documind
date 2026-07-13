'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const ITEMS = [
  {
    q: 'What file types can I upload?',
    a: 'PDF, Markdown (.md), plain text (.txt), CSV, JSON, JavaScript/TypeScript, Python, SQL, YAML, HTML, XML, and log files — 12 formats total. Each file can be up to 15 MB. PDFs are parsed with pdfjs-dist, and all others are read as UTF-8 text.',
  },
  {
    q: 'Do I need an AI API key?',
    a: 'For AI-powered answers and citations, yes. Any OpenAI-compatible key works: Google Gemini (free at aistudio.google.com), OpenAI, Groq/Llama (free tier), Together AI, or a local Ollama server. Without a key, document upload, semantic search, and collection management still work fully — only the AI chat responses are disabled.',
  },
  {
    q: 'How does DocuMind keep answers accurate?',
    a: 'Every answer is grounded in retrieved passages from your documents using cosine-similarity vector search (pgvector). The LLM is explicitly instructed to cite sources inline with [1], [2] markers and to say "I could not find this" rather than guessing. You can expand each citation to see the exact passage and relevance score.',
  },
  {
    q: 'Where is my data stored?',
    a: 'Your documents, embeddings, and chat history are stored in your own Postgres database (Neon recommended). The app never stores your files externally — only extracted text chunks and their vector embeddings. You own your data entirely; DocuMind is fully self-hostable.',
  },
  {
    q: 'What is General AI mode?',
    a: 'General AI mode lets you chat with the LLM directly without any document context — great for coding help, writing, analysis, or quick questions. The conversation history is passed along so it follows multi-turn threads. Switch between Document mode (cited RAG answers) and General AI mode using the toggle at the top of the Chat page.',
  },
  {
    q: 'My PDF upload fails with an error. What should I do?',
    a: 'PDFs must have a text layer — purely scanned (image-only) PDFs are not supported without OCR preprocessing. Run OCR using Adobe Acrobat, iLovePDF, or the open-source ocrmypdf tool first. Encrypted PDFs should be decrypted before uploading. Also ensure the pgvector extension is enabled in your Neon database (Dashboard → Extensions → vector).',
  },
  {
    q: 'Is it free to deploy?',
    a: 'The app code is free and open source (MIT). Deployment cost depends on your providers: Vercel hobby tier is free, Neon free tier handles small workloads, and Gemini offers a free API tier with 15 RPM. For most personal or small-team use, the total running cost is $0.',
  },
  {
    q: 'Can I use Ollama or a local LLM?',
    a: 'Yes. Set LLM_API_KEY=ollama, LLM_BASE_URL=http://localhost:11434/v1, and LLM_CHAT_MODEL to your model name (e.g. llama3.2). You must be running Ollama locally and have the model pulled. Note: Ollama embedding models differ from chat models — check the README for embedding configuration.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-2.5">
      {ITEMS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="glass rounded-xl overflow-hidden">
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-bg-hover/30 transition-colors"
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
                  transition={{ duration: 0.18, ease: 'easeInOut' }}
                >
                  <p className="px-5 pb-4 text-sm text-text-secondary leading-relaxed border-t border-border/40 pt-3">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
