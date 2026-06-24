import { NextRequest, NextResponse } from 'next/server';

// Cookie name must match lib/auth.ts SESSION_COOKIE
const SESSION_COOKIE = 'documind_session';

// Routes that require authentication
const PROTECTED_PREFIXES = [
  '/chat',
  '/documents',
  '/collections',
  '/analytics',
  '/export',
  '/settings',
];

// API routes that require authentication (everything except /api/auth/* and /api/me)
const PUBLIC_API_PREFIXES = ['/api/auth/', '/api/me'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow all static assets, Next.js internals, and public files through
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/public/')
  ) {
    return NextResponse.next();
  }

  // Protect page routes
  const isProtectedPage = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isProtectedPage) {
    const session = req.cookies.get(SESSION_COOKIE)?.value;
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = '/auth';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    // Quick expiry check — parse payload without full HMAC (API routes do full verification)
    const parts = session.split('.');
    if (parts.length >= 1) {
      try {
        const payload = JSON.parse(
          Buffer.from(parts[0], 'base64url').toString('utf8'),
        );
        if (payload.expiresAt && payload.expiresAt < Date.now()) {
          const url = req.nextUrl.clone();
          url.pathname = '/auth';
          url.searchParams.set('next', pathname);
          const res = NextResponse.redirect(url);
          res.cookies.delete(SESSION_COOKIE);
          return res;
        }
      } catch {
        // Malformed cookie — let it through to the page which will handle via useUser()
      }
    }
  }

  // Protect API routes
  const isPublicApi = PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));
  if (pathname.startsWith('/api/') && !isPublicApi) {
    const session = req.cookies.get(SESSION_COOKIE)?.value;
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except _next static files, images, and favicon
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
