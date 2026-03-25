import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getUserFromSession } from '@/lib/auth-helpers';
import { hasPermission, normalizeRole } from '@/lib/permissions';
import { isValidId } from '@/lib/id-validation';

// GET /api/tasks/[id] - Get a single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'getTask', requestId }, 'Fetching task');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'getTask', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    const task = await db.task.findUnique({
      where: { id },
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
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      logger.warn({ operation: 'getTask', requestId, taskId: id }, 'Task not found');
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404, headers: { 'x-request-id': requestId } }
      );
    }

    logger.info(
      { operation: 'getTask', requestId, taskId: task.id, duration_ms: Date.now() - start },
      'Task fetched successfully'
    );

    return NextResponse.json(task, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error(
      { err: error, operation: 'getTask', requestId, duration_ms: Date.now() - start },
      'Failed to fetch task'
    );
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}

// PUT /api/tasks/[id] - Update a task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'updateTask', requestId }, 'Updating task');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'updateTask', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      assignedTo,
      contactId,
      isRecurrent,
      recurrenceRule,
    } = body;

    const task = await db.task.update({
      where: { id },
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedTo,
        contactId,
        isRecurrent,
        recurrenceRule,
        ...(status === 'completed' && { completedAt: new Date() }),
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
      { operation: 'updateTask', requestId, taskId: task.id, duration_ms: Date.now() - start },
      'Task updated successfully'
    );

    return NextResponse.json(task, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error(
      { err: error, operation: 'updateTask', requestId, duration_ms: Date.now() - start },
      'Failed to update task'
    );
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'deleteTask', requestId }, 'Deleting task');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'deleteTask', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    await db.task.delete({
      where: { id },
    });

    logger.info(
      { operation: 'deleteTask', requestId, taskId: id, duration_ms: Date.now() - start },
      'Task deleted successfully'
    );

    return NextResponse.json({ success: true }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error(
      { err: error, operation: 'deleteTask', requestId, duration_ms: Date.now() - start },
      'Failed to delete task'
    );
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}
