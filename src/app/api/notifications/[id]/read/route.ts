import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/notifications/[id]/read - Mark notification as read
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const notification = await db.notification.update({
      where: { id },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
  }
}
