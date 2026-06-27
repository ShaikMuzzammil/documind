import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = [
  '/chat','/documents','/collections','/analytics',
  '/export','/settings','/search','/profile','/workspace','/help',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected  = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isProtected) return NextResponse.next();
  const session = req.cookies.get('dm_session');
  if (!session?.value) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/chat/:path*','/documents/:path*','/collections/:path*',
    '/analytics/:path*','/export/:path*','/settings/:path*',
    '/search/:path*','/profile/:path*','/workspace/:path*','/help/:path*',
  ],
};
