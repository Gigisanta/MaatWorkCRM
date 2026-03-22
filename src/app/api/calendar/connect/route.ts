import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth-helpers';

// This redirects to Google OAuth consent
// Frontend calls signIn('google', { callbackUrl: '/settings/google-calendar?connected=1' })
export async function POST(request: NextRequest) {
  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // The actual connection happens via NextAuth OAuth flow
  // This endpoint exists for API-based connection if needed
  return NextResponse.json({
    url: `/api/auth/signin/google?callbackUrl=${encodeURIComponent('/settings/google-calendar?connected=1')}`
  });
}
