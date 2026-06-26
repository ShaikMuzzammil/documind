'use client';

import { useState } from 'react';
import AuthGate        from '@/components/app/AuthGate';
import CollectionPicker from '@/components/app/CollectionPicker';
import PIIScanner      from '@/components/app/PIIScanner';
import { useCollections } from '@/lib/use-collections';
import { toast } from '@/components/app/Toast';
import { SchemaField } from '@/lib/types';
import {
  Download, Plus, Trash2, Loader2, FileText, Package,
  Database, MessageSquare, Braces, Play, AlertTriangle,
  CheckCircle2, X, Shield,
} from 'lucide-react';
import { generateId } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const FIELD_TYPES: SchemaField['type'][] = ['string', 'number', 'boolean', 'date'];
type Tab = 'export' | 'extract' | 'pii';

interface ExtractResult { _document: string; [key: string]: unknown; }

export default function ExportPage() { return <AuthGate><ExportInner /></AuthGate>; }

function ExportInner() {
  const { collections }               = useCollections();
  const [tab,           setTab]        = useState<Tab>('export');
  const [schemaColId,   setSchemaColId] = useState<string | undefined>();
  const [fields,        setFields]      = useState<(SchemaField & { id: string })[]>([
    { id: generateId(), key: 'title',  type: 'string', description: 'Document or contract title' },
    { id: generateId(), key: 'date',   type: 'date',   description: 'Key date or effective date' },
    { id: generateId(), key: 'amount', type: 'number', description: 'Any monetary amount or value' },
  ]);
  const [extracting,    setExtracting]  = useState(false);
  const [results,       setResults]     = useState<ExtractResult[] | null>(null);
  const [extractError,  setExtractError]= useState('');

  const addField    = () => setFields((p) => [...p, { id: generateId(), key: '', type: 'string' }]);
  const removeField = (id: string) => setFields((p) => p.filter((f) => f.id !== id));
  const updateField = (id: string, patch: Partial<SchemaField>) =>
    setFields((p) => p.map((f) => f.id === id ? { ...f, ...patch } : f));

  const runExtraction = async () => {
    if (!schemaColId) { toast.error('Select a collection first'); return; }
    const valid = fields.filter((f) => f.key.trim());
    if (!valid.length) { toast.error('Add at least one field'); return; }
    setExtracting(true); setExtractError(''); setResults(null);
    try {
      const res  = await fetch('/api/schema-extract', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ collectionId: schemaColId, schema: valid.map(({ key, type, description }) => ({ key, type, description })) }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setExtractError('AI quota reached. Please wait a few minutes and try again.'); if (data.partial?.length) setResults(data.partial); return;
      }
      if (!res.ok) throw new Error(data.error ?? 'Extraction failed');
      setResults(data.results);
      toast.success(`Extracted from ${data.count} document(s)`);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Extraction failed');
      toast.error('Extraction failed');
    } finally { setExtracting(false); }
  };

  const download = (type: 'csv'|'json') => {
    if (!results) return;
    if (type === 'csv') {
      const csv = [
        ['Document', ...fields.filter((f) => f.key).map((f) => f.key)].join(','),
        ...results.map((r) => [r._document, ...fields.filter((f) => f.key).map((f) => `"${String(r[f.key] ?? '').replace(/"/g, '""')}"`)] .join(',')),
      ].join('\n');
      const a = document.createElement('a'); a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`; a.download = 'extracted.csv'; a.click();
    } else {
      const a = document.createElement('a'); a.href = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(results, null, 2))}`; a.download = 'extracted.json'; a.click();
    }
    toast.success('Downloaded');
  };

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'export',  label: 'Quick Export',       icon: Download },
    { id: 'extract', label: 'Schema Extraction',  icon: Braces   },
    { id: 'pii',     label: 'PII Scanner',         icon: Shield   },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-7">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Export & Extract</h1>
        <p className="text-sm text-text-muted mt-0.5">Download data, extract structured fields, and scan for PII</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl border border-border bg-bg-secondary/40 p-1 mb-6 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === id ? 'bg-blue-600 text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Export tab */}
      {tab === 'export' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: FileText,      title: 'All Documents',  desc: 'Full document index as CSV', action: () => { window.location.href = '/api/export/documents'; toast.success('Downloading…'); }, label: 'Download CSV' },
            { icon: Package,       title: 'Collections',    desc: 'All collections with metadata as JSON', action: () => { window.location.href = '/api/export/collections'; toast.success('Downloading…'); }, label: 'Download JSON' },
            { icon: MessageSquare, title: 'Chat Export',    desc: 'Export chat sessions as Markdown', action: () => { window.location.href = '/chat'; }, label: 'Go to Chat' },
            { icon: Database,      title: 'Schema Report',  desc: 'Run extraction to generate structured CSV/JSON', action: () => setTab('extract'), label: 'Schema Extract →' },
            { icon: Shield,        title: 'PII Report',     desc: 'Scan documents for sensitive data', action: () => setTab('pii'), label: 'Open Scanner →' },
          ].map(({ icon: Icon, title, desc, action, label: lbl }) => (
            <div key={title} className="glass rounded-2xl p-5 card-glow">
              <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center mb-3">
                <Icon className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-sm font-semibold mb-1">{title}</p>
              <p className="text-xs text-text-muted mb-4 leading-relaxed">{desc}</p>
              <button onClick={action}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-bg-secondary text-text-secondary text-xs font-medium hover:bg-bg-hover hover:border-blue-500/25 transition-colors">
                <Download className="w-3.5 h-3.5" />{lbl}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Schema Extraction tab */}
      {tab === 'extract' && (
        <div>
          <div className="glass rounded-2xl p-6 mb-5">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
                <Braces className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Schema-Driven Batch Extraction</p>
                <p className="text-xs text-text-muted mt-0.5">Define a JSON schema. AI extracts those exact fields from every document in the chosen collection.</p>
              </div>
            </div>

            <div className="mb-5">
              <p className="text-xs font-medium text-text-secondary mb-2">Target Collection</p>
              <CollectionPicker collections={collections} value={schemaColId} onChange={setSchemaColId} placeholder="Choose collection…" />
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-text-secondary">Field Schema</p>
                <button onClick={addField} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  <Plus className="w-3 h-3" />Add field
                </button>
              </div>
              <div className="space-y-2">
                {fields.map((f) => (
                  <div key={f.id} className="grid grid-cols-[1fr_100px_1fr_32px] gap-2 items-center">
                    <input value={f.key} onChange={(e) => updateField(f.id, { key: e.target.value })} placeholder="Field name"
                      className="bg-bg-secondary border border-border rounded-lg px-3 py-2 text-xs placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition" />
                    <select value={f.type} onChange={(e) => updateField(f.id, { type: e.target.value as SchemaField['type'] })}
                      className="bg-bg-secondary border border-border rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-blue-500/50 transition">
                      {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input value={f.description ?? ''} onChange={(e) => updateField(f.id, { description: e.target.value })} placeholder="Description hint…"
                      className="bg-bg-secondary border border-border rounded-lg px-3 py-2 text-xs placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition" />
                    <button onClick={() => removeField(f.id)} className="h-8 w-8 flex items-center justify-center rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={runExtraction} disabled={extracting || !schemaColId}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors">
              {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {extracting ? 'Extracting…' : 'Run Extraction'}
            </button>
          </div>

          {extractError && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{extractError}
            </div>
          )}

          <AnimatePresence>
            {results && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <p className="text-sm font-semibold">Results — {results.length} document{results.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => download('csv')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-text-secondary hover:bg-bg-hover transition-colors">
                      <Download className="w-3.5 h-3.5" />CSV
                    </button>
                    <button onClick={() => download('json')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-text-secondary hover:bg-bg-hover transition-colors">
                      <Database className="w-3.5 h-3.5" />JSON
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-border bg-bg-secondary/30">
                      <th className="px-4 py-3 text-left text-text-muted font-medium">Document</th>
                      {fields.filter((f) => f.key).map((f) => (
                        <th key={f.id} className="px-4 py-3 text-left text-text-muted font-medium capitalize">{f.key}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {results.map((r, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-bg-hover/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-text-primary max-w-[180px] truncate">{r._document}</td>
                          {fields.filter((f) => f.key).map((f) => (
                            <td key={f.id} className="px-4 py-3 text-text-secondary max-w-[160px] truncate">
                              {r[f.key] == null ? <span className="text-text-muted italic">—</span> : String(r[f.key])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* PII Scanner tab */}
      {tab === 'pii' && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold">PII Detection & Redaction</p>
              <p className="text-xs text-text-muted mt-0.5">
                Paste any text to scan for emails, phone numbers, SSNs, credit cards, passport numbers, and more. Get a redacted version instantly.
              </p>
            </div>
          </div>
          <PIIScanner />
        </div>
      )}
    </div>
  );
}
