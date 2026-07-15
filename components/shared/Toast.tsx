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
  success: 'border-success/40 bg-bg-card text-success shadow-success/10',
  error:   'border-danger/40  bg-bg-card text-danger  shadow-danger/10',
  warning: 'border-warning/40 bg-bg-card text-warning shadow-warning/10',
  info:    'border-accent/40  bg-bg-card text-accent  shadow-accent/10',
};

const TITLE_STYLES: Record<ToastType, string> = {
  success: 'text-text-primary',
  error:   'text-text-primary',
  warning: 'text-text-primary',
  info:    'text-text-primary',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon = ICONS[toast.type];
  const progressRef = useRef<HTMLDivElement>(null);
  const duration = toast.duration ?? 5000;

  useEffect(() => {
    if (!duration) return;
    const timer = setTimeout(onDismiss, duration);
    const el = progressRef.current;
    if (el) {
      // Force reflow so transition fires
      el.getBoundingClientRect();
      el.style.transition = `width ${duration}ms linear`;
      el.style.width = '0%';
    }
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div
      className={`
        relative flex items-start gap-3 rounded-xl border px-4 py-3
        shadow-xl backdrop-blur-md overflow-hidden
        w-[340px] max-w-[calc(100vw-2rem)]
        ${STYLES[toast.type]}
      `}
      style={{ animation: 'toastSlideIn 0.25s cubic-bezier(0.16,1,0.3,1) forwards' }}
    >
      {/* Icon */}
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-tight ${TITLE_STYLES[toast.type]}`}>
          {toast.title}
        </p>
        {toast.message && (
          <p className="mt-0.5 text-xs text-text-secondary leading-relaxed">{toast.message}</p>
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

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        className="shrink-0 p-0.5 opacity-50 hover:opacity-100 transition-opacity rounded"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Progress bar */}
      {!!duration && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-current opacity-10">
          <div
            ref={progressRef}
            className="h-full bg-current opacity-50"
            style={{ width: '100%', transition: 'none' }}
          />
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
    setToasts(prev => [...prev.slice(-4), { ...opts, id }]);
    return id;
  }, []);

  const success = useCallback((title: string, message?: string) =>
    toast({ type: 'success', title, message, duration: 4000 }), [toast]);
  const error   = useCallback((title: string, message?: string) =>
    toast({ type: 'error', title, message, duration: 8000 }), [toast]);
  const warning = useCallback((title: string, message?: string) =>
    toast({ type: 'warning', title, message, duration: 6000 }), [toast]);
  const info    = useCallback((title: string, message?: string) =>
    toast({ type: 'info', title, message, duration: 4000 }), [toast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, success, error, warning, info }}>
      {children}

      {/* Toast container — fixed top-right */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none"
        style={{ maxWidth: 380 }}
      >
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(calc(100% + 1rem)); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
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
