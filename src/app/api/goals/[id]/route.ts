import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';

// GET /api/goals/[id] - Get a single goal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'getGoal', requestId }, 'Fetching goal');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'getGoal', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const { id } = await params;

    const goal = await db.teamGoal.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            leader: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!goal) {
      logger.warn({ operation: 'getGoal', requestId, goalId: id }, 'Goal not found');
      return NextResponse.json(
        { error: 'Meta no encontrada' },
        { status: 404, headers: { 'x-request-id': requestId } }
      );
    }

    // Calculate progress percentage
    const progressPercentage = goal.targetValue > 0
      ? Math.min(100, (goal.currentValue / goal.targetValue) * 100)
      : 0;

    logger.info(
      { operation: 'getGoal', requestId, goalId: goal.id, duration_ms: Date.now() - start },
      'Goal fetched successfully'
    );

    return NextResponse.json(
      {
        ...goal,
        progressPercentage,
      },
      { headers: { 'x-request-id': requestId } }
    );
  } catch (error) {
    logger.error(
      { err: error, operation: 'getGoal', requestId, duration_ms: Date.now() - start },
      'Failed to fetch goal'
    );
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}

// PUT /api/goals/[id] - Update goal progress
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'updateGoal', requestId }, 'Updating goal');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'updateGoal', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      type,
      targetValue,
      currentValue,
      unit,
      period,
      month,
      year,
      startDate,
      endDate,
      status,
    } = body;

    // Auto-update status if target is reached
    let finalStatus = status;
    if (currentValue !== undefined && targetValue !== undefined) {
      if (currentValue >= targetValue) {
        finalStatus = 'completed';
      }
    }

    const goal = await db.teamGoal.update({
      where: { id },
      data: {
        title,
        description,
        type,
        targetValue,
        currentValue,
        unit,
        period,
        month,
        year,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status: finalStatus,
      },
      include: {
        team: {
          include: {
            leader: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    logger.info(
      { operation: 'updateGoal', requestId, goalId: goal.id, duration_ms: Date.now() - start },
      'Goal updated successfully'
    );

    return NextResponse.json(goal, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error(
      { err: error, operation: 'updateGoal', requestId, duration_ms: Date.now() - start },
      'Failed to update goal'
    );
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}

// DELETE /api/goals/[id] - Delete a goal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'deleteGoal', requestId }, 'Deleting goal');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'deleteGoal', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const { id } = await params;

    await db.teamGoal.delete({
      where: { id },
    });

    logger.info(
      { operation: 'deleteGoal', requestId, goalId: id, duration_ms: Date.now() - start },
      'Goal deleted successfully'
    );

    return NextResponse.json({ success: true }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error(
      { err: error, operation: 'deleteGoal', requestId, duration_ms: Date.now() - start },
      'Failed to delete goal'
    );
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}
