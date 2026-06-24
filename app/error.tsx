'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[DocuMind Error]', error);
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-text-secondary text-sm mb-2">
          {error.message || 'An unexpected error occurred.'}
        </p>
        {error.digest && (
          <p className="text-text-muted text-xs font-mono mb-6">
            Error ID: {error.digest}
          </p>
        )}
        <button onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:opacity-90 text-white font-semibold rounded-xl transition-opacity text-sm">
          <RefreshCw className="w-4 h-4" /> Try again
        </button>
      </div>
    </div>
  );
}
