// ============================================================
// MaatWork CRM — Inngest Client + Automation Functions
// ============================================================

import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "maatwork-crm" });

// ── Automation: Contact activated → welcome notification ─────
export const onContactActivated = inngest.createFunction(
  { id: "on-contact-activated", name: "Contact Activated" },
  { event: "crm/contact.status.changed" },
  async ({ event, step }) => {
    if (event.data.newStatus !== "active") return;

    await step.run("create-welcome-notification", async () => {
      // In production, this would call the notification service
      console.log(`📧 Welcome notification for contact: ${event.data.contactName}`);
      return { sent: true, contactId: event.data.contactId };
    });
  }
);

// ── Automation: Task overdue → alert assignee ────────────────
export const onTaskOverdue = inngest.createFunction(
  { id: "check-overdue-tasks", name: "Check Overdue Tasks" },
  { cron: "0 9 * * *" }, // Daily at 9 AM
  async ({ step }) => {
    await step.run("find-overdue-tasks", async () => {
      console.log("🔔 Checking for overdue tasks...");
      // In production: query DB for overdue tasks and create notifications
      return { checked: true };
    });
  }
);

// ── Automation: Goal near target → notify team leader ────────
export const onGoalNearTarget = inngest.createFunction(
  { id: "on-goal-progress", name: "Goal Progress Check" },
  { event: "crm/goal.progress.updated" },
  async ({ event, step }) => {
    const progress = (event.data.currentValue / event.data.targetValue) * 100;

    if (progress >= 80 && progress < 100) {
      await step.run("notify-leader", async () => {
        console.log(`🎯 Goal "${event.data.goalTitle}" at ${progress.toFixed(0)}% — notifying leader`);
        return { notified: true, progress };
      });
    }

    if (progress >= 100) {
      await step.run("celebrate-completion", async () => {
        console.log(`🎉 Goal "${event.data.goalTitle}" completed!`);
        return { completed: true };
      });
    }
  }
);

export const inngestFunctions = [onContactActivated, onTaskOverdue, onGoalNearTarget];
