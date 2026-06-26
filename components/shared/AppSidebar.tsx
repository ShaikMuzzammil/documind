'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MessageSquare, FileText, FolderOpen, BarChart3,
  Download, Settings, Home, LogOut, Search,
  User, Keyboard, HelpCircle, type LucideIcon,
} from 'lucide-react';
import { useUser } from '@/lib/use-user';
import SearchPanel from '@/components/app/SearchPanel';
import KeyboardShortcuts from '@/components/app/KeyboardShortcuts';
import OnboardingModal from '@/components/app/OnboardingModal';

interface NavItem { href: string; label: string; icon: LucideIcon; badge?: string; }

const ITEMS: NavItem[] = [
  { href: '/chat',        label: 'Chat',        icon: MessageSquare },
  { href: '/documents',   label: 'Documents',   icon: FileText      },
  { href: '/collections', label: 'Collections', icon: FolderOpen    },
  { href: '/analytics',   label: 'Analytics',   icon: BarChart3     },
  { href: '/export',      label: 'Export',      icon: Download      },
  { href: '/search',      label: 'Search',      icon: Search        },
  { href: '/settings',    label: 'Settings',    icon: Settings      },
];

const APP_PREFIXES = ITEMS.map((i) => i.href);

export default function AppSidebar() {
  const pathname = usePathname() ?? '/';
  const router   = useRouter();
  const { user, refresh } = useUser();

  const [searchOpen,    setSearchOpen]    = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [onboardOpen,   setOnboardOpen]   = useState(false);

  const show = APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
    || pathname === '/profile';
  if (!show) return null;

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    await refresh();
    router.replace('/auth');
  };

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  // Global ⌘K shortcut
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === '?' && !['INPUT','TEXTAREA'].includes((e.target as HTMLElement).tagName)) { setShortcutsOpen(true); }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  return (
    <>
      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
      <KeyboardShortcuts open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <OnboardingModal open={onboardOpen} onClose={() => setOnboardOpen(false)} />

      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed top-16 left-0 bottom-0 w-56 z-30 flex-col border-r border-border bg-bg-secondary/50 backdrop-blur-sm px-3 pt-5 pb-4">

        {/* Home */}
        <Link href="/"
          className="flex items-center gap-2.5 px-3 py-2 mb-2 rounded-lg text-xs text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors">
          <Home className="w-3.5 h-3.5 shrink-0" />Back to Home
        </Link>

        {/* Quick search */}
        <button onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg text-xs text-text-muted bg-bg-card border border-border hover:border-blue-500/25 hover:text-text-secondary transition-all group">
          <Search className="w-3.5 h-3.5 shrink-0 group-hover:text-blue-400 transition-colors" />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="text-[9px] font-mono bg-bg-secondary px-1.5 py-0.5 rounded border border-border text-text-muted">⌘K</kbd>
        </button>

        <p className="px-3 mb-2 text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase">Workspace</p>

        {/* Nav items */}
        <nav className="flex flex-col gap-0.5 flex-1 overflow-y-auto no-scrollbar">
          {ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon   = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'text-blue-400 bg-blue-500/10' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                }`}>
                {active && (
                  <motion.span layoutId="app-active-indicator"
                    className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-blue-500" />
                )}
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
                {item.badge && (
                  <span className="ml-auto text-[10px] bg-blue-600/20 text-blue-400 border border-blue-500/25 px-1.5 py-0.5 rounded-full font-mono">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Profile */}
          <Link href="/profile"
            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/profile' ? 'text-blue-400 bg-blue-500/10' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
            }`}>
            <User className="w-4 h-4 shrink-0" />Profile
          </Link>
        </nav>

        {/* Help buttons */}
        <div className="flex gap-1.5 mb-3">
          <button onClick={() => setShortcutsOpen(true)} title="Keyboard shortcuts"
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-border text-[10px] text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-colors">
            <Keyboard className="w-3 h-3" />Shortcuts
          </button>
          <button onClick={() => setOnboardOpen(true)} title="Getting started guide"
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-border text-[10px] text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-colors">
            <HelpCircle className="w-3 h-3" />Guide
          </button>
        </div>

        {/* User profile + logout */}
        <div className="border-t border-border pt-3">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-bg-card/50">
            <Link href="/profile" className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 hover:bg-blue-600/30 transition-colors">
              <span className="text-[10px] font-bold text-blue-400">{initials}</span>
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-primary truncate">{user?.name ?? '…'}</p>
              <p className="text-[10px] text-text-muted truncate">{user?.email ?? ''}</p>
            </div>
            <button onClick={logout} title="Sign out"
              className="p-1 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="px-3 mt-2 text-[10px] text-text-muted font-mono">DocuMind v3.0</p>
        </div>
      </aside>

      {/* ── Mobile tab bar ───────────────────────────────────────────────── */}
      <nav className="lg:hidden sticky top-16 z-30 flex gap-1 overflow-x-auto border-b border-border bg-bg-secondary/80 backdrop-blur-sm px-2 py-2 no-scrollbar">
        <Link href="/"
          className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-xs font-medium text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors shrink-0">
          <Home className="w-3.5 h-3.5" />
        </Link>
        <button onClick={() => setSearchOpen(true)}
          className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-xs font-medium text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors shrink-0">
          <Search className="w-3.5 h-3.5" />
        </button>
        {ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon   = item.icon;
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors shrink-0 ${
                active ? 'text-blue-400 bg-blue-500/10' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}>
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Desktop spacer */}
      <div className="hidden lg:block w-56 shrink-0" />
    </>
  );
}
