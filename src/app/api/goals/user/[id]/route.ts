import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { userGoalUpdateSchema } from '@/lib/schemas/goal';

// Calculate health based on time elapsed and progress
function calculateHealth(
  currentValue: number,
  targetValue: number,
  startDate: Date | null,
  endDate: Date | null
): string | null {
  if (!startDate || !endDate || targetValue <= 0) {
    return null;
  }

  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDuration = end.getTime() - start.getTime();

  if (totalDuration <= 0) {
    return null;
  }

  const elapsed = now.getTime() - start.getTime();
  const progress = Math.min(100, (currentValue / targetValue) * 100);
  const expectedProgress = (elapsed / totalDuration) * 100;

  if (progress >= 100) {
    return 'achieved';
  } else if (progress >= expectedProgress * 0.9) {
    return 'on-track';
  } else if (progress >= expectedProgress * 0.5) {
    return 'at-risk';
  } else {
    return 'off-track';
  }
}

// GET /api/goals/user/[id] - Get a specific user goal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'getUserGoal', requestId }, 'Fetching user goal');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'getUserGoal', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const { id } = await params;

    const goal = await db.userGoal.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        teamGoal: {
          include: {
            team: {
              select: { id: true, name: true },
            },
          },
        },
        parent: {
          select: { id: true, title: true },
        },
        children: {
          select: { id: true, title: true, status: true },
        },
      },
    });

    if (!goal) {
      logger.warn({ operation: 'getUserGoal', requestId, goalId: id }, 'Goal not found');
      return NextResponse.json(
        { error: 'Meta no encontrada' },
        { status: 404, headers: { 'x-request-id': requestId } }
      );
    }

    // Check permission: owner can always access, team members can view team-shared goals
    if (goal.ownerId !== user.id && goal.privacy === 'private') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    // Calculate progress percentage
    const progressPercentage = goal.targetValue > 0
      ? Math.min(100, (goal.currentValue / goal.targetValue) * 100)
      : 0;

    // Calculate health
    const calculatedHealth = calculateHealth(
      goal.currentValue,
      goal.targetValue,
      goal.startDate,
      goal.endDate
    );

    logger.info(
      { operation: 'getUserGoal', requestId, goalId: goal.id, duration_ms: Date.now() - start },
      'User goal fetched successfully'
    );

    return NextResponse.json(
      {
        ...goal,
        progressPercentage,
        calculatedHealth: calculatedHealth || goal.health,
      },
      { headers: { 'x-request-id': requestId } }
    );
  } catch (error) {
    logger.error(
      { err: error, operation: 'getUserGoal', requestId, duration_ms: Date.now() - start },
      'Failed to fetch user goal'
    );
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}

// PUT /api/goals/user/[id] - Update a user goal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'updateUserGoal', requestId }, 'Updating user goal');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'updateUserGoal', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const { id } = await params;

    // Only the owner can modify their goal
    const existingGoal = await db.userGoal.findUnique({
      where: { id },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: 'Meta no encontrada' }, { status: 404, headers: { 'x-request-id': requestId } });
    }

    if (existingGoal.ownerId !== user.id) {
      logger.warn({ operation: 'updateUserGoal', requestId, goalId: id }, 'Access denied - not owner');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    const body = await request.json();

    const updateResult = userGoalUpdateSchema.safeParse(body);
    if (!updateResult.success) {
      logger.warn({ operation: 'updateUserGoal', requestId, errors: updateResult.error.flatten() }, 'Invalid input');
      return NextResponse.json(
        { error: 'Datos inválidos', details: updateResult.error.flatten() },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    const data = updateResult.data;

    // Auto-update status to completed if target is reached
    let finalStatus = data.status;
    if (data.currentValue !== undefined && data.targetValue !== undefined) {
      if (data.currentValue >= data.targetValue) {
        finalStatus = 'completed';
      }
    } else if (data.currentValue !== undefined && data.currentValue >= existingGoal.targetValue) {
      finalStatus = 'completed';
    }

    // Calculate health based on time elapsed and progress
    const currentValue = data.currentValue ?? existingGoal.currentValue;
    const targetValue = data.targetValue ?? existingGoal.targetValue;
    const startDate = data.startDate ? new Date(data.startDate) : existingGoal.startDate;
    const endDate = data.endDate ? new Date(data.endDate) : existingGoal.endDate;
    const calculatedHealth = calculateHealth(currentValue, targetValue, startDate, endDate);

    // Use calculated health if not explicitly provided in update
    const finalHealth = data.health !== undefined ? data.health : calculatedHealth;

    const goal = await db.userGoal.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        targetValue: data.targetValue,
        currentValue: data.currentValue,
        unit: data.unit,
        period: data.period,
        month: data.month,
        year: data.year,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: finalStatus,
        health: finalHealth,
        progressMethod: data.progressMethod,
        parentGoalId: data.parentGoalId,
        linkedDeals: data.linkedDeals,
        linkedContacts: data.linkedContacts,
        privacy: data.privacy,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        teamGoal: {
          include: {
            team: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    logger.info(
      { operation: 'updateUserGoal', requestId, goalId: goal.id, duration_ms: Date.now() - start },
      'User goal updated successfully'
    );

    return NextResponse.json(goal, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error(
      { err: error, operation: 'updateUserGoal', requestId, duration_ms: Date.now() - start },
      'Failed to update user goal'
    );
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}

// DELETE /api/goals/user/[id] - Delete a user goal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'deleteUserGoal', requestId }, 'Deleting user goal');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'deleteUserGoal', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const { id } = await params;

    // Only the owner can delete their goal
    const existingGoal = await db.userGoal.findUnique({
      where: { id },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: 'Meta no encontrada' }, { status: 404, headers: { 'x-request-id': requestId } });
    }

    if (existingGoal.ownerId !== user.id) {
      logger.warn({ operation: 'deleteUserGoal', requestId, goalId: id }, 'Access denied - not owner');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    await db.userGoal.delete({
      where: { id },
    });

    logger.info(
      { operation: 'deleteUserGoal', requestId, goalId: id, duration_ms: Date.now() - start },
      'User goal deleted successfully'
    );

    return NextResponse.json({ success: true }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error(
      { err: error, operation: 'deleteUserGoal', requestId, duration_ms: Date.now() - start },
      'Failed to delete user goal'
    );
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}