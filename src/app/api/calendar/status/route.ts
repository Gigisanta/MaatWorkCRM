import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { google, calendar_v3 } from 'googleapis';
import { decryptTokenIfSet } from '@/lib/crypto';
import { jwtDecrypt } from 'jose';
import { hkdf } from '@panva/hkdf';

// Derive the encryption key using the same algorithm as NextAuth
async function getDerivedEncryptionKey(keyMaterial: string, salt: string): Promise<Uint8Array> {
  const derivedKey = await hkdf(
    'sha256',
    keyMaterial,
    salt || 'nextauth.authjs.com',
    `NextAuth.js Generated Encryption Key${salt ? ` (${salt})` : ''}`,
    32
  );
  return new Uint8Array(derivedKey);
}

// Get user from session - uses cookies() from next/headers like session-custom
async function getUserFromSessionCookies() {
  try {
    const cookieStore = await cookies();
    const dbToken = cookieStore.get('session_token')?.value;

    const isProduction = process.env.NODE_ENV === 'production';
    const baseCookieName = isProduction ? '__Secure-next-auth.session-token' : 'next-auth.session-token';

    // Try production cookie name first, with chunking
    let nextAuthToken: string | null = null;
    let chunkIndex = 0;
    while (chunkIndex <= 5) {
      const chunkName = chunkIndex === 0 ? baseCookieName : `${baseCookieName}.${chunkIndex}`;
      const chunk = cookieStore.get(chunkName)?.value;
      if (chunk) {
        nextAuthToken = (nextAuthToken || '') + chunk;
        chunkIndex++;
      } else {
        break;
      }
    }

    // Fallback: try development cookie name
    if (!nextAuthToken) {
      const fallbackName = isProduction ? 'next-auth.session-token' : '__Secure-next-auth.session-token';
      chunkIndex = 0;
      while (chunkIndex <= 5) {
        const chunkName = chunkIndex === 0 ? fallbackName : `${fallbackName}.${chunkIndex}`;
        const chunk = cookieStore.get(chunkName)?.value;
        if (chunk) {
          nextAuthToken = (nextAuthToken || '') + chunk;
          chunkIndex++;
        } else {
          break;
        }
      }
    }

    console.log('[CalendarStatus] Cookies in cookieStore:', cookieStore.getAll().map(c => ({ name: c.name, hasValue: !!c.value })));
    console.log('[CalendarStatus] dbToken:', !!dbToken, 'nextAuthToken:', !!nextAuthToken, 'length:', nextAuthToken?.length);

    // Database session (UUID token from custom credentials login)
    if (dbToken) {
      const session = await db.session.findUnique({
        where: { token: dbToken },
        include: {
          user: {
            select: {
              id: true, email: true, name: true, role: true, isActive: true, image: true, managerId: true,
              members: { take: 1, select: { organizationId: true, role: true } },
            },
          },
        },
      });

      if (session && session.expiresAt > new Date() && session.user?.isActive) {
        const primaryMembership = session.user.members[0];
        const accounts = await db.account.findMany({ where: { userId: session.user.id }, select: { provider: true } });
        return {
          id: session.user.id, email: session.user.email, name: session.user.name, role: session.user.role,
          isActive: session.user.isActive, image: session.user.image, managerId: session.user.managerId,
          organizationId: primaryMembership?.organizationId || null, organizationRole: primaryMembership?.role || null,
          linkedProviders: accounts.map((a) => a.provider),
        };
      }
    }

    // NextAuth JWT token (from Google OAuth)
    if (nextAuthToken) {
      const secret = process.env.NEXTAUTH_SECRET;
      if (!secret) {
        console.log('[CalendarStatus] NEXTAUTH_SECRET not set');
        return null;
      }

      const encryptionKey = await getDerivedEncryptionKey(secret, '');
      try {
        const result = await jwtDecrypt(nextAuthToken, encryptionKey, { clockTolerance: 15 });
        const payload = result.payload;
        const userId = payload.id || payload.sub;

        console.log('[CalendarStatus] JWT payload:', JSON.stringify(payload).substring(0, 100));

        if (userId && typeof userId === 'string') {
          const user = await db.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true, role: true, isActive: true, image: true, managerId: true,
              members: { take: 1, select: { organizationId: true, role: true } } },
          });

          if (user && user.isActive) {
            const primaryMembership = user.members[0];
            const accounts = await db.account.findMany({ where: { userId: user.id }, select: { provider: true } });
            return {
              id: user.id, email: user.email, name: user.name, role: user.role, isActive: user.isActive,
              image: user.image, managerId: user.managerId,
              organizationId: primaryMembership?.organizationId || null, organizationRole: primaryMembership?.role || null,
              linkedProviders: accounts.map((a) => a.provider),
            };
          }
        }
      } catch (jwtError) {
        console.error('[CalendarStatus] JWT decrypt error:', jwtError);
      }
    }

    return null;
  } catch (error) {
    console.error('[CalendarStatus] getUserFromSessionCookies error:', error);
    return null;
  }
}

