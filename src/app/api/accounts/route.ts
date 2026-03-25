import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accounts = await db.account.findMany({
    where: { userId: user.id },
    select: { provider: true, type: true, createdAt: true },
  });

  const hasPassword = await db.user.findUnique({
    where: { id: user.id },
    select: { password: true },
  });

  return NextResponse.json({ accounts, hasPassword: !!hasPassword?.password });
}
