import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const matcher = [
  '/dashboard/:path*',
  '/contacts/:path*',
  '/pipeline/:path*',
  '/tasks/:path*',
  '/calendar/:path*',
  '/reports/:path*',
  '/teams/:path*',
  '/training/:path*',
  '/notifications/:path*',
  '/settings/:path*',
];

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

  const isProtectedPath = PROTECTED_PATHS.some(path =>
    pathname === path || pathname.startsWith(path + '/')
  );
  const isAuthPath = AUTH_PATHS.some(path => pathname === path);

  if (isProtectedPath) {
    // Check session_token cookie for database session auth
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isAuthPath && request.cookies.get('session_token')) {
    // Already authenticated, redirect to home
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}
