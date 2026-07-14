'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, 0 = persistent
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (opts: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error:   AlertCircle,
  warning: AlertTriangle,
  info:    Info,
};

const STYLES: Record<ToastType, string> = {
  success: 'border-success/30 bg-success/10 text-success',
  error:   'border-danger/30  bg-danger/10  text-danger',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  info:    'border-accent/30  bg-accent/10  text-accent',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon = ICONS[toast.type];
  const progressRef = useRef<HTMLDivElement>(null);
  const duration = toast.duration ?? 5000;

  useEffect(() => {
    if (!duration) return;
    const timer = setTimeout(onDismiss, duration);
    // Animate progress bar
    const el = progressRef.current;
    if (el) {
      el.style.transition = `width ${duration}ms linear`;
      requestAnimationFrame(() => { el.style.width = '0%'; });
    }
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div className={`relative flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm min-w-[300px] max-w-[420px] overflow-hidden ${STYLES[toast.type]}`}
      style={{ animation: 'slideInRight 0.2s ease-out' }}>
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">{toast.title}</p>
        {toast.message && (
          <p className="mt-0.5 text-xs opacity-80 leading-relaxed">{toast.message}</p>
        )}
        {toast.action && (
          <button
            onClick={() => { toast.action!.onClick(); onDismiss(); }}
            className="mt-1.5 text-xs font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity p-0.5">
        <X className="h-3.5 w-3.5" />
      </button>
      {!!duration && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-current opacity-20">
          <div ref={progressRef} className="h-full bg-current opacity-60" style={{ width: '100%' }} />
        </div>
      )}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((opts: Omit<Toast, 'id'>): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev.slice(-4), { ...opts, id }]); // max 5 toasts
    return id;
  }, []);

  const success = useCallback((title: string, message?: string) => toast({ type: 'success', title, message }), [toast]);
  const error   = useCallback((title: string, message?: string) => toast({ type: 'error',   title, message, duration: 8000 }), [toast]);
  const warning = useCallback((title: string, message?: string) => toast({ type: 'warning', title, message, duration: 7000 }), [toast]);
  const info    = useCallback((title: string, message?: string) => toast({ type: 'info',    title, message }), [toast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, success, error, warning, info }}>
      {children}
      {/* Toast portal */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
