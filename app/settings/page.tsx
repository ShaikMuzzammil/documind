'use client';

import { useState } from 'react';
import {
  BrainCircuit, CheckCircle2, Database, Download,
  ExternalLink, Globe, Key, Loader2, Server, Settings, Shield,
} from 'lucide-react';
import AuthGate from '@/components/app/AuthGate';
import { useUser } from '@/lib/use-user';

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="border-b border-border px-5 py-4 flex items-center gap-2">
        <Icon className="w-4 h-4 text-accent" />
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function EnvRow({ name, desc, required }: { name: string; desc: string; required?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
      <code className="text-xs font-mono text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20 shrink-0 mt-0.5">{name}</code>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-secondary">{desc}</p>
      </div>
      {required !== undefined && (
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${required ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-text-muted bg-bg-card border-border'}`}>
          {required ? 'required' : 'optional'}
        </span>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useUser();
  const [cap, setCap] = useState<{ ai?: boolean; postgres?: boolean; email?: boolean } | null>(null);
  const [checking, setChecking] = useState(false);

  const checkCapabilities = async () => {
    setChecking(true);
    try {
      const data = await fetch('/api/me').then((r) => r.json());
      setCap(data.capabilities || {});
    } finally { setChecking(false); }
  };

  return (
    <AuthGate>
      <div className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-6">

          <header>
            <p className="text-xs font-mono font-bold tracking-widest text-text-muted">WORKSPACE</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight flex items-center gap-2">
              <Settings className="w-7 h-7 text-accent" />Settings
            </h1>
            <p className="mt-2 text-sm text-text-secondary max-w-xl">
              Configuration reference and live capability check for your DocuMind deployment.
            </p>
          </header>

          {/* Account */}
          <Section title="Account" icon={Shield}>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-text-muted mb-1">Email</p>
                <p className="text-sm font-medium">{user?.email ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Name</p>
                <p className="text-sm font-medium">{user?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">User ID</p>
                <code className="text-xs font-mono text-text-muted">{user?.id ?? '—'}</code>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Member since</p>
                <p className="text-sm text-text-secondary">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</p>
              </div>
            </div>
          </Section>

          {/* Capability check */}
          <Section title="Live capability check" icon={Server}>
            <p className="text-xs text-text-secondary mb-4">Verify which features are active in your current deployment.</p>
            <button onClick={checkCapabilities} disabled={checking}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:opacity-90 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-opacity mb-4">
              {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Check now
            </button>
            {cap && (
              <div className="space-y-2">
                {[
                  { label: 'Gemini AI', key: 'ai', icon: BrainCircuit, desc: 'GEMINI_API_KEY configured' },
                  { label: 'Postgres + pgvector', key: 'postgres', icon: Database, desc: 'DATABASE_URL configured' },
                  { label: 'Email (Resend)', key: 'email', icon: Globe, desc: 'RESEND_API_KEY configured' },
                ].map(({ label, key, icon: Icon, desc }) => (
                  <div key={key} className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${(cap as Record<string,boolean>)[key] ? 'border-emerald-500/25 bg-emerald-500/8' : 'border-border bg-bg-secondary/30'}`}>
                    <Icon className={`w-4 h-4 ${(cap as Record<string,boolean>)[key] ? 'text-emerald-400' : 'text-text-muted'}`} />
                    <div>
                      <p className={`text-sm font-medium ${(cap as Record<string,boolean>)[key] ? 'text-emerald-300' : 'text-text-muted'}`}>{label}</p>
                      <p className="text-[11px] text-text-muted">{desc}</p>
                    </div>
                    <span className={`ml-auto text-xs font-mono font-bold ${(cap as Record<string,boolean>)[key] ? 'text-emerald-400' : 'text-red-400'}`}>
                      {(cap as Record<string,boolean>)[key] ? '● active' : '○ missing'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Env vars reference */}
          <Section title="Environment variables reference" icon={Key}>
            <p className="text-xs text-text-secondary mb-4">
              All variables go in <code className="text-accent-2 font-mono">.env.local</code> for local dev or in your Vercel project settings for production.
            </p>
            <EnvRow name="GEMINI_API_KEY" desc="Google AI Studio API key. Powers chat (Gemini 2.0 Flash) and embeddings (text-embedding-004). Without it, DocuMind uses local hash embeddings and shows a placeholder for chat." required />
            <EnvRow name="AUTH_SECRET" desc="Long random string for signing HMAC session cookies. Generate with: openssl rand -base64 32" required />
            <EnvRow name="NEXT_PUBLIC_APP_URL" desc="Your public URL without trailing slash, e.g. https://documind.vercel.app" required />
            <EnvRow name="DATABASE_URL" desc="Postgres connection string. When set, DocuMind auto-migrates and uses pgvector for retrieval. Leave empty to use the local JSON file store." />
            <EnvRow name="DATABASE_SSL" desc="Set to false to disable SSL for local Postgres. Defaults to true." />
            <EnvRow name="GEMINI_CHAT_MODEL" desc="Override the chat model. Default: gemini-2.0-flash" />
            <EnvRow name="GEMINI_EMBED_MODEL" desc="Override the embedding model. Default: text-embedding-004" />
            <EnvRow name="RESEND_API_KEY" desc="Resend.com API key for welcome emails sent on registration." />
            <EnvRow name="EMAIL_FROM" desc='Sender address for welcome emails. e.g. DocuMind <noreply@yourdomain.com>' />
          </Section>

          {/* Links */}
          <Section title="Resources & docs" icon={Download}>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: 'GitHub repository', desc: 'Source code, issues, PRs', href: 'https://github.com/ShaikMuzzammil/documind' },
                { label: 'Google AI Studio', desc: 'Get your free GEMINI_API_KEY', href: 'https://aistudio.google.com/app/apikey' },
                { label: 'Neon (free Postgres)', desc: 'pgvector-enabled DB hosting', href: 'https://neon.tech' },
                { label: 'Vercel deploy', desc: 'One-click Next.js hosting', href: 'https://vercel.com/new' },
              ].map((r) => (
                <a key={r.label} href={r.href} target="_blank" rel="noopener noreferrer"
                  className="flex items-start gap-3 rounded-xl border border-border bg-bg-secondary/30 px-4 py-3 hover:border-accent/30 transition-colors">
                  <ExternalLink className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{r.label}</p>
                    <p className="text-xs text-text-muted">{r.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </Section>

        </div>
      </div>
    </AuthGate>
  );
}
