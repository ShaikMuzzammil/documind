'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown, FolderPlus, MessageSquare, Search, Upload,
  Zap, Key, ExternalLink, CheckCircle2,
  Bug, AlertTriangle, BookOpen, Globe, Database,
  ChevronRight, FileText, Download, BarChart2, Bot,
} from 'lucide-react';
import AuthGate from '@/components/app/AuthGate';

const GUIDES = [
  {
    title: 'Upload your first document',
    Icon: Upload,
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    time: '2 min',
    steps: [
      'Open Collections from the sidebar and create a workspace (e.g. "Research" or "Legal").',
      'Open Documents from the sidebar.',
      'Select your collection in the upload panel.',
      'Drag a PDF or text file onto the drop zone, or click to browse.',
      'Wait for status to change from Processing → Ready (usually under 10 seconds).',
    ],
  },
  {
    title: 'Ask a question about your documents',
    Icon: MessageSquare,
    color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    time: '1 min',
    steps: [
      'Open Chat from the sidebar. Make sure mode is set to "Documents" (the toggle in the header).',
      'Optionally pick a collection from the scope selector in the sidebar to narrow answers.',
      'Type your question in plain language and press Enter or click Send.',
      'Read the answer and expand citations below it to see the exact passages used.',
    ],
  },
  {
    title: 'Use General AI mode',
    Icon: Globe,
    color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    time: '1 min',
    steps: [
      'Open Chat from the sidebar.',
      'Click "General AI" in the mode toggle pill in the header.',
      'Ask anything — code, writing, analysis, maths, or general knowledge.',
      'The assistant remembers your conversation history within the session.',
    ],
  },
  {
    title: 'Find specific passages with Search',
    Icon: Search,
    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    time: '1 min',
    steps: [
      'Open Search from the sidebar.',
      'Type a phrase or concept — finds related passages even when exact wording differs.',
      'Each result shows the document name, relevance %, and the passage text.',
      'Click "Ask AI" on any result to open a focused chat about that passage.',
    ],
  },
  {
    title: 'Organise with Collections',
    Icon: FolderPlus,
    color: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    time: '2 min',
    steps: [
      'Open Collections from the sidebar.',
      'Enter a name (and optional description) and click Create collection.',
      'Upload documents into that collection from the Documents page.',
      'Scope Chat and Search queries to a collection using the picker.',
    ],
  },
  {
    title: 'Enable AI answers',
    Icon: Key,
    color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    time: '3 min',
    steps: [
      'Get a free API key from Google AI Studio (aistudio.google.com/app/apikey).',
      'Add LLM_API_KEY and LLM_BASE_URL as environment variables in your Vercel project settings.',
      'Set LLM_CHAT_MODEL=gemini-2.5-flash and LLM_EMBED_MODEL=gemini-embedding-001.',
      'Redeploy your Vercel project — the AI status indicator in the sidebar will turn green.',
    ],
  },
  {
    title: 'Export your data',
    Icon: Download,
    color: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
    time: '1 min',
    steps: [
      'Open Export from the sidebar.',
      'Choose what to export: Document Index, Knowledge Chunks, or Chat History.',
      'Select a format: JSON, CSV, Markdown, or JSONL.',
      'Optionally scope to a specific collection, then click Export.',
    ],
  },
  {
    title: 'View analytics',
    Icon: BarChart2,
    color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
    time: '1 min',
    steps: [
      'Open Analytics from the sidebar.',
      'See upload velocity, index health, total chunks, and storage used.',
      'Break down documents and chunks per collection.',
      'Use the sparkline charts to monitor recent activity trends.',
    ],
  },
];

