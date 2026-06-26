'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle, CheckCircle2, BookOpen, Loader2,
  Lock, Mail, UserRound, Eye, EyeOff, ArrowLeft,
} from 'lucide-react';

type Mode = 'login' | 'register';

const BENEFITS = [
  'Private document collections',
  'Cited AI answers from your data',
  'Batch export and schema extraction',
  'Analytics across all documents',
];

export default function AuthPage() {
  const router      = useRouter();
  const [mode,       setMode]       = useState<Mode>('login');
  const [name,       setName]       = useState('');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');
  const [busy,       setBusy]       = useState(false);
  const [nextPath,   setNextPath]   = useState('/chat');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('next');
    if (p?.startsWith('/')) setNextPath(p);
  }, []);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      const res  = await fetch(`/api/auth/${mode}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Authentication failed.');
      setSuccess(mode === 'register' ? 'Account created! Redirecting…' : 'Welcome back! Redirecting…');
      setTimeout(() => { router.replace(nextPath); router.refresh(); }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_400px] lg:items-start">

        {/* Left: info panel */}
        <section className="pt-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-8">
            <ArrowLeft className="h-3.5 w-3.5" />Back to home
          </Link>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-lg font-bold">Docu<span className="gradient-text">Mind</span></span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            Your private document<br />intelligence workspace.
          </h1>
          <p className="mt-4 text-text-secondary max-w-md leading-relaxed">
            Upload any documents, ask questions, get precise cited answers. All data stays within your personal workspace.
          </p>
          <ul className="mt-8 space-y-3">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-2.5 text-sm text-text-secondary">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </section>

        {/* Right: form */}
        <section className="glass rounded-2xl p-6 mt-4 lg:sticky lg:top-24">
          {/* Mode toggle */}
          <div className="grid grid-cols-2 rounded-xl border border-border bg-bg-secondary/50 p-1 mb-5">
            {(['login', 'register'] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                className={`rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${
                  mode === m ? 'bg-blue-600 text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
                }`}>
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <h2 className="text-xl font-semibold">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {mode === 'login'
              ? 'Sign in to access your workspace.'
              : 'Set up your workspace in seconds.'}
          </p>

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger/10 px-3.5 py-3 text-sm text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">{error}</p>
                {error.includes('register') || error.includes('account') ? (
                  <button onClick={() => { setMode('register'); setError(''); }}
                    className="text-xs underline mt-0.5">
                    Create an account →
                  </button>
                ) : null}
              </div>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-3 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />{success}
            </div>
          )}

          <form onSubmit={submit} className="mt-5 space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Full Name</label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                  <input value={name} onChange={(e) => setName(e.target.value)} type="text"
                    placeholder="Your name" required
                    className="w-full bg-bg-secondary border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email"
                  placeholder="you@example.com" required
                  className="w-full bg-bg-secondary border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                <input value={password} onChange={(e) => setPassword(e.target.value)}
                  type={showPw ? 'text' : 'password'} placeholder={mode === 'register' ? 'Min. 8 characters' : '••••••••'}
                  required minLength={mode === 'register' ? 8 : 1}
                  className="w-full bg-bg-secondary border border-border rounded-xl pl-9 pr-10 py-2.5 text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition" />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                  {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={busy}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white transition-colors mt-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-text-muted">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
              className="text-blue-400 hover:underline font-medium">
              {mode === 'login' ? 'Register here' : 'Sign in'}
            </button>
          </p>
        </section>
      </div>
    </div>
  );
}
