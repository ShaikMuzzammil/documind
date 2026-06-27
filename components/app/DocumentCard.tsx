'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, FileCode, FileSpreadsheet, Package, Trash2, Eye,
  MessageSquare, MoreVertical,
} from 'lucide-react';
import { DocumentMeta } from '@/lib/types';
import { formatBytes } from '@/lib/utils';
import StatusBadge from '@/components/app/StatusBadge';
import DocumentViewer from '@/components/app/DocumentViewer';
import Link from 'next/link';

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf')                     return <FileText       className="w-5 h-5 text-red-400"     />;
  if (['ts','js','py','html','xml'].includes(ext)) return <FileCode  className="w-5 h-5 text-blue-400"    />;
  if (['csv','xlsx'].includes(ext))      return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
  if (ext === 'json')                    return <Package        className="w-5 h-5 text-amber-400"   />;
  return <FileText className="w-5 h-5 text-text-muted" />;
}

interface Props {
  doc:           DocumentMeta;
  collectionName?:string;
  selected?:     boolean;
  onSelect?:     (id: string) => void;
  onDelete?:     (id: string) => void;
}

export default function DocumentCard({ doc, collectionName, selected, onSelect, onDelete }: Props) {
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [viewerOpen,   setViewerOpen]   = useState(false);

  const handleDelete = () => { setMenuOpen(false); onDelete?.(doc.id); };

  return (
    <>
      <motion.div layout
        className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all group ${
          selected ? 'border-blue-500/40 bg-blue-500/5' : 'border-border bg-bg-card hover:border-blue-500/20 hover:bg-bg-hover/40'
        } card-glow`}>

        {/* Checkbox */}
        {onSelect && (
          <input type="checkbox" checked={!!selected}
            onChange={() => onSelect(doc.id)}
            className="accent-blue-500 shrink-0" />
        )}

        {/* Icon */}
        <div className="w-9 h-9 rounded-xl bg-bg-secondary border border-border flex items-center justify-center shrink-0">
          <FileIcon name={doc.name} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{doc.name}</p>
          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
            <span className="text-[10px] text-text-muted">{formatBytes(doc.size)}</span>
            <span className="text-text-muted">·</span>
            <span className="text-[10px] text-text-muted font-mono">{doc.chunkCount} chunks</span>
            {collectionName && <>
              <span className="text-text-muted">·</span>
              <span className="text-[10px] text-text-muted truncate">{collectionName}</span>
            </>}
            <span className="text-text-muted">·</span>
            <span className="text-[10px] text-text-muted">{new Date(doc.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Status */}
        <StatusBadge status={doc.status} pulse />

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => setViewerOpen(true)} title="View chunks"
            className="h-7 w-7 flex items-center justify-center rounded-lg text-text-muted hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
            <Eye className="w-3.5 h-3.5" />
          </button>
          <Link href={`/chat?document=${doc.id}`} title="Chat with this document"
            className="h-7 w-7 flex items-center justify-center rounded-lg text-text-muted hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
            <MessageSquare className="w-3.5 h-3.5" />
          </Link>

          {/* More menu */}
          <div className="relative">
            <button onClick={() => setMenuOpen((v) => !v)}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors">
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-50 min-w-[140px] rounded-xl border border-border bg-bg-card shadow-xl overflow-hidden">
                  <button onClick={() => { setViewerOpen(true); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors">
                    <Eye className="w-3.5 h-3.5" />View Chunks
                  </button>
                  <button onClick={handleDelete}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-danger hover:bg-danger/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Viewer drawer */}
      {viewerOpen && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setViewerOpen(false)} />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-lg bg-bg-secondary border-l border-border flex flex-col h-full shadow-2xl"
          >
            <DocumentViewer
              documentId={doc.id}
              documentName={doc.name}
              documentSize={doc.size}
              onClose={() => setViewerOpen(false)}
            />
          </motion.div>
        </div>
      )}
    </>
  );
}
