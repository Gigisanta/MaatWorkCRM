import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { db } from '@/lib/db/db';
import { logger } from '@/lib/db/logger';

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

const DEFAULT_SETTINGS: UserSettings = {
  emailNotifications: true,
  pushNotifications: true,
  taskReminders: true,
  goalProgressAlerts: true,
  newLeadsNotifications: true,
  theme: 'dark',
};

// GET /api/users/[id]/settings - Get user settings
export async function GET(request: NextRequest, { params }: RouteParams) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const dbUser = await db.user.findUnique({
      where: { id },
      select: { id: true, settings: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Parse stored settings or return defaults
    let settings: UserSettings = { ...DEFAULT_SETTINGS };

    if (dbUser.settings && typeof dbUser.settings === 'string') {
      try {
        const parsed = JSON.parse(dbUser.settings) as Partial<UserSettings>;
        settings = { ...settings, ...parsed };
      } catch {
        // Keep defaults if parsing fails
      }
    }

    return NextResponse.json({ settings });
  } catch (error) {
    logger.error({ operation: 'users:settings:get', requestId, error: error instanceof Error ? error.message : String(error) }, 'Error fetching user settings');
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 });
  }
}

// PUT /api/users/[id]/settings - Update user settings
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

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

    // Update user settings
    await db.user.update({
      where: { id },
      data: {
        settings: JSON.stringify(settings) as unknown as Record<string, unknown>,
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    logger.error({ operation: 'users:settings:put', requestId, error: error instanceof Error ? error.message : String(error) }, 'Error updating user settings');
    return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 });
  }
}