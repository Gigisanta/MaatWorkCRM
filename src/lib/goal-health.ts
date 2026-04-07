// Goal Health Calculation Utilities
// Calculates whether a goal is on-track, at-risk, or off-track based on elapsed time

export type GoalHealth = 'on-track' | 'at-risk' | 'off-track';

export interface GoalProgress {
  startDate: Date | null;
  endDate: Date | null;
  currentValue: number;
  targetValue: number;
}

/**
 * Calculate goal health based on expected vs actual progress
 *
 * Logic:
 * - Calculate expectedProgress = daysElapsed / totalDays
 * - If currentProgress >= expectedProgress -> on-track
 * - If currentProgress >= expectedProgress - 15% -> at-risk
 * - If lesser -> off-track
 */
export function calculateGoalHealth(goal: GoalProgress): GoalHealth {
  const { startDate, endDate, currentValue, targetValue } = goal;

  // If no dates or no target, assume on-track
  if (!endDate || !targetValue || targetValue === 0) {
    return 'on-track';
  }

  const now = new Date();
  const start = startDate || now;

  // Calculate total duration in days
  const totalDays = (endDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

  // If end date has passed, calculate based on end date
  const effectiveNow = now > endDate ? endDate : now;
  const daysElapsed = (effectiveNow.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

  // Avoid division by zero or negative values
  if (totalDays <= 0 || daysElapsed < 0) {
    return 'on-track';
  }

  // Expected progress as percentage (0-100+)
  const expectedProgress = (daysElapsed / totalDays) * 100;

  // Actual progress as percentage
  const actualProgress = (currentValue / targetValue) * 100;

  // Determine health status
  if (actualProgress >= expectedProgress) {
    return 'on-track';
  }

  // at-risk: within 15% below expected
  if (actualProgress >= expectedProgress - 15) {
    return 'at-risk';
  }

  return 'off-track';
}

/**
 * Get detailed progress info for a goal
 */
export function getGoalProgressDetails(goal: GoalProgress): {
  health: GoalHealth;
  actualProgress: number;
  expectedProgress: number;
  daysRemaining: number;
  isCompleted: boolean;
} {
  const { startDate, endDate, currentValue, targetValue } = goal;

  const now = new Date();
  const start = startDate || now;
  const end = endDate || now;

  const totalDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.max(0, Math.min(totalDays, (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const expectedProgress = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 100;
  const actualProgress = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;
  const isCompleted = currentValue >= targetValue;

  return {
    health: calculateGoalHealth(goal),
    actualProgress: Math.round(actualProgress * 10) / 10,
    expectedProgress: Math.round(expectedProgress * 10) / 10,
    daysRemaining: Math.round(daysRemaining),
    isCompleted,
  };
}
