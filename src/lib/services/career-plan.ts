import { db } from '@/lib/db/db';

/**
 * Get IDs of team members (advisors) under a manager
 */
async function getTeamMemberIds(managerId: string): Promise<string[]> {
  const team = await db.user.findMany({
    where: { managerId },
    select: { id: true },
  });
  return team.map(u => u.id);
}

/**
 * Calculate user's annual production based on their active productions
 * For managers, includes their team's production
 */
export async function calculateAnnualProduction(userId: string, role: string): Promise<number> {
  // Get all productions for this user (and team if manager)
  let assignedUserIds = [userId];

  if (role === 'manager') {
    const teamMemberIds = await getTeamMemberIds(userId);
    assignedUserIds = [userId, ...teamMemberIds];
  }

  const productions = await db.production.findMany({
    where: {
      estado: 'activo',
      contact: {
        assignedTo: { in: assignedUserIds },
      },
    },
    select: {
      primaMensual: true,
    },
  });

  // Sum all monthly premiums × 12
  const totalMonthly = productions.reduce((sum, p) => sum + (p.primaMensual || 0), 0);
  return totalMonthly * 12;
}

/**
 * Determine user's current career level based on annual production
 */
export async function getUserCareerProgress(userId: string, role: string, organizationId: string) {
  const annualProduction = await calculateAnnualProduction(userId, role);

  // Get all levels for this organization, ordered
  const levels = await db.careerPlanLevel.findMany({
    where: { organizationId },
    orderBy: { levelNumber: 'asc' },
  });

  if (!levels.length) {
    return {
      currentLevel: null,
      nextLevel: null,
      annualProduction,
      progressPercentage: 0,
    };
  }

  // Find current level (highest level where annualGoalUsd <= production)
  let currentLevel = null;
  let nextLevel = levels[0];

  for (let i = 0; i < levels.length; i++) {
    if (annualProduction >= levels[i].annualGoalUsd) {
      currentLevel = levels[i];
      nextLevel = levels[i + 1] || null;
    } else {
      if (!nextLevel || levels[i].annualGoalUsd < nextLevel.annualGoalUsd) {
        nextLevel = levels[i];
      }
      break;
    }
  }

  // Calculate progress percentage
  let progressPercentage = 0;
  if (currentLevel) {
    if (nextLevel) {
      const currentGoal = currentLevel.annualGoalUsd;
      const nextGoal = nextLevel.annualGoalUsd;
      const range = nextGoal - currentGoal;
      const progress = annualProduction - currentGoal;
      progressPercentage = Math.min(100, Math.round((progress / range) * 100));
    } else {
      // Max level reached
      progressPercentage = 100;
    }
  } else if (nextLevel) {
    // Below first level
    progressPercentage = Math.round((annualProduction / nextLevel.annualGoalUsd) * 100);
  }

  return {
    currentLevel,
    nextLevel,
    annualProduction,
    progressPercentage: Math.min(progressPercentage, 100),
  };
}
