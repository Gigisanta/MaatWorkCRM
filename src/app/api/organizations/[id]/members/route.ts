import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/organizations/[id]/members - List organization members
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const members = await db.member.findMany({
      where: { organizationId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Error al obtener miembros' }, { status: 500 });
  }
}

// POST /api/organizations/[id]/members - Invite/add member to organization
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { email, role = 'member', name } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email es requerido' }, { status: 400 });
    }

    // Check if organization exists
    const organization = await db.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    // Find or create user
    let user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create a placeholder user (they can register later)
      user = await db.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          role: 'member',
          isActive: false, // Pending activation
        },
      });
    }

    // Check if already a member
    const existingMember = await db.member.findFirst({
      where: {
        organizationId: id,
        userId: user.id,
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: 'El usuario ya es miembro de la organización' }, { status: 400 });
    }

    // Add member
    const member = await db.member.create({
      data: {
        organizationId: id,
        userId: user.id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json({ member });
  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json({ error: 'Error al agregar miembro' }, { status: 500 });
  }
}

// DELETE /api/organizations/[id]/members - Remove member from organization
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId es requerido' }, { status: 400 });
    }

    // Find and delete member
    const member = await db.member.findFirst({
      where: {
        organizationId: id,
        userId,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 });
    }

    // Don't allow removing the last owner
    if (member.role === 'owner') {
      const ownerCount = await db.member.count({
        where: {
          organizationId: id,
          role: 'owner',
        },
      });

      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'No se puede eliminar el último propietario de la organización' },
          { status: 400 }
        );
      }
    }

    await db.member.delete({
      where: { id: member.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Error al eliminar miembro' }, { status: 500 });
  }
}
