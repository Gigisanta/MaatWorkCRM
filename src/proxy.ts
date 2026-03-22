import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PROTECTED_PATHS = ['/dashboard', '/contacts', '/pipeline', '/tasks', '/calendar', '/reports', '/teams', '/training', '/notifications', '/settings'];
const AUTH_PATHS = ['/login', '/register'];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Fast path - skip auth for public paths
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/api/auth/')
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  const isProtectedPath = PROTECTED_PATHS.some(path =>
    pathname === path || pathname.startsWith(path + '/')
  );
  const isAuthPath = AUTH_PATHS.some(path => pathname === path);

  if (isProtectedPath && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith('/api/cron/')) {
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}
