import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { hasPermission } from '@/lib/permissions';
import { Prisma } from '@prisma/client';

// GET /api/admin/users - List all users in the organization
export async function GET(request: NextRequest) {
  const currentUser = await getUserFromSession(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(currentUser.role, 'users:manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || '';
  const isActiveParam = searchParams.get('isActive');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {
    members: currentUser.organizationId
      ? { some: { organizationId: currentUser.organizationId } }
      : undefined,
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(role && { role }),
    ...(isActiveParam !== null && isActiveParam !== '' && {
      isActive: isActiveParam === 'true',
    }),
  };

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isActive: true,
        careerLevel: true,
        phone: true,
        managerId: true,
        createdAt: true,
        manager: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, limit });
}

// POST /api/admin/users - Invite/create user directly in the organization
export async function POST(request: NextRequest) {
  const currentUser = await getUserFromSession(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(currentUser.role, 'users:manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const organizationId = currentUser.organizationId;
  if (!organizationId) {
    return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
  }

  const body = await request.json();
  const { email, role = 'member', name, careerLevel, phone } = body;

  if (!email) {
    return NextResponse.json({ error: 'Email es requerido' }, { status: 400 });
  }

  // Check if current user is owner or admin in org
  const currentMember = await db.member.findFirst({
    where: { organizationId, userId: currentUser.id },
  });

  if (!currentMember || (currentMember.role !== 'owner' && currentMember.role !== 'admin')) {
    return NextResponse.json({ error: 'Solo owner o admin pueden invitar miembros' }, { status: 403 });
  }

  // Find or create user
  let targetUser = await db.user.findUnique({ where: { email } });

  if (!targetUser) {
    targetUser = await db.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        role: 'member',
        isActive: false,
      },
    });
  }

  // Check if already a member
  const existingMember = await db.member.findFirst({
    where: { organizationId, userId: targetUser.id },
  });

  if (existingMember) {
    return NextResponse.json({ error: 'El usuario ya es miembro de la organización' }, { status: 400 });
  }

  // Add member
  const member = await db.member.create({
    data: { organizationId, userId: targetUser.id, role },
  });

  // Update user fields if provided
  if (careerLevel || phone) {
    await db.user.update({
      where: { id: targetUser.id },
      data: { careerLevel, phone },
    });
  }

  const userWithMember = await db.user.findUnique({
    where: { id: targetUser.id },
    select: {
      id: true, name: true, email: true, image: true,
      role: true, isActive: true, careerLevel: true, phone: true, createdAt: true,
    },
  });

  return NextResponse.json({ user: userWithMember, member }, { status: 201 });
}
