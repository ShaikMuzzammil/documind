import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <p className="text-8xl font-black text-text-muted/30">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-sm text-text-muted">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent hover:bg-accent-light px-5 py-2.5 text-sm font-semibold text-white transition-colors">
        Back to Home
      </Link>
    </div>
  );
}
