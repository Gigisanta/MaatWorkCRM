// Goal Tracking Service for MaatWork CRM
// Automatically tracks and updates goal progress based on entity changes

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { checkGoalMilestones } from '@/lib/notifications';

// ============================================
// Types
// ============================================

export type GoalType = 'revenue' | 'new_aum' | 'new_clients' | 'meetings' | 'custom';
export type EntityType = 'deal' | 'contact' | 'calendar_event';

interface TrackProgressParams {
  userId: string;
  entityType: EntityType;
  entityId: string;
  value: number;
}

interface GoalHealthResult {
  health: 'on-track' | 'at-risk' | 'off-track' | 'achieved';
  expectedProgress: number;
  actualProgress: number;
}

// ============================================
// Goal Progress Tracking
// ============================================

/**
 * Track goal progress when an entity is created/updated.
 *
 * This function:
 * 1. Finds all active team goals for the user's teams that match the entity type
 * 2. Updates the currentValue of matching goals
 * 3. Checks if goals are completed and triggers notifications
 *
 * @param userId - The user who owns/created the entity
 * @param entityType - The type of entity ('deal', 'contact', 'calendar_event')
 * @param entityId - The ID of the entity
 * @param value - The value to add to the goal (e.g., deal value, or 1 for contacts/events)
 */
export async function trackGoalProgress(
  userId: string,
  entityType: EntityType,
  entityId: string,
  value: number
): Promise<void> {
  const requestId = crypto.randomUUID();

  try {
    logger.debug(
      { operation: 'trackGoalProgress', requestId, userId, entityType, entityId, value },
      'Tracking goal progress'
    );

    // 1. Get user's team memberships
    const teamMemberships = await db.teamMember.findMany({
      where: { userId },
      select: { teamId: true },
    });

    const teamIds = teamMemberships.map(m => m.teamId);

    if (teamIds.length === 0) {
      logger.debug({ operation: 'trackGoalProgress', requestId }, 'User has no team memberships, skipping');
      return;
    }

    // 2. Find all active goals for these teams that match the entity type
    const matchingGoalTypes = getMatchingGoalTypes(entityType);

    if (matchingGoalTypes.length === 0) {
      logger.debug({ operation: 'trackGoalProgress', requestId, entityType }, 'No matching goal types');
      return;
    }

    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const activeGoals = await db.teamGoal.findMany({
      where: {
        teamId: { in: teamIds },
        status: 'active',
        type: { in: matchingGoalTypes },
        period: currentPeriod,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            organizationId: true,
          },
        },
      },
    });

    if (activeGoals.length === 0) {
      logger.debug({ operation: 'trackGoalProgress', requestId, teamIds, matchingGoalTypes }, 'No active goals found');
      return;
    }

    // 3. For each matching goal, update the progress
    const updatePromises = activeGoals.map(async (goal) => {
      const newValue = goal.currentValue + value;
      const wasCompleted = goal.currentValue < goal.targetValue;
      const isNowCompleted = newValue >= goal.targetValue;

      logger.info(
        {
          operation: 'trackGoalProgress',
          requestId,
          goalId: goal.id,
          goalTitle: goal.title,
          previousValue: goal.currentValue,
          newValue,
          targetValue: goal.targetValue,
        },
        'Updating goal progress'
      );

      // Update the goal with new progress
      const updatedGoal = await db.teamGoal.update({
        where: { id: goal.id },
        data: {
          currentValue: newValue,
          status: isNowCompleted ? 'completed' : goal.status,
        },
      });

      // If goal just completed, check milestones
      if (wasCompleted && isNowCompleted) {
        logger.info(
          { operation: 'trackGoalProgress', requestId, goalId: goal.id },
          'Goal completed, checking milestones'
        );
        await checkGoalMilestones(goal.id, newValue, goal.targetValue);
      }

      return updatedGoal;
    });

    await Promise.all(updatePromises);

    logger.info(
      { operation: 'trackGoalProgress', requestId, goalsUpdated: activeGoals.length },
      'Goal progress tracking completed'
    );
  } catch (error) {
    logger.error(
      { err: error, operation: 'trackGoalProgress', requestId },
      'Failed to track goal progress'
    );
    // Don't throw - goal tracking should not break the main operation
  }
}

