import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackGoalProgress, calculateGoalHealth } from '@/lib/services/goal-tracking';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    teamMember: {
      findMany: vi.fn(),
    },
    teamGoal: {
      findMany: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/notifications', () => ({
  checkGoalMilestones: vi.fn().mockResolvedValue(undefined),
}));

describe('goal-tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackGoalProgress', () => {
    it('should not update goals when user has no team memberships', async () => {
      const { db } = await import('@/lib/db');

      // @ts-expect-error - mock implementation
      db.teamMember.findMany.mockResolvedValue([]);

      await trackGoalProgress('user-123', 'deal', 'deal-123', 1000);

      expect(db.teamGoal.findMany).not.toHaveBeenCalled();
    });

    it('should find matching goals for deal entity type', async () => {
      const { db } = await import('@/lib/db');

      // @ts-expect-error - mock implementation
      db.teamMember.findMany.mockResolvedValue([{ teamId: 'team-1' }]);
      // @ts-expect-error - mock implementation
      db.teamGoal.findMany.mockResolvedValue([
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
      db.teamGoal.update.mockResolvedValue({});

      await trackGoalProgress('user-123', 'deal', 'deal-123', 1000);

      expect(db.teamGoal.findMany).toHaveBeenCalledWith(
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
      const { db } = await import('@/lib/db');

      // @ts-expect-error - mock implementation
      db.teamMember.findMany.mockResolvedValue([{ teamId: 'team-1' }]);
      // @ts-expect-error - mock implementation
      db.teamGoal.findMany.mockResolvedValue([
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
      db.teamGoal.update.mockResolvedValue({});

      await trackGoalProgress('user-123', 'contact', 'contact-123', 1);

      expect(db.teamGoal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: { in: ['new_clients'] },
          }),
        })
      );
    });

    it('should find matching goals for calendar_event entity type', async () => {
      const { db } = await import('@/lib/db');

      // @ts-expect-error - mock implementation
      db.teamMember.findMany.mockResolvedValue([{ teamId: 'team-1' }]);
      // @ts-expect-error - mock implementation
      db.teamGoal.findMany.mockResolvedValue([
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
      db.teamGoal.update.mockResolvedValue({});

      await trackGoalProgress('user-123', 'calendar_event', 'event-123', 1);

      expect(db.teamGoal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: { in: ['meetings'] },
          }),
        })
      );
    });

    it('should update goal currentValue when match is found', async () => {
      const { db } = await import('@/lib/db');

      // @ts-expect-error - mock implementation
      db.teamMember.findMany.mockResolvedValue([{ teamId: 'team-1' }]);
      // @ts-expect-error - mock implementation
      db.teamGoal.findMany.mockResolvedValue([
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
      db.teamGoal.update.mockResolvedValue({});

      await trackGoalProgress('user-123', 'deal', 'deal-123', 1000);

      expect(db.teamGoal.update).toHaveBeenCalledWith({
        where: { id: 'goal-1' },
        data: expect.objectContaining({
          currentValue: 6000,
        }),
      });
    });

    it('should mark goal as completed when target is reached', async () => {
      const { db } = await import('@/lib/db');

      // @ts-expect-error - mock implementation
      db.teamMember.findMany.mockResolvedValue([{ teamId: 'team-1' }]);
      // @ts-expect-error - mock implementation
      db.teamGoal.findMany.mockResolvedValue([
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
      db.teamGoal.update.mockResolvedValue({});

      await trackGoalProgress('user-123', 'deal', 'deal-123', 1000);

      expect(db.teamGoal.update).toHaveBeenCalledWith({
        where: { id: 'goal-1' },
        data: expect.objectContaining({
          currentValue: 10500,
          status: 'completed',
        }),
      });
    });
  });

  describe('calculateGoalHealth', () => {
    it('should return achieved for completed goals', async () => {
      const { db } = await import('@/lib/db');

      // @ts-expect-error - mock implementation
      db.teamGoal.findUnique.mockResolvedValue({
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-04-30'),
        currentValue: 10000,
        targetValue: 10000,
        status: 'completed',
      });

      const result = await calculateGoalHealth('goal-1');

      expect(result).toEqual({
        health: 'achieved',
        expectedProgress: 10000,
        actualProgress: 10000,
      });
    });

    it('should return null for non-existent goals', async () => {
      const { db } = await import('@/lib/db');

      // @ts-expect-error - mock implementation
      db.teamGoal.findUnique.mockResolvedValue(null);

      const result = await calculateGoalHealth('non-existent');

      expect(result).toBeNull();
    });

    it('should return on-track for goals with 100% time elapsed and progress', async () => {
      const { db } = await import('@/lib/db');

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // @ts-expect-error - mock implementation
      db.teamGoal.findUnique.mockResolvedValue({
        startDate: startOfMonth,
        endDate: endOfMonth,
        currentValue: 10000,
        targetValue: 10000,
        status: 'active',
      });

      const result = await calculateGoalHealth('goal-1');

      expect(result?.health).toBe('on-track');
    });
  });
});
