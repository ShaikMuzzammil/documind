'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthGate from '@/components/app/AuthGate';
import {
  BookOpen, Upload, MessageSquare, FolderOpen, BarChart3, Download,
  Shield, Search, Braces, ChevronDown, ChevronUp, ArrowRight,
  CheckCircle2, AlertTriangle, Zap, FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-b-0">
      <button onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full py-4 text-left text-sm font-medium text-text-primary hover:text-accent transition-colors">
        <span>{q}</span>
        {open ? <ChevronUp className="w-4 h-4 shrink-0 text-accent" /> : <ChevronDown className="w-4 h-4 shrink-0 text-text-muted" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height:0,opacity:0 }} animate={{ height:'auto',opacity:1 }} exit={{ height:0,opacity:0 }} className="overflow-hidden">
            <p className="pb-4 text-sm text-text-secondary leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const GUIDES = [
  {
    icon: FolderOpen, color: 'blue', title: 'Step 1 — Create a Collection',
    steps: [
      'Go to the Collections page from the sidebar.',
      'Click "New Collection" and give it a name (e.g., "Legal Contracts", "Research Papers").',
      'Add an optional description for context.',
      'Click Create — your collection is ready to receive documents.',
    ],
  },
  {
    icon: Upload, color: 'emerald', title: 'Step 2 — Upload Documents',
    steps: [
      'Go to the Documents page.',
      'Select your target collection from the picker at the top.',
      'Drag and drop files or click "Browse" to select from disk.',
      'Watch real-time progress — each file shows chunk count when complete.',
      'Supported: PDF, TXT, Markdown, CSV, JSON, TypeScript, Python, and more.',
    ],
  },
  {
    icon: MessageSquare, color: 'blue', title: 'Step 3 — Chat with Your Documents',
    steps: [
      'Open the Chat page from the sidebar.',
      'Optionally select a specific collection from the picker (or leave as "All docs").',
      'Type your question and press Enter.',
      'Each answer includes numbered citations — click to expand the source passage.',
      'Use the suggestions panel when no messages exist for example questions.',
    ],
  },
  {
    icon: Braces, color: 'emerald', title: 'Schema Extraction',
    steps: [
      'Go to Export → Schema Extraction tab.',
      'Define your field schema: field name, type (string/number/date/boolean), description.',
      'Select the collection to extract from.',
      'Click "Run Extraction" — AI processes each document and extracts the fields.',
      'Download results as CSV or JSON.',
    ],
  },
  {
    icon: Shield, color: 'blue', title: 'PII Scanner',
    steps: [
      'Go to Export → PII Scanner tab.',
      'Paste any text you want to scan.',
      'Click "Scan for PII" — detects emails, phones, SSNs, credit cards, and more.',
      'Each match shows type, risk level (High/Medium/Low), and a masked preview.',
      'Copy the auto-redacted version with all PII replaced by placeholders.',
    ],
  },
  {
    icon: Search, color: 'blue', title: 'Semantic Search',
    steps: [
      'Open the Search page from the sidebar (or press ⌘K anywhere).',
      'Choose search mode: Hybrid (recommended), Semantic, or Keyword.',
      'Type your query — results appear as you type.',
      'Results are grouped by collection with confidence scores.',
      'Click any result to open a chat focused on that document.',
    ],
  },
];

const FAQS = [
  { q: 'Why does the AI say "No document context found"?', a: 'This happens when no documents are uploaded to your workspace, or none match the semantic meaning of your query. Ensure you have uploaded documents, selected the right collection, and that indexing completed (status = "ready").' },
  { q: 'What does the quota error mean?', a: 'The AI engine is rate-limited on free tiers. When you see a quota error, wait a few minutes before trying again. For production use, upgrade to a paid AI plan for higher limits.' },
  { q: 'Why are some documents showing "error" status?', a: 'Document processing can fail if the file is corrupted, password-protected, scanned without OCR text, or contains no extractable text. Try a different file format or ensure the PDF has actual text content (not just images).' },
  { q: 'Can I chat across multiple collections at once?', a: 'Yes — in the Chat page, leave the collection picker as "All docs" to search across all your uploaded documents simultaneously.' },
  { q: 'How accurate is the Schema Extraction?', a: 'Accuracy depends on AI quota and document clarity. Extraction works best when documents have consistent structure and your field descriptions are specific. For high-volume processing, ensure your AI key has sufficient quota.' },
  { q: 'Is my data private?', a: 'Yes. Each user account has a fully isolated data namespace. No other user can access your documents, collections, or chat history. Documents are stored in your configured database (or local JSON in dev mode).' },
  { q: 'How do I export my data?', a: 'Go to the Export page. You can download all documents as CSV, all collections as JSON, and any chat session as Markdown. The Schema Extraction feature also exports structured data as CSV/JSON.' },
  { q: 'What file types are supported?', a: 'PDF, TXT, Markdown (.md), CSV, JSON, TypeScript, JavaScript, Python, HTML, and XML. Maximum 20 MB per file. Multiple files can be uploaded simultaneously.' },
];

