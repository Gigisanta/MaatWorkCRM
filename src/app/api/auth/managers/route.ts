import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'getManagers', requestId }, 'Fetching managers');

    // Get users with manager/owner/admin roles
    const managers = await db.user.findMany({
      where: {
        role: {
          in: ['manager', 'owner', 'admin'],
        },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    logger.info({ operation: 'getManagers', requestId, count: managers.length, duration_ms: Date.now() - start }, 'Managers fetched successfully');

    return NextResponse.json({
      managers,
    });
  } catch (error) {
    logger.error({ err: error, operation: 'getManagers', requestId, duration_ms: Date.now() - start }, 'Failed to fetch managers');
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
