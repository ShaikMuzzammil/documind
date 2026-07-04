'use client';

import { useEffect, useState } from 'react';
import {
  BellRing, CheckCircle2, Globe, Lock, Save, Shield, UserRound, X,
  Zap, AlertTriangle, FileText, ExternalLink, BookOpen, Database,
} from 'lucide-react';
import AuthGate from '@/components/app/AuthGate';
import { useUser } from '@/lib/use-user';

type Tab = 'profile' | 'ai' | 'workspace' | 'notifications' | 'privacy';

export default function SettingsPage() {
  const { user, capabilities, refresh: refreshUser } = useUser() as {
    user: { name?: string; email?: string; createdAt?: string } | null;
    capabilities?: { ai?: boolean; postgres?: boolean; email?: boolean };
    refresh: () => void;
  };

  const [tab, setTab]           = useState<Tab>('profile');
  const [name, setName]         = useState('');
  const [saving, setSaving]     = useState(false);
  const [notice, setNotice]     = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [notifEmail, setNotifEmail]   = useState(true);
  const [notifIngest, setNotifIngest] = useState(true);

  useEffect(() => { if (user) setName(user.name || ''); }, [user]);

  const saveProfile = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const res  = await fetch('/api/me', {
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

  const TABS: { key: Tab; label: string; Icon: React.ElementType; dot?: boolean }[] = [
    { key: 'profile',       label: 'Profile',       Icon: UserRound },
    { key: 'ai',            label: 'AI Engine',     Icon: Zap,      dot: !capabilities?.ai },
    { key: 'workspace',     label: 'Workspace',     Icon: Globe },
    { key: 'notifications', label: 'Notifications', Icon: BellRing },
    { key: 'privacy',       label: 'Privacy',       Icon: Shield },
  ];

  return (
    <AuthGate>
      <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8">
        <div className="mx-auto max-w-3xl space-y-6">

          <div>
            <p className="text-xs font-mono font-bold tracking-widest text-text-muted">ACCOUNT</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Settings</h1>
          </div>

          {notice && (
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm
              ${notice.type === 'success'
                ? 'border-success/25 bg-success/10 text-success'
                : 'border-danger/25  bg-danger/10  text-danger'}`}
            >
              {notice.type === 'success'
                ? <CheckCircle2 className="h-4 w-4 shrink-0" />
                : <AlertTriangle className="h-4 w-4 shrink-0" />}
              {notice.text}
              <button onClick={() => setNotice(null)} className="ml-auto">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Tab strip */}
          <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-bg-secondary/50 p-1">
            {TABS.map(({ key, label, Icon, dot }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap
                  min-w-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                  ${tab === key
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:text-text-primary'}`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
                {dot && (
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-warning" />
                )}
              </button>
            ))}
          </div>

          {/* ── Profile ─────────────────────────────────────────────── */}
          {tab === 'profile' && (
            <div className="glass rounded-xl p-6 space-y-4">
              <h2 className="font-semibold">Display information</h2>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">Display name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveProfile()}
                  placeholder="Your name"
                  className="w-full rounded-lg border border-border bg-bg-card px-3 py-2.5 text-sm outline-none focus:border-accent/50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">Email address</label>
                <input
                  value={user?.email || ''}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-border bg-bg-card/50 px-3 py-2.5 text-sm text-text-muted"
                />
                <p className="mt-1 text-xs text-text-muted">Email cannot be changed.</p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">Member since</label>
                <input
                  value={user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                    : '—'}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-border bg-bg-card/50 px-3 py-2.5 text-sm text-text-muted"
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

          {/* ── AI Engine ───────────────────────────────────────────── */}
          {tab === 'ai' && (
            <div className="space-y-4">

              {/* Status card */}
              <div className={`glass rounded-xl p-6 border flex items-start gap-4
                ${capabilities?.ai
                  ? 'border-success/20 bg-success/5'
                  : 'border-warning/20 bg-warning/5'}`}
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl
                  ${capabilities?.ai ? 'bg-success/15' : 'bg-warning/15'}`}
                >
                  <Zap className={`h-6 w-6 ${capabilities?.ai ? 'text-success' : 'text-warning'}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold">
                    {capabilities?.ai ? 'AI Answer Engine — Active' : 'AI Answer Engine — Not configured'}
                  </p>
                  <p className={`mt-1 text-sm leading-relaxed ${capabilities?.ai ? 'text-success' : 'text-warning'}`}>
                    {capabilities?.ai
                      ? 'Your AI key is connected. Streaming answers with citations are fully enabled.'
                      : 'An API key is required to enable AI-generated answers. Check the project README for setup instructions.'}
                  </p>
                </div>
              </div>

              {/* What AI enables */}
              <div className="glass rounded-xl p-5 space-y-3">
                <h2 className="font-semibold">What AI enables</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { ok: true,              label: 'Document upload & indexing' },
                    { ok: true,              label: 'Semantic search across documents' },
                    { ok: true,              label: 'Citation retrieval' },
                    { ok: capabilities?.ai,  label: 'AI-generated answers in Chat' },
                    { ok: capabilities?.ai,  label: 'Streaming responses' },
                    { ok: capabilities?.ai,  label: 'Context-aware follow-up questions' },
                  ].map(({ ok, label }) => (
                    <div key={label} className={`flex items-center gap-2.5 rounded-lg px-3 py-2
                      ${ok ? '' : 'opacity-40'}`}
                    >
                      <CheckCircle2 className={`h-4 w-4 shrink-0 ${ok ? 'text-success' : 'text-text-muted'}`} />
                      <span className="text-sm">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* If not configured — point to README */}
              {!capabilities?.ai && (
                <div className="glass rounded-xl p-5 space-y-3 border border-accent/15">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-accent" />
                    <h2 className="font-semibold">How to configure</h2>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Full setup instructions — including supported providers, environment variable
                    names, and step-by-step hosting guides — are documented in the project README.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href="https://github.com/ShaikMuzzammil/documind#configuration"
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
                    >
                      <BookOpen className="h-4 w-4" /> Read README
                      <ExternalLink className="h-3 w-3 opacity-70" />
                    </a>
                    <a
                      href="https://github.com/ShaikMuzzammil/documind/blob/main/README.md"
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-card px-4 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
                    >
                      <ExternalLink className="h-4 w-4" /> View on GitHub
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Workspace ───────────────────────────────────────────── */}
          {tab === 'workspace' && (
            <div className="glass rounded-xl p-6 space-y-5">
              <h2 className="font-semibold">Workspace configuration</h2>
              <div className="space-y-3">
                {[
                  {
                    label: 'Storage backend',
                    hint:  'Where documents and embeddings are stored.',
                    value: capabilities?.postgres ? 'PostgreSQL + pgvector' : 'Local JSON store',
                  },
                  {
                    label: 'Answer engine',
                    hint:  'The AI provider used to generate responses.',
                    value: capabilities?.ai
                      ? 'Connected (see README for env var details)'
                      : 'Not configured — see README.md',
                  },
                  {
                    label: 'Embedding size',
                    hint:  'Dimensionality of the semantic vector index.',
                    value: '768-dimensional vectors',
                  },
                  {
                    label: 'Chunk size',
                    hint:  'How documents are split before indexing.',
                    value: '~512 tokens per chunk',
                  },
                ].map(({ label, hint, value }) => (
                  <div key={label} className="rounded-xl border border-border bg-bg-card/50 px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="mt-0.5 text-xs text-text-muted">{hint}</p>
                      </div>
                      <span className="max-w-[200px] rounded-lg bg-bg-secondary px-2 py-1 text-right text-xs text-text-secondary shrink-0">
                        {value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-muted">
                Environment variables are set at deploy time. See README.md for the full list.
              </p>
            </div>
          )}

          {/* ── Notifications ───────────────────────────────────────── */}
          {tab === 'notifications' && (
            <div className="glass rounded-xl p-6 space-y-4">
              <h2 className="font-semibold">Notification preferences</h2>
              {[
                {
                  label: 'Welcome email on signup',
                  hint:  'Sent once when you create your account (requires email service).',
                  value: notifEmail, onChange: setNotifEmail,
                },
                {
                  label: 'Document indexed notification',
                  hint:  'Show an in-app notification when a document finishes indexing.',
                  value: notifIngest, onChange: setNotifIngest,
                },
              ].map(({ label, hint, value, onChange }) => (
                <div key={label}
                  className="flex items-start gap-3 rounded-xl border border-border bg-bg-card/50 px-4 py-3"
                >
                  <button
                    onClick={() => onChange(!value)}
                    className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors
                      ${value ? 'bg-accent' : 'bg-border'}`}
                  >
                    <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform
                      ${value ? 'translate-x-4' : 'translate-x-0'}`}
                    />
                  </button>
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="mt-0.5 text-xs text-text-muted">{hint}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Privacy ─────────────────────────────────────────────── */}
          {tab === 'privacy' && (
            <div className="glass rounded-xl p-6 space-y-4">
              <h2 className="font-semibold">Privacy and data</h2>
              {[
                { Icon: Lock,     title: 'Your documents stay yours',   body: 'Documents are stored in your own database. The app never uploads files to a shared server.' },
                { Icon: Shield,   title: 'Per-user isolation',          body: 'Every collection, document, and embedded chunk is scoped to your user ID. Other users cannot access your data.' },
                { Icon: Database, title: 'Your provider, your keys',    body: 'Answers are generated using your own API credentials configured in environment variables. See README.md for details.' },
              ].map(({ Icon, title, body }) => (
                <div key={title}
                  className="flex items-start gap-3 rounded-xl border border-border bg-bg-card/50 px-4 py-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent-soft mt-0.5">
                    <Icon className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{body}</p>
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
