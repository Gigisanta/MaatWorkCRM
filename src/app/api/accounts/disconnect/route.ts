import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { providerId } = await request.json();

  // Verify user has alternative login method
  const accounts = await db.account.findMany({ where: { userId: user.id } });
  const hasPassword = await db.user.findUnique({ where: { id: user.id }, select: { password: true } });

  if (providerId === 'google' && accounts.length <= 1 && !hasPassword?.password) {
    return NextResponse.json({ error: 'No puedes desvincular tu única cuenta' }, { status: 400 });
  }

  await db.account.deleteMany({
    where: { userId: user.id, providerId },
  });

  return NextResponse.json({ success: true });
}
