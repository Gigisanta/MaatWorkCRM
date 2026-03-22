import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';

// POST /api/notifications/read-all - Mark all notifications as read
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'markAllNotificationsAsRead', requestId }, 'Marcando todas las notificaciones como leidas');

    const body = await request.json();
    const { userId, organizationId } = body;

    if (!userId || !organizationId) {
      logger.warn({ operation: 'markAllNotificationsAsRead', requestId }, 'Faltan parametros requeridos: userId u organizationId');
      return NextResponse.json({ error: 'userId and organizationId are required' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    const result = await db.notification.updateMany({
      where: {
        userId,
        organizationId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    logger.info({ operation: 'markAllNotificationsAsRead', requestId, updatedCount: result.count, duration_ms: Date.now() - start }, 'Notificaciones marcadas como leidas exitosamente');
    return NextResponse.json({
      success: true,
      updatedCount: result.count,
    }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'markAllNotificationsAsRead', requestId, duration_ms: Date.now() - start }, 'Error al marcar notificaciones como leidas');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}
