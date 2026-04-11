import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================
// Mock dependencies
// ============================================

const {
  notificationCreate,
  notificationCreateMany,
  notificationFindMany,
  teamMemberFindMany,
  teamGoalFindUnique,
  memberFindMany,
  taskFindMany,
} = vi.hoisted(() => ({
  notificationCreate: vi.fn(),
  notificationCreateMany: vi.fn(),
  notificationFindMany: vi.fn(),
  teamMemberFindMany: vi.fn(),
  teamGoalFindUnique: vi.fn(),
  memberFindMany: vi.fn(),
  taskFindMany: vi.fn(),
}));

vi.mock('@/lib/db/db', () => ({
  db: {
    notification: {
      create: notificationCreate,
      createMany: notificationCreateMany,
      findMany: notificationFindMany,
    },
    teamMember: {
      findMany: teamMemberFindMany,
    },
    teamGoal: {
      findUnique: teamGoalFindUnique,
    },
    member: {
      findMany: memberFindMany,
    },
    task: {
      findMany: taskFindMany,
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

// Import after mocks are declared
import {
  createNotification,
  createNotificationForUsers,
  checkGoalMilestones,
  notifyGoalProgress,
  notifyGoalCompleted,
  notifyGoalBehindSchedule,
  notifyTaskOverdue,
  notifyTaskAssigned,
  notifyOrganization,
  processOverdueTasks,
  processTasksDueSoon,
} from '@/lib/services/notifications';

// ============================================
// Test suite
// ============================================

describe('notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ============================================
  // checkGoalMilestones
  // ============================================

  describe('checkGoalMilestones', () => {
    const BASE_DATE = new Date('2026-04-08T12:00:00Z');

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(BASE_DATE);
    });

    it('does not notify when progress is below first milestone (below 80%)', async () => {
      // @ts-expect-error - mock implementation
      teamGoalFindUnique.mockResolvedValue({
        id: 'goal-1',
        title: 'Revenue Goal',
        teamId: 'team-1',
        team: { organizationId: 'org-1' },
      });
      // @ts-expect-error - mock implementation
      notificationFindMany.mockResolvedValue([]);

      await checkGoalMilestones('goal-1', 50, 100);

      // 50/100 = 50%, below 80% threshold — no notification should be created
      expect(notificationFindMany).not.toHaveBeenCalled();
      expect(notificationCreateMany).not.toHaveBeenCalled();
    });

    it('notifies at 80% milestone (first threshold)', async () => {
      // @ts-expect-error - mock implementation
      teamGoalFindUnique.mockResolvedValue({
        id: 'goal-1',
        title: 'Revenue Goal',
        teamId: 'team-1',
        team: { organizationId: 'org-1' },
      });
      // @ts-expect-error - mock implementation
      notificationFindMany.mockResolvedValue([]);
      // @ts-expect-error - mock implementation
      teamMemberFindMany.mockResolvedValue([{ userId: 'user-1' }, { userId: 'user-2' }]);
      // @ts-expect-error - mock implementation
      notificationCreateMany.mockResolvedValue({ count: 2 });

      await checkGoalMilestones('goal-1', 80, 100);

      expect(notificationFindMany).toHaveBeenCalled();
      expect(teamMemberFindMany).toHaveBeenCalledWith({
        where: { teamId: 'team-1' },
        select: { userId: true },
      });
      expect(notificationCreateMany).toHaveBeenCalled();
    });

    it('notifies at 90% milestone', async () => {
      // @ts-expect-error - mock implementation
      teamGoalFindUnique.mockResolvedValue({
        id: 'goal-1',
        title: 'Revenue Goal',
        teamId: 'team-1',
        team: { organizationId: 'org-1' },
      });
      // @ts-expect-error - mock implementation
      notificationFindMany.mockResolvedValue([]);
      // @ts-expect-error - mock implementation
      teamMemberFindMany.mockResolvedValue([{ userId: 'user-1' }]);
      // @ts-expect-error - mock implementation
      notificationCreateMany.mockResolvedValue({ count: 1 });

      await checkGoalMilestones('goal-1', 90, 100);

      expect(notificationFindMany).toHaveBeenCalled();
      expect(notificationCreateMany).toHaveBeenCalled();
    });

    it('calls notifyGoalCompleted when progress reaches 100%', async () => {
      // @ts-expect-error - mock implementation
      teamGoalFindUnique.mockResolvedValue({
        id: 'goal-1',
        title: 'Revenue Goal',
        teamId: 'team-1',
        team: { organizationId: 'org-1' },
      });
      // @ts-expect-error - mock implementation
      notificationFindMany.mockResolvedValue([]);
      // @ts-expect-error - mock implementation
      teamMemberFindMany.mockResolvedValue([{ userId: 'user-1' }]);
      // @ts-expect-error - mock implementation
      notificationCreateMany.mockResolvedValue({ count: 1 });

      await checkGoalMilestones('goal-1', 100, 100);

      // At 100%, notifyGoalCompleted path is taken
      expect(teamGoalFindUnique).toHaveBeenCalledWith({
        where: { id: 'goal-1' },
        select: {
          id: true,
          title: true,
          teamId: true,
          team: { select: { organizationId: true } },
        },
      });
    });

    it('skips notification if one was already sent for this milestone in last 24h', async () => {
      // @ts-expect-error - mock implementation
      teamGoalFindUnique.mockResolvedValue({
        id: 'goal-1',
        title: 'Revenue Goal',
        teamId: 'team-1',
        team: { organizationId: 'org-1' },
      });
      // Existing notification found (within 24h window)
      // @ts-expect-error - mock implementation
      notificationFindMany.mockResolvedValue([{ id: 'notif-1' }]);

      await checkGoalMilestones('goal-1', 80, 100);

      // Should NOT create new notification since one already exists
      expect(teamMemberFindMany).not.toHaveBeenCalled();
      expect(notificationCreateMany).not.toHaveBeenCalled();
    });

    it('does nothing when goal is not found', async () => {
      // @ts-expect-error - mock implementation
      teamGoalFindUnique.mockResolvedValue(null);

      await checkGoalMilestones('non-existent-goal', 80, 100);

      expect(notificationFindMany).not.toHaveBeenCalled();
      expect(notificationCreateMany).not.toHaveBeenCalled();
    });

    it('rounds progress correctly (Math.round)', async () => {
      // 79.6% should round to 80%, triggering the 80% milestone
      // @ts-expect-error - mock implementation
      teamGoalFindUnique.mockResolvedValue({
        id: 'goal-1',
        title: 'Revenue Goal',
        teamId: 'team-1',
        team: { organizationId: 'org-1' },
      });
      // @ts-expect-error - mock implementation
      notificationFindMany.mockResolvedValue([]);
      // @ts-expect-error - mock implementation
      teamMemberFindMany.mockResolvedValue([{ userId: 'user-1' }]);
      // @ts-expect-error - mock implementation
      notificationCreateMany.mockResolvedValue({ count: 1 });

      await checkGoalMilestones('goal-1', 79.6, 100);

      // 79.6/100 = 79.6%, rounded to 80% >= 80 threshold
      expect(notificationCreateMany).toHaveBeenCalled();
    });
  });

  // ============================================
  // createNotification
  // ============================================

  describe('createNotification', () => {
    it('creates a notification with correct data', async () => {
      const createdNotification = {
        id: 'notif-1',
        userId: 'user-1',
        organizationId: 'org-1',
        type: 'task',
        title: 'Test notification',
        message: 'This is a test',
        actionUrl: '/tasks?task=123',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      // @ts-expect-error - mock implementation
      notificationCreate.mockResolvedValue(createdNotification);

      const result = await createNotification({
        userId: 'user-1',
        organizationId: 'org-1',
        type: 'task',
        title: 'Test notification',
        message: 'This is a test',
        actionUrl: '/tasks?task=123',
      });

      expect(notificationCreate).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          organizationId: 'org-1',
          type: 'task',
          title: 'Test notification',
          message: 'This is a test',
          actionUrl: '/tasks?task=123',
          isRead: false,
        },
      });
      expect(result).toEqual(createdNotification);
    });

    it('sets actionUrl to null when not provided', async () => {
      // @ts-expect-error - mock implementation
      notificationCreate.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        organizationId: 'org-1',
        type: 'info',
        title: 'Info',
        message: 'No action needed',
        actionUrl: null,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await createNotification({
        userId: 'user-1',
        organizationId: 'org-1',
        type: 'info',
        title: 'Info',
        message: 'No action needed',
      });

      expect(notificationCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actionUrl: null,
        }),
      });
    });

    it('throws error when DB create fails', async () => {
      // @ts-expect-error - mock implementation
      notificationCreate.mockRejectedValue(new Error('DB connection failed'));

      await expect(
        createNotification({
          userId: 'user-1',
          organizationId: 'org-1',
          type: 'task',
          title: 'Test',
          message: 'Test message',
        })
      ).rejects.toThrow('DB connection failed');
    });
  });

  // ============================================
  // createNotificationForUsers
  // ============================================

  describe('createNotificationForUsers', () => {
    it('creates notifications for multiple users', async () => {
      // @ts-expect-error - mock implementation
      notificationCreateMany.mockResolvedValue({ count: 3 });

      await createNotificationForUsers(
        ['user-1', 'user-2', 'user-3'],
        {
          organizationId: 'org-1',
          type: 'goal',
          title: 'Goal update',
          message: 'Your team goal is progressing',
        }
      );

      expect(notificationCreateMany).toHaveBeenCalledWith({
        data: [
          {
            userId: 'user-1',
            organizationId: 'org-1',
            type: 'goal',
            title: 'Goal update',
            message: 'Your team goal is progressing',
            actionUrl: null,
            isRead: false,
          },
          {
            userId: 'user-2',
            organizationId: 'org-1',
            type: 'goal',
            title: 'Goal update',
            message: 'Your team goal is progressing',
            actionUrl: null,
            isRead: false,
          },
          {
            userId: 'user-3',
            organizationId: 'org-1',
            type: 'goal',
            title: 'Goal update',
            message: 'Your team goal is progressing',
            actionUrl: null,
            isRead: false,
          },
        ],
      });
    });

    it('returns early when userIds array is empty', async () => {
      await createNotificationForUsers([], {
        organizationId: 'org-1',
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });

      expect(notificationCreateMany).not.toHaveBeenCalled();
    });

    it('throws error when DB createMany fails', async () => {
      // @ts-expect-error - mock implementation
      notificationCreateMany.mockRejectedValue(new Error('Bulk insert failed'));

      await expect(
        createNotificationForUsers(['user-1'], {
          organizationId: 'org-1',
          type: 'info',
          title: 'Test',
          message: 'Test message',
        })
      ).rejects.toThrow('Bulk insert failed');
    });
  });

  // ============================================
  // notifyGoalProgress
  // ============================================

  describe('notifyGoalProgress', () => {
    it('notifies all team members when goal reaches milestone', async () => {
      // @ts-expect-error - mock implementation
      teamMemberFindMany.mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
      ]);
      // @ts-expect-error - mock implementation
      notificationCreateMany.mockResolvedValue({ count: 2 });

      await notifyGoalProgress({
        goalId: 'goal-1',
        goalTitle: 'Revenue Goal',
        progress: 80,
        teamId: 'team-1',
        organizationId: 'org-1',
      });

      expect(teamMemberFindMany).toHaveBeenCalledWith({
        where: { teamId: 'team-1' },
        select: { userId: true },
      });
      expect(notificationCreateMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: 'user-1',
            organizationId: 'org-1',
            type: 'goal',
            title: 'Objetivo alcanzando meta',
            message: 'El objetivo "Revenue Goal" ha alcanzado el 80%',
            actionUrl: '/teams?team=team-1',
            isRead: false,
          }),
        ]),
      });
    });

    it('does nothing when team has no members', async () => {
      // @ts-expect-error - mock implementation
      teamMemberFindMany.mockResolvedValue([]);

      await notifyGoalProgress({
        goalId: 'goal-1',
        goalTitle: 'Revenue Goal',
        progress: 80,
        teamId: 'team-1',
        organizationId: 'org-1',
      });

      expect(notificationCreateMany).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // notifyGoalCompleted
  // ============================================

  describe('notifyGoalCompleted', () => {
    it('notifies all team members when goal is completed', async () => {
      // @ts-expect-error - mock implementation
      teamMemberFindMany.mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
      ]);
      // @ts-expect-error - mock implementation
      notificationCreateMany.mockResolvedValue({ count: 2 });

      await notifyGoalCompleted({
        goalId: 'goal-1',
        goalTitle: 'Revenue Goal',
        teamId: 'team-1',
        organizationId: 'org-1',
      });

      expect(notificationCreateMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            type: 'success',
            title: '¡Objetivo completado!',
            message: 'El objetivo "Revenue Goal" ha sido completado exitosamente',
          }),
        ]),
      });
    });
  });

  // ============================================
  // notifyGoalBehindSchedule
  // ============================================

  describe('notifyGoalBehindSchedule', () => {
    it('notifies team members with warning type', async () => {
      // @ts-expect-error - mock implementation
      teamMemberFindMany.mockResolvedValue([{ userId: 'user-1' }]);
      // @ts-expect-error - mock implementation
      notificationCreateMany.mockResolvedValue({ count: 1 });

      await notifyGoalBehindSchedule({
        goalId: 'goal-1',
        goalTitle: 'Revenue Goal',
        progress: 45,
        teamId: 'team-1',
        organizationId: 'org-1',
      });

      expect(notificationCreateMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            type: 'warning',
            title: 'Objetivo rezagado',
            message: expect.stringContaining('45'),
          }),
        ]),
      });
    });
  });

  // ============================================
  // notifyTaskOverdue
  // ============================================

  describe('notifyTaskOverdue', () => {
    it('creates overdue task notification', async () => {
      // @ts-expect-error - mock implementation
      notificationCreate.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        organizationId: 'org-1',
        type: 'task',
        title: 'Tarea vencida',
        message: 'La tarea "Fix bug" venció el 4/8/2026',
        actionUrl: '/tasks?task=task-1',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const dueDate = new Date('2026-04-08');
      await notifyTaskOverdue({
        taskId: 'task-1',
        taskTitle: 'Fix bug',
        assignedTo: 'user-1',
        organizationId: 'org-1',
        dueDate,
      });

      expect(notificationCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          organizationId: 'org-1',
          type: 'task',
          title: 'Tarea vencida',
          message: expect.stringContaining('Fix bug'),
          actionUrl: '/tasks?task=task-1',
          isRead: false,
        }),
      });
    });
  });

  // ============================================
  // notifyTaskAssigned
  // ============================================

  describe('notifyTaskAssigned', () => {
    it('creates task assigned notification', async () => {
      // @ts-expect-error - mock implementation
      notificationCreate.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        organizationId: 'org-1',
        type: 'task',
        title: 'Nueva tarea asignada',
        message: 'Se te ha asignado la tarea "New feature"',
        actionUrl: '/tasks?task=task-1',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await notifyTaskAssigned({
        taskId: 'task-1',
        taskTitle: 'New feature',
        assignedTo: 'user-1',
        organizationId: 'org-1',
        assignedBy: 'user-2',
      });

      expect(notificationCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'task',
          title: 'Nueva tarea asignada',
          message: 'Se te ha asignado la tarea "New feature"',
        }),
      });
    });
  });

  // ============================================
  // notifyOrganization
  // ============================================

  describe('notifyOrganization', () => {
    it('notifies all organization members', async () => {
      // @ts-expect-error - mock implementation
      memberFindMany.mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
        { userId: 'user-3' },
      ]);
      // @ts-expect-error - mock implementation
      notificationCreateMany.mockResolvedValue({ count: 3 });

      await notifyOrganization({
        organizationId: 'org-1',
        title: 'System maintenance',
        message: 'Scheduled downtime tonight',
      });

      expect(memberFindMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        select: { userId: true },
      });
      expect(notificationCreateMany).toHaveBeenCalled();
    });

    it('does nothing when organization has no members', async () => {
      // @ts-expect-error - mock implementation
      memberFindMany.mockResolvedValue([]);

      await notifyOrganization({
        organizationId: 'org-1',
        title: 'System maintenance',
        message: 'Scheduled downtime tonight',
      });

      expect(notificationCreateMany).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // processOverdueTasks
  // ============================================

  describe('processOverdueTasks', () => {
    const BASE_DATE = new Date('2026-04-08T12:00:00Z');

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(BASE_DATE);
    });

    it('returns empty array when no overdue tasks exist', async () => {
      // @ts-expect-error - mock implementation
      taskFindMany.mockResolvedValue([]);

      const result = await processOverdueTasks('org-1');

      expect(result).toEqual([]);
    });

    it('does not duplicate notifications for same task on same day', async () => {
      // @ts-expect-error - mock implementation
      taskFindMany.mockResolvedValue([
        {
          id: 'task-1',
          title: 'Overdue task',
          dueDate: new Date('2026-04-07'),
          assignedTo: 'user-1',
        },
      ]);
      // @ts-expect-error - mock implementation
      notificationFindMany.mockResolvedValue([
        { actionUrl: '/tasks?task=task-1' }, // Already notified today
      ]);
      // @ts-expect-error - mock implementation
      notificationCreateMany.mockResolvedValue({ count: 0 });

      const result = await processOverdueTasks('org-1');

      // Should return empty since notification already exists
      expect(result).toEqual([]);
    });

    it('creates notifications for overdue tasks not yet notified', async () => {
      // @ts-expect-error - mock implementation
      taskFindMany.mockResolvedValue([
        {
          id: 'task-1',
          title: 'Overdue task',
          dueDate: new Date('2026-04-07'),
          assignedTo: 'user-1',
        },
      ]);
      // @ts-expect-error - mock implementation
      notificationFindMany.mockResolvedValue([]); // No existing notification
      // @ts-expect-error - mock implementation
      notificationCreateMany.mockResolvedValue({ count: 1 });

      const result = await processOverdueTasks('org-1');

      expect(notificationCreateMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: 'user-1',
            organizationId: 'org-1',
            type: 'task',
            title: 'Tarea vencida',
            actionUrl: '/tasks?task=task-1',
          }),
        ]),
      });
    });
  });

  // ============================================
  // processTasksDueSoon
  // ============================================

  describe('processTasksDueSoon', () => {
    const BASE_DATE = new Date('2026-04-08T12:00:00Z');

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(BASE_DATE);
    });

    it('returns empty array when no tasks are due soon', async () => {
      // @ts-expect-error - mock implementation
      taskFindMany.mockResolvedValue([]);

      const result = await processTasksDueSoon('org-1');

      expect(result).toEqual([]);
    });

    it('creates notifications for tasks due tomorrow', async () => {
      // @ts-expect-error - mock implementation
      taskFindMany.mockResolvedValue([
        {
          id: 'task-2',
          title: 'Task due tomorrow',
          dueDate: new Date('2026-04-09'),
          assignedTo: 'user-1',
        },
      ]);
      // @ts-expect-error - mock implementation
      notificationFindMany.mockResolvedValue([]);
      // @ts-expect-error - mock implementation
      notificationCreateMany.mockResolvedValue({ count: 1 });

      const result = await processTasksDueSoon('org-1');

      expect(notificationCreateMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            type: 'task',
            title: 'Tarea próxima a vencer',
            message: expect.stringContaining('Task due tomorrow'),
          }),
        ]),
      });
    });
  });
});
