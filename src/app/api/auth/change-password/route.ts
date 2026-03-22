import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash, compare } from 'bcryptjs';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const body = await request.json();
    const { userId, currentPassword, newPassword } = body;

    logger.info({ operation: 'changePassword', requestId, userId }, 'Password change attempt');

    if (!userId || !currentPassword || !newPassword) {
      logger.warn({ operation: 'changePassword', requestId, reason: 'missing_fields' }, 'Password change validation failed');
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      logger.warn({ operation: 'changePassword', requestId, userId, reason: 'weak_password' }, 'Password change validation failed');
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      logger.warn({ operation: 'changePassword', requestId, userId, reason: 'user_not_found' }, 'Password change failed');
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verify current password
    if (!user.password) {
      logger.warn({ operation: 'changePassword', requestId, userId, reason: 'no_password' }, 'Password change failed');
      return NextResponse.json(
        { error: 'La cuenta no tiene contraseña configurada' },
        { status: 400 }
      );
    }

    const isValidPassword = await compare(currentPassword, user.password);
    if (!isValidPassword) {
      logger.warn({ operation: 'changePassword', requestId, userId, reason: 'invalid_current_password' }, 'Password change failed');
      return NextResponse.json(
        { error: 'La contraseña actual es incorrecta' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 10);

    // Update password
    await db.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    logger.info({ operation: 'changePassword', requestId, userId, duration_ms: Date.now() - start }, 'Password change success');

    return NextResponse.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    logger.error({ err: error, operation: 'changePassword', requestId, duration_ms: Date.now() - start }, 'Password change failed');
    return NextResponse.json({ error: 'Error al cambiar contraseña' }, { status: 500 });
  }
}
