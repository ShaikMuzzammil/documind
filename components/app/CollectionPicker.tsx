'use client';

import { Collection } from '@/lib/types';
import { FolderOpen } from 'lucide-react';

interface Props {
  collections: Collection[];
  value: string;
  onChange: (id: string) => void;
  includeAll?: boolean;
  placeholder?: string;
  className?: string;
}

export default function CollectionPicker({
  collections, value, onChange, includeAll, placeholder, className = '',
}: Props) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <FolderOpen className="w-4 h-4 text-text-muted shrink-0" />
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="bg-bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent/40 min-w-[160px] max-w-[240px] truncate">
        {includeAll && <option value="">All collections</option>}
        {collections.length === 0 && !includeAll && (
          <option value="" disabled>{placeholder || 'No collections yet'}</option>
        )}
        {collections.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}
