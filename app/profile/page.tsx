'use client';

import { useCallback, useEffect, useState } from 'react';
import AuthGate from '@/components/app/AuthGate';
import { useUser } from '@/lib/use-user';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { User, BarChart3, FileText, FolderOpen, Database, Cpu, Loader2, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface Stats {
  user:             { id: string; name: string; email: string; memberSince: string };
  stats:            { totalDocuments: number; totalCollections: number; totalChunks: number; totalSize: string; readyDocuments: number; errorDocuments: number; avgChunksPerDoc: number };
  typeDistribution: Record<string, number>;
  monthlyActivity:  Record<string, number>;
  topCollections:   { id: string; name: string; docCount: number; size: string }[];
  capabilities:     { aiEnabled: boolean; dbEnabled: boolean };
}

export default function ProfilePage() { return <AuthGate><ProfileInner /></AuthGate>; }

function ProfileInner() {
  const { user } = useUser();
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/user/stats');
      if (res.ok) setStats(await res.json());
    } catch { /**/ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activityData = stats
    ? Object.entries(stats.monthlyActivity).map(([month, count]) => ({
        month: month.slice(5), count,
      }))
    : [];

  const typeData = stats
    ? Object.entries(stats.typeDistribution).map(([type, count]) => ({ type, count }))
    : [];

  const initials = user?.name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  return (
    <div className="max-w-4xl mx-auto px-4 py-7">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      {loading && (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-blue-400" /></div>
      )}

      {!loading && stats && (
        <div className="space-y-6">
          {/* Profile card */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <span className="text-2xl font-black text-blue-400">{initials}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{stats.user.name}</h2>
              <p className="text-sm text-text-muted">{stats.user.email}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <Calendar className="w-3.5 h-3.5 text-text-muted" />
                <p className="text-xs text-text-muted">
                  Member since {new Date(stats.user.memberSince).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium ${
                stats.capabilities.aiEnabled ? 'border-emerald-500/25 bg-emerald-500/8 text-emerald-400' : 'border-amber-500/25 bg-amber-500/8 text-amber-400'
              }`}>
                <Cpu className="w-3 h-3" />AI {stats.capabilities.aiEnabled ? 'Active' : 'Inactive'}
              </span>
              <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium ${
                stats.capabilities.dbEnabled ? 'border-emerald-500/25 bg-emerald-500/8 text-emerald-400' : 'border-amber-500/25 bg-amber-500/8 text-amber-400'
              }`}>
                <Database className="w-3 h-3" />{stats.capabilities.dbEnabled ? 'PostgreSQL' : 'Local Store'}
              </span>
            </div>
          </motion.div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: FileText,   label: 'Documents',   value: stats.stats.totalDocuments,   sub: `${stats.stats.readyDocuments} ready` },
              { icon: FolderOpen, label: 'Collections', value: stats.stats.totalCollections,  sub: 'total' },
              { icon: BarChart3,  label: 'Chunks',      value: stats.stats.totalChunks,       sub: `avg ${stats.stats.avgChunksPerDoc}/doc` },
              { icon: Database,   label: 'Storage',     value: stats.stats.totalSize,         sub: 'indexed' },
            ].map(({ icon: Icon, label, value, sub }) => (
              <div key={label} className="glass rounded-2xl p-4 card-glow">
                <Icon className="w-4 h-4 text-blue-400 mb-2" />
                <p className="text-xl font-bold">{value}</p>
                <p className="text-xs font-medium text-text-secondary">{label}</p>
                <p className="text-[10px] text-text-muted">{sub}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Monthly activity */}
            <div className="glass rounded-2xl p-5">
              <p className="text-sm font-semibold mb-4">Monthly Upload Activity</p>
              {activityData.some((d) => d.count > 0) ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={activityData} margin={{ left: -24 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#8a96b8' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#8a96b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#0f1726', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }}
                      labelStyle={{ color: '#e4eaf7' }} itemStyle={{ color: '#3b82f6' }}
                    />
                    <Bar dataKey="count" fill="#2563eb" radius={[4,4,0,0]} name="Documents" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[180px] text-sm text-text-muted">No upload activity yet</div>
              )}
            </div>

            {/* File types */}
            <div className="glass rounded-2xl p-5">
              <p className="text-sm font-semibold mb-4">File Types</p>
              {typeData.length > 0 ? (
                <div className="space-y-2.5">
                  {typeData.sort((a, b) => b.count - a.count).map(({ type, count }) => {
                    const max = Math.max(...typeData.map((d) => d.count));
                    return (
                      <div key={type} className="flex items-center gap-3">
                        <span className="text-xs font-mono text-text-secondary w-10 shrink-0">.{type}</span>
                        <div className="flex-1 h-2 rounded-full bg-bg-hover overflow-hidden">
                          <div className="h-full rounded-full bg-blue-500 transition-all"
                            style={{ width: `${(count / max) * 100}%` }} />
                        </div>
                        <span className="text-xs font-mono text-text-muted w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[140px] text-sm text-text-muted">No documents yet</div>
              )}
            </div>
          </div>

          {/* Top collections */}
          {stats.topCollections.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <p className="text-sm font-semibold mb-4">Top Collections</p>
              <div className="space-y-2">
                {stats.topCollections.map((col, i) => (
                  <div key={col.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-b-0">
                    <span className="text-[10px] font-mono font-bold text-text-muted w-5 shrink-0">#{i + 1}</span>
                    <FolderOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="flex-1 text-sm text-text-primary truncate">{col.name}</span>
                    <span className="text-xs text-text-muted font-mono">{col.docCount} docs</span>
                    <span className="text-xs text-text-muted">{col.size}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
