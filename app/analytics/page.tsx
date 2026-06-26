'use client';

import { useCallback, useEffect, useState } from 'react';
import AuthGate from '@/components/app/AuthGate';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CheckCircle2, AlertCircle, Loader2, BarChart3, RefreshCw, FileText, FolderOpen, Database, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

interface AnalyticsData {
  summary: {
    totalDocuments: number; totalCollections: number; totalChunks: number;
    totalSize: string; readyCount: number; errorCount: number; processingCount: number;
    aiConnected: boolean; dbConnected: boolean;
  };
  typeBreakdown:   { type: string; count: number }[];
  collectionStats: { id: string; name: string; docCount: number; chunkCount: number; sizeLabel: string }[];
  recentDocuments: { id: string; name: string; status: string; chunkCount: number; sizeLabel: string; createdAt: string; collection: string }[];
}

const PALETTE = ['#2563eb','#10b981','#f59e0b','#8b5cf6','#f87171','#06b6d4','#ec4899'];

function StatCard({ icon: Icon, label, value, sub, color = 'blue' }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) {
  const colors: Record<string,string> = {
    blue:    'text-blue-400 bg-blue-500/10 border-blue-500/25',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    amber:   'text-amber-400 bg-amber-500/10 border-amber-500/25',
    red:     'text-red-400 bg-red-500/10 border-red-500/25',
  };
  return (
    <div className="glass rounded-2xl p-5 card-glow">
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm font-medium text-text-secondary mt-0.5">{label}</p>
      {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() { return <AuthGate><AnalyticsInner /></AuthGate>; }

function AnalyticsInner() {
  const [data,    setData]    = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/analytics');
      if (!res.ok) throw new Error('Failed to load analytics');
      setData(await res.json());
    } catch (err) { setError(err instanceof Error ? err.message : 'Error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
      <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
    </div>
  );
  if (error || !data) return (
    <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
      <p className="text-sm text-danger">{error || 'No data'}</p>
    </div>
  );

  const { summary, typeBreakdown, collectionStats, recentDocuments } = data;

  return (
    <div className="max-w-6xl mx-auto px-4 py-7">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-text-muted mt-0.5">Workspace health and document insights</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-bg-card text-text-secondary text-xs font-medium hover:bg-bg-hover transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />Refresh
        </button>
      </div>

      {/* Summary cards */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard icon={FileText}   label="Documents"   value={summary.totalDocuments}   sub={`${summary.readyCount} ready`} color="blue" />
        <StatCard icon={FolderOpen} label="Collections" value={summary.totalCollections}  color="emerald" />
        <StatCard icon={BarChart3}  label="Chunks"      value={summary.totalChunks}       sub="semantic segments" color="amber" />
        <StatCard icon={Database}   label="Storage"     value={summary.totalSize}         color="blue" />
      </motion.div>

      {/* System status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {[
          { icon: Cpu,      label: 'AI Engine',  ok: summary.aiConnected, okText: 'Connected',      failText: 'Key not configured' },
          { icon: Database, label: 'Vector DB',  ok: summary.dbConnected, okText: 'PostgreSQL + pgvector', failText: 'Using local JSON store' },
        ].map(({ icon: Icon, label, ok, okText, failText }) => (
          <div key={label} className={`flex items-center gap-3 rounded-xl border p-4 ${ok ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-amber-500/25 bg-amber-500/5'}`}>
            <Icon className={`w-5 h-5 shrink-0 ${ok ? 'text-emerald-400' : 'text-amber-400'}`} />
            <div className="flex-1">
              <p className="text-sm font-medium">{label}</p>
              <p className={`text-xs ${ok ? 'text-emerald-400' : 'text-amber-400'}`}>{ok ? okText : failText}</p>
            </div>
            {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-amber-400" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Collection bar chart */}
        <div className="glass rounded-2xl p-5">
          <p className="text-sm font-semibold mb-4">Documents per Collection</p>
          {collectionStats.length === 0 ? (
            <p className="text-xs text-text-muted py-8 text-center">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={collectionStats} margin={{ left: -20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8a96b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#8a96b8' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0f1726', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: '#e4eaf7' }} itemStyle={{ color: '#3b82f6' }}
                />
                <Bar dataKey="docCount" fill="#2563eb" radius={[4,4,0,0]} name="Documents" />
                <Bar dataKey="chunkCount" fill="#10b981" radius={[4,4,0,0]} name="Chunks" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* File type pie */}
        <div className="glass rounded-2xl p-5">
          <p className="text-sm font-semibold mb-4">File Types</p>
          {typeBreakdown.length === 0 ? (
            <p className="text-xs text-text-muted py-8 text-center">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={typeBreakdown} dataKey="count" nameKey="type" cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {typeBreakdown.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f1726', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }}
                  itemStyle={{ color: '#e4eaf7' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#8a96b8' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent documents table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold">Recent Documents</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {['Name','Collection','Chunks','Size','Status','Added'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-text-muted font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentDocuments.map((d) => (
                <tr key={d.id} className="border-b border-border/50 hover:bg-bg-hover/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-text-primary max-w-[200px] truncate">{d.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{d.collection}</td>
                  <td className="px-4 py-3 text-text-secondary font-mono">{d.chunkCount}</td>
                  <td className="px-4 py-3 text-text-secondary">{d.sizeLabel}</td>
                  <td className="px-4 py-3">
                    <span className={`px-1.5 py-0.5 rounded font-medium ${
                      d.status === 'ready' ? 'text-emerald-400 bg-emerald-500/10' :
                      d.status === 'error' ? 'text-red-400 bg-red-500/10' :
                      'text-blue-400 bg-blue-500/10'
                    }`}>{d.status}</span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{new Date(d.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {recentDocuments.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">No documents yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
