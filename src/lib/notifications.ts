// Notification Service for MaatWork CRM
// This service provides helper functions to create notifications for various events

import { db } from "@/lib/db";

// ============================================
// Types
// ============================================

export type NotificationType = 
  | "task" 
  | "goal" 
  | "contact" 
  | "system" 
  | "info" 
  | "success" 
  | "warning" 
  | "error";

export interface CreateNotificationParams {
  userId: string;
  organizationId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string | null;
}

// ============================================
// Core Notification Functions
// ============================================

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await db.notification.create({
      data: {
        userId: params.userId,
        organizationId: params.organizationId,
        type: params.type,
        title: params.title,
        message: params.message,
        actionUrl: params.actionUrl || null,
        isRead: false,
      },
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Create notifications for multiple users
 */
export async function createNotificationForUsers(
  userIds: string[],
  params: Omit<CreateNotificationParams, "userId">
) {
  try {
    const notifications = await Promise.all(
      userIds.map((userId) =>
        db.notification.create({
          data: {
            userId,
            organizationId: params.organizationId,
            type: params.type,
            title: params.title,
            message: params.message,
            actionUrl: params.actionUrl || null,
            isRead: false,
          },
        })
      )
    );
    return notifications;
  } catch (error) {
    console.error("Error creating notifications for users:", error);
    throw error;
  }
}

// ============================================
// Task Notification Triggers
// ============================================

/**
 * Notify when a task is overdue
 * Call this from a cron job or scheduler
 */
export async function notifyTaskOverdue(params: {
  taskId: string;
  taskTitle: string;
  assignedTo: string;
  organizationId: string;
  dueDate: Date;
}) {
  return createNotification({
    userId: params.assignedTo,
    organizationId: params.organizationId,
    type: "task",
    title: "Tarea vencida",
    message: `La tarea "${params.taskTitle}" venció el ${params.dueDate.toLocaleDateString("es-MX")}`,
    actionUrl: `/tasks?task=${params.taskId}`,
  });
}

/**
 * Notify when a task is due soon (e.g., tomorrow)
 */
export async function notifyTaskDueSoon(params: {
  taskId: string;
  taskTitle: string;
  assignedTo: string;
  organizationId: string;
  dueDate: Date;
}) {
  return createNotification({
    userId: params.assignedTo,
    organizationId: params.organizationId,
    type: "task",
    title: "Tarea próxima a vencer",
    message: `La tarea "${params.taskTitle}" vence mañana`,
    actionUrl: `/tasks?task=${params.taskId}`,
  });
}

/**
 * Notify when a task is assigned to a user
 */
export async function notifyTaskAssigned(params: {
  taskId: string;
  taskTitle: string;
  assignedTo: string;
  organizationId: string;
  assignedBy: string;
}) {
  return createNotification({
    userId: params.assignedTo,
    organizationId: params.organizationId,
    type: "task",
    title: "Nueva tarea asignada",
    message: `Se te ha asignado la tarea "${params.taskTitle}"`,
    actionUrl: `/tasks?task=${params.taskId}`,
  });
}

/**
 * Notify when a task is completed
 */
export async function notifyTaskCompleted(params: {
  taskId: string;
  taskTitle: string;
  completedBy: string;
  organizationId: string;
  notifyUserId: string;
}) {
  return createNotification({
    userId: params.notifyUserId,
    organizationId: params.organizationId,
    type: "success",
    title: "Tarea completada",
    message: `La tarea "${params.taskTitle}" ha sido completada`,
    actionUrl: `/tasks?task=${params.taskId}`,
  });
}

// ============================================
// Goal Notification Triggers
// ============================================

/**
 * Notify when a goal reaches a milestone (e.g., 80%)
 */
export async function notifyGoalProgress(params: {
  goalId: string;
  goalTitle: string;
  progress: number;
  teamId: string;
  organizationId: string;
}) {
  // Get all team members to notify
  const teamMembers = await db.teamMember.findMany({
    where: { teamId: params.teamId },
    select: { userId: true },
  });

  const userIds = teamMembers.map((m) => m.userId);

  return createNotificationForUsers(userIds, {
    organizationId: params.organizationId,
    type: "goal",
    title: "Objetivo alcanzando meta",
    message: `El objetivo "${params.goalTitle}" ha alcanzado el ${params.progress}%`,
    actionUrl: `/teams?team=${params.teamId}`,
  });
}

/**
 * Notify when a goal is completed
 */
export async function notifyGoalCompleted(params: {
  goalId: string;
  goalTitle: string;
  teamId: string;
  organizationId: string;
}) {
  const teamMembers = await db.teamMember.findMany({
    where: { teamId: params.teamId },
    select: { userId: true },
  });

  const userIds = teamMembers.map((m) => m.userId);

  return createNotificationForUsers(userIds, {
    organizationId: params.organizationId,
    type: "success",
    title: "¡Objetivo completado!",
    message: `El objetivo "${params.goalTitle}" ha sido completado exitosamente`,
    actionUrl: `/teams?team=${params.teamId}`,
  });
}

/**
 * Notify when a goal is behind schedule
 */
export async function notifyGoalBehindSchedule(params: {
  goalId: string;
  goalTitle: string;
  progress: number;
  teamId: string;
  organizationId: string;
}) {
  const teamMembers = await db.teamMember.findMany({
    where: { teamId: params.teamId },
    select: { userId: true },
  });

  const userIds = teamMembers.map((m) => m.userId);

  return createNotificationForUsers(userIds, {
    organizationId: params.organizationId,
    type: "warning",
    title: "Objetivo rezagado",
    message: `El objetivo "${params.goalTitle}" está por debajo del progreso esperado (${params.progress}%)`,
    actionUrl: `/teams?team=${params.teamId}`,
  });
}

// ============================================
// Contact Notification Triggers
// ============================================

/**
 * Notify when a new contact is assigned
 */
export async function notifyContactAssigned(params: {
  contactId: string;
  contactName: string;
  assignedTo: string;
  organizationId: string;
  assignedBy: string;
}) {
  return createNotification({
    userId: params.assignedTo,
    organizationId: params.organizationId,
    type: "contact",
    title: "Nuevo contacto asignado",
    message: `Se te ha asignado el contacto "${params.contactName}"`,
    actionUrl: `/contacts?contact=${params.contactId}`,
  });
}

/**
 * Notify when a contact moves to a new pipeline stage
 */
export async function notifyContactStageChange(params: {
  contactId: string;
  contactName: string;
  newStage: string;
  assignedTo: string;
  organizationId: string;
}) {
  return createNotification({
    userId: params.assignedTo,
    organizationId: params.organizationId,
    type: "contact",
    title: "Contacto actualizado",
    message: `El contacto "${params.contactName}" se movió a "${params.newStage}"`,
    actionUrl: `/contacts?contact=${params.contactId}`,
  });
}

/**
 * Notify when a high-value contact is created
 */
export async function notifyHighValueContact(params: {
  contactId: string;
  contactName: string;
  segment: string;
  organizationId: string;
  managerId?: string;
}) {
  // Notify managers about high-value contacts
  const managers = await db.member.findMany({
    where: {
      organizationId: params.organizationId,
      role: { in: ["owner", "admin"] },
    },
    select: { userId: true },
  });

  const userIds = managers.map((m) => m.userId);

  return createNotificationForUsers(userIds, {
    organizationId: params.organizationId,
    type: "contact",
    title: "Nuevo contacto premium",
    message: `Se creó el contacto "${params.contactName}" en segmento ${params.segment}`,
    actionUrl: `/contacts?contact=${params.contactId}`,
  });
}

// ============================================
// System Notification Triggers
// ============================================

/**
 * Send a system notification to all organization members
 */
export async function notifyOrganization(params: {
  organizationId: string;
  title: string;
  message: string;
  actionUrl?: string;
}) {
  const members = await db.member.findMany({
    where: { organizationId: params.organizationId },
    select: { userId: true },
  });

  const userIds = members.map((m) => m.userId);

  return createNotificationForUsers(userIds, {
    organizationId: params.organizationId,
    type: "system",
    title: params.title,
    message: params.message,
    actionUrl: params.actionUrl,
  });
}

/**
 * Send a notification to a specific user
 */
export async function notifyUser(params: {
  userId: string;
  organizationId: string;
  title: string;
  message: string;
  type?: NotificationType;
  actionUrl?: string;
}) {
  return createNotification({
    userId: params.userId,
    organizationId: params.organizationId,
    type: params.type || "info",
    title: params.title,
    message: params.message,
    actionUrl: params.actionUrl,
  });
}

// ============================================
// Scheduled Job Helpers
// ============================================

/**
 * Check for overdue tasks and create notifications
 * This should be called by a cron job
 */
export async function processOverdueTasks(organizationId: string) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // Find all overdue tasks that are not completed
  const overdueTasks = await db.task.findMany({
    where: {
      organizationId,
      dueDate: { lt: now },
      status: { notIn: ["completed", "cancelled"] },
      assignedTo: { not: null },
    },
    take: 100,
    orderBy: { dueDate: 'asc' },
    select: {
      id: true,
      title: true,
      dueDate: true,
      assignedTo: true,
      assignedUser: { select: { id: true, name: true } },
    },
  });

  if (overdueTasks.length === 0) {
    return [];
  }

  // Bulk check for existing notifications (optimization: avoid N+1)
  const existingNotifications = await db.notification.findMany({
    where: {
      userId: { in: overdueTasks.map(t => t.assignedTo).filter(Boolean) as string[] },
      organizationId,
      type: "task",
      title: "Tarea vencida",
      createdAt: { gte: todayStart },
    },
    select: { actionUrl: true },
  });

  const existingUrls = new Set(existingNotifications.map(n => n.actionUrl));
  const toNotify = overdueTasks.filter(t => !existingUrls.has(`/tasks?task=${t.id}`));

  // Bulk create notifications
  if (toNotify.length === 0) {
    return [];
  }

  const notificationData = toNotify
    .filter(t => t.assignedTo && t.dueDate)
    .map(t => ({
      userId: t.assignedTo!,
      organizationId,
      type: "task" as const,
      title: "Tarea vencida",
      message: `La tarea "${t.title}" venció el ${t.dueDate!.toLocaleDateString("es-MX")}`,
      actionUrl: `/tasks?task=${t.id}`,
      isRead: false,
    }));

  const notifications = await db.notification.createMany({
    data: notificationData,
    skipDuplicates: true,
  });

  return notifications;
}

/**
 * Check for tasks due soon and create notifications
 * This should be called by a cron job
 */
export async function processTasksDueSoon(organizationId: string) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find all tasks due tomorrow that are not completed
  const upcomingTasks = await db.task.findMany({
    where: {
      organizationId,
      dueDate: {
        gte: today,
        lte: tomorrow,
      },
      status: { notIn: ["completed", "cancelled"] },
      assignedTo: { not: null },
    },
    take: 100,
    orderBy: { dueDate: 'asc' },
    select: {
      id: true,
      title: true,
      dueDate: true,
      assignedTo: true,
      assignedUser: { select: { id: true, name: true } },
    },
  });

  if (upcomingTasks.length === 0) {
    return [];
  }

  // Bulk check for existing notifications (optimization: avoid N+1)
  const existingNotifications = await db.notification.findMany({
    where: {
      userId: { in: upcomingTasks.map(t => t.assignedTo).filter(Boolean) as string[] },
      organizationId,
      type: "task",
      title: "Tarea próxima a vencer",
      createdAt: { gte: today },
    },
    select: { actionUrl: true },
  });

  const existingUrls = new Set(existingNotifications.map(n => n.actionUrl));
  const toNotify = upcomingTasks.filter(t => !existingUrls.has(`/tasks?task=${t.id}`));

  // Bulk create notifications
  if (toNotify.length === 0) {
    return [];
  }

  const notificationData = toNotify
    .filter(t => t.assignedTo && t.dueDate)
    .map(t => ({
      userId: t.assignedTo!,
      organizationId,
      type: "task" as const,
      title: "Tarea próxima a vencer",
      message: `La tarea "${t.title}" vence mañana`,
      actionUrl: `/tasks?task=${t.id}`,
      isRead: false,
    }));

  const notifications = await db.notification.createMany({
    data: notificationData,
    skipDuplicates: true,
  });

  return notifications;
}

