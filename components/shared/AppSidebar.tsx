'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  ChevronRight,
  Download,
  FileText,
  FolderOpen,
  HelpCircle,
  Home,
  Layers,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  User,
} from 'lucide-react';
import { useUser } from '@/lib/use-user';
import Logo from './Logo';

const NAV_ITEMS = [
  { href: '/chat',        icon: MessageSquare, label: 'Chat'        },
  { href: '/documents',   icon: FileText,      label: 'Documents'   },
  { href: '/collections', icon: FolderOpen,    label: 'Collections' },
  { href: '/analytics',   icon: BarChart3,     label: 'Analytics'   },
  { href: '/export',      icon: Download,      label: 'Export'      },
  { href: '/search',      icon: Search,        label: 'Search'      },
  { href: '/help',        icon: HelpCircle,    label: 'Help'        },
  { href: '/settings',    icon: Settings,      label: 'Settings'    },
  { href: '/profile',     icon: User,          label: 'Profile'     },
];

export default function AppSidebar() {
  const pathname = usePathname() || '/';
  const { user, loading, refresh } = useUser();
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    const appPaths = ['/chat', '/documents', '/collections', '/analytics', '/export', '/search', '/help', '/settings', '/profile'];
    const isApp = appPaths.some((p) => pathname.startsWith(p));
    setShow(isApp);
    if (isApp) setExpanded(false);
  }, [pathname]);

  const logout = async () => {
    if (initRef.current) return;
    initRef.current = true;
    await fetch('/api/auth/logout', { method: 'POST' });
    await refresh();
    initRef.current = false;
    window.location.href = '/';
  };

  if (!show) return null;

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border bg-bg-secondary/50 sticky top-0 h-screen">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-4 h-16 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-accent-soft border border-accent/30 flex items-center justify-center">
            <Logo className="h-4.5 w-4.5" animated />
          </div>
          <span className="font-bold text-sm tracking-tight">
            Docu<span className="gradient-text">Mind</span>
          </span>
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          {/* Back to home */}
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 mx-2 rounded-lg text-xs text-text-muted hover:bg-bg-hover hover:text-text-secondary transition-colors mb-3"
          >
            <Home className="h-3.5 w-3.5" />
            Back to Home
          </Link>

          <p className="px-4 pb-1 text-[10px] font-bold tracking-widest text-text-muted">WORKSPACE</p>
          <nav className="space-y-0.5 px-2">
            {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    active
                      ? 'bg-accent-soft text-accent border-l-2 border-accent ml-[-2px]'
                      : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                  {active && <ChevronRight className="ml-auto h-3 w-3 opacity-50" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User footer */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {loading ? '…' : initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{user?.name || '—'}</p>
              <p className="text-[10px] text-text-muted truncate">{user?.email || '—'}</p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="p-1.5 rounded-lg text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-text-muted text-center mt-1">DocuMind v3.2</p>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-bg-secondary/90 backdrop-blur">
        <div className="flex">
          {[
            { href: '/chat',      icon: MessageSquare, label: 'Chat'    },
            { href: '/documents', icon: FileText,      label: 'Docs'    },
            { href: '/collections', icon: Layers,      label: 'Folders' },
            { href: '/search',    icon: Search,        label: 'Search'  },
            { href: '/settings',  icon: Settings,      label: 'More'    },
          ].map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
                  active ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
