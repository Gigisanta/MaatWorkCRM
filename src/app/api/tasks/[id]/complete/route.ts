import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { logger } from '@/lib/db/logger';

// Helper function to calculate next recurrence date
function calculateNextRecurrence(recurrenceRule: string | null, currentDate: Date): Date | null {
  if (!recurrenceRule) return null;

  const nextDate = new Date(currentDate);

  if (recurrenceRule.includes('FREQ=DAILY')) {
    nextDate.setDate(nextDate.getDate() + 1);
  } else if (recurrenceRule.includes('FREQ=WEEKLY')) {
    nextDate.setDate(nextDate.getDate() + 7);
  } else if (recurrenceRule.includes('FREQ=MONTHLY')) {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else if (recurrenceRule.includes('FREQ=YEARLY')) {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  } else {
    nextDate.setDate(nextDate.getDate() + 7);
  }

  const intervalMatch = recurrenceRule.match(/INTERVAL=(\d+)/);
  if (intervalMatch) {
    const interval = parseInt(intervalMatch[1]);
    if (recurrenceRule.includes('FREQ=DAILY')) {
      nextDate.setDate(nextDate.getDate() + (interval - 1));
    } else if (recurrenceRule.includes('FREQ=WEEKLY')) {
      nextDate.setDate(nextDate.getDate() + (interval - 1) * 7);
    } else if (recurrenceRule.includes('FREQ=MONTHLY')) {
      nextDate.setMonth(nextDate.getMonth() + (interval - 1));
    } else if (recurrenceRule.includes('FREQ=YEARLY')) {
      nextDate.setFullYear(nextDate.getFullYear() + (interval - 1));
    }
  }

  return nextDate;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { createNextRecurrence } = body;

    const currentTask = await db.task.findUnique({ where: { id } });

    if (!currentTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (currentTask.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedTask = await db.task.update({
      where: { id },
      data: { status: 'completed', completedAt: new Date() },
      include: {
        assignedUser: { select: { id: true, name: true, email: true, image: true } },
        contact: { select: { id: true, name: true, email: true, company: true } },
      },
    });

    let newRecurrentTask = null;
    if (currentTask.isRecurrent && currentTask.recurrenceRule && createNextRecurrence !== false) {
      const nextDueDate = calculateNextRecurrence(
        currentTask.recurrenceRule,
        currentTask.dueDate || new Date()
      );
      if (nextDueDate) {
        newRecurrentTask = await db.task.create({
          data: {
            organizationId: currentTask.organizationId,
            title: currentTask.title,
            description: currentTask.description,
            status: 'pending',
            priority: currentTask.priority,
            dueDate: nextDueDate,
            assignedTo: currentTask.assignedTo,
            contactId: currentTask.contactId,
            isRecurrent: true,
            recurrenceRule: currentTask.recurrenceRule,
            parentTaskId: currentTask.id,
          },
          include: {
            assignedUser: { select: { id: true, name: true, email: true, image: true } },
            contact: { select: { id: true, name: true, email: true, company: true } },
          },
        });
      }
    }

    return NextResponse.json({ completedTask: updatedTask, newRecurrentTask });
  } catch (error) {
    logger.error(
      { operation: 'POST /api/tasks/[id]/complete', requestId, error },
      'Error completing task'
    );
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
