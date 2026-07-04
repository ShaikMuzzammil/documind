'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown, FolderPlus, MessageSquare, Search, Upload,
  Zap, Shield, Key, BookOpen, ExternalLink, CheckCircle2,
} from 'lucide-react';
import AuthGate from '@/components/app/AuthGate';

const GUIDES = [
  {
    title: 'Upload your first document',
    Icon: Upload,
    color: 'text-blue-400 bg-blue-400/10',
    time: '2 min',
    steps: [
      { text: 'Open Collections from the sidebar and create a workspace (e.g. "Research" or "Legal").', done: false },
      { text: 'Open Documents from the sidebar.', done: false },
      { text: 'Select your collection in the upload panel on the left.', done: false },
      { text: 'Drag a PDF or text file onto the drop zone, or click to browse.', done: false },
      { text: 'Wait for status to change from Processing → Ready (usually a few seconds).', done: false },
    ],
  },
  {
    title: 'Ask a question about your documents',
    Icon: MessageSquare,
    color: 'text-purple-400 bg-purple-400/10',
    time: '1 min',
    steps: [
      { text: 'Open Chat from the sidebar.', done: false },
      { text: 'Select a collection in the top-right picker to scope answers, or leave on All collections.', done: false },
      { text: 'Type your question in plain language and press Enter.', done: false },
      { text: 'Read the answer and expand "Sources" below it to see the exact passages used.', done: false },
    ],
  },
  {
    title: 'Find specific passages with Search',
    Icon: Search,
    color: 'text-cyan-400 bg-cyan-400/10',
    time: '1 min',
    steps: [
      { text: 'Open Search from the sidebar.', done: false },
      { text: 'Type a phrase or concept — finds related passages even when the exact wording differs.', done: false },
      { text: 'Each result shows the document name, a relevance percentage, and the passage text.', done: false },
      { text: 'Click "Ask AI" on any result to open a chat about that specific passage.', done: false },
    ],
  },
  {
    title: 'Organize with Collections',
    Icon: FolderPlus,
    color: 'text-emerald-400 bg-emerald-400/10',
    time: '2 min',
    steps: [
      { text: 'Open Collections from the sidebar.', done: false },
      { text: 'Enter a name (and optional description) and click Create collection.', done: false },
      { text: 'Upload documents into that collection from the Documents page.', done: false },
      { text: 'Use the Chat or Upload buttons on each collection card for quick access.', done: false },
    ],
  },
  {
    title: 'Enable AI answers',
    Icon: Key,
    color: 'text-orange-400 bg-orange-400/10',
    time: '3 min',
    steps: [
      { text: 'Go to Settings → AI Engine tab.', done: false },
      { text: 'Choose a provider (Gemini is free and recommended).', done: false },
      { text: 'Get an API key from the provider\'s dashboard using the link shown.', done: false },
      { text: 'Add LLM_API_KEY (and optionally LLM_BASE_URL) as environment variables in your Vercel project.', done: false },
      { text: 'Redeploy — the AI status indicator in the sidebar will turn green.', done: false },
    ],
  },
];

const TROUBLESHOOTING = [
  {
    q: 'Upload is stuck on "Processing"',
    a: 'Large PDFs can take 30–60 seconds. Reload the page and check document status. If it shows Error, the file may be encrypted, a scanned image PDF with no text layer, or an unsupported binary format.',
  },
  {
    q: 'Chat says "AI answers not turned on"',
    a: 'You need to add a LLM_API_KEY environment variable. Go to Settings → AI Engine for a step-by-step guide on getting a free API key from Google Gemini.',
  },
  {
    q: 'Chat returns empty or vague answers',
    a: 'Make sure the documents you want answers from have a "Ready" status. Ask a more specific question. If using "All collections", try scoping to a single collection for more focused retrieval.',
  },
  {
    q: 'I registered but can\'t log in',
    a: 'Check that you\'re typing the same email and password you used to register. Passwords are case-sensitive. If you recently redeployed, the local JSON store may have reset — re-registering will create a fresh account.',
  },
  {
    q: 'Search returns no results',
    a: 'Semantic search requires indexed (Ready) documents. Make sure you have documents uploaded and that their status shows Ready. The search uses meaning, not keywords, so try broader terms.',
  },
  {
    q: 'Environment variables not working',
    a: 'After adding environment variables in Vercel, you must redeploy the project for changes to take effect. Go to Deployments → Redeploy. The Analytics page shows which capabilities are currently active.',
  },
];

