'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  BarChart2, FileText, Layers, Database, RefreshCw,
  TrendingUp, MessageSquare, FolderOpen, Clock,
  Zap, AlertCircle, CheckCircle2, ArrowUp, ArrowDown,
} from 'lucide-react';
import AuthGate from '@/components/app/AuthGate';
import { formatBytes } from '@/lib/utils';

interface Stats {
  totalDocuments: number; readyDocuments: number; errorDocuments: number; processingDocuments: number;
  totalChunks: number; totalSize: number; totalCollections: number; totalSessions: number;
  byCollection: { id: string; name: string; docCount: number; chunkCount: number; size: number }[];
  recentDocs: { id: string; name: string; status: string; createdAt: string; size: number }[];
  docsByDay: { date: string; count: number }[];
}

function MiniBar({ value, max, color = 'bg-accent' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-bg-secondary overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function SparkLine({ data }: { data: number[] }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 120; const h = 36; const pad = 2;
  const pts = data.map((v, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - ((v / max) * (h - pad * 2));
    return `${x},${y}`;
  });
  const area = `M${pts[0]} ` + pts.slice(1).map(p => `L${p}`).join(' ') + ` L${w - pad},${h} L${pad},${h} Z`;
  const line = `M${pts[0]} ` + pts.slice(1).map(p => `L${p}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <path d={area} fill="url(#sparkGrad)" opacity="0.3" />
      <path d={line} fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function BarChart({ data, max, color = 'bg-accent' }: { data: { label: string; value: number }[]; max: number; color?: string }) {
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map(({ label, value }) => {
        const pct = max > 0 ? (value / max) * 100 : 0;
        return (
          <div key={label} className="flex flex-col items-center gap-1 flex-1 group">
            <div className="relative w-full flex items-end" style={{ height: '72px' }}>
              <div
                className={`w-full rounded-t-md ${color} transition-all duration-500 opacity-80 group-hover:opacity-100`}
                style={{ height: `${Math.max(pct, 2)}%` }}
                title={`${label}: ${value}`}
              />
            </div>
            <span className="text-[9px] text-text-muted truncate w-full text-center">{label.slice(-3)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    try {
      const [docsRes, collRes, sessRes] = await Promise.all([
        fetch('/api/documents'),
        fetch('/api/collections'),
        fetch('/api/chat/sessions'),
      ]);
      const [docsData, collData, sessData] = await Promise.all([
        docsRes.json(), collRes.json(), sessRes.json(),
      ]);

      const documents = docsData.documents || [];
      const collections = collData.collections || [];
      const sessions = sessData.sessions || [];

      // Build by-day (last 14 days)
      const dayMap: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        dayMap[d.toISOString().slice(0, 10)] = 0;
      }
      documents.forEach((d: { createdAt: string }) => {
        const k = d.createdAt?.slice(0, 10);
        if (k && k in dayMap) dayMap[k]++;
      });

      interface DocItem { collectionId: string; chunkCount: number; size: number; status: string; createdAt: string; }
      interface CollItem { id: string; name: string; }
      const byCollection = (collections as CollItem[]).map((c) => {
        const colDocs = (documents as DocItem[]).filter(d => d.collectionId === c.id);
        return {
          id: c.id, name: c.name,
          docCount: colDocs.length,
          chunkCount: colDocs.reduce((s, d) => s + (d.chunkCount || 0), 0),
          size: colDocs.reduce((s, d) => s + (d.size || 0), 0),
        };
      }).sort((a, b) => b.chunkCount - a.chunkCount);

      setStats({
        totalDocuments: documents.length,
        readyDocuments: documents.filter((d: { status: string }) => d.status === 'ready').length,
        errorDocuments: documents.filter((d: { status: string }) => d.status === 'error').length,
        processingDocuments: documents.filter((d: { status: string }) => d.status === 'processing').length,
        totalChunks: documents.reduce((s: number, d: { chunkCount: number }) => s + (d.chunkCount || 0), 0),
        totalSize: documents.reduce((s: number, d: { size: number }) => s + (d.size || 0), 0),
        totalCollections: collections.length,
        totalSessions: sessions.length,
        byCollection,
        recentDocs: [...documents].sort((a: { createdAt: string }, b: { createdAt: string }) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
        docsByDay: Object.entries(dayMap).map(([date, count]) => ({ date, count })),
      });
      setLastRefresh(new Date());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const maxDay = stats ? Math.max(...stats.docsByDay.map(d => d.count), 1) : 1;
  const maxColl = stats ? Math.max(...stats.byCollection.map(c => c.chunkCount), 1) : 1;
  const sparkData = stats?.docsByDay.map(d => d.count) ?? [];
  const healthPct = stats && stats.totalDocuments > 0 ? Math.round((stats.readyDocuments / stats.totalDocuments) * 100) : 0;

  return (
    <AuthGate>
      <div className="min-h-screen pb-24 lg:pb-8">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-mono font-bold tracking-widest text-text-muted">WORKSPACE ANALYTICS</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">Intelligence Dashboard</h1>
              <p className="mt-1 text-sm text-text-secondary">
                Real-time metrics across your entire DocuMind workspace
              </p>
            </div>
            <button onClick={load} className="flex items-center gap-2 rounded-xl border border-border bg-bg-card px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:border-border/80 transition-colors">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {loading && !stats ? (
            <div className="flex items-center justify-center py-32">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                <p className="text-sm text-text-muted">Loading analytics…</p>
              </div>
            </div>
          ) : stats ? (
            <>
              {/* KPI grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: 'Total Documents', value: stats.totalDocuments, icon: FileText, color: 'text-accent', bg: 'bg-accent/10 border-accent/20', spark: true },
                  { label: 'Knowledge Chunks', value: stats.totalChunks.toLocaleString(), icon: Layers, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20', spark: false },
                  { label: 'Collections', value: stats.totalCollections, icon: FolderOpen, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', spark: false },
                  { label: 'Chat Sessions', value: stats.totalSessions, icon: MessageSquare, color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20', spark: false },
                ].map(({ label, value, icon: Icon, color, bg, spark }) => (
                  <div key={label} className="glass rounded-2xl p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${bg}`}>
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      {spark && <SparkLine data={sparkData} />}
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${color}`}>{value}</p>
                      <p className="text-xs text-text-muted mt-0.5">{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Health + Storage row */}
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Index health */}
                <div className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold">Index Health</h3>
                    <span className={`text-xs font-bold ${healthPct >= 80 ? 'text-success' : healthPct >= 50 ? 'text-warning' : 'text-danger'}`}>{healthPct}%</span>
                  </div>
                  <div className="relative h-24 w-24 mx-auto mb-4">
                    <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-border)" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.5" fill="none"
                        stroke={healthPct >= 80 ? 'var(--color-success)' : healthPct >= 50 ? '#f59e0b' : 'var(--color-danger)'}
                        strokeWidth="3" strokeLinecap="round"
                        strokeDasharray={`${healthPct} 100`} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">{healthPct}%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: 'Ready', count: stats.readyDocuments, color: 'bg-success' },
                      { label: 'Processing', count: stats.processingDocuments, color: 'bg-accent' },
                      { label: 'Errors', count: stats.errorDocuments, color: 'bg-danger' },
                    ].map(({ label, count, color }) => (
                      <div key={label} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-text-secondary">
                          <span className={`h-1.5 w-1.5 rounded-full ${color}`} /> {label}
                        </span>
                        <span className="font-semibold text-text-primary">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Storage */}
                <div className="glass rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Database className="h-4 w-4 text-accent" />
                    <h3 className="text-sm font-bold">Storage</h3>
                  </div>
                  <p className="text-3xl font-bold mb-1">{formatBytes(stats.totalSize)}</p>
                  <p className="text-xs text-text-muted mb-4">across {stats.totalDocuments} documents</p>
                  <div className="space-y-2">
                    {stats.byCollection.slice(0, 4).map(c => (
                      <div key={c.id} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="truncate text-text-secondary max-w-[120px]">{c.name}</span>
                          <span className="text-text-muted shrink-0 ml-2">{formatBytes(c.size)}</span>
                        </div>
                        <MiniBar value={c.size} max={stats.totalSize} color="bg-blue-400" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upload velocity */}
                <div className="glass rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    <h3 className="text-sm font-bold">Upload Activity</h3>
                  </div>
                  <p className="text-xs text-text-muted mb-3">Documents added (last 14 days)</p>
                  <BarChart
                    data={stats.docsByDay.map(d => ({
                      label: new Date(d.date).toLocaleDateString([], { weekday: 'short' }),
                      value: d.count,
                    }))}
                    max={maxDay}
                    color="bg-accent"
                  />
                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-[11px]">
                    <span className="text-text-muted">Total this period</span>
                    <span className="font-bold text-accent">{stats.docsByDay.reduce((s, d) => s + d.count, 0)} docs</span>
                  </div>
                </div>
              </div>

              {/* Collections breakdown */}
              {stats.byCollection.length > 0 && (
                <div className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-accent" /> Collection Breakdown
                    </h3>
                    <Link href="/collections" className="text-xs text-accent hover:underline">Manage →</Link>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="pb-2 text-left font-semibold text-text-muted">Collection</th>
                          <th className="pb-2 text-right font-semibold text-text-muted">Docs</th>
                          <th className="pb-2 text-right font-semibold text-text-muted">Chunks</th>
                          <th className="pb-2 text-right font-semibold text-text-muted">Size</th>
                          <th className="pb-2 pl-4 text-left font-semibold text-text-muted w-32">Coverage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {stats.byCollection.map(c => (
                          <tr key={c.id} className="group hover:bg-bg-hover/30 transition-colors">
                            <td className="py-2.5">
                              <Link href={`/documents?collectionId=${c.id}`} className="font-medium text-text-primary group-hover:text-accent transition-colors hover:underline">
                                {c.name}
                              </Link>
                            </td>
                            <td className="py-2.5 text-right text-text-secondary">{c.docCount}</td>
                            <td className="py-2.5 text-right text-text-secondary">{c.chunkCount.toLocaleString()}</td>
                            <td className="py-2.5 text-right text-text-muted">{formatBytes(c.size)}</td>
                            <td className="py-2.5 pl-4">
                              <MiniBar value={c.chunkCount} max={maxColl} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recent activity */}
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-accent" /> Recent Documents
                  </h3>
                  <Link href="/documents" className="text-xs text-accent hover:underline">View all →</Link>
                </div>
                {stats.recentDocs.length === 0 ? (
                  <div className="py-8 text-center">
                    <FileText className="h-8 w-8 text-text-muted opacity-30 mx-auto mb-2" />
                    <p className="text-sm text-text-muted">No documents yet</p>
                    <Link href="/documents" className="mt-2 inline-flex items-center gap-1.5 text-xs text-accent hover:underline">
                      Upload your first document →
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {stats.recentDocs.map(doc => (
                      <div key={doc.id} className="flex items-center gap-3 py-2.5 hover:bg-bg-hover/30 -mx-2 px-2 rounded-lg transition-colors group">
                        <div className={`h-2 w-2 rounded-full shrink-0 ${doc.status === 'ready' ? 'bg-success' : doc.status === 'error' ? 'bg-danger' : 'bg-accent animate-pulse'}`} />
                        <span className="flex-1 min-w-0 truncate text-xs text-text-primary">{doc.name}</span>
                        <span className="text-[10px] text-text-muted shrink-0">{formatBytes(doc.size)}</span>
                        <span className="text-[10px] text-text-muted shrink-0">{new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { href: '/documents', icon: FileText, label: 'Upload Documents', desc: 'Add PDFs, notes, code files', color: 'text-accent bg-accent/10 border-accent/20' },
                  { href: '/chat', icon: MessageSquare, label: 'Start Chatting', desc: 'Ask questions about your docs', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
                  { href: '/search', icon: Zap, label: 'Semantic Search', desc: 'Find exact passages instantly', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
                ].map(({ href, icon: Icon, label, desc, color }) => (
                  <Link key={href} href={href} className="glass rounded-xl p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform group">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold group-hover:text-accent transition-colors">{label}</p>
                      <p className="text-[11px] text-text-muted">{desc}</p>
                    </div>
                  </Link>
                ))}
              </div>

              <p className="text-center text-[10px] text-text-muted">
                Last updated {lastRefresh.toLocaleTimeString()} · Auto-refreshes every 30s
              </p>
            </>
          ) : null}
        </div>
      </div>
    </AuthGate>
  );
}
