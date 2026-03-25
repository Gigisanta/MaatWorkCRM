import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getCachedUsers } from '@/lib/cache';

// GET /api/users - List users for an organization
export async function GET(request: NextRequest) {
  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': request.headers.get('x-request-id') || '' } });
  }

  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'listUsers', requestId }, 'Iniciando obtencion de usuarios');

    const searchParams = await request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      logger.warn({ operation: 'listUsers', requestId }, 'organizationId es requerido');
      return NextResponse.json(
        { error: 'organizationId es requerido' },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    // Verify session user belongs to the requested organization
    if (organizationId !== user.organizationId) {
      logger.warn({ operation: 'listUsers', requestId, organizationId }, 'Acceso denegado a organizacion');
      return NextResponse.json(
        { error: 'No perteneces a esta organización' },
        { status: 403, headers: { 'x-request-id': requestId } }
      );
    }

    // Get cached users for organization
    const users = await getCachedUsers(organizationId);

    logger.info({ operation: 'listUsers', requestId, organizationId, count: users.length, duration_ms: Date.now() - start }, 'Usuarios obtenidos exitosamente');
    return NextResponse.json({ users }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'listUsers', requestId, duration_ms: Date.now() - start }, 'Error al obtener usuarios');
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}
