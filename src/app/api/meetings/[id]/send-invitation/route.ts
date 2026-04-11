import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { logger } from '@/lib/db/logger';
import { createRequestContext } from '@/lib/api-response';
import { sendMeetingInvitation } from '@/lib/services/google-email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromSession(request);
  const { requestId } = createRequestContext(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { clientEmail, clientName, meeting } = body;

  if (!clientEmail) {
    return NextResponse.json({ error: 'Email del cliente requerido' }, { status: 400 });
  }

  try {
    const result = await sendMeetingInvitation(user.id, meeting, clientEmail, clientName);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error: unknown) {
    logger.error({ err: error, operation: 'sendMeetingInvite', requestId }, 'Failed to send meeting invite');
    return NextResponse.json({ error: 'An unexpected error occurred', requestId }, { status: 500 });
  }
}