const TROUBLESHOOTING = [
  {
    q: 'Upload is stuck on "Processing"',
    a: 'Large PDFs can take 30–60 seconds. Reload the page and check the document status. If it shows Error, the file may be encrypted, a scanned image PDF with no text layer, or an unsupported binary format. Check the error message shown under the filename for details.',
  },
  {
    q: 'Chat says "AI answers are not configured"',
    a: 'You need to set LLM_API_KEY in your environment variables. Go to Vercel → your project → Settings → Environment Variables. Google Gemini is free and recommended (get a key at aistudio.google.com). After adding the key, redeploy the project.',
  },
  {
    q: 'PDF upload fails with a text layer error',
    a: 'DocuMind parses text-based PDFs only. Scanned PDFs (image-only) have no text layer and must be processed with OCR first. Use Adobe Acrobat, iLovePDF (free online), or the open-source ocrmypdf CLI tool to add a text layer before uploading.',
  },
  {
    q: '"A database error occurred" when indexing',
    a: 'This usually means the pgvector extension is not enabled in your Neon database. Go to your Neon dashboard → Extensions tab → search for "vector" → Enable. Then try uploading again.',
  },
  {
    q: 'Chat returns "I could not find this in the provided documents"',
    a: 'Make sure your documents have a "Ready" status. Ask a more specific question, or try scoping chat to the collection containing your documents. In Document mode, answers come only from your indexed files — not from the LLM\'s general knowledge.',
  },
  {
    q: 'Search returns no results',
    a: 'Semantic search requires at least one document with Ready status. Make sure uploads completed successfully. Semantic search works on meaning, not keywords — try broader or more conceptual phrases if specific terms return nothing.',
  },
  {
    q: 'I registered but can\'t log in',
    a: 'Check that you\'re typing the same email and password used during registration (passwords are case-sensitive). If you recently redeployed with the JSON adapter (no database), accounts reset — re-register with a fresh account.',
  },
  {
    q: 'Embedding dimension mismatch error',
    a: 'You changed the LLM_EMBED_MODEL or EMBED_DIM environment variable after uploading documents. The stored vectors have a different size than the new model produces. Delete all existing documents from the Documents page, then re-upload them so new embeddings are generated with the correct dimension.',
  },
];