function createCalendarClient(accessToken: string, refreshToken?: string | null): calendar_v3.Calendar {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + '/api/auth/callback/google'
  );
  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken ? decryptTokenIfSet(refreshToken) ?? undefined : undefined,
  });
  return google.calendar({ version: 'v3', auth });
}

async function getGoogleCalendars(accessToken: string, refreshToken?: string | null): Promise<{ calendars: calendar_v3.Schema$CalendarListEntry[]; error?: string }> {
  try {
    const calendar = createCalendarClient(accessToken, refreshToken);
    const res = await calendar.calendarList.list({ maxResults: 100 });
    return { calendars: res.data.items ?? [] };
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    const errorCode = error?.code || error?.status || '';
    const errorResponse = error?.response?.data;
    const googleError = errorResponse?.error || '';
    const googleErrorDescription = errorResponse?.error_description || '';

    console.error('[CalendarStatus] Failed to list calendars:', {
      message: errorMessage,
      code: errorCode,
      googleError,
      googleErrorDescription,
    });

    // Return error info so the API can report it properly
    return {
      calendars: [],
      error: googleErrorDescription || googleError || errorMessage,
    };
  }
}

export async function GET(request: NextRequest) {
  // Use cookies() from next/headers (like session-custom) instead of request.cookies
  const user = await getUserFromSessionCookies();
  if (!user) {
    console.log('[CalendarStatus] No user from session - returning 401');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[CalendarStatus] User authenticated:', user.email);

  const googleAccount = await db.account.findFirst({
    where: { userId: user.id, provider: 'google' },
  });

  const syncState = await db.calendarSyncState.findFirst({
    where: { userId: user.id },
  });

  const membership = await db.member.findFirst({
    where: { userId: user.id },
  });

  let calendars: { id: string; name: string; selected: boolean }[] = [];
  let selectedCalendarIds: string[] = ['primary'];

  let calendarError: string | undefined;

  // If connected, fetch real calendar list from Google
  if (googleAccount?.access_token) {
    const accessToken = decryptTokenIfSet(googleAccount.access_token) ?? googleAccount.access_token;
    const refreshToken = googleAccount.refresh_token ?? undefined;
    const result = await getGoogleCalendars(accessToken, refreshToken);
    calendarError = result.error;

    calendars = result.calendars.map((cal) => ({
      id: cal.id ?? 'primary',
      name: cal.summary ?? cal.id ?? 'Unknown',
      selected: (selectedCalendarIds).includes(cal.id ?? 'primary'),
    }));
  }

  return NextResponse.json({
    connected: !!googleAccount,
    email: googleAccount?.providerAccountId ?? null,
    syncStatus: syncState?.syncStatus ?? 'idle',
    lastSyncedAt: syncState?.lastSyncedAt ?? null,
    errorCount: syncState?.errorCount ?? 0,
    calendars,
    selectedCalendarIds,
    error: calendarError,
  });
}
