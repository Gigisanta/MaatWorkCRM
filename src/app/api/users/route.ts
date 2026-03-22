import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';

// GET /api/users - List users for an organization
export async function GET(request: NextRequest) {
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

    // Get users who are members of the organization
    const members = await db.member.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
    });

    const users = members.map(m => m.user);

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
