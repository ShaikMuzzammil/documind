'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  AlertCircle, Calendar, CheckCircle2, Edit2, FolderOpen,
  Layers, Save, User, X, FileText, Activity, Award,
  Upload, MessageSquare, Search, Download, ExternalLink,
  RefreshCw, Globe,
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
  const [refreshing, setRefreshing] = useState(false);
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) return;
      const data = await res.json();
      setStats(data.stats);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
  const totalCollections = stats?.totals.collections || 0;

  const achievements = [
    {
      label: 'First document',
      desc: 'Uploaded and indexed your first file',
      earned: totalDocs >= 1,
      Icon: FileText,
      href: '/documents',
      color: 'text-blue-400',
    },
    {
      label: '10+ chunks indexed',
      desc: 'Built a meaningful knowledge base',
      earned: totalChunks >= 10,
      Icon: Layers,
      href: '/search',
      color: 'text-cyan-400',
    },
    {
      label: '5+ documents',
      desc: 'Growing your document workspace',
      earned: totalDocs >= 5,
      Icon: Award,
      href: '/documents',
      color: 'text-amber-400',
    },
    {
      label: 'Built a collection',
      desc: 'Organized documents into a collection',
      earned: totalCollections >= 1,
      Icon: FolderOpen,
      href: '/collections',
      color: 'text-emerald-400',
    },
    {
      label: 'Power user',
      desc: 'Have 10+ documents indexed',
      earned: totalDocs >= 10,
      Icon: Activity,
      href: '/analytics',
      color: 'text-purple-400',
    },
    {
      label: 'Data hoarder',
      desc: 'Stored over 1MB of content',
      earned: totalBytes >= 1024 * 1024,
      Icon: Download,
      href: '/export',
      color: 'text-orange-400',
    },
  ];

  const earnedCount = achievements.filter(a => a.earned).length;

  return (
    <AuthGate>
      <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-mono font-bold tracking-widest text-text-muted">ACCOUNT</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">Profile</h1>
            </div>
            <button
              onClick={() => { load(true); refreshUser(); }}
              disabled={refreshing}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-bg-card px-3 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {notice && (
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${notice.type === 'success' ? 'border-success/25 bg-success/10 text-success' : 'border-danger/25 bg-danger/10 text-danger'}`}>
              {notice.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {notice.text}
              <button onClick={() => setNotice(null)} className="ml-auto"><X className="h-4 w-4" /></button>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
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

              {/* Account info card */}
              <div className="glass rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold tracking-widest text-text-muted mb-3">ACCOUNT INFO</p>
                <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-text-secondary">
                  <User className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span className="truncate">{typedUser?.name || 'No display name'}</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-text-secondary">
                  <Globe className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span className="truncate">{typedUser?.email || '—'}</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-text-secondary">
                  <Calendar className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span>Member since {typedUser?.createdAt ? new Date(typedUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}</span>
                </div>
                <Link href="/settings"
                  className="flex items-center gap-2 mt-2 rounded-lg border border-border bg-bg-card/50 px-3 py-2 text-xs text-text-muted hover:text-accent hover:border-accent/30 transition-colors"
                >
                  <Edit2 className="h-3 w-3" /> Edit profile in Settings
                </Link>
              </div>

              {/* Achievements */}
              <div className="glass rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold tracking-widest text-text-muted">ACHIEVEMENTS</p>
                  <span className="text-xs text-text-muted">{earnedCount}/{achievements.length}</span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 w-full bg-bg-hover rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-accent-2 rounded-full transition-all duration-700"
                    style={{ width: `${achievements.length > 0 ? (earnedCount / achievements.length) * 100 : 0}%` }}
                  />
                </div>
                <div className="space-y-2">
                  {achievements.map(({ label, desc, earned, Icon, href, color }) => (
                    <Link
                      key={label}
                      href={href}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 transition-all hover:scale-[1.01] ${
                        earned
                          ? 'bg-success/8 border border-success/15 hover:bg-success/12'
                          : 'opacity-40 hover:opacity-60 border border-transparent'
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${earned ? color : 'text-text-muted'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{label}</p>
                        {earned && <p className="text-[10px] text-text-muted truncate">{desc}</p>}
                      </div>
                      {earned
                        ? <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-success shrink-0" />
                        : <ExternalLink className="ml-auto h-3 w-3 text-text-muted shrink-0 opacity-0 group-hover:opacity-100" />
                      }
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  { Icon: FileText,   label: 'Documents',   value: totalDocs,          color: 'text-accent',        href: '/documents' },
                  { Icon: FolderOpen, label: 'Collections', value: totalCollections,    color: 'text-cyan-400',      href: '/collections' },
                  { Icon: Layers,     label: 'Chunks',      value: totalChunks,         color: 'text-emerald-400',   href: '/search' },
                  { Icon: Activity,   label: 'Storage',     value: fmt(totalBytes),     color: 'text-orange-400',    href: '/export' },
                ].map(({ Icon, label, value, color, href }) => (
                  <Link key={label} href={href} className="glass rounded-xl p-4 flex items-center gap-3 hover:border-accent/30 transition-all group">
                    <div className="w-9 h-9 rounded-lg bg-bg-card border border-border/60 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{loading ? '–' : value}</p>
                      <p className="text-xs text-text-muted">{label}</p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Collections breakdown chart */}
              {stats && stats.collections.length > 0 && (
                <div className="glass rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-sm">Collections overview</h2>
                    <Link href="/collections" className="text-xs text-accent hover:underline">Manage →</Link>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats.collections} margin={{ left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: '#161922', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} />
                      <Bar dataKey="documents" name="Documents" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="chunks" name="Chunks" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Recent docs */}
              {stats && stats.recentDocuments.length > 0 && (
                <div className="glass rounded-xl overflow-hidden">
                  <div className="border-b border-border px-4 py-3 flex items-center justify-between">
                    <h2 className="font-semibold text-sm">Recently indexed</h2>
                    <Link href="/documents" className="text-xs text-accent hover:underline">View all →</Link>
                  </div>
                  <div className="divide-y divide-border/60">
                    {stats.recentDocuments.slice(0, 5).map(doc => (
                      <div key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-bg-secondary/30 transition-colors">
                        <FileText className="h-4 w-4 text-text-muted shrink-0" />
                        <span className="flex-1 text-sm truncate">{doc.name}</span>
                        <span className={`text-xs rounded-full px-2 py-0.5 ${doc.status === 'ready' ? 'bg-success/10 text-success' : 'bg-yellow-500/10 text-yellow-400'}`}>{doc.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick action links */}
              <div className="glass rounded-xl p-4">
                <p className="text-xs font-bold tracking-widest text-text-muted mb-3">QUICK ACTIONS</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { href: '/documents', icon: Upload, label: 'Upload docs' },
                    { href: '/chat', icon: MessageSquare, label: 'Chat' },
                    { href: '/search', icon: Search, label: 'Search' },
                    { href: '/export', icon: Download, label: 'Export data' },
                  ].map(({ href, icon: Icon, label }) => (
                    <Link key={href} href={href}
                      className="flex items-center gap-2 rounded-lg border border-border bg-bg-card/60 px-3 py-2 text-xs text-text-secondary hover:text-accent hover:border-accent/30 transition-colors"
                    >
                      <Icon className="h-3.5 w-3.5" /> {label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Empty state */}
              {!loading && totalDocs === 0 && (
                <div className="glass rounded-xl p-8 text-center">
                  <User className="mx-auto h-10 w-10 text-text-muted opacity-30 mb-3" />
                  <p className="font-semibold mb-2">Your workspace is empty</p>
                  <p className="text-sm text-text-muted mb-4">Create a collection and upload your first document to get started.</p>
                  <Link href="/documents" className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
                    <Upload className="h-4 w-4" /> Get started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