export default function HelpPage() {
  return (
    <AuthGate>
      <div className="max-w-4xl mx-auto px-4 py-7">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Help Center</h1>
              <p className="text-sm text-text-muted">Step-by-step guides and answers</p>
            </div>
          </div>
        </div>

        {/* Quick start cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Zap,         label: 'Quick Start',    href: '/collections', desc: 'Create your first collection' },
            { icon: FileText,    label: 'Upload Files',   href: '/documents',   desc: 'Index your documents'        },
            { icon: MessageSquare, label: 'Start Chatting', href: '/chat',      desc: 'Ask your first question'     },
          ].map(({ icon: Icon, label, href, desc }) => (
            <Link key={href} href={href}
              className="glass rounded-2xl p-4 hover:border-accent/30 transition-all card-glow group">
              <Icon className="w-5 h-5 text-accent mb-2" />
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs text-text-muted mt-0.5">{desc}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                Go <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>

        {/* Step-by-step guides */}
        <h2 className="text-lg font-bold mb-4">Feature Guides</h2>
        <div className="space-y-4 mb-10">
          {GUIDES.map((guide) => {
            const Icon = guide.icon;
            return (
              <div key={guide.title} className="glass rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    guide.color === 'blue' ? 'bg-accent/15 border border-accent/25' : 'bg-accent-2/15 border border-accent-2/25'
                  }`}>
                    <Icon className={`w-4 h-4 ${guide.color === 'blue' ? 'text-accent' : 'text-accent-2'}`} />
                  </div>
                  <h3 className="text-sm font-semibold">{guide.title}</h3>
                </div>
                <ol className="space-y-2">
                  {guide.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-text-secondary">
                      <span className="w-5 h-5 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-[10px] font-bold text-accent shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>

        {/* Troubleshooting */}
        <div className="glass rounded-2xl p-5 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
            <h2 className="text-base font-semibold">Common Issues</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { problem: 'App looks unstyled', fix: 'Run npm install and ensure Tailwind CSS is installed.' },
              { problem: 'Upload stuck on "processing"', fix: 'Check server logs. Large PDFs can take 30–60s. Reload and check document status.' },
              { problem: 'Chat returns empty answers', fix: 'Ensure documents are indexed (status = ready) and try a more specific question.' },
              { problem: 'Schema extraction times out', fix: 'AI has a 60s limit. Try fewer documents or shorter field schemas.' },
              { problem: 'Login error "No account found"', fix: 'Register first — click "Register here" on the auth page.' },
              { problem: 'Vercel deploy fails', fix: 'Ensure AI_API_KEY, AUTH_SECRET, and NEXT_PUBLIC_APP_URL are set in environment variables.' },
            ].map(({ problem, fix }) => (
              <div key={problem} className="rounded-xl bg-bg-secondary/50 border border-border p-3">
                <p className="text-xs font-semibold text-text-primary mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-warning shrink-0" />{problem}
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">{fix}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="glass rounded-2xl p-5 mb-6">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent-2" />FAQ
          </h2>
          {FAQS.map((f) => <FAQItem key={f.q} {...f} />)}
        </div>

        <p className="text-center text-xs text-text-muted">
          Still stuck? Check the{' '}
          <Link href="/settings" className="text-accent hover:underline">Settings page</Link>
          {' '}for system status, or review your environment variables.
        </p>
      </div>
    </AuthGate>
  );
}
