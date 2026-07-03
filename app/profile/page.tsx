'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  AlertCircle, Calendar, CheckCircle2, Edit2, FolderOpen, Layers, Save, TrendingUp, User, X,
} from 'lucide-react';
import AuthGate from '@/components/app/AuthGate';
import { WorkspaceStats } from '@/lib/analytics';
import { useUser } from '@/lib/use-user';

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
  useEffect(() => { if (user) setName(user.name || ''); }, [user]);
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

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <AuthGate>
      <div className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8">
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

          {/* Profile card */}
          <section className="glass rounded-xl p-6">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                {editName ? (
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      ref={inputRef}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setEditName(false); setName(user?.name || ''); }}}
                      className="flex-1 rounded-lg border border-accent/50 bg-bg-card px-3 py-1.5 text-lg font-bold outline-none"
                    />
                    <button onClick={saveName} disabled={saving} className="p-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30">
                      <Save className="h-4 w-4" />
                    </button>
                    <button onClick={() => { setEditName(false); setName(user?.name || ''); }} className="p-2 rounded-lg text-text-muted hover:text-text-primary">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold">{user?.name || 'Unnamed user'}</h2>
                    <button onClick={() => setEditName(true)} className="p-1 rounded text-text-muted hover:text-text-primary transition-colors">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <p className="text-sm text-text-secondary">{user?.email}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
                  <Calendar className="h-3.5 w-3.5" />
                  Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                </p>
              </div>
            </div>
          </section>

          {/* Stats cards */}
          {stats && (
            <section className="grid gap-4 sm:grid-cols-4">
              {[
                { icon: User, label: 'Documents', value: stats.totals.documents },
                { icon: FolderOpen, label: 'Collections', value: stats.totals.collections },
                { icon: Layers, label: 'Chunks', value: stats.totals.chunks },
                { icon: TrendingUp, label: 'Storage', value: fmt(stats.totals.bytes) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="glass rounded-xl p-4">
                  <p className="text-xs text-text-muted">{label}</p>
                  <p className="mt-2 text-2xl font-bold">{value}</p>
                </div>
              ))}
            </section>
          )}

          {/* Charts row */}
          {stats && (
            <section className="grid gap-6 lg:grid-cols-2">
              <div className="glass rounded-xl p-5">
                <h3 className="font-semibold mb-4">Monthly uploads</h3>
                {stats.monthly.length === 0 ? (
                  <p className="text-sm text-text-muted py-6 text-center">No upload activity yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={stats.monthly} margin={{ left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: '#161922', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} labelStyle={{ color: '#e6e9ef' }} />
                      <Bar dataKey="count" name="Uploads" fill="#6366f1" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="glass rounded-xl p-5">
                <h3 className="font-semibold mb-4">Top collections</h3>
                {stats.collections.length === 0 ? (
                  <p className="text-sm text-text-muted py-6 text-center">No collections yet</p>
                ) : (
                  <div className="space-y-3">
                    {stats.collections.slice(0, 5).map((col, i) => (
                      <div key={col.id} className="flex items-center gap-3">
                        <span className="text-xs text-text-muted w-4 shrink-0">#{i + 1}</span>
                        <FolderOpen className="h-4 w-4 text-accent shrink-0" />
                        <span className="flex-1 text-sm truncate">{col.name}</span>
                        <span className="text-xs text-text-muted shrink-0">{col.documents} docs · {fmt(col.bytes)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </AuthGate>
  );
}