function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={item.q} className="glass rounded-xl overflow-hidden">
          <button onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 px-4 py-3.5 text-left hover:bg-white/3 transition-colors"
          >
            <span className="text-sm font-medium">{item.q}</span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-text-muted transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && (
            <div className="px-4 pb-4 text-sm text-text-secondary leading-relaxed border-t border-border/50 pt-3">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function GuideCard({ guide, index }: { guide: typeof GUIDES[0]; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (i: number) => {
    setCheckedSteps(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const progress = Math.round((checkedSteps.size / guide.steps.length) * 100);

  return (
    <div className="glass rounded-xl overflow-hidden">
      <button onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/3 transition-colors"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${guide.color}`}>
          <guide.Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold">{guide.title}</p>
            <span className="text-[10px] bg-bg-secondary border border-border rounded px-1.5 py-0.5 text-text-muted">{guide.time}</span>
            {checkedSteps.size > 0 && (
              <span className="text-[10px] bg-success/15 text-success rounded px-1.5 py-0.5">{progress}%</span>
            )}
          </div>
          {checkedSteps.size > 0 && (
            <div className="h-1 w-full max-w-xs bg-bg-hover rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-text-muted shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-border/50 px-5 py-4 space-y-3">
          {guide.steps.map((step, i) => (
            <button key={i} onClick={() => toggleStep(i)}
              className={`w-full flex items-start gap-3 text-left p-2 rounded-lg transition-colors ${checkedSteps.has(i) ? 'bg-success/5' : 'hover:bg-white/3'}`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${checkedSteps.has(i) ? 'border-success bg-success' : 'border-border'}`}>
                {checkedSteps.has(i) && <CheckCircle2 className="h-3 w-3 text-white" />}
              </div>
              <p className={`text-sm leading-relaxed ${checkedSteps.has(i) ? 'text-text-muted line-through' : 'text-text-secondary'}`}>
                {step.text}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  return (
    <AuthGate>
      <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <div>
            <p className="text-xs font-mono font-bold tracking-widest text-text-muted">DOCUMENTATION</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Help & Guides</h1>
            <p className="mt-1 text-sm text-text-secondary">Step-by-step walkthroughs to get the most out of DocuMind.</p>
          </div>

          {/* Quick nav */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Getting Started', icon: BookOpen, href: '#guides' },
              { label: 'AI Configuration', icon: Key, href: '#ai' },
              { label: 'Troubleshooting', icon: Zap, href: '#troubleshooting' },
              { label: 'Privacy', icon: Shield, href: '#privacy' },
            ].map(({ label, icon: Icon, href }) => (
              <a key={label} href={href}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-card px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:border-accent/30 transition-colors"
              >
                <Icon className="h-3.5 w-3.5" />{label}
              </a>
            ))}
          </div>

          {/* Guides */}
          <section id="guides">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-accent" /> Step-by-step guides
            </h2>
            <div className="space-y-3">
              {GUIDES.map((guide, i) => <GuideCard key={guide.title} guide={guide} index={i} />)}
            </div>
          </section>

          {/* Keyboard shortcuts */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Keyboard shortcuts</h2>
            <div className="glass rounded-xl overflow-hidden divide-y divide-border/60">
              {[
                { key: 'Enter', desc: 'Send message in chat' },
                { key: 'Shift + Enter', desc: 'New line in chat input' },
                { key: 'Escape', desc: 'Clear search input' },
              ].map(({ key, desc }) => (
                <div key={key} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-text-secondary">{desc}</span>
                  <kbd className="rounded-lg border border-border bg-bg-card px-2.5 py-1 font-mono text-xs text-text-primary">{key}</kbd>
                </div>
              ))}
            </div>
          </section>

          {/* Troubleshooting */}
          <section id="troubleshooting">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" /> Troubleshooting
            </h2>
            <Accordion items={TROUBLESHOOTING} />
          </section>

          {/* Privacy */}
          <section id="privacy">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" /> Privacy & security
            </h2>
            <div className="glass rounded-xl p-5 space-y-3 text-sm text-text-secondary leading-relaxed">
              <p>DocuMind is a <strong className="text-text-primary">self-hosted</strong> application. Your documents are stored in your own database (PostgreSQL or local JSON). No document content is ever sent to Anthropic, DocuMind servers, or any third party.</p>
              <p>AI answers are generated by sending <strong className="text-text-primary">only the relevant text passages</strong> (retrieved chunks) and your question to the AI provider you configure. Full documents are never sent.</p>
              <p>Session cookies are HMAC-signed with your own AUTH_SECRET. Passwords are bcrypt-hashed. There is no password recovery system — keep your credentials safe.</p>
            </div>
          </section>

          <div className="glass rounded-xl p-4 flex items-center gap-3 text-sm">
            <ExternalLink className="h-4 w-4 text-accent shrink-0" />
            <span className="text-text-secondary">Found a bug or want to contribute?</span>
            <a href="https://github.com/ShaikMuzzammil/documind" target="_blank" rel="noopener noreferrer"
              className="ml-auto text-accent hover:underline font-medium shrink-0"
            >
              GitHub →
            </a>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