function GuideCard({ guide }: { guide: typeof GUIDES[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-bg-hover/30 transition-colors"
      >
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${guide.color}`}>
          <guide.Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{guide.title}</p>
          <p className="text-[11px] text-text-muted">{guide.time} guide</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-border/40 px-5 py-4 space-y-2">
          {guide.steps.map((step, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent mt-0.5">{i + 1}</div>
              <p className="text-sm text-text-secondary leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TroubleCard({ item }: { item: typeof TROUBLESHOOTING[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-bg-hover/30 transition-colors"
      >
        <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
        <p className="flex-1 font-medium text-sm text-left">{item.q}</p>
        <ChevronDown className={`h-4 w-4 text-text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-border/40 px-5 py-4">
          <p className="text-sm text-text-secondary leading-relaxed">{item.a}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [tab, setTab] = useState<'guides' | 'troubleshoot' | 'providers'>('guides');

  return (
    <AuthGate>
      <div className="min-h-screen pb-24 lg:pb-8">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">

          {/* Header */}
          <div>
            <p className="text-xs font-mono font-bold tracking-widest text-text-muted">HELP & GUIDES</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">DocuMind Help Center</h1>
            <p className="mt-1 text-sm text-text-secondary">Step-by-step guides, troubleshooting, and LLM provider reference.</p>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { href: '/documents',   icon: FileText,    label: 'Documents' },
              { href: '/chat',        icon: MessageSquare, label: 'Chat' },
              { href: '/search',      icon: Search,      label: 'Search' },
              { href: '/settings',    icon: Key,         label: 'Settings' },
            ].map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 glass rounded-xl px-4 py-3 text-sm font-medium text-text-secondary hover:text-text-primary hover:border-accent/25 transition-colors group"
              >
                <Icon className="h-4 w-4 text-text-muted group-hover:text-accent transition-colors" />
                {label}
                <ChevronRight className="h-3 w-3 ml-auto opacity-40 group-hover:opacity-70" />
              </Link>
            ))}
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 rounded-xl border border-border bg-bg-secondary/40 p-1">
            {([
              { id: 'guides',       label: 'Getting Started', icon: BookOpen },
              { id: 'troubleshoot', label: 'Troubleshooting', icon: Bug },
              { id: 'providers',    label: 'LLM Providers',   icon: Bot },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  tab === id ? 'bg-accent text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Guides tab */}
          {tab === 'guides' && (
            <div className="space-y-3">
              {GUIDES.map(guide => (
                <GuideCard key={guide.title} guide={guide} />
              ))}
            </div>
          )}

          {/* Troubleshoot tab */}
          {tab === 'troubleshoot' && (
            <div className="space-y-3">
              <div className="glass rounded-xl px-5 py-4 flex items-start gap-3">
                <Bug className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm mb-0.5">Found a bug?</p>
                  <p className="text-sm text-text-secondary">
                    Check the Vercel function logs for detailed error messages. Most issues are either a missing environment variable, the pgvector extension not being enabled, or a PDF without a text layer.
                  </p>
                </div>
              </div>
              {TROUBLESHOOTING.map(item => (
                <TroubleCard key={item.q} item={item} />
              ))}
            </div>
          )}

          {/* Providers tab */}
          {tab === 'providers' && (
            <div className="space-y-4">
              <div className="glass rounded-xl p-5 space-y-4">
                <h2 className="font-bold text-sm flex items-center gap-2"><Bot className="h-4 w-4 text-accent" /> Supported AI Providers</h2>
                <p className="text-sm text-text-secondary">DocuMind uses the OpenAI-compatible API format. Any provider below works by setting environment variables — no code changes needed.</p>

                <div className="space-y-3">
                  {[
                    {
                      name: 'Google Gemini', badge: 'Free tier', color: 'text-green-400 bg-green-400/10 border-green-400/20',
                      apiKey: 'LLM_API_KEY=AIza...',
                      baseUrl: 'LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai',
                      chatModel: 'LLM_CHAT_MODEL=gemini-2.5-flash',
                      embedModel: 'LLM_EMBED_MODEL=gemini-embedding-001',
                      embedDim: 'EMBED_DIM=768',
                      link: 'https://aistudio.google.com/app/apikey',
                    },
                    {
                      name: 'OpenAI', badge: 'Paid', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
                      apiKey: 'LLM_API_KEY=sk-proj-...',
                      baseUrl: '# LLM_BASE_URL not needed for OpenAI',
                      chatModel: 'LLM_CHAT_MODEL=gpt-4o-mini',
                      embedModel: 'LLM_EMBED_MODEL=text-embedding-3-small',
                      embedDim: 'EMBED_DIM=1536',
                      link: 'https://platform.openai.com/api-keys',
                    },
                    {
                      name: 'Groq / Llama', badge: 'Free tier', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
                      apiKey: 'LLM_API_KEY=gsk_...',
                      baseUrl: 'LLM_BASE_URL=https://api.groq.com/openai/v1',
                      chatModel: 'LLM_CHAT_MODEL=llama-3.3-70b-versatile',
                      embedModel: '# Groq has no embedding model — local fallback is used',
                      embedDim: '',
                      link: 'https://console.groq.com/keys',
                    },
                    {
                      name: 'Ollama (local)', badge: 'Self-hosted', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
                      apiKey: 'LLM_API_KEY=ollama',
                      baseUrl: 'LLM_BASE_URL=http://localhost:11434/v1',
                      chatModel: 'LLM_CHAT_MODEL=llama3.2',
                      embedModel: '# Pull a model: ollama pull nomic-embed-text',
                      embedDim: '# EMBED_DIM=768 for nomic-embed-text',
                      link: 'https://ollama.com',
                    },
                  ].map(p => (
                    <div key={p.name} className="rounded-xl border border-border bg-bg-secondary/30 overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                        <p className="font-semibold text-sm">{p.name}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${p.color}`}>{p.badge}</span>
                        <a href={p.link} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-[11px] text-accent hover:underline">
                          Get key <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <pre className="px-4 py-3 text-[11px] font-mono text-text-secondary leading-relaxed overflow-x-auto">
{[p.apiKey, p.baseUrl, p.chatModel, p.embedModel, p.embedDim].filter(Boolean).join('\n')}
                      </pre>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-warning/20 bg-warning/8 px-4 py-3">
                  <p className="text-[11px] text-warning font-semibold mb-1">⚠️ Changing providers after uploading</p>
                  <p className="text-xs text-text-secondary">If you change <code className="font-mono bg-bg-secondary rounded px-1">LLM_EMBED_MODEL</code> or <code className="font-mono bg-bg-secondary rounded px-1">EMBED_DIM</code>, you must delete all existing documents and re-upload them. Vector dimensions must match exactly.</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </AuthGate>
  );
}
