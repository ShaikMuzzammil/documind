'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BarChart2, BookOpen, Download, FileText, FolderOpen,
  HelpCircle, LayoutDashboard, LogOut, MessageSquare,
  Search, Settings, User, Zap, ChevronRight, Bot,
  Layers, Database,
} from 'lucide-react';
import { useUser } from '@/lib/use-user';

const NAV = [
  { href: '/chat',        label: 'Chat',        icon: MessageSquare, desc: 'Ask your docs' },
  { href: '/documents',   label: 'Documents',   icon: FileText,      desc: 'Upload & manage' },
  { href: '/collections', label: 'Collections', icon: FolderOpen,    desc: 'Organise files' },
  { href: '/analytics',   label: 'Analytics',   icon: BarChart2,     desc: 'Usage insights' },
  { href: '/search',      label: 'Search',      icon: Search,        desc: 'Semantic search' },
  { href: '/export',      label: 'Export',      icon: Download,      desc: 'Download data' },
  { href: '/help',        label: 'Help',        icon: HelpCircle,    desc: 'Docs & support' },
  { href: '/settings',    label: 'Settings',    icon: Settings,      desc: 'Config & AI' },
  { href: '/profile',     label: 'Profile',     icon: User,          desc: 'Account info' },
];

interface QuickStats { docs: number; chunks: number; sessions: number }

export default function AppSidebar() {
  const pathname = usePathname();
  const { user, capabilities } = useUser();
  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    window.location.href = '/auth?mode=login';
  };
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const isApp = pathname.startsWith('/chat') || pathname.startsWith('/documents') ||
      pathname.startsWith('/collections') || pathname.startsWith('/analytics') ||
      pathname.startsWith('/search') || pathname.startsWith('/export') ||
      pathname.startsWith('/help') || pathname.startsWith('/settings') || pathname.startsWith('/profile');
    if (!isApp) return;
    Promise.all([
      fetch('/api/documents').then(r => r.json()).catch(() => ({ documents: [] })),
      fetch('/api/chat/sessions').then(r => r.json()).catch(() => ({ sessions: [] })),
    ]).then(([d, s]) => {
      const docs = d.documents || [];
      setStats({
        docs: docs.length,
        chunks: docs.reduce((t: number, doc: { chunkCount?: number }) => t + (doc.chunkCount || 0), 0),
        sessions: (s.sessions || []).length,
      });
    }).catch(() => undefined);
  }, [pathname]);

  const isApp = NAV.some(n => pathname.startsWith(n.href));
  if (!isApp) return null;

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <aside className={`hidden lg:flex flex-col h-screen sticky top-0 shrink-0 border-r border-border bg-bg-secondary/20 transition-all duration-200 ${collapsed ? 'w-14' : 'w-56'}`}>
      {/* Brand */}
      <div className={`flex items-center gap-2.5 px-3 py-4 border-b border-border ${collapsed ? 'flex-col gap-1' : ''}`}>
        {collapsed ? (
          <>
            <Link href="/" className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-white" title="DocuMind">
              <Bot className="h-4 w-4" />
            </Link>
            {/* Expand button — always visible when collapsed */}
            <button
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
              className="flex h-6 w-6 items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <Link href="/" className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-bold tracking-tight">DocuMind</span>
                <span className="ml-1.5 text-[9px] font-mono font-bold text-text-muted border border-border/60 rounded px-1 py-px">v6</span>
              </div>
            </Link>
            {/* Collapse button — always visible (was broken: opacity-0 with no parent group class) */}
            <button
              onClick={() => setCollapsed(true)}
              title="Collapse sidebar"
              className="ml-auto p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
            >
              <LayoutDashboard className="h-3.5 w-3.5 rotate-90" />
            </button>
          </>
        )}
      </div>

      {/* AI status */}
      {!collapsed && (
        <div className="px-3 pt-3">
          <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${capabilities?.ai ? 'bg-success/10 border border-success/20 text-success' : 'bg-warning/10 border border-warning/20 text-warning'}`}>
            <Zap className="h-3 w-3 shrink-0" />
            {capabilities?.ai ? 'AI ready' : <Link href="/settings" className="hover:underline">Configure AI</Link>}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon, desc }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href} href={href}
              title={collapsed ? label : undefined}
              className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                active
                  ? 'bg-accent/12 text-accent font-semibold'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary'}`} />
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <span className="block truncate">{label}</span>
                </div>
              )}
              {!collapsed && active && <ChevronRight className="h-3 w-3 shrink-0 text-accent/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Quick stats */}
      {!collapsed && stats && (
        <div className="mx-2 mb-2 rounded-xl border border-border/50 bg-bg-secondary/30 p-3 space-y-2">
          <p className="text-[9px] font-bold uppercase tracking-wider text-text-muted">Workspace</p>
          <div className="space-y-1.5">
            {[
              { label: 'Documents', value: stats.docs, icon: FileText },
              { label: 'Chunks', value: stats.chunks.toLocaleString(), icon: Layers },
              { label: 'Sessions', value: stats.sessions, icon: MessageSquare },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-text-muted"><Icon className="h-3 w-3" />{label}</span>
                <span className="font-bold text-text-secondary">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User footer */}
      <div className={`border-t border-border p-2 ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <Link href="/profile" className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-white text-xs font-bold">
            {initials}
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/profile" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-white text-xs font-bold hover:opacity-90 transition-opacity">
              {initials}
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-text-primary">{user?.name || 'User'}</p>
              <p className="truncate text-[10px] text-text-muted">{user?.email}</p>
            </div>
            <button onClick={signOut} title="Sign out" className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors shrink-0">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
