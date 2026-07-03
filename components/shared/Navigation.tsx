'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, LogOut, Menu, UserRound, X } from 'lucide-react';
import { useUser } from '@/lib/use-user';
import Logo from './Logo';

const HOME_SECTIONS = [
  { id: 'how',      label: 'How it Works' },
  { id: 'features', label: 'Features' },
  { id: 'guide',    label: 'Use Cases' },
  { id: 'faq',      label: 'FAQ' },
];

export default function Navigation() {
  const pathname = usePathname() || '/';
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('how');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, refresh } = useUser();

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    await refresh();
    window.location.href = '/';
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
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
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${
          scrolled
            ? 'glass border-b border-border shadow-xl shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center transition-colors group-hover:border-accent/50">
              <Logo className="h-5 w-5" animated />
            </div>
            <span className="font-bold tracking-tight text-[15px]">
              Docu<span className="gradient-text">Mind</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          {isHome && (
            <div className="hidden md:flex items-center gap-0.5">
              {HOME_SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`px-3.5 py-2 text-sm rounded-lg transition-colors ${
                    active === s.id
                      ? 'text-accent bg-accent/8 font-medium'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                  }`}
                >
                  {s.label}
                </a>
              ))}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  Workspace
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={logout}
                  className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-bg-card px-3 text-xs text-text-secondary transition-colors hover:text-text-primary hover:border-border/80"
                  title={`Signed in as ${user.email}`}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </>
            ) : loading ? (
              <div className="h-9 w-24 rounded-lg bg-bg-card animate-pulse border border-border" />
            ) : (
              <>
                <Link
                  href="/auth"
                  className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth?mode=register"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  Get started
                  <UserRound className="h-3.5 w-3.5" />
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            {isHome && (
              <button
                onClick={() => setMobileOpen((o) => !o)}
                className="md:hidden ml-1 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-bg-card text-text-secondary"
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile dropdown */}
        {isHome && mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t border-border bg-bg-secondary/95 backdrop-blur px-4 py-3 space-y-1"
          >
            {HOME_SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                {s.label}
              </a>
            ))}
          </motion.div>
        )}
      </motion.nav>
    </>
  );
}
