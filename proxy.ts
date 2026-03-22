import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : (() => { throw new Error('JWT_SECRET environment variable is required'); })();

// Session cache for verified tokens
interface CachedSession {
  payload: { userId: string; role: string; managerId?: string };
  expiry: number;
}

const SESSION_CACHE_TTL = 300000; // 5 minutes in ms
const sessionCache = new Map<string, CachedSession>();

// Security headers configuration
const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    `connect-src 'self' http://localhost:* ws://localhost:* https://${process.env.VERCEL_URL || 'maatworkcrm.vercel.app'}`,
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export async function proxy(request: NextRequest) {
  const url = new URL(request.url);

  // Public routes - skip auth
  if (url.pathname.startsWith('/login') || url.pathname.startsWith('/register')) {
    const response = NextResponse.next();
    // Apply security headers to public routes too
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // API routes - skip auth redirect, let them return proper JSON responses
  if (url.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // For protected routes, just pass through with security headers.
  // Session validation is handled by /api/auth/session on the client side.
  // TODO: Add server-side session validation via database lookup if needed.
  const response = NextResponse.next();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
