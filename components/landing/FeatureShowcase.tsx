'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Upload, BarChart3,
  Shield, Braces, Search, FolderOpen,
} from 'lucide-react';

const FEATURES = [
  {
    id:    'chat',
    icon:  MessageSquare,
    label: 'AI Chat',
    color: 'blue',
    title: 'Ask any question, get cited answers',
    desc:  'Every response is grounded in your actual documents. Citations include the source document name, chunk number, and a confidence percentage so you can verify every claim.',
    preview: [
      { role: 'user', text: 'What are the payment terms in the vendor agreement?' },
      { role: 'ai',   text: 'Per Section 7.2 of the Vendor Agreement, payment is due within 30 days of invoice receipt. Late payments accrue interest at 1.5% per month. [vendor-agreement.pdf · Chunk 14 · 94%]' },
    ],
  },
  {
    id:    'upload',
    icon:  Upload,
    label: 'Smart Upload',
    color: 'emerald',
    title: 'Multi-file drag-drop with live indexing',
    desc:  'Upload PDF, TXT, Markdown, CSV, JSON, TypeScript, Python and more simultaneously. Each file is chunked and embedded in real time with per-file status logging.',
    preview: [
      { status: 'done',      name: 'q3-report.pdf',        detail: '142 chunks' },
      { status: 'done',      name: 'vendor-agreement.docx', detail: '38 chunks'  },
      { status: 'uploading', name: 'meeting-notes.md',      detail: 'Indexing…'  },
      { status: 'queued',    name: 'data-analysis.csv',     detail: 'Queued'     },
    ],
  },
  {
    id:    'extract',
    icon:  Braces,
    label: 'Schema Extract',
    color: 'emerald',
    title: 'AI batch field extraction',
    desc:  'Define a JSON schema once — vendor name, date, amount, risk clause — and extract those exact fields from every document in a collection automatically. Export as CSV or JSON.',
    preview: {
      schema: ['vendor_name: string', 'contract_date: date', 'total_value: number', 'risk_level: string'],
      results: [
        { doc: 'vendor-a.pdf',  vendor: 'Acme Corp', date: '2024-01-15', value: '$120,000', risk: 'Low'    },
        { doc: 'vendor-b.pdf',  vendor: 'TechCo',    date: '2024-03-01', value: '$85,500',  risk: 'Medium' },
      ],
    },
  },
  {
    id:    'analytics',
    icon:  BarChart3,
    label: 'Analytics',
    color: 'blue',
    title: 'Document health at a glance',
    desc:  'Real-time dashboard showing document status, chunk coverage per collection, file type breakdown, storage usage, and AI/database connectivity status.',
    preview: [
      { label: 'Total Documents',   value: '48',      sub: '46 ready · 2 errors' },
      { label: 'Collections',       value: '7',       sub: 'across all workspaces' },
      { label: 'Semantic Chunks',   value: '3,842',   sub: 'avg 80 per document' },
      { label: 'Indexed Storage',   value: '24.6 MB', sub: 'compressed text' },
    ],
  },
  {
    id:    'pii',
    icon:  Shield,
    label: 'PII Scanner',
    color: 'emerald',
    title: 'Detect & redact sensitive data',
    desc:  'Scan any text for personally identifiable information — emails, phone numbers, SSNs, credit cards, passport numbers. Auto-redact before sending to AI or sharing externally.',
    preview: [
      { type: 'Email',    risk: 'Medium', masked: 'jo***@example.com' },
      { type: 'Phone',    risk: 'Medium', masked: '***-***-4521'       },
      { type: 'SSN',      risk: 'High',   masked: '***-**-6789'        },
    ],
  },
  {
    id:    'search',
    icon:  Search,
    label: 'Semantic Search',
    color: 'blue',
    title: 'Find by meaning, not just keywords',
    desc:  'Hybrid search combines vector similarity with keyword boosting. Results group by collection, show confidence scores, and highlight matched passages with context.',
    preview: [
      { name: 'q3-report.pdf',       col: 'Finance',   score: 94, type: 'semantic' },
      { name: 'board-minutes.pdf',   col: 'Legal',     score: 87, type: 'semantic' },
      { name: 'risk-assessment.md',  col: 'Compliance',score: 71, type: 'hybrid'   },
    ],
  },
];

