import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-bold gradient-text">404</p>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-text-secondary max-w-sm">The page you are looking for does not exist or has been moved.</p>
      <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
        Back to home
      </Link>
    </div>
  );
}
