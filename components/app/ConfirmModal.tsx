'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  open:       boolean;
  title:      string;
  message:    string;
  confirmLabel?: string;
  cancelLabel?:  string;
  danger?:    boolean;
  onConfirm:  () => void;
  onClose:    () => void;
}

export default function ConfirmModal({
  open, title, message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  danger = false, onConfirm, onClose,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1,  scale: 1,    y: 0  }}
            exit={{    opacity: 0,  scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[301] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="glass rounded-2xl border border-border shadow-2xl w-full max-w-sm pointer-events-auto overflow-hidden">
              <div className="flex items-start justify-between px-5 pt-5 pb-3">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-red-500/10 border border-red-500/25' : 'bg-amber-500/10 border border-amber-500/25'}`}>
                    <AlertTriangle className={`w-4 h-4 ${danger ? 'text-red-400' : 'text-amber-400'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{message}</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors shrink-0 ml-2">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2 px-5 pb-5 mt-2">
                <button onClick={onClose}
                  className="flex-1 py-2 rounded-xl border border-border text-sm text-text-secondary font-medium hover:bg-bg-hover transition-colors">
                  {cancelLabel}
                </button>
                <button onClick={() => { onConfirm(); onClose(); }}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-colors ${danger ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
