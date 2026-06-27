'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  items: BreadcrumbItem[];
  showHome?: boolean;
}

export default function Breadcrumb({ items, showHome = true }: Props) {
  const all: BreadcrumbItem[] = showHome
    ? [{ label: 'Home', href: '/' }, ...items]
    : items;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-text-muted">
      {all.map((item, i) => {
        const isLast = i === all.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i === 0 && showHome && <Home className="w-3 h-3" />}
            {item.href && !isLast ? (
              <Link href={item.href}
                className="hover:text-text-primary transition-colors">{item.label}</Link>
            ) : (
              <span className={isLast ? 'text-text-secondary font-medium' : ''}>{item.label}</span>
            )}
            {!isLast && <ChevronRight className="w-3 h-3 shrink-0" />}
          </span>
        );
      })}
    </nav>
  );
}
