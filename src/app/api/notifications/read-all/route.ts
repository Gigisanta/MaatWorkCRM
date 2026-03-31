import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getUserFromSession } from '@/lib/auth-helpers';

// POST /api/notifications/read-all - Mark all notifications as read
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
  }

  try {
    logger.debug({ operation: 'markAllNotificationsAsRead', requestId }, 'Marcando todas las notificaciones como leidas');

    const body = await request.json().catch(() => ({}));
    const { organizationId } = body;

    if (!organizationId) {
      logger.warn({ operation: 'markAllNotificationsAsRead', requestId }, 'Falta organizationId');
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    // Enforce organization isolation - cannot mark notifications for other orgs
    if (organizationId !== user.organizationId) {
      logger.warn({ operation: 'markAllNotificationsAsRead', requestId, organizationId, userOrgId: user.organizationId }, 'Access denied: org mismatch');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    // Use session userId, not from body - prevents marking other users' notifications
    const result = await db.notification.updateMany({
      where: {
        userId: user.id,
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
