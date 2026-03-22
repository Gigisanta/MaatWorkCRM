import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const googleAccount = await db.account.findFirst({
    where: { userId: user.id, providerId: 'google' },
  });

  const syncState = await db.calendarSyncState.findFirst({
    where: { userId: user.id },
  });

  return NextResponse.json({
    connected: !!googleAccount,
    email: googleAccount?.providerAccountId,
    syncStatus: syncState?.syncStatus || 'idle',
    lastSyncedAt: syncState?.lastSyncedAt || null,
    errorCount: syncState?.errorCount || 0,
  });
}
