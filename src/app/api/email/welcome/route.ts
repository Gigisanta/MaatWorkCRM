import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { sendWelcomeEmail } from '@/lib/services/google-email';
import { logger } from '@/lib/db/logger';

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'sendWelcomeEmail', requestId }, 'Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contactId, email, name } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email del contacto requerido' }, { status: 400 });
    }

    logger.info({ operation: 'sendWelcomeEmail', requestId, contactId, email }, 'Sending welcome email');
    const result = await sendWelcomeEmail(user.id, name, email);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    logger.error({ err: error, operation: 'sendWelcomeEmail', requestId }, 'Failed to send welcome email');
    return NextResponse.json({ error: 'An unexpected error occurred', requestId }, { status: 500 });
  }
}
