import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with clsx support */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Generate a unique ID (crypto-safe) */
export function generateId(): string {
  return crypto.randomUUID();
}

/** Format a date to locale string */
export function formatDate(date: Date | string, locale = "es-AR"): string {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Format currency */
export function formatCurrency(amount: number, currency = "ARS", locale = "es-AR"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export type TaskPriorityType = "task_overdue" | "task_today" | "stale_contact" | "meeting_pending" | "no_interaction";

export function calculateTaskPriority(
  task: { status: string; dueDate?: Date | string | null; contactId?: string | null },
  contact?: { updatedAt?: Date | string | null },
  hasMeetingPending = false,
): { score: number; type: TaskPriorityType } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (task.status === "completed") {
    return { score: 0, type: "no_interaction" };
  }

  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    const dueDateDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

    if (dueDateDay < today) {
      return { score: 10, type: "task_overdue" };
    }

    if (dueDateDay.getTime() === today.getTime()) {
      return { score: 8, type: "task_today" };
    }
  }

  if (hasMeetingPending) {
    return { score: 6, type: "meeting_pending" };
  }

  if (contact?.updatedAt) {
    const contactDate = new Date(contact.updatedAt);
    const daysSinceContact = Math.floor((today.getTime() - contactDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceContact > 14) {
      return { score: 7, type: "stale_contact" };
    }

    if (daysSinceContact > 7) {
      return { score: 5, type: "no_interaction" };
    }
  }

  return { score: 0, type: "no_interaction" };
}

export function sortTasksByPriority<
  T extends { status: string; dueDate?: Date | string | null; contactId?: string | null },
>(tasks: T[], getContact?: (contactId: string) => { updatedAt?: Date | string | null } | undefined): T[] {
  return [...tasks].sort((a, b) => {
    const priorityA = calculateTaskPriority(a, getContact?.(a.contactId || ""));
    const priorityB = calculateTaskPriority(b, getContact?.(b.contactId || ""));
    return priorityB.score - priorityA.score;
  });
}
