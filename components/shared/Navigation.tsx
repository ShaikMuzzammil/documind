'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { BrainCircuit, ArrowRight, LogOut, UserRound, Menu, X, Sparkles } from 'lucide-react';
import { useUser } from '@/lib/use-user';

const HOME_SECTIONS = [
  { id: 'how', label: 'How it works' },
  { id: 'features', label: 'Features' },
  { id: 'deploy', label: 'Deploy' },
  { id: 'tech', label: 'Tech' },
  { id: 'faq', label: 'FAQ' },
];

export default function Navigation() {
  const pathname = usePathname() || '/';
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, refresh } = useUser();

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    await refresh();
    window.location.href = '/auth';
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isHome) return;
    const sections = HOME_SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0.15, 0.4, 0.7] },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [isHome]);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${
          scrolled ? 'glass border-b border-border' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4 text-violet-400" />
            </div>
            <span className="font-bold tracking-tight text-sm">
              Docu<span className="gradient-text">Mind</span>
            </span>
          </Link>

          {/* Desktop nav links (home only) */}
          {isHome && (
            <div className="hidden md:flex items-center gap-0.5">
              {HOME_SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                    active === s.id
                      ? 'text-violet-400 bg-violet-500/10'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                  }`}
                >
                  {s.label}
                </a>
              ))}
            </div>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/chat"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-semibold text-white transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Open app
                </Link>
                <button
                  onClick={logout}
                  className="hidden sm:inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-bg-card px-3 text-xs text-text-secondary transition-colors hover:text-text-primary"
                  title={`Signed in as ${user.email}`}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-semibold text-white transition-colors"
              >
                {loading ? 'Loading...' : 'Sign in'}
                <UserRound className="h-3.5 w-3.5" />
              </Link>
            )}

            {/* Mobile menu toggle */}
            {isHome && (
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg border border-border text-text-secondary"
              >
                {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        {isHome && mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border glass px-4 py-3 flex flex-col gap-1"
          >
            {HOME_SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary rounded-lg hover:bg-white/5 transition-colors"
              >
                {s.label}
              </a>
            ))}
            {user && (
              <Link
                href="/chat"
                onClick={() => setMobileOpen(false)}
                className="mt-1 inline-flex items-center gap-1.5 justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Sparkles className="w-4 h-4" />
                Open app
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </motion.div>
        )}
      </motion.nav>
    </>
  );
}
