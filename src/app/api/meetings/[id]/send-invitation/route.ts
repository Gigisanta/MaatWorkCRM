import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth-helpers';
import { sendMeetingInvitation } from '@/lib/google-email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromSession(request);
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
