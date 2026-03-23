import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// POST /api/notifications - Create a notification
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'createNotification', requestId }, 'Creando notificacion');

    const body = await request.json();
    const { userId, organizationId, type, title, message, actionUrl } = body;

    if (!userId || !organizationId || !type || !title || !message) {
      logger.warn({ operation: 'createNotification', requestId }, 'Faltan campos requeridos para crear notificacion');
      return NextResponse.json(
        { error: 'userId, organizationId, type, title, and message are required' },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    const notification = await db.notification.create({
      data: {
        userId,
        organizationId,
        type,
        title,
        message,
        actionUrl,
        isRead: false,
      },
    });

    logger.info({ operation: 'createNotification', requestId, notificationId: notification.id, duration_ms: Date.now() - start }, 'Notificacion creada exitosamente');
    return NextResponse.json(notification, { status: 201, headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'createNotification', requestId, duration_ms: Date.now() - start }, 'Error al crear notificacion');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}

// GET /api/notifications - List user notifications
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'listNotifications', requestId }, 'Obteniendo lista de notificaciones');

    const { searchParams } = await request.nextUrl;
    const userId = searchParams.get('userId');
    const organizationId = searchParams.get('organizationId');
    const isRead = searchParams.get('isRead');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!userId || !organizationId) {
      logger.warn({ operation: 'listNotifications', requestId }, 'Faltan parametros requeridos: userId u organizationId');
      return NextResponse.json({ error: 'userId and organizationId are required' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId, organizationId };

    if (isRead !== null && isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    if (type) {
      where.type = type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.notification.count({ where }),
      db.notification.count({ where: { userId, organizationId, isRead: false } }),
    ]);

    logger.info({ operation: 'listNotifications', requestId, count: notifications.length, total, unreadCount, duration_ms: Date.now() - start }, 'Notificaciones obtenidas exitosamente');
    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'listNotifications', requestId, duration_ms: Date.now() - start }, 'Error al obtener notificaciones');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}
