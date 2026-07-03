'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/lib/use-user';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useUser();

  useEffect(() => {
    if (loading || user) return;
    const next = `${window.location.pathname}${window.location.search}`;
    router.replace(`/auth?next=${encodeURIComponent(next)}`);
  }, [loading, router, user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-card px-4 py-3 text-sm text-text-secondary">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking your workspace
        </div>
      </div>
    );
  }

  return children;
}
