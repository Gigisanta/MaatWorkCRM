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

  return NextResponse.json({ selectedCalendarIds: ['primary'] });
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

  return NextResponse.json({ success: true });
}
