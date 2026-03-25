import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getUserFromSession } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/users/[id] - Get user by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const sessionUser = await getUserFromSession(request);
    if (!sessionUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const { id } = await params;

    logger.debug({ operation: 'getUser', requestId }, 'Fetching user by ID');

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        phone: true,
        bio: true,
        isActive: true,
        managerId: true,
        createdAt: true,
        updatedAt: true,
        members: {
          select: {
            organizationId: true,
            role: true,
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      logger.warn({ operation: 'getUser', requestId }, 'Usuario no encontrado');
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404, headers: { 'x-request-id': requestId } }
      );
    }

    logger.info({ operation: 'getUser', requestId, userId: id, duration_ms: Date.now() - start }, 'Usuario obtenido exitosamente');
    return NextResponse.json({ user }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'getUser', requestId, duration_ms: Date.now() - start }, 'Error al obtener usuario');
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}

// PUT /api/users/[id] - Update user profile
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const { id } = await params;
    if (user.id !== id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    const body = await request.json();
    const { name, email, phone, image, bio } = body;

    logger.debug({ operation: 'updateUser', requestId, userId: id }, 'Iniciando actualizacion de usuario');

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      logger.warn({ operation: 'updateUser', requestId, userId: id }, 'Usuario no encontrado para actualizacion');
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404, headers: { 'x-request-id': requestId } }
      );
    }

    // If email is being changed, check if it's already taken
    if (email && email !== existingUser.email) {
      const emailTaken = await db.user.findUnique({
        where: { email },
      });
      if (emailTaken) {
        logger.warn({ operation: 'updateUser', requestId, userId: id }, 'El email ya esta en uso');
        return NextResponse.json(
          { error: 'El email ya esta en uso' },
          { status: 400, headers: { 'x-request-id': requestId } }
        );
      }
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id },
      data: {
        name: name ?? existingUser.name,
        email: email ?? existingUser.email,
        phone: phone ?? existingUser.phone,
        image: image ?? existingUser.image,
        bio: bio ?? existingUser.bio,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        phone: true,
        bio: true,
        isActive: true,
      },
    });

    logger.info({ operation: 'updateUser', requestId, userId: id, duration_ms: Date.now() - start }, 'Usuario actualizado exitosamente');
    return NextResponse.json({ user: updatedUser }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'updateUser', requestId, duration_ms: Date.now() - start }, 'Error al actualizar usuario');
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}

// DELETE /api/users/[id] - Delete user account
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const { id } = await params;
    if (user.id !== id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    logger.debug({ operation: 'deleteUser', requestId, userId: id }, 'Iniciando eliminacion de usuario');

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      logger.warn({ operation: 'deleteUser', requestId, userId: id }, 'Usuario no encontrado para eliminacion');
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404, headers: { 'x-request-id': requestId } }
      );
    }

    // Delete user (cascade will handle related records)
    await db.user.delete({
      where: { id },
    });

    logger.info({ operation: 'deleteUser', requestId, userId: id, duration_ms: Date.now() - start }, 'Usuario eliminado exitosamente');
    return NextResponse.json({ success: true }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'deleteUser', requestId, duration_ms: Date.now() - start }, 'Error al eliminar usuario');
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}
