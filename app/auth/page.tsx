'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Lock, Mail, UserRound } from 'lucide-react';
import { useUser } from '@/lib/use-user';
import Logo from '@/components/shared/Logo';

type Mode = 'login' | 'register';

export default function AuthPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [nextPath, setNextPath] = useState('/chat');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    if (next && next.startsWith('/') && !next.startsWith('//')) setNextPath(next);
    const modeParam = params.get('mode');
    if (modeParam === 'register') setMode('register');
  }, []);

  // If the session is already valid (e.g. the user pressed Back after logging
  // in, or revisited /auth from a bookmark), never show the form again -
  // jump straight back into the workspace. This is the fix for "once
  // entered, no coming back to sign in unless I log out."
  useEffect(() => {
    if (!userLoading && user) {
      router.replace(nextPath);
    }
  }, [user, userLoading, router, nextPath]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Authentication failed.');
      // Hard navigation guarantees the new session cookie is picked up by
      // every server component and the AuthGate on the very first paint -
      // no stale client cache, no flicker back to the login screen.
      window.location.href = nextPath;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
      setBusy(false);
    }
  };

  if (userLoading || user) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-card px-4 py-3 text-sm text-text-secondary">
          <Loader2 className="h-4 w-4 animate-spin" />
          {user ? 'Taking you back to your workspace' : 'Checking your session'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
        <section>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary">
            <Logo className="h-4 w-4" animated={false} />
            Back to DocuMind
          </Link>
          <h1 className="mt-8 text-4xl font-bold tracking-tight sm:text-5xl">
            Your private document workspace.
          </h1>
          <p className="mt-5 max-w-xl text-text-secondary">
            Create an account, upload documents, and keep every collection isolated to your login. No shared demo
            user, no fake workspace environment variables.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {['User-owned collections', 'Secure session cookies', 'Optional welcome email'].map((item) => (
              <div key={item} className="rounded-xl border border-border bg-bg-secondary/45 p-4 text-sm text-text-secondary">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="glass rounded-xl p-6">
          <div className="mb-5 grid grid-cols-2 rounded-lg border border-border bg-bg-secondary/50 p-1">
            {(['login', 'register'] as const).map((item) => (
              <button
                key={item}
                onClick={() => {
                  setMode(item);
                  setError('');
                }}
                className={`rounded-md px-3 py-2 text-sm font-medium capitalize transition-colors ${
                  mode === item ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <h2 className="text-xl font-semibold">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="mt-1 text-sm text-text-muted">
            {mode === 'login' ? 'Log in to continue to your workspace.' : 'Start a real user workspace in seconds.'}
          </p>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submit} className="mt-5 space-y-4">
            {mode === 'register' && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-text-muted">Name</span>
                <span className="relative block">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    className="w-full rounded-lg border border-border bg-bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-accent/50"
                    placeholder="Ayesha Khan"
                  />
                </span>
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Email</span>
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-lg border border-border bg-bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-accent/50"
                  placeholder="you@example.com"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-text-muted">Password</span>
              <span className="relative block">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full rounded-lg border border-border bg-bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-accent/50"
                  placeholder="At least 8 characters"
                />
              </span>
            </label>

            <button
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
