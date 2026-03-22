import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { canBeManager } from '@/lib/permissions';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const body = await request.json();
    const { fullName, email, password, role, managerId } = body;

    logger.info({ operation: 'register', requestId, email }, 'Registration attempt');

    // Validate input
    if (!fullName || !email || !password || !role) {
      logger.warn({ operation: 'register', requestId, reason: 'missing_fields' }, 'Registration validation failed');
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.warn({ operation: 'register', requestId, email, reason: 'invalid_email' }, 'Registration validation failed');
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      logger.warn({ operation: 'register', requestId, reason: 'weak_password' }, 'Registration validation failed');
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['advisor', 'manager', 'staff', 'owner'];
    if (!validRoles.includes(role)) {
      logger.warn({ operation: 'register', requestId, role, reason: 'invalid_role' }, 'Registration validation failed');
      return NextResponse.json(
        { error: 'Rol inválido' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      logger.warn({ operation: 'register', requestId, email, reason: 'email_exists' }, 'Registration failed');
      return NextResponse.json(
        { error: 'Ya existe una cuenta con este email' },
        { status: 400 }
      );
    }

    // If role is advisor, validate managerId
    if (role === 'advisor') {
      if (!managerId) {
        logger.warn({ operation: 'register', requestId, reason: 'missing_manager' }, 'Registration validation failed');
        return NextResponse.json(
          { error: 'Debes seleccionar un gerente' },
          { status: 400 }
        );
      }

      const manager = await db.user.findUnique({
        where: { id: managerId },
      });

      if (!manager || !canBeManager(manager.role)) {
        logger.warn({ operation: 'register', requestId, managerId, reason: 'invalid_manager' }, 'Registration validation failed');
        return NextResponse.json(
          { error: 'Gerente inválido' },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        name: fullName,
        password: hashedPassword,
        role,
        managerId: role === 'advisor' ? managerId : null,
        isActive: false,
      },
    });

    logger.info({ operation: 'register', requestId, userId: user.id, email: user.email, role: user.role, duration_ms: Date.now() - start }, 'Registration success');

    return NextResponse.json({
      message: 'Cuenta creada exitosamente. Pendiente de aprobación.',
      userId: user.id,
    });
  } catch (error) {
    logger.error({ err: error, operation: 'register', requestId, duration_ms: Date.now() - start }, 'Registration failed');
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
