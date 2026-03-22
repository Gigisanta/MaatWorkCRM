import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/sessions/logout-others - Log out all other sessions
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'No hay sesión activa' }, { status: 401 });
    }

    // Get current session
    const currentSession = await db.session.findUnique({
      where: { token: sessionToken },
      select: { userId: true, id: true },
    });

    if (!currentSession) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 401 });
    }

    // Delete all other sessions for this user
    const result = await db.session.deleteMany({
      where: {
        userId: currentSession.userId,
        id: { not: currentSession.id },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Se cerraron ${result.count} sesiones`,
    });
  } catch (error) {
    console.error('Error logging out other sessions:', error);
    return NextResponse.json({ error: 'Error al cerrar sesiones' }, { status: 500 });
  }
}
