import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE, verifyToken } from '@/lib/auth';

// Endpoints that authenticate themselves (Telegram secret / cron secret) or are part of login.
const PUBLIC_API_PREFIXES = ['/api/auth/login', '/api/auth/logout', '/api/telegram/', '/api/cron/'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const session = token ? verifyToken(token) : null;

  if (pathname.startsWith('/api/')) {
    if (PUBLIC_API_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
      return NextResponse.next();
    }
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname === '/' && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/api/:path*'],
};