export default function FeatureShowcase() {
  const [active, setActive] = useState(FEATURES[0].id);
  const feature = FEATURES.find((f) => f.id === active)!;
  const Icon    = feature.icon;

  return (
    <div className="grid lg:grid-cols-[220px_1fr] gap-5">
      {/* Tab list */}
      <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible no-scrollbar">
        {FEATURES.map((f) => {
          const FIcon = f.icon;
          return (
            <button key={f.id} onClick={() => setActive(f.id)}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                active === f.id
                  ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}>
              <FIcon className="w-4 h-4 shrink-0" />{f.label}
            </button>
          );
        })}
      </div>

      {/* Preview panel */}
      <AnimatePresence mode="wait">
        <motion.div key={active}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0  }}
          exit={{    opacity: 0, x: -16 }}
          transition={{ duration: 0.18 }}
          className="glass rounded-2xl p-6 border border-border min-h-[320px]"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              feature.color === 'blue' ? 'bg-blue-600/15 border border-blue-500/25' : 'bg-emerald-500/15 border border-emerald-500/25'
            }`}>
              <Icon className={`w-4 h-4 ${feature.color === 'blue' ? 'text-blue-400' : 'text-emerald-400'}`} />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{feature.title}</h3>
              <p className="text-xs text-text-muted mt-0.5">{feature.desc}</p>
            </div>
          </div>

          {/* Chat preview */}
          {active === 'chat' && Array.isArray(feature.preview) && (
            <div className="space-y-3 mt-5">
              {(feature.preview as { role: string; text: string }[]).map((m, i) => (
                <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    m.role === 'user' ? 'bg-blue-600/15 border border-blue-500/25' : 'bg-bg-secondary border border-border'
                  }`}>{m.text}</div>
                </div>
              ))}
            </div>
          )}

          {/* Upload preview */}
          {active === 'upload' && Array.isArray(feature.preview) && (
            <div className="space-y-2 mt-5">
              {(feature.preview as { status: string; name: string; detail: string }[]).map((u, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-bg-secondary border border-border text-xs">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    u.status === 'done'      ? 'bg-emerald-400' :
                    u.status === 'uploading' ? 'bg-blue-400 animate-pulse' :
                    'bg-text-muted'
                  }`} />
                  <span className="flex-1 truncate text-text-secondary">{u.name}</span>
                  <span className={u.status === 'done' ? 'text-emerald-400' : u.status === 'uploading' ? 'text-blue-400' : 'text-text-muted'}>
                    {u.detail}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Schema extract preview */}
          {active === 'extract' && !Array.isArray(feature.preview) && (
            <div className="mt-5 space-y-3">
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(feature.preview as { schema: string[]; results: Record<string,string>[] }).schema.map((s) => (
                  <span key={s} className="text-[10px] font-mono px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{s}</span>
                ))}
              </div>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="text-[10px] w-full">
                  <thead><tr className="border-b border-border bg-bg-secondary/50">
                    {['Document','Vendor','Date','Value','Risk'].map((h) => (
                      <th key={h} className="px-2.5 py-1.5 text-left text-text-muted font-medium">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{(feature.preview as { schema: string[]; results: { doc: string; vendor: string; date: string; value: string; risk: string }[] }).results.map((r, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="px-2.5 py-1.5 text-text-secondary">{r.doc}</td>
                      <td className="px-2.5 py-1.5 text-text-primary font-medium">{r.vendor}</td>
                      <td className="px-2.5 py-1.5 text-text-secondary">{r.date}</td>
                      <td className="px-2.5 py-1.5 text-emerald-400 font-mono">{r.value}</td>
                      <td className="px-2.5 py-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${r.risk === 'Low' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{r.risk}</span>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analytics preview */}
          {active === 'analytics' && Array.isArray(feature.preview) && (
            <div className="grid grid-cols-2 gap-3 mt-5">
              {(feature.preview as { label: string; value: string; sub: string }[]).map((s) => (
                <div key={s.label} className="bg-bg-secondary/50 rounded-xl p-3 border border-border">
                  <p className="text-lg font-bold text-text-primary">{s.value}</p>
                  <p className="text-xs font-medium text-text-secondary">{s.label}</p>
                  <p className="text-[10px] text-text-muted">{s.sub}</p>
                </div>
              ))}
            </div>
          )}

          {/* PII preview */}
          {active === 'pii' && Array.isArray(feature.preview) && (
            <div className="space-y-2 mt-5">
              {(feature.preview as { type: string; risk: string; masked: string }[]).map((m, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-bg-secondary border border-border text-xs">
                  <Shield className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <span className="text-text-secondary font-medium">{m.type}</span>
                  <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${m.risk === 'High' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>{m.risk}</span>
                  <span className="text-text-muted font-mono ml-auto">{m.masked}</span>
                </div>
              ))}
            </div>
          )}

          {/* Search preview */}
          {active === 'search' && Array.isArray(feature.preview) && (
            <div className="space-y-2 mt-5">
              {(feature.preview as { name: string; col: string; score: number; type: string }[]).map((r, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-bg-secondary border border-border text-xs">
                  <FolderOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="text-text-secondary flex-1 truncate">{r.name}</span>
                  <span className="text-text-muted">{r.col}</span>
                  <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${r.type === 'semantic' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>{r.type}</span>
                  <span className="text-emerald-400 font-mono">{r.score}%</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
