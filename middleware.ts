import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// ─── Verify NextAuth JWT token (v4 uses JWS, not JWE) ─────────────────────
// NextAuth v4 stores sessions as JWTs signed with NEXTAUTH_SECRET (JWS, not JWE)
// We use jwtVerify to verify the signature at the edge
async function decryptNextAuthToken(token: string): Promise<{ id?: string; sub?: string } | null> {
  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) return null;

    // NextAuth v4 uses HS256 signed JWTs
    const secretBytes = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretBytes, {
      algorithms: ['HS256'],
      clockTolerance: 15,
    });
    return payload as { id?: string; sub?: string };
  } catch {
    return null;
  }
}

// ─── Protected routes that require authentication ─────────────────────────
const PROTECTED_PATHS = ['/api/', '/dashboard', '/contacts', '/pipeline', '/tasks', '/calendar', '/reports', '/teams', '/training'];

// ─── Public routes that should not redirect ──────────────────────────────
const PUBLIC_PATHS = ['/login', '/register', '/api/auth/', '/api/auth/session', '/api/auth/session-custom', '/privacy-policy', '/terms'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(prefix => pathname.startsWith(prefix));
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(prefix => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip non-protected routes
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check for session token
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieName = isProduction ? '__Secure-next-auth.session-token' : 'next-auth.session-token';
  const sessionToken = request.cookies.get(cookieName)?.value;

  // Also check chunked cookies
  let fullToken = sessionToken;
  for (let i = 0; i <= 5; i++) {
    const chunkName = i === 0 ? cookieName : `${cookieName}.${i}`;
    const chunk = request.cookies.get(chunkName)?.value;
    if (chunk) {
      fullToken = (fullToken || '') + chunk;
    } else {
      break;
    }
  }

  // No NextAuth token - let API routes handle DB session validation
  // (Edge middleware cannot make DB calls, so we pass through for UUID tokens)
  if (!fullToken) {
    const dbToken = request.cookies.get('session_token')?.value;
    if (dbToken) {
      // UUID token - pass through, API route will validate with DB
      return NextResponse.next();
    }

    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Try to verify the NextAuth JWS token at edge
  // (This is the only validation we can do without DB access)
  try {
    const payload = await decryptNextAuthToken(fullToken);
    if (!payload?.id && !payload?.sub) {
      // Invalid JWT - let API routes do full validation
      return NextResponse.next();
    }
  } catch (error) {
    console.error('[Edge Middleware] Token validation error:', error);
    // On error, pass through and let API routes do proper validation
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
