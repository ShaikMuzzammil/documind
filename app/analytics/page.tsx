'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, LineChart, Line,
} from 'recharts';
import {
  AlertCircle, BarChart3, CheckCircle2, FileText, FolderOpen,
  Layers, RefreshCw, TrendingUp, Zap, Database, Mail, Activity,
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

interface Capabilities { aiAnswers: boolean; database: string; email: boolean; }

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl border border-border bg-bg-card/95 backdrop-blur px-3 py-2 text-xs shadow-xl">
        <p className="font-medium text-text-primary mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.name === 'Docs' ? '#6366f1' : '#22d3ee' }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [caps, setCaps] = useState<Capabilities | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

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

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, load]);

  // Build activity data from recentDocuments
  const activityData = stats?.recentDocuments
    ? (() => {
        const byDay: Record<string, number> = {};
        stats.recentDocuments.forEach(doc => {
          const day = new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          byDay[day] = (byDay[day] || 0) + 1;
        });
        return Object.entries(byDay).slice(-7).map(([day, count]) => ({ day, count }));
      })()
    : [];

  return (
    <AuthGate>
      <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-mono font-bold tracking-widest text-text-muted">WORKSPACE</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">Analytics</h1>
              <p className="mt-1 text-sm text-text-secondary">Workspace health and document insights</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoRefresh(a => !a)}
                className={`inline-flex items-center gap-1.5 h-9 rounded-lg border px-3 text-xs transition-colors ${autoRefresh ? 'border-accent/30 bg-accent/10 text-accent' : 'border-border bg-bg-card text-text-secondary hover:text-text-primary'}`}
              >
                <Activity className={`h-3.5 w-3.5 ${autoRefresh ? 'animate-pulse' : ''}`} />
                {autoRefresh ? 'Live' : 'Auto-refresh'}
              </button>
              <button onClick={load}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-bg-card px-3 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </header>

          {error && (
            <div className="flex gap-2 rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
            </div>
          )}

          {loading && !stats ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => <div key={i} className="glass animate-pulse rounded-xl p-6 h-28" />)}
            </div>
          ) : stats ? (
            <>
              {/* KPI cards */}
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { Icon: FileText,   label: 'Documents',   value: stats.totals.documents,     sub: stats.totals.readyDocuments + ' ready',  color: 'text-accent' },
                  { Icon: FolderOpen, label: 'Collections', value: stats.totals.collections,    sub: 'active workspaces',                       color: 'text-cyan-400' },
                  { Icon: Layers,     label: 'Chunks',      value: stats.totals.chunks,          sub: 'semantic segments',                       color: 'text-emerald-400' },
                  { Icon: TrendingUp, label: 'Storage',     value: fmt(stats.totals.bytes),      sub: 'indexed content',                         color: 'text-orange-400' },
                ].map(({ Icon, label, value, sub, color }) => (
                  <div key={label} className="glass rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-bg-card border border-border/60 flex items-center justify-center">
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      <span className="text-xs text-text-muted">{label}</span>
                    </div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-text-muted mt-0.5">{sub}</p>
                  </div>
                ))}
              </section>

              {/* Capabilities */}
              {caps && (
                <section className="grid gap-4 sm:grid-cols-3">
                  {[
                    { Icon: Zap,      label: 'Answer Engine',   ok: caps.aiAnswers, okText: 'AI answers enabled', failText: 'Add LLM_API_KEY to Settings' },
                    { Icon: Database, label: 'Vector Database',  ok: caps.database === 'postgres', okText: 'PostgreSQL + pgvector', failText: 'Using local JSON (add DATABASE_URL)' },
                    { Icon: Mail,     label: 'Email Service',    ok: caps.email,    okText: 'Resend configured', failText: 'Optional — add RESEND_API_KEY' },
                  ].map(({ Icon, label, ok, okText, failText }) => (
                    <div key={label} className={`glass rounded-xl p-4 flex items-start gap-3 border ${ok ? 'border-success/20 bg-success/5' : 'border-yellow-500/20 bg-yellow-500/5'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ok ? 'bg-success/15' : 'bg-yellow-500/15'}`}>
                        <Icon className={`h-4 w-4 ${ok ? 'text-success' : 'text-yellow-400'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {ok ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <AlertCircle className="h-3.5 w-3.5 text-yellow-400" />}
                          <p className="text-sm font-semibold">{label}</p>
                        </div>
                        <p className={`text-xs ${ok ? 'text-success' : 'text-yellow-400'}`}>{ok ? okText : failText}</p>
                      </div>
                    </div>
                  ))}
                </section>
              )}

              <section className="grid gap-6 lg:grid-cols-2">
                {/* Documents per collection */}
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
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="documents" name="Docs" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="chunks" name="Chunks" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* File type breakdown */}
                <div className="glass rounded-xl p-5">
                  <h2 className="font-semibold mb-4">File type breakdown</h2>
                  {stats.fileTypes.length === 0 ? (
                    <p className="text-sm text-text-muted py-8 text-center">No documents yet</p>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <ResponsiveContainer width={160} height={160}>
                        <PieChart>
                          <Pie data={stats.fileTypes} dataKey="count" nameKey="type" innerRadius={48} outerRadius={72} paddingAngle={3}>
                            {stats.fileTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#161922', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2 flex-1">
                        {stats.fileTypes.map((ft, i) => (
                          <div key={ft.type} className="flex items-center gap-2 text-sm">
                            <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                            <span className="text-text-secondary font-mono">.{ft.type}</span>
                            <div className="flex-1 h-1 bg-bg-hover rounded-full overflow-hidden mx-2">
                              <div className="h-full rounded-full" style={{ background: COLORS[i % COLORS.length], width: `${Math.round((ft.count / Math.max(...stats.fileTypes.map(f => f.count))) * 100)}%` }} />
                            </div>
                            <span className="font-semibold text-text-primary">{ft.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Activity timeline */}
              {activityData.length > 1 && (
                <div className="glass rounded-xl p-5">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-accent" /> Recent indexing activity
                  </h2>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={activityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: '#161922', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} />
                      <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} name="Docs indexed" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Recent documents */}
              {stats.recentDocuments.length > 0 && (
                <section className="glass rounded-xl overflow-hidden">
                  <div className="border-b border-border px-5 py-4 flex items-center justify-between">
                    <h2 className="font-semibold">Recent documents</h2>
                    <span className="text-xs text-text-muted">{stats.recentDocuments.length} shown</span>
                  </div>
                  <div className="divide-y divide-border/60">
                    {stats.recentDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 px-5 py-3 hover:bg-bg-secondary/30 transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-accent/8 border border-accent/15 flex items-center justify-center">
                          <FileText className="h-3.5 w-3.5 text-accent" />
                        </div>
                        <span className="flex-1 text-sm truncate">{doc.name}</span>
                        <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${doc.status === 'ready' ? 'bg-success/10 text-success' : doc.status === 'processing' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-danger/10 text-danger'}`}>
                          {doc.status}
                        </span>
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
