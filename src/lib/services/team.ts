import { db } from '@/lib/db/db';

/**
 * Check if targetUserId is a direct team member of managerId.
 * Returns true if targetUserId's managerId matches the given managerId.
 */
export async function isInTeam(targetUserId: string, managerId: string): Promise<boolean> {
  const teamMember = await db.user.findFirst({
    where: {
      id: targetUserId,
      managerId: managerId,
    },
    select: { id: true },
  });
  return !!teamMember;
}

/**
 * Get all user IDs that report directly to managerId.
 */
export async function getTeamMemberIds(managerId: string): Promise<string[]> {
  const team = await db.user.findMany({
    where: { managerId },
    select: { id: true },
  });
  return team.map(u => u.id);
}
