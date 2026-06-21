'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { BrainCircuit, ArrowRight, LogOut, UserRound } from 'lucide-react';
import { useUser } from '@/lib/use-user';

const HOME_SECTIONS = [
  { id: 'features', label: 'Features' },
  { id: 'how', label: 'How it works' },
  { id: 'tech', label: 'Tech' },
  { id: 'faq', label: 'FAQ' },
];

export default function Navigation() {
  const pathname = usePathname() || '/';
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('features');
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
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`fixed top-0 inset-x-0 z-50 transition-all ${
        scrolled ? 'glass border-b border-border' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent-soft border border-accent/30 flex items-center justify-center">
            <BrainCircuit className="w-4 h-4 text-accent" />
          </div>
          <span className="font-bold tracking-tight">
            Docu<span className="gradient-text">Mind</span>
          </span>
        </Link>

        {isHome && (
          <div className="hidden md:flex items-center gap-1">
            {HOME_SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  active === s.id
                    ? 'text-accent bg-accent-soft'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                }`}
              >
                {s.label}
              </a>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/chat"
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Open app
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={logout}
                className="hidden h-9 items-center gap-1.5 rounded-lg border border-border bg-bg-card px-3 text-xs text-text-secondary transition-colors hover:text-text-primary sm:inline-flex"
                title={`Signed in as ${user.email}`}
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {loading ? 'Checking' : 'Sign in'}
              <UserRound className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
