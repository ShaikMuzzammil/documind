'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, UserRound } from 'lucide-react';
import { useUser } from '@/lib/use-user';
import Logo from '@/components/shared/Logo';

type Mode = 'login' | 'register';

const TRUST_POINTS = [
  'User-owned collections, zero data sharing',
  'HMAC-signed session cookies',
  'Your keys, your database, your data',
];

export default function AuthPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [nextPath, setNextPath] = useState('/chat');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    if (next && next.startsWith('/') && !next.startsWith('//')) setNextPath(next);
    const modeParam = params.get('mode');
    if (modeParam === 'register') setMode('register');
  }, []);

  // Already logged in → redirect immediately
  useEffect(() => {
    if (!userLoading && user) {
      router.replace(nextPath);
    }
  }, [user, userLoading, router, nextPath]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
    setSuccess('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    // Basic client-side validation
    if (!email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (mode === 'register' && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please try again.');
      }

      if (mode === 'register') {
        setSuccess('Account created! Taking you to your workspace…');
      }

      // Hard navigation so the session cookie is picked up immediately
      setTimeout(() => {
        window.location.href = nextPath;
      }, mode === 'register' ? 800 : 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
      setBusy(false);
    }
  };

  // Session check loading state
  if (userLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-accent/30 bg-accent/10">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
          </div>
          <p className="text-sm text-text-secondary">
            {user ? 'Taking you to your workspace…' : 'Checking your session…'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-24 pb-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[1fr_420px] lg:items-start">

        {/* ── Left column ──────────────────────────────────────────── */}
        <section className="hidden lg:block">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-10"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-accent/30 bg-accent/10">
              <Logo className="h-6 w-6" animated />
            </div>
            <div>
              <p className="font-bold tracking-tight">
                Docu<span className="gradient-text">Mind</span>
              </p>
              <p className="text-xs text-text-muted">Document Intelligence Platform</p>
            </div>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight mb-4 leading-tight">
            Your private<br />
            <span className="gradient-text">document workspace.</span>
          </h1>

          <p className="text-text-secondary mb-8 leading-relaxed max-w-sm">
            {mode === 'login'
              ? 'Welcome back. Sign in to access your collections and continue where you left off.'
              : 'Create an account to upload documents, build collections, and get AI-powered answers.'}
          </p>

          <ul className="space-y-3">
            {TRUST_POINTS.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-text-secondary">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                {p}
              </li>
            ))}
          </ul>
        </section>

        {/* ── Right column: form ────────────────────────────────────── */}
        <section>
          {/* Mobile back link */}
          <Link
            href="/"
            className="lg:hidden inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>

          <div className="glass rounded-2xl p-7">
            {/* Mode toggle */}
            <div className="mb-6 grid grid-cols-2 rounded-xl border border-border bg-bg-secondary/60 p-1">
              {(['login', 'register'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => switchMode(item)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium capitalize transition-all ${
                    mode === item
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {item === 'login' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-text-primary">
                {mode === 'login' ? 'Welcome back' : 'Get started free'}
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                {mode === 'login'
                  ? 'Enter your credentials to access your workspace.'
                  : 'Create your account — no credit card required.'}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger/8 px-4 py-3 text-sm text-danger">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-success/25 bg-success/8 px-4 py-3 text-sm text-success">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={submit} className="space-y-4" noValidate>
              {/* Name (register only) */}
              {mode === 'register' && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-muted">
                    Full name <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      placeholder="Your name"
                      required
                      className="w-full rounded-xl border border-border bg-bg-card py-3 pl-9 pr-3 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">
                  Email address <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl border border-border bg-bg-card py-3 pl-9 pr-3 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">
                  Password <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
                    required
                    className="w-full rounded-xl border border-border bg-bg-card py-3 pl-9 pr-10 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {mode === 'register' && (
                  <p className="mt-1.5 text-[11px] text-text-muted">Minimum 8 characters</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={busy}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3.5 text-sm font-bold text-white transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {busy
                  ? mode === 'login'
                    ? 'Signing in…'
                    : 'Creating account…'
                  : mode === 'login'
                    ? 'Sign in to workspace'
                    : 'Create free account'}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-text-muted">
              {mode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="text-accent hover:underline font-medium"
                  >
                    Create one free
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-accent hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
