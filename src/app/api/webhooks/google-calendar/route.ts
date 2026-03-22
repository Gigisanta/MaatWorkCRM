import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calendarSyncEngine } from '@/lib/google-calendar/sync-engine';

export async function GET(request: NextRequest) {
  const { searchParams }: { searchParams: URLSearchParams } = await request.nextUrl;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.CALENDAR_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const resourceState = request.headers.get('x-goog-resource-state');
    const channelId = request.headers.get('x-goog-channel-id');

    // not_exists / deleted → deactivate webhook, don't sync
    if (resourceState === 'not_exists' || resourceState === 'deleted') {
      if (channelId) {
        await db.calendarWebhook.updateMany({
          where: { channelId },
          data: { isActive: false },
        }).catch(() => {});
      }
      return NextResponse.json({ success: true, reason: 'channel_inactive' });
    }

    if (!channelId) {
      return NextResponse.json({ error: 'No channel ID' }, { status: 400 });
    }

    const webhook = await db.calendarWebhook.findFirst({
      where: { channelId, isActive: true },
    });

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const membership = await db.member.findFirst({
      where: { userId: webhook.userId },
    });

    if (membership) {
      // Don't await — Google expects 200 fast; sync runs async
      calendarSyncEngine.deltaSync(
        webhook.userId,
        membership.organizationId
      ).catch((err: Error) => console.error('[Webhook] Sync failed:', err.message));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
