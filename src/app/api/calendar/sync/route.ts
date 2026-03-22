import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth-helpers';
import { calendarSyncEngine } from '@/lib/google-calendar/sync-engine';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { action = 'delta' } = await request.json().catch(() => ({}));

  // Get user's organization
  const membership = await db.member.findFirst({
    where: { userId: user.id },
  });

  if (!membership) {
    return NextResponse.json({ error: 'No organization found' }, { status: 400 });
  }

  try {
    if (action === 'full') {
      const { synced } = await calendarSyncEngine.initialSync(user.id, membership.organizationId);
      return NextResponse.json({ success: true, action, synced });
    } else {
      const { synced, direction } = await calendarSyncEngine.deltaSync(user.id, membership.organizationId);
      return NextResponse.json({ success: true, action, synced, direction });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 });
  }
}
