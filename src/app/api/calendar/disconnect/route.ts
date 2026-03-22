import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export async function POST() {
  const request = NextRequest.next();
  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Delete sync state and webhook
  await db.calendarSyncState.deleteMany({ where: { userId: user.id } });
  await db.calendarWebhook.deleteMany({ where: { userId: user.id } });

  // Optionally unlink Google account too
  // await db.account.deleteMany({ where: { userId: user.id, providerId: 'google' } });

  return NextResponse.json({ success: true });
}
