'use client';

import { useEffect, useRef, useState } from 'react';
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

// App pages have their own sidebar branding — Navigation hides on these
const APP_PATHS = [
  '/chat', '/documents', '/collections', '/analytics',
  '/export', '/search', '/help', '/settings', '/profile',
];

export default function Navigation() {
  const pathname    = usePathname() || '/';
  const isApp       = APP_PATHS.some((p) => pathname.startsWith(p));
  const isHome      = pathname === '/';
  const [scrolled,    setScrolled]    = useState(false);
  const [active,      setActive]      = useState('how');
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const { user, loading, refresh }    = useUser();
  const rafRef = useRef<number>(0);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    await refresh();
    window.location.href = '/';
  };

  // Scroll → glass nav
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll-position based active section detection (reliable on all browsers)
  useEffect(() => {
    if (!isHome) return;

    const update = () => {
      // Use 40% from top of viewport as the "active" threshold
      const threshold = window.scrollY + window.innerHeight * 0.4;
      let found = HOME_SECTIONS[0].id;
      for (const { id } of HOME_SECTIONS) {
        const el = document.getElementById(id);
        if (!el) continue;
        // offsetTop is relative to the nearest positioned ancestor; use getBoundingClientRect for accuracy
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= threshold + 80) found = id; // +80 for nav height
      }
      setActive(found);
    };

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // Kick off initial check after paint
    const t = setTimeout(update, 100);
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafRef.current);
      clearTimeout(t);
    };
  }, [isHome]);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Hide on app pages — AppSidebar provides branding there
  if (isApp) return null;

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
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

          {/* Desktop nav links — only on home */}
          {isHome && (
            <div className="hidden md:flex items-center gap-0.5">
              {HOME_SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`px-3.5 py-2 text-sm rounded-lg transition-all duration-150 ${
                    active === s.id
                      ? 'text-accent bg-accent/8 font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                  }`}
                >
                  {s.label}
                  {active === s.id && (
                    <span className="block h-0.5 bg-accent rounded-full mt-0.5 mx-auto" style={{ width: '70%' }} />
                  )}
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

            {/* Mobile hamburger */}
            {isHome && (
              <button
                onClick={() => setMobileOpen((o) => !o)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
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
                onClick={(e) => {
                  e.preventDefault();
                  setMobileOpen(false);
                  document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`flex items-center rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active === s.id
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                }`}
              >
                {s.label}
              </a>
            ))}
            <div className="pt-2 border-t border-border/40 mt-1">
              {user ? (
                <Link href="/chat" className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-semibold text-white">
                  Go to Workspace <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link href="/auth?mode=register" className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-semibold text-white">
                  Get started free <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </motion.nav>
    </>
  );
}
