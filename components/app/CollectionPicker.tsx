'use client';

import { useState } from 'react';
import { FolderOpen, ChevronDown, Check } from 'lucide-react';
import { Collection } from '@/lib/types';

interface Props {
  collections: Collection[];
  value?: string;
  onChange: (id: string | undefined) => void;
  placeholder?: string;
}

export default function CollectionPicker({ collections, value, onChange, placeholder = 'All collections' }: Props) {
  const [open, setOpen] = useState(false);
  const selected = collections.find((c) => c.id === value);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg border border-border bg-bg-card hover:bg-bg-hover transition-colors min-w-[160px]">
        <FolderOpen className="w-3.5 h-3.5 text-text-muted shrink-0" />
        <span className="flex-1 text-left truncate text-text-secondary">
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown className={`w-3 h-3 text-text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1.5 left-0 z-50 min-w-[200px] rounded-xl border border-border bg-bg-card shadow-2xl overflow-hidden">
            <button
              onClick={() => { onChange(undefined); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-bg-hover transition-colors ${!value ? 'text-blue-400' : 'text-text-secondary'}`}>
              <FolderOpen className="w-3.5 h-3.5 shrink-0" />
              <span className="flex-1 text-left">{placeholder}</span>
              {!value && <Check className="w-3 h-3" />}
            </button>
            <div className="h-px bg-border" />
            {collections.map((col) => (
              <button key={col.id}
                onClick={() => { onChange(col.id); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-bg-hover transition-colors ${value === col.id ? 'text-blue-400' : 'text-text-secondary'}`}>
                <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1 text-left truncate">{col.name}</span>
                {value === col.id && <Check className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
