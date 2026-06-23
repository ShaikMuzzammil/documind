'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MessageSquare, FileText, FolderOpen, BarChart3,
  Download, Settings, type LucideIcon,
} from 'lucide-react';

interface NavItem { href: string; label: string; icon: LucideIcon; }

const ITEMS: NavItem[] = [
  { href: '/chat',        label: 'Chat',        icon: MessageSquare },
  { href: '/documents',   label: 'Documents',   icon: FileText      },
  { href: '/collections', label: 'Collections', icon: FolderOpen    },
  { href: '/analytics',   label: 'Analytics',   icon: BarChart3     },
  { href: '/export',      label: 'Export',      icon: Download      },
  { href: '/settings',    label: 'Settings',    icon: Settings      },
];

const APP_PREFIXES = ITEMS.map((i) => i.href);

export default function AppSidebar() {
  const pathname = usePathname() || '/';
  const show = APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!show) return null;

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed top-16 left-0 bottom-0 w-56 z-30 flex-col border-r border-border bg-bg-secondary/50 backdrop-blur-sm px-3 pt-6 pb-4">
        <p className="px-3 mb-3 text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase">Workspace</p>
        <nav className="flex flex-col gap-0.5 flex-1">
          {ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'text-accent bg-accent-soft' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                }`}>
                {active && (
                  <motion.span layoutId="app-side-active"
                    className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-accent" />
                )}
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border pt-3 mt-2">
          <p className="px-3 text-[10px] text-text-muted font-mono">DocuMind v2.0 · Next.js 15.3</p>
        </div>
      </aside>

      {/* Mobile tab bar */}
      <nav className="lg:hidden sticky top-16 z-30 flex gap-1 overflow-x-auto border-b border-border bg-bg-secondary/80 backdrop-blur-sm px-3 py-2 no-scrollbar">
        {ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors shrink-0 ${
                active ? 'text-accent bg-accent-soft' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
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
