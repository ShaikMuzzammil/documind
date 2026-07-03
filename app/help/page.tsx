'use client';

import { useState } from 'react';
import { ChevronDown, FolderPlus, HelpCircle, MessageSquare, Search, Upload } from 'lucide-react';
import AuthGate from '@/components/app/AuthGate';

const GUIDES = [
  {
    title: 'Upload your first document',
    Icon: Upload,
    steps: [
      'Go to Collections and create a workspace for your project.',
      'Open Documents from the sidebar.',
      'Select your new collection in the top-right dropdown.',
      'Drag a PDF or text file onto the upload area, or click Browse.',
      'Wait for the status to change from Processing to Ready — this usually takes a few seconds.',
    ],
  },
  {
    title: 'Ask a question about a document',
    Icon: MessageSquare,
    steps: [
      'Open Chat from the sidebar.',
      'Select a collection from the top-right picker if you want to limit answers to one project.',
      'Type your question in plain language and press Enter.',
      'Read the answer and click "sources" below it to see the exact passages that were used.',
    ],
  },
  {
    title: 'Find a specific passage',
    Icon: Search,
    steps: [
      'Open Search from the sidebar.',
      'Type a phrase or concept — search finds related passages even when the wording is different.',
      'Each result shows the document name and a relevance percentage.',
    ],
  },
  {
    title: 'Organize into collections',
    Icon: FolderPlus,
    steps: [
      'Open Collections from the sidebar.',
      'Enter a name and optional description and click Create workspace.',
      'Upload documents into a specific collection from the Documents page.',
      'Click the Chat button on a collection card to open a conversation scoped to that workspace.',
    ],
  },
];

const TROUBLESHOOTING = [
  {
    q: 'Upload is stuck on Processing',
    a: 'Large PDFs or very long documents can take 30–60 seconds. Reload the page and check Document status. If the status shows Error, the file may be encrypted, scanned without text, or a binary format that is not supported.',
  },
  {
    q: 'Chat returns empty or incomplete answers',
    a: 'Make sure the documents you expect to draw from have a Ready status. Ask a more specific question that is likely to appear verbatim in the source text.',
  },
  {
    q: 'I registered but cannot log in',
    a: 'Check that you are typing the same email and password you used to register. Passwords are case-sensitive. If you are sure the credentials are correct, the data store may have reset between deployments — re-registering will create a fresh account.',
  },
  {
    q: 'I see No collections. Add one first',
    a: 'Chat requires at least one document in at least one collection. Go to Collections, create a workspace, then upload a document from the Documents page.',
  },
  {
    q: 'The page shows an error after deploying',
    a: 'Check that all required environment variables are set in your hosting dashboard: NEXT_PUBLIC_APP_URL, AUTH_SECRET, and LLM_API_KEY. Redeploy after adding them.',
  },
];

function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={item.q} className="glass rounded-xl overflow-hidden">
          <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between gap-4 px-4 py-3.5 text-left">
            <span className="text-sm font-medium">{item.q}</span>
            <ChevronDown className={`h-4 w-4 text-text-muted shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && <p className="px-4 pb-4 text-sm text-text-secondary leading-relaxed">{item.a}</p>}
        </div>
      ))}
    </div>
  );
}

export default function HelpPage() {
  return (
    <AuthGate>
      <div className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <div>
            <p className="text-xs font-mono font-bold tracking-widest text-text-muted">DOCUMENTATION</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Help center</h1>
            <p className="mt-1 text-sm text-text-secondary">Quick guides and troubleshooting for common issues.</p>
          </div>

          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-accent" /> Step-by-step guides
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              {GUIDES.map(({ title, Icon, steps }) => (
                <div key={title} className="glass rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-accent-soft border border-accent/20 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-accent" />
                    </div>
                    <h3 className="font-semibold text-sm">{title}</h3>
                  </div>
                  <ol className="space-y-2">
                    {steps.map((step, i) => (
                      <li key={i} className="flex gap-2.5 text-sm text-text-secondary">
                        <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center">{i + 1}</span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4">Troubleshooting</h2>
            <Accordion items={TROUBLESHOOTING} />
          </section>
        </div>
      </div>
    </AuthGate>
  );
}
