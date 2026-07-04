'use client';

import { useEffect, useState } from 'react';
import {
  BellRing, CheckCircle2, Globe, Lock, Save, Shield, UserRound, X,
  Key, Zap, AlertTriangle, ExternalLink, Copy, Check, Eye, EyeOff,
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

  const [tab, setTab] = useState<Tab>('profile');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifIngest, setNotifIngest] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

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

  const copySnippet = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(idx);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const TABS: { key: Tab; label: string; Icon: React.ElementType; dot?: boolean }[] = [
    { key: 'profile',       label: 'Profile',       Icon: UserRound },
    { key: 'ai',            label: 'AI Engine',     Icon: Zap,       dot: !capabilities?.ai },
    { key: 'workspace',     label: 'Workspace',     Icon: Globe },
    { key: 'notifications', label: 'Notifications', Icon: BellRing },
    { key: 'privacy',       label: 'Privacy',       Icon: Shield },
  ];

  const AI_PROVIDERS = [
    {
      name: 'Google Gemini',
      model: 'gemini-2.5-flash',
      envKey: 'LLM_API_KEY',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      envBase: 'LLM_BASE_URL',
      docsUrl: 'https://aistudio.google.com/apikey',
      description: 'Fast, capable, and free-tier available. Recommended for most deployments.',
      free: true,
    },
    {
      name: 'OpenAI',
      model: 'gpt-4o-mini',
      envKey: 'LLM_API_KEY',
      baseUrl: 'https://api.openai.com/v1',
      envBase: 'LLM_BASE_URL',
      docsUrl: 'https://platform.openai.com/api-keys',
      description: 'GPT-4o Mini is fast and cost-effective for document Q&A tasks.',
      free: false,
    },
    {
      name: 'Groq',
      model: 'llama-3.1-70b-versatile',
      envKey: 'LLM_API_KEY',
      baseUrl: 'https://api.groq.com/openai/v1',
      envBase: 'LLM_BASE_URL',
      docsUrl: 'https://console.groq.com/keys',
      description: 'Ultra-fast inference with free tier. Great for rapid prototyping.',
      free: true,
    },
  ];

  const [selectedProvider, setSelectedProvider] = useState(0);

  return (
    <AuthGate>
      <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <p className="text-xs font-mono font-bold tracking-widest text-text-muted">ACCOUNT</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Settings</h1>
          </div>

          {notice && (
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${notice.type === 'success' ? 'border-success/25 bg-success/10 text-success' : 'border-danger/25 bg-danger/10 text-danger'}`}>
              {notice.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
              {notice.text}
              <button onClick={() => setNotice(null)} className="ml-auto"><X className="h-4 w-4" /></button>
            </div>
          )}

          {/* Tab strip */}
          <div className="flex gap-1 rounded-xl border border-border bg-bg-secondary/50 p-1 overflow-x-auto">
            {TABS.map(({ key, label, Icon, dot }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap min-w-0 ${tab === key ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'}`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
                {dot && <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-warning" />}
              </button>
            ))}
          </div>

          {/* Profile tab */}
          {tab === 'profile' && (
            <div className="glass rounded-xl p-6 space-y-4">
              <h2 className="font-semibold">Display information</h2>
              <div>
                <label className="block mb-1.5 text-xs font-medium text-text-muted">Display name</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveProfile()}
                  className="w-full rounded-lg border border-border bg-bg-card px-3 py-2.5 text-sm outline-none focus:border-accent/50"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-medium text-text-muted">Email address</label>
                <input value={user?.email || ''} disabled
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
              <button onClick={saveProfile} disabled={saving || !name.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          )}

          {/* AI Engine tab */}
          {tab === 'ai' && (
            <div className="space-y-4">
              {/* Status card */}
              <div className={`glass rounded-xl p-5 flex items-start gap-4 border ${capabilities?.ai ? 'border-success/20 bg-success/5' : 'border-warning/20 bg-warning/5'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${capabilities?.ai ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
                  {capabilities?.ai ? <Zap className="h-5 w-5" /> : <Key className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-semibold">
                    {capabilities?.ai ? 'AI Answer Engine is Active' : 'AI Answer Engine needs configuration'}
                  </p>
                  <p className={`text-sm mt-0.5 ${capabilities?.ai ? 'text-success' : 'text-warning'}`}>
                    {capabilities?.ai
                      ? 'LLM_API_KEY is set. Streaming answers with citations are enabled.'
                      : 'Add LLM_API_KEY to your environment variables to enable AI-generated answers.'}
                  </p>
                </div>
              </div>

              {/* Provider selector */}
              <div className="glass rounded-xl p-5 space-y-4">
                <h2 className="font-semibold">Choose a provider</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  {AI_PROVIDERS.map((p, i) => (
                    <button key={p.name} onClick={() => setSelectedProvider(i)}
                      className={`rounded-xl border p-4 text-left transition-all ${selectedProvider === i ? 'border-accent/40 bg-accent/8' : 'border-border bg-bg-card/50 hover:border-border/80'}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-sm">{p.name}</p>
                        {p.free && <span className="text-[10px] bg-success/15 text-success rounded px-1.5 py-0.5 font-medium">FREE TIER</span>}
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed">{p.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Setup steps */}
              <div className="glass rounded-xl p-5 space-y-4">
                <h2 className="font-semibold">Setup guide — {AI_PROVIDERS[selectedProvider].name}</h2>

                {[
                  {
                    step: 1,
                    title: `Get your ${AI_PROVIDERS[selectedProvider].name} API key`,
                    content: (
                      <a href={AI_PROVIDERS[selectedProvider].docsUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-accent hover:underline text-sm"
                      >
                        {AI_PROVIDERS[selectedProvider].docsUrl} <ExternalLink className="h-3 w-3" />
                      </a>
                    ),
                    code: null,
                  },
                  {
                    step: 2,
                    title: 'Set these environment variables in Vercel / your host',
                    content: null,
                    code: `LLM_API_KEY=your_api_key_here\nLLM_BASE_URL=${AI_PROVIDERS[selectedProvider].baseUrl}\nLLM_CHAT_MODEL=${AI_PROVIDERS[selectedProvider].model}`,
                  },
                  {
                    step: 3,
                    title: 'Redeploy your project',
                    content: <p className="text-sm text-text-secondary">After saving env vars in Vercel → go to Deployments → Redeploy. The AI status on this page will update to "Active".</p>,
                    code: null,
                  },
                ].map(({ step, title, content, code }, idx) => (
                  <div key={step} className="flex gap-4">
                    <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center text-xs font-bold text-accent shrink-0 mt-0.5">
                      {step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm mb-2">{title}</p>
                      {content}
                      {code && (
                        <div className="relative mt-2">
                          <pre className={`rounded-lg bg-bg-card border border-border px-4 py-3 text-xs font-mono text-text-secondary overflow-x-auto whitespace-pre ${showKey ? '' : 'blur-sm select-none'}`}>
                            {code}
                          </pre>
                          <div className="absolute top-2 right-2 flex gap-1.5">
                            <button onClick={() => setShowKey(s => !s)}
                              className="h-6 w-6 flex items-center justify-center rounded bg-bg-hover hover:bg-bg-card transition-colors text-text-muted hover:text-text-primary"
                              title={showKey ? 'Hide' : 'Show'}
                            >
                              {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </button>
                            {showKey && (
                              <button onClick={() => copySnippet(code, idx)}
                                className="h-6 w-6 flex items-center justify-center rounded bg-bg-hover hover:bg-bg-card transition-colors text-text-muted hover:text-text-primary"
                              >
                                {copiedStep === idx ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass rounded-xl p-4 text-xs text-text-muted">
                API keys are stored only in your hosting environment and never sent to DocuMind servers. Your documents and queries remain private.
              </div>
            </div>
          )}

          {/* Workspace tab */}
          {tab === 'workspace' && (
            <div className="glass rounded-xl p-6 space-y-5">
              <h2 className="font-semibold">Workspace configuration</h2>
              <div className="space-y-3">
                {[
                  { label: 'Storage backend', hint: 'Where your documents and embeddings are stored.', value: capabilities?.postgres ? 'PostgreSQL + pgvector' : 'Local JSON store' },
                  { label: 'Answer engine', hint: 'The provider used to generate responses.', value: capabilities?.ai ? 'Configured via LLM_API_KEY' : 'Not configured — see AI Engine tab' },
                  { label: 'Embedding size', hint: 'Dimensionality of the semantic vector index.', value: '768-dimensional vectors' },
                  { label: 'Chunk size', hint: 'How documents are split before indexing.', value: '~512 tokens per chunk' },
                ].map(({ label, hint, value }) => (
                  <div key={label} className="rounded-xl border border-border bg-bg-card/50 px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-text-muted mt-0.5">{hint}</p>
                      </div>
                      <span className="text-xs text-text-secondary bg-bg-secondary rounded-lg px-2 py-1 shrink-0 max-w-[200px] text-right">{value}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-muted">
                Environment variables are set at deploy time. Update your hosting config and redeploy to change them.
              </p>
            </div>
          )}

          {/* Notifications tab */}
          {tab === 'notifications' && (
            <div className="glass rounded-xl p-6 space-y-4">
              <h2 className="font-semibold">Notification preferences</h2>
              {[
                { label: 'Welcome email on signup', hint: 'Sent once when you create your account (requires Resend API key).', value: notifEmail, onChange: setNotifEmail },
                { label: 'Document indexed notification', hint: 'Show an in-app notification when a document finishes indexing.', value: notifIngest, onChange: setNotifIngest },
              ].map(({ label, hint, value, onChange }) => (
                <div key={label} className="flex items-start gap-3 rounded-xl border border-border bg-bg-card/50 px-4 py-3">
                  <button onClick={() => onChange(!value)}
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
