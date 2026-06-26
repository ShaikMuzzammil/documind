'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';
export interface Toast { id: string; type: ToastType; message: string; }

let _addToast: ((t: Omit<Toast, 'id'>) => void) | null = null;

export function toast(type: ToastType, message: string) { _addToast?.({ type, message }); }
toast.success = (msg: string) => toast('success', msg);
toast.error   = (msg: string) => toast('error', msg);
toast.info    = (msg: string) => toast('info', msg);

const ICONS  = { success: CheckCircle2, error: AlertCircle, info: Info } as const;
const STYLES = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  error:   'border-red-500/30 bg-red-500/10 text-red-300',
  info:    'border-blue-500/30 bg-blue-500/10 text-blue-300',
};

export default function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    _addToast = (t) => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev.slice(-4), { ...t, id }]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4000);
    };
    return () => { _addToast = null; };
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <motion.div key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0,  scale: 1   }}
              exit={   { opacity: 0, y: 8,  scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-xl backdrop-blur-lg min-w-[280px] max-w-[400px] ${STYLES[t.type]}`}>
              <Icon className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="text-sm flex-1 leading-relaxed">{t.message}</span>
              <button onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                className="opacity-50 hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
