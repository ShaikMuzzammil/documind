'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, LogOut, UserRound, Menu, X, Sparkles, Home } from 'lucide-react';
import { useUser } from '@/lib/use-user';

const HOME_SECTIONS = [
  { id: 'how',          label: 'How it Works'  },
  { id: 'features',     label: 'Features'      },
  { id: 'capabilities', label: 'Capabilities'  },
  { id: 'guide',        label: 'Guide'         },
  { id: 'faq',          label: 'FAQ'           },
];

export default function Navigation() {
  const pathname    = usePathname() ?? '/';
  const router      = useRouter();
  const isHome      = pathname === '/';
  const [scrolled,    setScrolled]    = useState(false);
  const [active,      setActive]      = useState('');
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const { user, loading, refresh }    = useUser();

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    await refresh();
    router.replace('/auth');
  };

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    if (!isHome) return;
    const sections = HOME_SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis?.target.id) setActive(vis.target.id);
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: [0.1, 0.4, 0.7] },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [isHome, pathname]);

  const isApp = !isHome && pathname !== '/auth';

  return (
    <motion.nav
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${
        scrolled || isApp ? 'glass border-b border-border' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center group-hover:bg-blue-600/25 transition-colors">
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <span className="font-bold tracking-tight text-sm">
            Docu<span className="gradient-text">Mind</span>
          </span>
        </Link>

        {/* Desktop home nav */}
        {isHome && (
          <nav className="hidden md:flex items-center gap-0.5">
            {HOME_SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`}
                className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                  active === s.id
                    ? 'text-blue-400 bg-blue-500/10 font-medium'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                }`}>
                {s.label}
              </a>
            ))}
          </nav>
        )}

        {/* App breadcrumb home link */}
        {isApp && (
          <Link href="/"
            className="hidden md:flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
            <Home className="w-3.5 h-3.5" />Home
          </Link>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {isHome && (
                <Link href="/chat"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-semibold text-white transition-colors">
                  <Sparkles className="w-3.5 h-3.5" />Open Workspace
                </Link>
              )}
              <button onClick={logout}
                className="hidden sm:inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-bg-card px-3 text-xs text-text-secondary transition-colors hover:text-text-primary"
                title={`Signed in as ${user.email}`}>
                <LogOut className="h-3.5 w-3.5" />Sign out
              </button>
            </>
          ) : (
            <Link href="/auth"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-semibold text-white transition-colors">
              {loading ? 'Loading…' : 'Sign in'} <UserRound className="h-3.5 w-3.5" />
            </Link>
          )}

          {/* Mobile toggle */}
          {isHome && (
            <button onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg border border-border text-text-secondary">
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isHome && mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t border-border glass px-4 py-3 flex flex-col gap-1">
          {HOME_SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary rounded-lg hover:bg-white/5 transition-colors">
              {s.label}
            </a>
          ))}
          {user
            ? <Link href="/chat" onClick={() => setMobileOpen(false)}
                className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
                <Sparkles className="w-4 h-4" />Open Workspace
              </Link>
            : <Link href="/auth" onClick={() => setMobileOpen(false)}
                className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
                Sign in
              </Link>
          }
        </motion.div>
      )}
    </motion.nav>
  );
}
