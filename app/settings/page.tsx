'use client';

import { useEffect, useState } from 'react';
import { BellRing, CheckCircle2, Globe, Lock, Save, Shield, UserRound, X } from 'lucide-react';
import AuthGate from '@/components/app/AuthGate';
import { useUser } from '@/lib/use-user';

type Tab = 'profile' | 'workspace' | 'notifications' | 'privacy';

export default function SettingsPage() {
  const { user, refresh: refreshUser } = useUser();
  const [tab, setTab] = useState<Tab>('profile');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notification preferences (local only)
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifIngest, setNotifIngest] = useState(true);

  useEffect(() => { if (user) setName(user.name || ''); }, [user]);

  const saveProfile = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setNotice({ type: 'success', text: 'Profile saved.' });
      await refreshUser();
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const TABS: { key: Tab; label: string; Icon: React.ElementType }[] = [
    { key: 'profile', label: 'Profile', Icon: UserRound },
    { key: 'workspace', label: 'Workspace', Icon: Globe },
    { key: 'notifications', label: 'Notifications', Icon: BellRing },
    { key: 'privacy', label: 'Privacy', Icon: Shield },
  ];

  return (
    <AuthGate>
      <div className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <p className="text-xs font-mono font-bold tracking-widest text-text-muted">ACCOUNT</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Settings</h1>
          </div>

          {notice && (
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${notice.type === 'success' ? 'border-success/25 bg-success/10 text-success' : 'border-danger/25 bg-danger/10 text-danger'}`}>
              {notice.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : null}
              {notice.text}
              <button onClick={() => setNotice(null)} className="ml-auto"><X className="h-4 w-4" /></button>
            </div>
          )}

          {/* Tab strip */}
          <div className="flex gap-1 rounded-xl border border-border bg-bg-secondary/50 p-1">
            {TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${tab === key ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'}`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Profile tab */}
          {tab === 'profile' && (
            <div className="glass rounded-xl p-6 space-y-4">
              <h2 className="font-semibold">Display information</h2>
              <div>
                <label className="block mb-1.5 text-xs font-medium text-text-muted">Display name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg-card px-3 py-2.5 text-sm outline-none focus:border-accent/50"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-medium text-text-muted">Email address</label>
                <input
                  value={user?.email || ''}
                  disabled
                  className="w-full rounded-lg border border-border bg-bg-card/50 px-3 py-2.5 text-sm text-text-muted cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-text-muted">Email cannot be changed.</p>
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-medium text-text-muted">Member since</label>
                <input
                  value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
                  disabled
                  className="w-full rounded-lg border border-border bg-bg-card/50 px-3 py-2.5 text-sm text-text-muted cursor-not-allowed"
                />
              </div>
              <button
                onClick={saveProfile}
                disabled={saving || !name.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          )}

          {/* Workspace tab */}
          {tab === 'workspace' && (
            <div className="glass rounded-xl p-6 space-y-5">
              <h2 className="font-semibold">Workspace configuration</h2>
              <div className="space-y-3">
                {[
                  { label: 'Storage backend', hint: 'Where your documents and embeddings are stored.', value: process.env.DATABASE_URL ? 'PostgreSQL + pgvector' : 'Local JSON store' },
                  { label: 'Answer engine', hint: 'The provider used to generate responses.', value: 'Configured via LLM_API_KEY environment variable' },
                  { label: 'Embedding size', hint: 'Dimensionality of the semantic vector index.', value: '768-dimensional vectors' },
                  { label: 'Chunk size', hint: 'How documents are split before indexing.', value: 'Approximately 512 tokens per chunk' },
                ].map(({ label, hint, value }) => (
                  <div key={label} className="rounded-xl border border-border bg-bg-card/50 px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-text-muted mt-0.5">{hint}</p>
                      </div>
                      <span className="text-xs text-text-secondary bg-bg-secondary rounded-lg px-2 py-1 shrink-0">{value}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-muted">
                Environment variables are set at deploy time. To change them, update your hosting configuration and redeploy.
              </p>
            </div>
          )}

          {/* Notifications tab */}
          {tab === 'notifications' && (
            <div className="glass rounded-xl p-6 space-y-4">
              <h2 className="font-semibold">Notification preferences</h2>
              {[
                { label: 'Welcome email on signup', hint: 'Sent once when you create your account (requires email to be configured).', value: notifEmail, onChange: setNotifEmail },
                { label: 'Document indexed notification', hint: 'Show an in-app notification when a document finishes indexing.', value: notifIngest, onChange: setNotifIngest },
              ].map(({ label, hint, value, onChange }) => (
                <div key={label} className="flex items-start gap-3 rounded-xl border border-border bg-bg-card/50 px-4 py-3">
                  <button
                    onClick={() => onChange(!value)}
                    className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${value ? 'bg-accent' : 'bg-border'}`}
                  >
                    <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-text-muted mt-0.5">{hint}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Privacy tab */}
          {tab === 'privacy' && (
            <div className="glass rounded-xl p-6 space-y-4">
              <h2 className="font-semibold">Privacy and data</h2>
              {[
                { Icon: Lock, title: 'Your documents stay yours', body: 'Documents are stored in your own database. The app never uploads files to a shared server.' },
                { Icon: Shield, title: 'Per-user isolation', body: 'Every collection, document, and embedded chunk is scoped to your user ID. Other users cannot access your data.' },
                { Icon: Globe, title: 'Your provider, your keys', body: 'Answers are generated using your own API credentials set in environment variables. No third-party service has access to your content.' },
              ].map(({ Icon, title, body }) => (
                <div key={title} className="flex items-start gap-3 rounded-xl border border-border bg-bg-card/50 px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-accent-soft border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGate>
  );
}
