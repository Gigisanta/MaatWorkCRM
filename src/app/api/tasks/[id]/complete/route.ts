import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';

// Helper function to calculate next recurrence date
function calculateNextRecurrence(recurrenceRule: string | null, currentDate: Date): Date | null {
  if (!recurrenceRule) return null;

  const nextDate = new Date(currentDate);

  // Simple RRULE parsing for common patterns
  if (recurrenceRule.includes('FREQ=DAILY')) {
    nextDate.setDate(nextDate.getDate() + 1);
  } else if (recurrenceRule.includes('FREQ=WEEKLY')) {
    nextDate.setDate(nextDate.getDate() + 7);
  } else if (recurrenceRule.includes('FREQ=MONTHLY')) {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else if (recurrenceRule.includes('FREQ=YEARLY')) {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  } else {
    // Default to weekly if pattern not recognized
    nextDate.setDate(nextDate.getDate() + 7);
  }

  // Parse INTERVAL if present
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

// POST /api/tasks/[id]/complete - Mark task as complete
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { createNextRecurrence } = body;

    // Get current task
    const currentTask = await db.task.findUnique({
      where: { id },
    });

    if (!currentTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Update task as completed
    const updatedTask = await db.task.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
          },
        },
      },
    });

    // Create next recurrence if task is recurrent
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
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            contact: {
              select: {
                id: true,
                name: true,
                email: true,
                company: true,
              },
            },
          },
        });
      }
    }

    return NextResponse.json({
      completedTask: updatedTask,
      newRecurrentTask,
    });
  } catch (error) {
    console.error('Error completing task:', error);
    return NextResponse.json({ error: 'Failed to complete task' }, { status: 500 });
  }
}
