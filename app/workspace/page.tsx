'use client';

import { useCallback, useEffect, useState } from 'react';
import AuthGate    from '@/components/app/AuthGate';
import StatsCard   from '@/components/app/StatsCard';
import RecentActivity, { ActivityEvent } from '@/components/app/RecentActivity';
import { AnalyticsSkeleton } from '@/components/app/LoadingSkeleton';
import { useUser } from '@/lib/use-user';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import {
  FileText, FolderOpen, BarChart3, Zap, Database, Cpu,
  AlertTriangle, CheckCircle2, RefreshCw, MessageSquare,
  ArrowRight, Upload,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface WorkspaceData {
  user: { name: string; email: string };
  overview: {
    totalDocuments: number; totalCollections: number; totalChunks: number; totalSize: string;
    readyDocuments: number; errorDocuments: number; healthyCollections: number;
    degradedCollections: number; aiEnabled: boolean; dbEnabled: boolean;
  };
  collectionHealth: { id: string; name: string; docCount: number; healthScore: number; health: string; sizeFmt: string }[];
  timeSeries:       { month: string; docs: number; chunks: number }[];
  recentDocuments:  { id: string; name: string; status: string; sizeLabel: string; timeAgo: string; collection: string }[];
  activities:       ActivityEvent[];
}

export default function WorkspacePage() { return <AuthGate><WorkspaceInner /></AuthGate>; }

function WorkspaceInner() {
  const { user } = useUser();
  const [data,    setData]    = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/workspace');
      if (res.ok) setData(await res.json());
    } catch { /**/ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const hour    = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="max-w-6xl mx-auto px-4 py-7">
      {/* Header */}
      <div className="flex items-start justify-between mb-7 gap-4">
        <div>
          <h1 className="text-2xl font-bold">{greeting}, {firstName} 👋</h1>
          <p className="text-sm text-text-muted mt-1">Here's what's happening in your workspace.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={load}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-bg-hover transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link href="/documents"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors">
            <Upload className="w-3.5 h-3.5" />Upload
          </Link>
        </div>
      </div>

      {loading && <AnalyticsSkeleton />}

      {!loading && data && (
        <div className="space-y-6">
          {/* Quick action banner — show if empty */}
          {data.overview.totalDocuments === 0 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="cta-gradient rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Your workspace is empty</p>
                <p className="text-xs text-text-muted mt-0.5">Create a collection and upload your first document to get started.</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link href="/collections"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-text-secondary text-xs font-medium hover:bg-bg-hover transition-colors">
                  <FolderOpen className="w-3.5 h-3.5" />New Collection
                </Link>
                <Link href="/documents"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors">
                  <Upload className="w-3.5 h-3.5" />Upload Files
                </Link>
              </div>
            </motion.div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatsCard icon={FileText}   label="Documents"   value={data.overview.totalDocuments}
              sub={`${data.overview.readyDocuments} ready`} color="blue" />
            <StatsCard icon={FolderOpen} label="Collections" value={data.overview.totalCollections}
              sub={`${data.overview.healthyCollections} healthy`} color="emerald" />
            <StatsCard icon={BarChart3}  label="Chunks"      value={data.overview.totalChunks.toLocaleString()}
              sub="semantic segments" color="amber" />
            <StatsCard icon={Database}   label="Storage"     value={data.overview.totalSize}
              sub="indexed" color="blue" />
          </div>

          {/* Error alert */}
          {data.overview.errorDocuments > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-300 flex-1">
                {data.overview.errorDocuments} document{data.overview.errorDocuments !== 1 ? 's' : ''} failed to index.
              </p>
              <Link href="/documents" className="text-xs text-amber-400 hover:underline shrink-0">
                View documents →
              </Link>
            </div>
          )}

          {/* Charts row */}
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Upload activity */}
            <div className="lg:col-span-2 glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold">Upload Activity (6 months)</p>
                <span className="text-xs text-text-muted">Documents per month</span>
              </div>
              {data.timeSeries.some((d) => d.docs > 0) ? (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={data.timeSeries} margin={{ left: -24 }}>
                    <defs>
                      <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#8a96b8' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#8a96b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#0f1726', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }}
                      labelStyle={{ color: '#e4eaf7' }} itemStyle={{ color: '#3b82f6' }}
                    />
                    <Area type="monotone" dataKey="docs" stroke="#2563eb" strokeWidth={2} fill="url(#blueGrad)" name="Documents" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-44 text-sm text-text-muted">No upload history yet</div>
              )}
            </div>

            {/* System status */}
            <div className="glass rounded-2xl p-5">
              <p className="text-sm font-semibold mb-4">System Status</p>
              <div className="space-y-3">
                {[
                  { icon: Cpu,      label: 'AI Engine',    ok: data.overview.aiEnabled,  okText: 'Connected',    failText: 'API key missing' },
                  { icon: Database, label: 'Vector DB',    ok: data.overview.dbEnabled,  okText: 'PostgreSQL',   failText: 'Local JSON store' },
                  { icon: Zap,      label: 'Streaming',    ok: true,                     okText: 'SSE active',   failText: '' },
                  { icon: CheckCircle2, label: 'Auth',     ok: true,                     okText: 'HMAC sessions', failText: '' },
                ].map(({ icon: Icon, label, ok, okText, failText }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${ok ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{label}</p>
                      <p className={`text-[10px] ${ok ? 'text-emerald-400' : 'text-amber-400'}`}>{ok ? okText : failText}</p>
                    </div>
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${ok ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Collection health */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold">Collection Health</p>
                <Link href="/collections" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {data.collectionHealth.length === 0 ? (
                <p className="text-sm text-text-muted py-6 text-center">No collections yet</p>
              ) : (
                <div className="space-y-2.5">
                  {data.collectionHealth.slice(0, 5).map((c) => (
                    <div key={c.id} className="flex items-center gap-3">
                      <FolderOpen className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <span className="flex-1 text-xs text-text-secondary truncate">{c.name}</span>
                      <span className="text-[10px] text-text-muted">{c.docCount} docs</span>
                      <div className="w-20 h-1.5 rounded-full bg-bg-hover overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${
                          c.health === 'healthy' ? 'bg-emerald-500' : c.health === 'degraded' ? 'bg-amber-500' : 'bg-text-muted'
                        }`} style={{ width: `${c.healthScore}%` }} />
                      </div>
                      <span className={`text-[10px] font-mono w-7 text-right ${
                        c.health === 'healthy' ? 'text-emerald-400' : c.health === 'degraded' ? 'text-amber-400' : 'text-text-muted'
                      }`}>{c.healthScore}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent activity */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold">Recent Activity</p>
                <Link href="/documents" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                  All docs <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <RecentActivity events={data.activities} maxItems={6} compact />
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: '/chat',        icon: MessageSquare, label: 'Start chatting', desc: 'Ask your docs anything' },
              { href: '/documents',   icon: Upload,        label: 'Upload files',   desc: 'Add more documents'    },
              { href: '/export',      icon: BarChart3,     label: 'Extract data',   desc: 'Schema-driven batch'   },
              { href: '/analytics',   icon: BarChart3,     label: 'View analytics', desc: 'Full stats dashboard'  },
            ].map(({ href, icon: Icon, label, desc }) => (
              <Link key={href} href={href}
                className="glass rounded-2xl p-4 hover:border-blue-500/25 transition-all card-glow group">
                <Icon className="w-5 h-5 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-semibold">{label}</p>
                <p className="text-[10px] text-text-muted mt-0.5">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
