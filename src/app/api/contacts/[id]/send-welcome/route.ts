import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { logger } from '@/lib/db/logger';
import { sendWelcomeEmail } from '@/lib/services/google-email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromSession(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { contactName, contactEmail } = body;

  if (!contactEmail) {
    return NextResponse.json({ error: 'Email del contacto requerido' }, { status: 400 });
  }

  try {
    const result = await sendWelcomeEmail(user.id, contactName, contactEmail);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error: unknown) {
    logger.error({ err: error, operation: 'sendWelcomeEmail' }, 'Failed to send welcome email');
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
