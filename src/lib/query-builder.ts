// Shared query builder utilities for MaatWork CRM
import { db } from '@/lib/db/db';

export const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
} as const;

export const TEAM_SELECT = {
  id: true,
  name: true,
} as const;

export async function getTeamMemberIds(managerId: string): Promise<string[]> {
  const team = await db.user.findMany({
    where: { managerId },
    select: { id: true },
  });
  return team.map(u => u.id);
}

export function buildWhereClause(base: Record<string, unknown>, filters: Record<string, unknown>): Record<string, unknown> {
  const where = { ...base };
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        where[key] = { in: value };
      } else if (typeof value === 'string' && value.includes(',')) {
        where[key] = { in: value.split(',') };
      } else {
        where[key] = value;
      }
    }
  }
  return where;
}
