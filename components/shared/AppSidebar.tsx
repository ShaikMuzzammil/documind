'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageSquare, FileText, FolderOpen, type LucideIcon } from 'lucide-react';

const ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/collections', label: 'Collections', icon: FolderOpen },
];

const APP_PREFIXES = ['/chat', '/documents', '/collections'];

export default function AppSidebar() {
  const pathname = usePathname() || '/';
  const show = APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!show) return null;

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <aside className="hidden lg:flex fixed top-16 left-0 bottom-0 w-56 z-30 flex-col border-r border-border bg-bg-secondary/40 backdrop-blur-sm px-3 py-6">
        <p className="px-3 mb-3 text-[10px] font-mono font-bold tracking-widest text-text-muted">
          WORKSPACE
        </p>
        <nav className="flex flex-col gap-1">
          {ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'text-accent bg-accent-soft'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="app-side-active"
                    className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent"
                  />
                )}
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav className="lg:hidden sticky top-16 z-30 flex gap-1 overflow-x-auto border-b border-border bg-bg-secondary/70 backdrop-blur-sm px-3 py-2">
        {ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                active ? 'text-accent bg-accent-soft' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="hidden lg:block w-56 shrink-0" aria-hidden />
    </>
  );
}
