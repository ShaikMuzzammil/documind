import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth';

// Routes that require an active session. Every sub-path is protected.
const PROTECTED = [
  '/chat', '/documents', '/collections', '/analytics',
  '/export', '/search', '/help', '/settings', '/profile',
  '/workspace',
];

// API routes that require auth (handled by requireCurrentUser inside the
// route itself, but we also check here for belt-and-suspenders).
const PROTECTED_API = [
  '/api/chat', '/api/documents', '/api/collections',
  '/api/ingest', '/api/me', '/api/search', '/api/stats',
  '/api/export', '/api/workspace',
];

function isProtected(path: string): boolean {
  return PROTECTED.some((p) => path === p || path.startsWith(p + '/'))
    || PROTECTED_API.some((p) => path === p || path.startsWith(p + '/'));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!isProtected(pathname)) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value ?? null;
  const session = verifySessionToken(token);

  if (!session) {
    // API routes return 401 JSON; page routes redirect to /auth
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/auth';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/chat/:path*', '/documents/:path*', '/collections/:path*',
    '/analytics/:path*', '/export/:path*', '/search/:path*',
    '/help/:path*', '/settings/:path*', '/profile/:path*',
    '/workspace/:path*',
    '/api/chat/:path*', '/api/documents/:path*', '/api/collections/:path*',
    '/api/ingest/:path*', '/api/me/:path*', '/api/search/:path*',
    '/api/stats/:path*', '/api/export/:path*', '/api/workspace/:path*',
  ],
};
