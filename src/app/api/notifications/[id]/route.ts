import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getUserFromSession } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/notifications/[id] - Get a single notification
export async function GET(request: NextRequest, { params }: RouteParams) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const { id } = await params;

  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401, headers: { 'x-request-id': requestId } });
  }

  try {
    logger.debug({ operation: 'getNotificationById', requestId, notificationId: id }, 'Obteniendo notificacion por ID');

    const notification = await db.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      logger.warn({ operation: 'getNotificationById', requestId, notificationId: id }, 'Notificacion no encontrada');
      return NextResponse.json({ error: 'Notificacion no encontrada' }, { status: 404, headers: { 'x-request-id': requestId } });
    }

    if (notification.userId !== user.id) {
      logger.warn({ operation: 'getNotificationById', requestId, notificationId: id, userId: user.id }, 'Acceso denegado: notificacion no pertenece al usuario');
      return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    logger.info({ operation: 'getNotificationById', requestId, notificationId: id, duration_ms: Date.now() - start }, 'Notificacion obtenida exitosamente');
    return NextResponse.json(notification, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'getNotificationById', requestId, notificationId: id, duration_ms: Date.now() - start }, 'Error al obtener notificacion');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}

// PATCH /api/notifications/[id] - Update a notification (e.g., mark as read)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const { id } = await params;

  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401, headers: { 'x-request-id': requestId } });
  }

  try {
    logger.debug({ operation: 'updateNotification', requestId, notificationId: id }, 'Actualizando notificacion');

    const body = await request.json();
    const { isRead } = body;

    // Check ownership BEFORE mutation to prevent unauthorized updates
    const existing = await db.notification.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Notificacion no encontrada' }, { status: 404, headers: { 'x-request-id': requestId } });
    }
    if (existing.userId !== user.id) {
      logger.warn({ operation: 'updateNotification', requestId, notificationId: id, userId: user.id }, 'Acceso denegado: notificacion no pertenece al usuario');
      return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    const notification = await db.notification.update({
      where: { id },
      data: {
        ...(isRead !== undefined && { isRead }),
      },
    });

    logger.info({ operation: 'updateNotification', requestId, notificationId: id, duration_ms: Date.now() - start }, 'Notificacion actualizada exitosamente');
    return NextResponse.json(notification, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'updateNotification', requestId, notificationId: id, duration_ms: Date.now() - start }, 'Error al actualizar notificacion');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}

// DELETE /api/notifications/[id] - Delete a notification
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const { id } = await params;

  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401, headers: { 'x-request-id': requestId } });
  }

  try {
    logger.debug({ operation: 'deleteNotification', requestId, notificationId: id }, 'Eliminando notificacion');

    const notification = await db.notification.findUnique({ where: { id } });
    if (!notification) {
      return NextResponse.json({ error: 'Notificacion no encontrada' }, { status: 404, headers: { 'x-request-id': requestId } });
    }
    if (notification.userId !== user.id) {
      logger.warn({ operation: 'deleteNotification', requestId, notificationId: id, userId: user.id }, 'Acceso denegado: notificacion no pertenece al usuario');
      return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    await db.notification.delete({ where: { id } });

    logger.info({ operation: 'deleteNotification', requestId, notificationId: id, duration_ms: Date.now() - start }, 'Notificacion eliminada exitosamente');
    return NextResponse.json({ success: true }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'deleteNotification', requestId, notificationId: id, duration_ms: Date.now() - start }, 'Error al eliminar notificacion');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}
