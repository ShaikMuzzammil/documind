/**
 * proxy.ts – Next.js 16 route guard (replaces middleware.ts).
 *
 * ⚠ This file runs in the Edge Runtime – NO Node.js built-ins (fs, crypto,
 *   path, process.cwd …). Session verification is re-implemented with the
 *   Web Crypto API which is available everywhere.
 */
import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'documind_session';

/* ── Protected route lists ─────────────────────────────────────────── */
const PROTECTED_PAGES = [
  '/chat', '/documents', '/collections', '/analytics',
  '/export', '/search', '/help', '/settings', '/profile',
  '/workspace',
];
const PROTECTED_API = [
  '/api/chat', '/api/documents', '/api/collections',
  '/api/ingest', '/api/me', '/api/search', '/api/stats',
  '/api/export', '/api/workspace',
];

function isProtected(path: string): boolean {
  return (
    PROTECTED_PAGES.some((p) => path === p || path.startsWith(p + '/')) ||
    PROTECTED_API.some((p) => path === p || path.startsWith(p + '/'))
  );
}

/* ── Edge-compatible base64url helpers ─────────────────────────────── */
function base64urlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // Re-add stripped padding
  const padded = base64 + '=='.slice(0, (4 - (base64.length % 4)) % 4);
  return atob(padded);
}

/* ── Web Crypto HMAC-SHA256 verification ────────────────────────────── */
async function verifyHmac(payload: string, sig: string, secret: string): Promise<boolean> {
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const raw = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
    const expected = btoa(String.fromCharCode(...new Uint8Array(raw)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return expected === sig;
  } catch {
    return false;
  }
}

/* ── Session token verification (no Node.js imports) ───────────────── */
async function verifyToken(token: string): Promise<boolean> {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;

  const secret =
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV !== 'production' ? 'documind-dev-session-secret' : null);
  if (!secret) return false;

  if (!(await verifyHmac(payload, signature, secret))) return false;

  try {
    const decoded = JSON.parse(base64urlDecode(payload)) as {
      userId?: string;
      expiresAt?: number;
    };
    return Boolean(decoded.userId && decoded.expiresAt && decoded.expiresAt > Date.now());
  } catch {
    return false;
  }
}

/* ── Main handler ───────────────────────────────────────────────────── */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!isProtected(pathname)) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value ?? null;
  const valid = token ? await verifyToken(token) : false;

  if (!valid) {
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
    '/chat/:path*',       '/documents/:path*',  '/collections/:path*',
    '/analytics/:path*',  '/export/:path*',      '/search/:path*',
    '/help/:path*',       '/settings/:path*',    '/profile/:path*',
    '/workspace/:path*',
    '/api/chat/:path*',   '/api/documents/:path*', '/api/collections/:path*',
    '/api/ingest/:path*', '/api/me/:path*',       '/api/search/:path*',
    '/api/stats/:path*',  '/api/export/:path*',   '/api/workspace/:path*',
  ],
};
