'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  AlertCircle, Calendar, CheckCircle2, Edit2, FolderOpen,
  Layers, Save, User, X, FileText, Activity, Award,
} from 'lucide-react';
import AuthGate from '@/components/app/AuthGate';
import { WorkspaceStats } from '@/lib/analytics';
import { useUser } from '@/lib/use-user';
import { formatBytes } from '@/lib/utils';

function fmt(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

export default function ProfilePage() {
  const { user, refresh: refreshUser } = useUser();
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) return;
      const data = await res.json();
      setStats(data.stats);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (user) setName((user as { name?: string }).name || ''); }, [user]);
  useEffect(() => { if (editName) inputRef.current?.focus(); }, [editName]);

  const saveName = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setNotice({ type: 'success', text: 'Name updated.' });
      setEditName(false);
      await refreshUser();
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Update failed.' });
    } finally {
      setSaving(false);
    }
  };

  const typedUser = user as { name?: string; email?: string; createdAt?: string } | null;
  const initials = typedUser?.name
    ? typedUser.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : typedUser?.email?.[0]?.toUpperCase() || '?';

  const totalChunks = stats?.totals.chunks || 0;
  const totalDocs = stats?.totals.documents || 0;
  const totalBytes = stats?.totals.bytes || 0;

  const achievements = [
    { label: 'First document', earned: totalDocs >= 1, Icon: FileText },
    { label: '10+ chunks indexed', earned: totalChunks >= 10, Icon: Layers },
    { label: '5+ documents', earned: totalDocs >= 5, Icon: Award },
    { label: 'Built a collection', earned: (stats?.totals.collections || 0) >= 1, Icon: FolderOpen },
  ];

  return (
    <AuthGate>
      <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <p className="text-xs font-mono font-bold tracking-widest text-text-muted">ACCOUNT</p>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>

          {notice && (
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${notice.type === 'success' ? 'border-success/25 bg-success/10 text-success' : 'border-danger/25 bg-danger/10 text-danger'}`}>
              {notice.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {notice.text}
              <button onClick={() => setNotice(null)} className="ml-auto"><X className="h-4 w-4" /></button>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* Profile card */}
            <div className="space-y-4">
              <div className="glass rounded-xl p-6 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg shadow-accent/20">
                  {initials}
                </div>

                {editName ? (
                  <div className="space-y-2">
                    <input
                      ref={inputRef}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditName(false); }}
                      className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-center outline-none focus:border-accent/50"
                    />
                    <div className="flex gap-2">
                      <button onClick={saveName} disabled={saving}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-accent py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {saving ? '…' : <><Save className="h-3 w-3" /> Save</>}
                      </button>
                      <button onClick={() => setEditName(false)}
                        className="flex-1 rounded-lg border border-border py-1.5 text-xs text-text-muted hover:text-text-primary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-center gap-2">
                      <p className="font-bold text-lg">{typedUser?.name || 'Anonymous'}</p>
                      <button onClick={() => setEditName(true)}
                        className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-sm text-text-muted mt-0.5">{typedUser?.email}</p>
                    {typedUser?.createdAt && (
                      <p className="text-xs text-text-muted mt-2 flex items-center justify-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Since {new Date(typedUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Achievements */}
              <div className="glass rounded-xl p-4">
                <p className="text-xs font-bold tracking-widest text-text-muted mb-3">ACHIEVEMENTS</p>
                <div className="space-y-2">
                  {achievements.map(({ label, earned, Icon }) => (
                    <div key={label} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 ${earned ? 'bg-success/8 border border-success/15' : 'opacity-40'}`}>
                      <Icon className={`h-4 w-4 ${earned ? 'text-success' : 'text-text-muted'}`} />
                      <span className="text-xs">{label}</span>
                      {earned && <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-success" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { Icon: FileText,   label: 'Documents',  value: totalDocs,             color: 'text-accent' },
                  { Icon: Layers,     label: 'Chunks',     value: totalChunks,            color: 'text-cyan-400' },
                  { Icon: Activity,   label: 'Storage',    value: fmt(totalBytes),        color: 'text-emerald-400' },
                ].map(({ Icon, label, value, color }) => (
                  <div key={label} className="glass rounded-xl p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-bg-card border border-border/60 flex items-center justify-center">
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{loading ? '–' : value}</p>
                      <p className="text-xs text-text-muted">{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Collections breakdown chart */}
              {stats && stats.collections.length > 0 && (
                <div className="glass rounded-xl p-5">
                  <h2 className="font-semibold mb-4 text-sm">Collections overview</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats.collections} margin={{ left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: '#161922', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} />
                      <Bar dataKey="documents" name="Documents" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Recent docs */}
              {stats && stats.recentDocuments.length > 0 && (
                <div className="glass rounded-xl overflow-hidden">
                  <div className="border-b border-border px-4 py-3">
                    <h2 className="font-semibold text-sm">Recently indexed</h2>
                  </div>
                  <div className="divide-y divide-border/60">
                    {stats.recentDocuments.slice(0, 5).map(doc => (
                      <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                        <FileText className="h-4 w-4 text-text-muted shrink-0" />
                        <span className="flex-1 text-sm truncate">{doc.name}</span>
                        <span className={`text-xs rounded-full px-2 py-0.5 ${doc.status === 'ready' ? 'bg-success/10 text-success' : 'bg-yellow-500/10 text-yellow-400'}`}>{doc.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
