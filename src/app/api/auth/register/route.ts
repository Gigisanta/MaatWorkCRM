import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { canBeManager } from '@/lib/roles';
import { logger } from '@/lib/db/logger';

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
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique slug for the new organization
    const baseSlug = email.toLowerCase().split('@')[0].replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);
    const orgSlug = `${baseSlug}-${uniqueSuffix}`;
    const orgName = `${fullName}'s Organization`;

    // Create user and organization
    const newUser = await db.user.create({
      data: {
        email: email.toLowerCase(),
        name: fullName,
        password: hashedPassword,
        role,
        managerId: role === 'advisor' ? managerId : null,
        isActive: true,
      },
    });

    const organization = await db.organization.create({
      data: {
        name: orgName,
        slug: orgSlug,
      },
    });

    await db.member.create({
      data: {
        userId: newUser.id,
        organizationId: organization.id,
        role: 'owner',
      },
    });

    // Seed pipeline stages using createMany (avoids N sequential queries)
    const stageNames = [
      { name: 'Prospecto', order: 0, color: '#8B5CF6', isDefault: true, isActive: true },
      { name: 'Contactado', order: 1, color: '#3B82F6', isDefault: false, isActive: true },
      { name: 'Primera Reunión', order: 2, color: '#F59E0B', isDefault: false, isActive: true },
      { name: 'Segunda Reunión', order: 3, color: '#10B981', isDefault: false, isActive: true },
      { name: 'Apertura', order: 4, color: '#6366F1', isDefault: false, isActive: true },
      { name: 'Cliente', order: 5, color: '#22C55E', isDefault: false, isActive: true },
      { name: 'Caído', order: 6, color: '#EF4444', isDefault: false, isActive: true },
      { name: 'Cuenta Vacía', order: 7, color: '#6B7280', isDefault: false, isActive: true },
    ];

    await db.pipelineStage.createMany({
      data: stageNames.map(stage => ({ ...stage, organizationId: organization.id })),
    });

    logger.info({ operation: 'register', requestId, userId: newUser.id, email: newUser.email, role: newUser.role, duration_ms: Date.now() - start }, 'Registration success');

    return NextResponse.json({
      message: 'Cuenta creada exitosamente.',
      userId: newUser.id,
    });
  } catch (error) {
    logger.error({ err: error, operation: 'register', requestId, duration_ms: Date.now() - start }, 'Registration failed');
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