/**
 * Get goal types that match a given entity type
 */
function getMatchingGoalTypes(entityType: EntityType): GoalType[] {
  switch (entityType) {
    case 'deal':
      return ['revenue', 'new_aum'];
    case 'contact':
      return ['new_clients'];
    case 'calendar_event':
      return ['meetings'];
    default:
      return [];
  }
}

// ============================================
// Goal Health Calculation
// ============================================

/**
 * Calculate goal health based on time elapsed vs progress made.
 *
 * Health is determined by comparing:
 * - Expected progress: (timeElapsed / totalDuration) * targetValue
 * - Actual progress: currentValue
 *
 * @param goalId - The goal ID to calculate health for
 * @returns The health status and related metrics
 */
export async function calculateGoalHealth(goalId: string): Promise<GoalHealthResult | null> {
  try {
    const goal = await db.teamGoal.findUnique({
      where: { id: goalId },
      select: {
        startDate: true,
        endDate: true,
        currentValue: true,
        targetValue: true,
        status: true,
      },
    });

    if (!goal) {
      return null;
    }

    // If already completed/achieved, return achieved
    if (goal.status === 'completed') {
      return {
        health: 'achieved',
        expectedProgress: goal.targetValue,
        actualProgress: goal.currentValue,
      };
    }

    const now = new Date();

    // Default to full period if no dates set (use current month)
    const startDate = goal.startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = goal.endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const totalDuration = endDate.getTime() - startDate.getTime();
    const timeElapsed = now.getTime() - startDate.getTime();

    // Avoid division by zero
    if (totalDuration <= 0) {
      return {
        health: 'on-track',
        expectedProgress: 0,
        actualProgress: goal.currentValue,
      };
    }

    // Calculate expected progress as a percentage of target
    const timeProgress = Math.min(1, Math.max(0, timeElapsed / totalDuration));
    const expectedProgress = timeProgress * goal.targetValue;
    const actualProgress = goal.currentValue;

    // Calculate ratio of actual to expected
    const progressRatio = expectedProgress > 0 ? actualProgress / expectedProgress : 1;

    let health: GoalHealthResult['health'];

    if (progressRatio >= 1.0) {
      health = 'on-track';
    } else if (progressRatio >= 0.8) {
      health = 'at-risk';
    } else if (progressRatio >= 0.5) {
      health = 'off-track';
    } else {
      health = 'off-track';
    }

    return {
      health,
      expectedProgress: Math.round(expectedProgress * 100) / 100,
      actualProgress,
    };
  } catch (error) {
    logger.error({ err: error, operation: 'calculateGoalHealth', goalId }, 'Failed to calculate goal health');
    return null;
  }
}

/**
 * Update goal health and check milestones.
 * This should be called after any goal progress update.
 *
 * @param goalId - The goal ID to update
 */
export async function updateGoalHealthAndMilestones(goalId: string): Promise<void> {
  const requestId = crypto.randomUUID();

  try {
    logger.debug({ operation: 'updateGoalHealthAndMilestones', requestId, goalId }, 'Updating goal health');

    // Calculate new health
    const healthResult = await calculateGoalHealth(goalId);

    if (!healthResult) {
      logger.warn({ operation: 'updateGoalHealthAndMilestones', requestId, goalId }, 'Goal not found');
      return;
    }

    // Get current goal data for milestone checking
    const goal = await db.teamGoal.findUnique({
      where: { id: goalId },
      select: {
        id: true,
        currentValue: true,
        targetValue: true,
        team: { select: { organizationId: true } },
      },
    });

    if (goal) {
      // Log progress for notifications
      const progress = Math.round((goal.currentValue / goal.targetValue) * 100);
      logger.info(
        {
          operation: 'updateGoalHealthAndMilestones',
          requestId,
          goalId,
          progress,
          health: healthResult.health,
        },
        'Goal progress logged'
      );

      // Check milestones
      await checkGoalMilestones(goalId, goal.currentValue, goal.targetValue);
    }

    logger.info(
      { operation: 'updateGoalHealthAndMilestones', requestId, goalId, health: healthResult.health },
      'Goal health updated'
    );
  } catch (error) {
    logger.error(
      { err: error, operation: 'updateGoalHealthAndMilestones', requestId, goalId },
      'Failed to update goal health'
    );
  }
}
