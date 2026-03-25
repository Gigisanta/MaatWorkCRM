import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

// POST /api/sessions/logout-others - Log out all other sessions
export async function POST(request: NextRequest) {
  const user = await getUserFromSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Delete all other sessions for this user
    const result = await db.session.deleteMany({
      where: {
        userId: user.id,
        id: { not: request.cookies.get('session_token')?.value },
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
