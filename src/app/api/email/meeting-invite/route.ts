import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { sendMeetingInvitation } from '@/lib/services/google-email';
import { logger } from '@/lib/db/logger';

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'sendMeetingInvite', requestId }, 'Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contactId, email, name, meetingTitle, startAt, endAt, location, description } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email del contacto requerido' }, { status: 400 });
    }

    if (!startAt) {
      return NextResponse.json({ error: 'Fecha de inicio requerida' }, { status: 400 });
    }

    logger.info({ operation: 'sendMeetingInvite', requestId, contactId, email, meetingTitle }, 'Sending meeting invite');

    // Uses Gmail API via OAuth (google-email lib). Requires the advisor's Google account to be connected.
    // TODO [future]: swap sendMeetingInvitation for a transactional email provider (e.g. Resend)
    //   - Install: npm install resend
    //   - Env vars needed: RESEND_API_KEY, RESEND_FROM_EMAIL (e.g. "onboarding@resend.dev")
    //   - Template should include: meeting title, formatted date+time, location, optional notes, advisor name
    const result = await sendMeetingInvitation(
      user.id,
      {
        title: meetingTitle,
        startAt: new Date(startAt),
        endAt: endAt ? new Date(endAt) : new Date(new Date(startAt).getTime() + 60 * 60 * 1000),
        location,
        description,
      },
      email,
      name
    );

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      logger.error({ operation: 'sendMeetingInvite', requestId, error: result.error }, 'Email send failed');
      return NextResponse.json({ error: result.error ?? 'Failed to send meeting invite' }, { status: 500 });
    }
  } catch (error) {
    logger.error({ err: error, operation: 'sendMeetingInvite', requestId }, 'Failed to send meeting invite');
    return NextResponse.json({ error: 'An unexpected error occurred', requestId }, { status: 500 });
  }
}
