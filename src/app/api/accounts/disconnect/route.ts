import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { providerId } = await request.json();

  // Validate providerId is a supported provider
  const validProviders = ['google'];
  if (!validProviders.includes(providerId)) {
    return NextResponse.json({ error: 'Proveedor no válido' }, { status: 400 });
  }

  // Check if the account exists before trying to delete
  const account = await db.account.findFirst({
    where: { userId: user.id, provider: providerId },
  });

  if (!account) {
    return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 });
  }

  // Verify user has alternative login method
  const accounts = await db.account.findMany({ where: { userId: user.id } });
  const hasPassword = await db.user.findUnique({ where: { id: user.id }, select: { password: true } });

  if (providerId === 'google' && accounts.length <= 1 && !hasPassword?.password) {
    return NextResponse.json({ error: 'No puedes desvincular tu única cuenta' }, { status: 400 });
  }

  await db.account.deleteMany({
    where: { userId: user.id, provider: providerId },
  });

  return NextResponse.json({ success: true });
}
