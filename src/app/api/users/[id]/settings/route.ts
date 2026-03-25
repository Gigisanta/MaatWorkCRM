import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// User settings type for notifications and preferences
interface UserSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  taskReminders: boolean;
  goalProgressAlerts: boolean;
  newLeadsNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
}

// GET /api/users/[id]/settings - Get user settings
export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Parse stored settings or return defaults
    let settings: UserSettings = {
      emailNotifications: true,
      pushNotifications: true,
      taskReminders: true,
      goalProgressAlerts: true,
      newLeadsNotifications: true,
      theme: 'dark',
    };

    // @ts-ignore - settings field exists in database
    if (user.settings) {
      try {
        // @ts-ignore
        settings = { ...settings, ...JSON.parse(user.settings as string) };
      } catch {
        // Keep defaults if parsing fails
      }
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 });
  }
}

// PUT /api/users/[id]/settings - Update user settings
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const sessionUser = await getUserFromSession(request);
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Ownership check - users can only update their own settings
    if (sessionUser.id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const settings: UserSettings = await request.json();

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Update user settings using Prisma's typed API
    await db.user.update({
      where: { id },
      data: {
        // @ts-ignore - settings field exists in database schema
        settings: JSON.stringify(settings),
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 });
  }
}
