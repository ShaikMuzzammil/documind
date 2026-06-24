import Link from 'next/link';
import { BrainCircuit, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-6">
          <BrainCircuit className="w-8 h-8 text-violet-400" />
        </div>
        <p className="text-7xl font-bold gradient-text mb-4">404</p>
        <h1 className="text-2xl font-bold mb-3">Page not found</h1>
        <p className="text-text-secondary text-sm mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:opacity-90 text-white font-semibold rounded-xl transition-opacity text-sm">
            <ArrowLeft className="w-4 h-4" /> Back home
          </Link>
          <Link href="/chat"
            className="inline-flex items-center gap-2 px-5 py-2.5 glass rounded-xl font-medium text-text-secondary hover:text-text-primary transition-colors text-sm">
            <Search className="w-4 h-4" /> Go to Chat
          </Link>
        </div>
      </div>
    </div>
  );
}
