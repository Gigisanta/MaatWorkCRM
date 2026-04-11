import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { db } from '@/lib/db/db';
import { logger } from '@/lib/db/logger';

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
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
  } catch (error) {
    logger.error({ operation: 'GET /api/accounts', requestId, error }, 'Error fetching accounts');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