/**
 * Check for goals reaching milestones (80%)
 * This should be called when goals are updated
 */
export async function checkGoalMilestones(
  goalId: string,
  currentValue: number,
  targetValue: number
) {
  const progress = Math.round((currentValue / targetValue) * 100);

  // Check milestone thresholds
  const milestones = [80, 90, 100];

  for (const milestone of milestones) {
    if (progress >= milestone) {
      // Check if we already notified about this milestone
      const goal = await db.teamGoal.findUnique({
        where: { id: goalId },
        select: {
          id: true,
          title: true,
          teamId: true,
          team: { select: { organizationId: true } },
        },
      });

      if (goal) {
        // Bulk check for existing notifications (optimization: avoid N+1)
        const existingNotifications = await db.notification.findMany({
          where: {
            type: "goal",
            title: "Objetivo alcanzando meta",
            actionUrl: `/teams?team=${goal.teamId}`,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
          select: { id: true },
          take: 1,
        });

        if (existingNotifications.length === 0) {
          if (progress >= 100) {
            await notifyGoalCompleted({
              goalId,
              goalTitle: goal.title,
              teamId: goal.teamId,
              organizationId: goal.team.organizationId,
            });
          } else {
            await notifyGoalProgress({
              goalId,
              goalTitle: goal.title,
              progress,
              teamId: goal.teamId,
              organizationId: goal.team.organizationId,
            });
          }
        }
      }
      break;
    }
  }
}
