import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * MaatWork CRM Middleware
 *
 * Auth Architecture:
 * ------------------
 * This application uses a two-layer authentication system:
 *
 * 1. NextAuth.js (OAuth) - Handles Google OAuth login at /api/auth/*
 *    NextAuth manages the session cookies and provides session via getServerSession().
 *    This covers the primary authentication flow.
 *
 * 2. Custom Credentials Session - For API routes that need server-side validation
 *    of a custom JWT payload (userId, role, managerId). The JWT is verified using
 *    JWT_SECRET. If JWT_SECRET is not set, server-side JWT validation is skipped.
 *
 * Route Protection Strategy:
 * ---------------------------
 * - Public routes (/login, /register): Pass through with CSP headers
 * - API routes (/api/*): Pass through with CSP headers; API routes are responsible
 *   for their own auth checks and return proper JSON error responses
 * - Protected routes: Pass through with CSP headers; client-side components
 *   call /api/auth/session to validate session before rendering sensitive data
 *
 * CSP Headers:
 * -------------
 * Content Security Policy is configured for Google OAuth flows including:
 * - accounts.google.com, oauth2.googleapis.com, www.googleapis.com
 * - www.accounts.google.com (for auth)
 * - Vercel deployment URL for API callbacks
 */

const CSP_SECRET = process.env.CSP_SECRET || process.env.AUTH_SECRET;
if (!CSP_SECRET) {
  throw new Error('CRITICAL: CSP_SECRET or AUTH_SECRET environment variable is required');
}

// Generate a deterministic nonce from the secret (stable across requests)
function generateStableNonce(): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(CSP_SECRET + '-maatwork-csp-nonce');
  // Use a hash-like transformation for the nonce
  let hash = 0;
  const str = CSP_SECRET.slice(0, 32);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return btoa(String.fromCharCode(...new Uint8Array([...str].map(c => c.charCodeAt(0) ^ (hash & 0xFF))))).slice(0, 24);
}

export default async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const nonce = generateStableNonce();

  // Security headers configuration
  // Note: 'strict-dynamic' is not used because Next.js 16 + Turbopack injects script tags
  // at runtime that don't carry the CSP nonce. Instead we allow explicit host sources.
  const vercelUrl = process.env.VERCEL_URL || 'maatworkcrm.vercel.app';
  const securityHeaders = {
    'Content-Security-Policy': [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://${vercelUrl} https://*.vercel.app`,
      `style-src 'self' 'unsafe-inline' https://${vercelUrl}`,
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      `connect-src 'self' http://localhost:* ws://localhost:* https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://www.accounts.google.com https://${vercelUrl} https://*.vercel.app`,
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

  // Helper to apply security headers to any response
  const applySecurityHeaders = (response: NextResponse): NextResponse => {
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    response.headers.set('x-nonce', nonce);
    return response;
  };

  // Public routes - skip auth, pass through with CSP headers
  if (url.pathname.startsWith('/login') || url.pathname.startsWith('/register')) {
    return applySecurityHeaders(NextResponse.next());
  }

  // API routes - pass through with CSP headers
  // API routes handle their own auth and return proper JSON error responses
  if (url.pathname.startsWith('/api/')) {
    return applySecurityHeaders(NextResponse.next());
  }

  // All other routes (protected routes) - pass through with CSP headers
  // Client-side components validate session via /api/auth/session before rendering
  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
