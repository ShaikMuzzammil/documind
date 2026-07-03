'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  AlertCircle, BarChart3, CheckCircle2, FileText, FolderOpen,
  Layers, RefreshCw, TrendingUp,
} from 'lucide-react';
import AuthGate from '@/components/app/AuthGate';
import { WorkspaceStats } from '@/lib/analytics';
import { relativeTime } from '@/lib/utils';

const COLORS = ['#6366f1', '#22d3ee', '#34d399', '#f59e0b', '#f87171', '#a78bfa'];

function fmt(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

interface Capabilities {
  aiAnswers: boolean;
  database: string;
  email: boolean;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [caps, setCaps] = useState<Capabilities | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Could not load workspace data.');
      const data = await res.json();
      setStats(data.stats);
      setCaps(data.capabilities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <AuthGate>
      <div className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-mono font-bold tracking-widest text-text-muted">WORKSPACE</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">Analytics</h1>
              <p className="mt-1 text-sm text-text-secondary">Workspace health and document insights</p>
            </div>
            <button onClick={load} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-bg-card px-3 text-sm text-text-secondary hover:text-text-primary transition-colors">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </header>

          {error && (
            <div className="flex gap-2 rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {loading && !stats ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => <div key={i} className="glass animate-pulse rounded-xl p-6 h-28" />)}
            </div>
          ) : stats ? (
            <>
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { Icon: FileText, label: 'Documents', value: stats.totals.documents, sub: stats.totals.readyDocuments + ' ready' },
                  { Icon: FolderOpen, label: 'Collections', value: stats.totals.collections, sub: 'active workspaces' },
                  { Icon: Layers, label: 'Chunks', value: stats.totals.chunks, sub: 'semantic segments' },
                  { Icon: TrendingUp, label: 'Storage', value: fmt(stats.totals.bytes), sub: 'indexed content' },
                ].map(({ Icon, label, value, sub }) => (
                  <div key={label} className="glass rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-accent-soft border border-accent/20 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-accent" />
                      </div>
                      <span className="text-xs text-text-muted">{label}</span>
                    </div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-text-muted mt-0.5">{sub}</p>
                  </div>
                ))}
              </section>

              {caps && (
                <section className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: 'Answer Engine', ok: caps.aiAnswers, okText: 'Configured and ready', failText: 'Add LLM_API_KEY to enable answers' },
                    { label: 'Vector Database', ok: caps.database === 'postgres', okText: 'PostgreSQL + pgvector', failText: 'Using local JSON store (add DATABASE_URL for production)' },
                    { label: 'Welcome Email', ok: caps.email, okText: 'Resend configured', failText: 'Optional — add RESEND_API_KEY to enable' },
                  ].map(({ label, ok, okText, failText }) => (
                    <div key={label} className={`glass rounded-xl p-4 flex items-start gap-3 border ${ok ? 'border-success/20 bg-success/5' : 'border-yellow-500/20 bg-yellow-500/5'}`}>
                      {ok ? <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" /> : <AlertCircle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />}
                      <div>
                        <p className="text-sm font-semibold">{label}</p>
                        <p className={`text-xs mt-0.5 ${ok ? 'text-success' : 'text-yellow-400'}`}>{ok ? okText : failText}</p>
                      </div>
                    </div>
                  ))}
                </section>
              )}

              <section className="grid gap-6 lg:grid-cols-2">
                <div className="glass rounded-xl p-5">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-accent" /> Documents per collection
                  </h2>
                  {stats.collections.length === 0 ? (
                    <p className="text-sm text-text-muted py-8 text-center">No collections yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={stats.collections} margin={{ left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: '#161922', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} labelStyle={{ color: '#e6e9ef' }} itemStyle={{ color: '#a7adba' }} />
                        <Bar dataKey="documents" name="Docs" fill="#6366f1" radius={[4,4,0,0]} />
                        <Bar dataKey="chunks" name="Chunks" fill="#22d3ee" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="glass rounded-xl p-5">
                  <h2 className="font-semibold mb-4">File types</h2>
                  {stats.fileTypes.length === 0 ? (
                    <p className="text-sm text-text-muted py-8 text-center">No documents yet</p>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <ResponsiveContainer width={160} height={160}>
                        <PieChart>
                          <Pie data={stats.fileTypes} dataKey="count" nameKey="type" innerRadius={45} outerRadius={72} paddingAngle={3}>
                            {stats.fileTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#161922', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2">
                        {stats.fileTypes.map((ft, i) => (
                          <div key={ft.type} className="flex items-center gap-2 text-sm">
                            <span className="inline-block h-3 w-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                            <span className="text-text-secondary font-mono">.{ft.type}</span>
                            <span className="ml-auto pl-4 font-semibold">{ft.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {stats.recentDocuments.length > 0 && (
                <section className="glass rounded-xl overflow-hidden">
                  <div className="border-b border-border px-5 py-4"><h2 className="font-semibold">Recent documents</h2></div>
                  <div className="divide-y divide-border/60">
                    {stats.recentDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 px-5 py-3">
                        <FileText className="h-4 w-4 text-text-muted shrink-0" />
                        <span className="flex-1 text-sm truncate">{doc.name}</span>
                        <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${doc.status === 'ready' ? 'bg-success/10 text-success' : doc.status === 'processing' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-danger/10 text-danger'}`}>{doc.status}</span>
                        <span className="text-xs text-text-muted shrink-0">{relativeTime(doc.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : null}
        </div>
      </div>
    </AuthGate>
  );
}
