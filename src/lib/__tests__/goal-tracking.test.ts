import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted() ensures these are initialized before vi.mock factories run
const { teamMemberFindMany, teamGoalFindMany, teamGoalUpdate, teamGoalFindUnique } = vi.hoisted(() => ({
  teamMemberFindMany: vi.fn(),
  teamGoalFindMany: vi.fn(),
  teamGoalUpdate: vi.fn(),
  teamGoalFindUnique: vi.fn(),
}));

vi.mock('@/lib/db/db', () => ({
  db: {
    teamMember: { findMany: teamMemberFindMany },
    teamGoal: {
      findMany: teamGoalFindMany,
      update: teamGoalUpdate,
      findUnique: teamGoalFindUnique,
    },
  },
}));

vi.mock('@/lib/db/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/services/notifications', () => ({
  checkGoalMilestones: vi.fn().mockResolvedValue(undefined),
}));

// Import goal-tracking after mocks are declared so vitest injects the stubs
import { trackGoalProgress, calculateGoalHealth } from '@/lib/services/goal-tracking';

describe('goal-tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackGoalProgress', () => {
    it('should not update goals when user has no team memberships', async () => {
            // @ts-expect-error - mock implementation
      teamMemberFindMany.mockResolvedValue([]);

      await trackGoalProgress('user-123', 'deal', 'deal-123', 1000);

      expect(teamGoalFindMany).not.toHaveBeenCalled();
    });

    it('should find matching goals for deal entity type', async () => {
            // @ts-expect-error - mock implementation
      teamMemberFindMany.mockResolvedValue([{ teamId: 'team-1' }]);
      // @ts-expect-error - mock implementation
      teamGoalFindMany.mockResolvedValue([
        {
          id: 'goal-1',
          teamId: 'team-1',
          type: 'revenue',
          currentValue: 5000,
          targetValue: 10000,
          status: 'active',
          team: { id: 'team-1', name: 'Team 1', organizationId: 'org-1' },
        },
      ]);
      // @ts-expect-error - mock implementation
      teamGoalUpdate.mockResolvedValue({});

      await trackGoalProgress('user-123', 'deal', 'deal-123', 1000);

      expect(teamGoalFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            teamId: { in: ['team-1'] },
            status: 'active',
            type: { in: ['revenue', 'new_aum'] },
          }),
        })
      );
    });

    it('should find matching goals for contact entity type', async () => {
            // @ts-expect-error - mock implementation
      teamMemberFindMany.mockResolvedValue([{ teamId: 'team-1' }]);
      // @ts-expect-error - mock implementation
      teamGoalFindMany.mockResolvedValue([
        {
          id: 'goal-1',
          teamId: 'team-1',
          type: 'new_clients',
          currentValue: 5,
          targetValue: 20,
          status: 'active',
          team: { id: 'team-1', name: 'Team 1', organizationId: 'org-1' },
        },
      ]);
      // @ts-expect-error - mock implementation
      teamGoalUpdate.mockResolvedValue({});

      await trackGoalProgress('user-123', 'contact', 'contact-123', 1);

      expect(teamGoalFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: { in: ['new_clients'] },
          }),
        })
      );
    });

    it('should find matching goals for calendar_event entity type', async () => {
            // @ts-expect-error - mock implementation
      teamMemberFindMany.mockResolvedValue([{ teamId: 'team-1' }]);
      // @ts-expect-error - mock implementation
      teamGoalFindMany.mockResolvedValue([
        {
          id: 'goal-1',
          teamId: 'team-1',
          type: 'meetings',
          currentValue: 3,
          targetValue: 10,
          status: 'active',
          team: { id: 'team-1', name: 'Team 1', organizationId: 'org-1' },
        },
      ]);
      // @ts-expect-error - mock implementation
      teamGoalUpdate.mockResolvedValue({});

      await trackGoalProgress('user-123', 'calendar_event', 'event-123', 1);

      expect(teamGoalFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: { in: ['meetings'] },
          }),
        })
      );
    });

    it('should update goal currentValue when match is found', async () => {
            // @ts-expect-error - mock implementation
      teamMemberFindMany.mockResolvedValue([{ teamId: 'team-1' }]);
      // @ts-expect-error - mock implementation
      teamGoalFindMany.mockResolvedValue([
        {
          id: 'goal-1',
          teamId: 'team-1',
          type: 'revenue',
          currentValue: 5000,
          targetValue: 10000,
          status: 'active',
          team: { id: 'team-1', name: 'Team 1', organizationId: 'org-1' },
        },
      ]);
      // @ts-expect-error - mock implementation
      teamGoalUpdate.mockResolvedValue({});

      await trackGoalProgress('user-123', 'deal', 'deal-123', 1000);

      expect(teamGoalUpdate).toHaveBeenCalledWith({
        where: { id: 'goal-1' },
        data: expect.objectContaining({
          currentValue: { increment: 1000 },
        }),
      });
    });

    it('should mark goal as completed when target is reached', async () => {
            // @ts-expect-error - mock implementation
      teamMemberFindMany.mockResolvedValue([{ teamId: 'team-1' }]);
      // @ts-expect-error - mock implementation
      teamGoalFindMany.mockResolvedValue([
        {
          id: 'goal-1',
          teamId: 'team-1',
          type: 'revenue',
          currentValue: 9500,
          targetValue: 10000,
          status: 'active',
          team: { id: 'team-1', name: 'Team 1', organizationId: 'org-1' },
        },
      ]);
      // @ts-expect-error - mock implementation
      teamGoalUpdate.mockResolvedValue({});

      await trackGoalProgress('user-123', 'deal', 'deal-123', 1000);

      expect(teamGoalUpdate).toHaveBeenCalledWith({
        where: { id: 'goal-1' },
        data: expect.objectContaining({
          currentValue: { increment: 1000 },
          status: 'completed',
        }),
      });
    });
  });

  describe('calculateGoalHealth', () => {
    it('should return achieved for completed goals', async () => {
            // @ts-expect-error - mock implementation
      teamGoalFindUnique.mockResolvedValue({
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-04-30'),
        currentValue: 10000,
        targetValue: 10000,
        status: 'completed',
      });

      const result = await calculateGoalHealth('goal-1');

      expect(result?.health).toBe('achieved');
      expect(result?.actualProgress).toBe(10000);
    });

    it('should return null for non-existent goals', async () => {
            // @ts-expect-error - mock implementation
      teamGoalFindUnique.mockResolvedValue(null);

      const result = await calculateGoalHealth('non-existent');

      expect(result).toBeNull();
    });

    it('should return achieved when currentValue equals targetValue regardless of elapsed time', async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // @ts-expect-error - mock implementation
      teamGoalFindUnique.mockResolvedValue({
        startDate: startOfMonth,
        endDate: endOfMonth,
        currentValue: 10000,
        targetValue: 10000,
        status: 'active',
      });

      const result = await calculateGoalHealth('goal-1');

      // currentValue === targetValue triggers 'achieved' pre-check in calculateGoalHealth
      expect(result?.health).toBe('achieved');
    });
  });
});
