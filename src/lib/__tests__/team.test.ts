import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTeamMemberIds, isInTeam } from '@/lib/services/team';

const mockDb = vi.hoisted(() => ({
  user: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
}));

vi.mock('@/lib/db/db', () => ({
  db: mockDb,
}));

describe('team service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // getTeamMemberIds
  // ============================================

  describe('getTeamMemberIds', () => {
    it('returns team member IDs for a manager', async () => {
      const managerId = 'manager-1';
      const members = [
        { id: 'member-1' },
        { id: 'member-2' },
        { id: 'member-3' },
      ];

      mockDb.user.findMany.mockResolvedValue(members);

      const result = await getTeamMemberIds(managerId);

      expect(result).toEqual(['member-1', 'member-2', 'member-3']);
      expect(mockDb.user.findMany).toHaveBeenCalledWith({
        where: { managerId },
        select: { id: true },
      });
    });

    it('returns empty array when user has no team', async () => {
      const managerId = 'manager-no-team';

      mockDb.user.findMany.mockResolvedValue([]);

      const result = await getTeamMemberIds(managerId);

      expect(result).toEqual([]);
    });

    it('handles errors gracefully', async () => {
      const managerId = 'manager-error';

      mockDb.user.findMany.mockRejectedValue(new Error('Database error'));

      await expect(getTeamMemberIds(managerId)).rejects.toThrow('Database error');
    });
  });

  // ============================================
  // isInTeam
  // ============================================

  describe('isInTeam', () => {
    it('returns true when member is in users team', async () => {
      const targetUserId = 'member-1';
      const managerId = 'manager-1';

      mockDb.user.findFirst.mockResolvedValue({ id: 'member-1' });

      const result = await isInTeam(targetUserId, managerId);

      expect(result).toBe(true);
      expect(mockDb.user.findFirst).toHaveBeenCalledWith({
        where: {
          id: targetUserId,
          managerId: managerId,
        },
        select: { id: true },
      });
    });

    it('returns false when member is not in users team', async () => {
      const targetUserId = 'non-member';
      const managerId = 'manager-1';

      mockDb.user.findFirst.mockResolvedValue(null);

      const result = await isInTeam(targetUserId, managerId);

      expect(result).toBe(false);
    });
  });
});
