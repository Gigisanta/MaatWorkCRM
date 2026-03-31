import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { taskCreateSchema } from '@/lib/schemas';
import type { TaskCreateInput } from '@/lib/schemas';

// GET /api/tasks - List tasks with filters
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'listTasks', requestId }, 'Fetching tasks');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'listTasks', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const { searchParams } = await request.nextUrl;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');
    const contactId = searchParams.get('contactId');
    const overdue = searchParams.get('overdue') === 'true';
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      logger.warn({ operation: 'listTasks', requestId }, 'organizationId is required');
      return NextResponse.json(
        { error: 'organizationId es requerido' },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    if (organizationId !== user.organizationId) {
      logger.warn({ operation: 'listTasks', requestId, organizationId }, 'Access denied - org mismatch');
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403, headers: { 'x-request-id': requestId } }
      );
    }

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { organizationId };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    if (contactId) {
      where.contactId = contactId;
    }

    if (overdue) {
      const now = new Date();
      where.dueDate = { lt: now };
      where.status = { notIn: ['completed', 'cancelled'] };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [tasks, total] = await Promise.all([
      db.task.findMany({
        where,
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
        skip,
        take: limit,
        orderBy: [
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      db.task.count({ where }),
    ]);

    logger.info(
      { operation: 'listTasks', requestId, count: tasks.length, total, duration_ms: Date.now() - start },
      'Tasks fetched successfully'
    );

    return NextResponse.json(
      {
        tasks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { headers: { 'x-request-id': requestId } }
    );
  } catch (error) {
    logger.error(
      { err: error, operation: 'listTasks', requestId, duration_ms: Date.now() - start },
      'Failed to fetch tasks'
    );
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'createTask', requestId }, 'Creating task');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'createTask', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const body = await request.json();
    const {
      organizationId,
      title,
      description,
      status,
      priority,
      dueDate,
      assignedTo,
      contactId,
      isRecurrent,
      recurrenceRule,
      parentTaskId,
    } = body;

    if (!organizationId || !title) {
      logger.warn({ operation: 'createTask', requestId }, 'organizationId and title are required');
      return NextResponse.json(
        { error: 'organizationId y title son requeridos' },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    // Organization ownership check
    if (user.organizationId !== organizationId) {
      logger.warn({ operation: 'createTask', requestId, organizationId }, 'Access denied - org mismatch');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    const task = await db.task.create({
      data: {
        organizationId,
        title,
        description,
        status: status || 'pending',
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedTo,
        contactId,
        isRecurrent: isRecurrent || false,
        recurrenceRule,
        parentTaskId,
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

    logger.info(
      { operation: 'createTask', requestId, taskId: task.id, duration_ms: Date.now() - start },
      'Task created successfully'
    );

    return NextResponse.json(task, { status: 201, headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error(
      { err: error, operation: 'createTask', requestId, duration_ms: Date.now() - start },
      'Failed to create task'
    );
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}
