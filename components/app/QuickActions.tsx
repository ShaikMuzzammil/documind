'use client';

import Link from 'next/link';
import { Upload, MessageSquare, Search, Download, FolderPlus, type LucideIcon } from 'lucide-react';

interface QuickAction {
  icon:    LucideIcon;
  label:   string;
  desc:    string;
  href:    string;
  color:   'blue' | 'emerald' | 'amber' | 'purple';
}

const ACTIONS: QuickAction[] = [
  { icon: Upload,      label: 'Upload',      desc: 'Add documents',        href: '/documents',   color: 'blue'    },
  { icon: FolderPlus,  label: 'Collection',  desc: 'Organise your work',   href: '/collections', color: 'emerald' },
  { icon: MessageSquare, label: 'Chat',      desc: 'Ask questions',        href: '/chat',        color: 'blue'    },
  { icon: Search,      label: 'Search',      desc: 'Find anything',        href: '/search',      color: 'purple'  },
  { icon: Download,    label: 'Export',      desc: 'Extract & download',   href: '/export',      color: 'amber'   },
];

const COLOR_MAP = {
  blue:    'text-blue-400    bg-blue-500/10    border-blue-500/25    hover:bg-blue-500/15',
  emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25 hover:bg-emerald-500/15',
  amber:   'text-amber-400   bg-amber-500/10   border-amber-500/25   hover:bg-amber-500/15',
  purple:  'text-purple-400  bg-purple-500/10  border-purple-500/25  hover:bg-purple-500/15',
};

export default function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map(({ icon: Icon, label, desc, href, color }) => (
        <Link key={href} href={href}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all text-xs font-medium ${COLOR_MAP[color]}`}>
          <Icon className="w-3.5 h-3.5 shrink-0" />
          <span>{label}</span>
          <span className="hidden sm:inline text-current opacity-60">— {desc}</span>
        </Link>
      ))}
    </div>
  );
}
