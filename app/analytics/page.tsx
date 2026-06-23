'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Activity, BarChart3, BrainCircuit, CheckCircle2,
  Database, FileText, FolderOpen, Layers, RefreshCw,
  AlertCircle, Clock, Zap, TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import AuthGate from '@/components/app/AuthGate';
import { formatBytes, relativeTime } from '@/lib/utils';
import { DocumentMeta } from '@/lib/types';

interface OverviewData {
  totalDocs: number; readyDocs: number; processingDocs: number; errorDocs: number;
  totalChunks: number; totalSizeBytes: number; totalCollections: number;
  storageMode: 'local' | 'postgres'; aiEnabled: boolean;
}
interface CollectionStat { id: string; name: string; docs: number; chunks: number; size: number; ready: number; error: number; }
interface TypeBreakdown { ext: string; count: number; }
interface StatusBreakdown { status: string; count: number; }
interface Analytics {
  overview: OverviewData;
  collectionStats: CollectionStat[];
  typeBreakdown: TypeBreakdown[];
  statusBreakdown: StatusBreakdown[];
  recent: DocumentMeta[];
}

const CHART_COLORS = ['#7c3aed','#06b6d4','#34d399','#f59e0b','#f87171','#a78bfa','#67e8f9'];
const PIE_COLORS  = ['#7c3aed','#06b6d4','#34d399','#f59e0b','#f87171'];

function StatCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="glass rounded-xl p-5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium text-text-secondary mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-text-muted mt-0.5 font-mono">{sub}</p>}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs border border-border">
      <p className="font-semibold text-text-primary mb-1">{label}</p>
      {payload.map((p: {name:string;value:number;color:string}, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-mono">{p.value}</span></p>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) { setData(await res.json()); setLastRefresh(new Date()); }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const o = data?.overview;

  return (
    <AuthGate>
      <div className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-mono font-bold tracking-widest text-text-muted">KNOWLEDGE BASE</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Analytics</h1>
              <p className="mt-2 text-sm text-text-secondary max-w-2xl">
                Real-time insights into your document store — chunks indexed, collection usage, file types, and storage health.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted">
                Updated {relativeTime(lastRefresh.toISOString())}
              </span>
              <button
                onClick={load}
                disabled={loading}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-bg-card px-3 text-sm text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </header>

          {/* Overview stat cards */}
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard icon={FileText}    label="Total documents"   value={o?.totalDocs ?? '—'}       sub={`${o?.readyDocs ?? 0} ready`}               color="text-violet-400 bg-violet-500/10" />
            <StatCard icon={Layers}      label="Chunks indexed"    value={o?.totalChunks ?? '—'}      sub="searchable passages"                        color="text-cyan-400 bg-cyan-500/10" />
            <StatCard icon={FolderOpen}  label="Collections"       value={o?.totalCollections ?? '—'} sub="isolated workspaces"                        color="text-emerald-400 bg-emerald-500/10" />
            <StatCard icon={Database}    label="Storage"           value={o ? formatBytes(o.totalSizeBytes) : '—'} sub={o?.storageMode === 'postgres' ? 'Postgres + pgvector' : 'Local JSON store'} color="text-amber-400 bg-amber-500/10" />
            <StatCard icon={BrainCircuit} label="AI engine"        value={o?.aiEnabled ? 'Gemini' : 'Local'} sub={o?.aiEnabled ? 'gemini-2.0-flash' : 'no API key set'} color="text-pink-400 bg-pink-500/10" />
          </section>

          {/* Status indicators */}
          {o && (
            <section className="grid sm:grid-cols-3 gap-3">
              <div className="glass rounded-xl px-5 py-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xl font-bold text-emerald-400">{o.readyDocs}</p>
                  <p className="text-xs text-text-secondary">Documents ready for chat</p>
                </div>
              </div>
              <div className="glass rounded-xl px-5 py-4 flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-xl font-bold text-amber-400">{o.processingDocs}</p>
                  <p className="text-xs text-text-secondary">Currently processing</p>
                </div>
              </div>
              <div className="glass rounded-xl px-5 py-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <p className="text-xl font-bold text-red-400">{o.errorDocs}</p>
                  <p className="text-xs text-text-secondary">Failed ingestion</p>
                </div>
              </div>
            </section>
          )}

          {/* Charts row */}
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Docs + chunks per collection */}
            <div className="glass rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-violet-400" />
                <h2 className="font-semibold text-sm">Documents &amp; chunks per collection</h2>
              </div>
              {(data?.collectionStats?.length ?? 0) === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-text-muted">No collections yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data!.collectionStats} margin={{ top: 4, right: 8, left: -12, bottom: 4 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 10, color: 'var(--text-muted)' }} />
                    <Bar dataKey="docs"   name="Documents" fill="#7c3aed" radius={[4,4,0,0]} />
                    <Bar dataKey="chunks" name="Chunks"    fill="#06b6d4" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* File type pie */}
            <div className="glass rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h2 className="font-semibold text-sm">Document types breakdown</h2>
              </div>
              {(data?.typeBreakdown?.length ?? 0) === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-text-muted">No documents yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data!.typeBreakdown} dataKey="count" nameKey="ext" cx="50%" cy="50%" outerRadius={80} label={({ ext, percent }) => `${ext} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {data!.typeBreakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number, name: string) => [`${val} files`, name]} />
                    <Legend wrapperStyle={{ fontSize: 10, color: 'var(--text-muted)' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Collection size bar */}
          {(data?.collectionStats?.length ?? 0) > 0 && (
            <div className="glass rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h2 className="font-semibold text-sm">Storage size per collection (bytes)</h2>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data!.collectionStats} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} tickFormatter={(v) => formatBytes(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} width={90} />
                  <Tooltip content={<CustomTooltip />} formatter={(v: number) => formatBytes(v)} />
                  <Bar dataKey="size" name="Size" radius={[0,4,4,0]}>
                    {data!.collectionStats.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent documents */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="border-b border-border px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h2 className="font-semibold text-sm">Recent documents</h2>
              </div>
              <Link href="/documents" className="text-xs text-accent hover:underline">View all →</Link>
            </div>
            {(data?.recent?.length ?? 0) === 0 ? (
              <div className="p-10 text-center text-sm text-text-muted">No documents uploaded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="bg-bg-secondary/60 text-xs text-text-muted uppercase tracking-wide">
                    <tr>
                      <th className="px-5 py-3 font-medium">Document</th>
                      <th className="px-5 py-3 font-medium">Chunks</th>
                      <th className="px-5 py-3 font-medium">Size</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data!.recent.map((doc) => (
                      <tr key={doc.id} className="border-t border-border/60 hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3 font-medium truncate max-w-[240px]">{doc.name}</td>
                        <td className="px-5 py-3 text-text-secondary font-mono text-xs">{doc.chunkCount}</td>
                        <td className="px-5 py-3 text-text-secondary">{formatBytes(doc.size)}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium
                            ${doc.status === 'ready' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            : doc.status === 'processing' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                            : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-text-muted text-xs">{relativeTime(doc.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Storage info card */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="glass rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-sm">Storage mode</h3>
              </div>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                o?.storageMode === 'postgres'
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
              }`}>
                {o?.storageMode === 'postgres' ? '● Postgres + pgvector' : '● Local JSON store (dev)'}
              </div>
              <p className="mt-2 text-xs text-text-muted">
                {o?.storageMode === 'postgres'
                  ? 'Production mode — all data in your Postgres database with vector search via pgvector.'
                  : 'Development mode — data in ./data/ directory. Set DATABASE_URL for production.'}
              </p>
            </div>
            <div className="glass rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <BrainCircuit className="w-4 h-4 text-violet-400" />
                <h3 className="font-semibold text-sm">AI configuration</h3>
              </div>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                o?.aiEnabled
                  ? 'bg-violet-500/10 border-violet-500/25 text-violet-400'
                  : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
              }`}>
                {o?.aiEnabled ? '● Gemini 2.0 Flash + text-embedding-004' : '● Local fallback embeddings (no key)'}
              </div>
              <p className="mt-2 text-xs text-text-muted">
                {o?.aiEnabled
                  ? 'GEMINI_API_KEY set — using 768-dim semantic embeddings and full AI answers.'
                  : 'Add GEMINI_API_KEY to .env.local for AI answers and high-quality embeddings.'}
              </p>
            </div>
          </div>

        </div>
      </div>
    </AuthGate>
  );
}
