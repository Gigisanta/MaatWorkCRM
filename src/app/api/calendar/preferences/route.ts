import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const membership = await db.member.findFirst({
    where: { userId: user.id },
  });

  if (!membership) {
    return NextResponse.json({ error: 'No organization found' }, { status: 400 });
  }

  const org = await db.organization.findUnique({
    where: { id: membership.organizationId },
    select: { calendarPreferences: true },
  });

  const prefs = (org?.calendarPreferences as { selectedCalendarIds?: string[] } | null) ?? {
    selectedCalendarIds: ['primary'],
  };

  return NextResponse.json({ selectedCalendarIds: prefs.selectedCalendarIds ?? ['primary'] });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const membership = await db.member.findFirst({
    where: { userId: user.id },
  });

  if (!membership) {
    return NextResponse.json({ error: 'No organization found' }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.calendars)) {
    return NextResponse.json({ error: 'Invalid request: calendars array required' }, { status: 400 });
  }

  await db.organization.update({
    where: { id: membership.organizationId },
    data: {
      calendarPreferences: { selectedCalendarIds: body.calendars },
    },
  });

  return NextResponse.json({ success: true });
}
