import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";

// Notification types and priorities
export type Priority = "high" | "medium" | "low";
export type NotifType = "alerts" | "system" | "actions";

export interface Notification {
  id: string;
  type: NotifType;
  message: string;
  timestamp: number;
  priority: Priority;
  read: boolean;
  snoozeUntil?: number;
  groupKey?: string;
  meta?: Record<string, unknown>;
}

type ActionPayload = {
  type: "markRead" | "dismiss" | "snooze";
  id: string;
  payload?: { minutes?: number };
};

// Basic validation schema for actions (Zod)
const actionSchema = z.object({
  type: z.enum(["markRead", "dismiss", "snooze"]),
  id: z.string().min(1),
  payload: z.object({ minutes: z.number().int().positive() }).optional(),
});

const STORAGE_KEY = "maatwork_notifications_v1";

function defaultSeed(): Notification[] {
  const t = Date.now();
  return [
    {
      id: `seed_alert_${t}-1`,
      type: "alerts",
      message: "New client activity detected. Review required.",
      timestamp: t - 1000 * 60 * 5,
      priority: "high",
      read: false,
    },
    {
      id: `seed_system_${t}-2`,
      type: "system",
      message: "Backup completed successfully.",
      timestamp: t - 1000 * 60 * 30,
      priority: "low",
      read: false,
    },
    {
      id: `seed_action_${t}-3`,
      type: "actions",
      message: "User requested document export.",
      timestamp: t - 1000 * 60 * 60,
      priority: "medium",
      read: true,
    },
  ];
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const data = JSON.parse(raw) as Notification[];
        return Array.isArray(data) ? data : defaultSeed();
      }
    } catch {
      // ignore parse errors
    }
    return defaultSeed();
  });

  // Persist changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // no-op
    }
  }, [notifications]);

  const addNotification = useCallback((payload: Omit<Notification, "id" | "timestamp" | "read">) => {
    const id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    const item: Notification = {
      id,
      timestamp: Date.now(),
      read: false,
      ...payload,
    };
    setNotifications((prev) => [item, ...prev]);
  }, []);

  const updateNotification = useCallback((id: string, patch: Partial<Notification>) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Expose a minimal memoized view to compute visible items (respect snooze)
  const visibleNotifications = useMemo(() => {
    const now = Date.now();
    return notifications.filter((n) => !n.snoozeUntil || n.snoozeUntil <= now);
  }, [notifications]);

  // Simple typed action dispatcher with validation (for UI layer use)
  const dispatchAction = useCallback(
    (action: ActionPayload) => {
      const parsed = actionSchema.safeParse({ type: action.type, id: action.id, payload: action.payload });
      if (!parsed.success) {
        // ignore invalid actions here; UI layer can show a toast
        return false;
      }
      const { type, id, payload } = parsed.data;
      if (type === "markRead") {
        updateNotification(id, { read: true });
      } else if (type === "dismiss") {
        removeNotification(id);
      } else if (type === "snooze") {
        const minutes = payload?.minutes ?? 10;
        updateNotification(id, { snoozeUntil: Date.now() + minutes * 60 * 1000 });
      }
      return true;
    },
    [updateNotification, removeNotification],
  );

  return {
    notifications,
    visibleNotifications,
    addNotification,
    updateNotification,
    removeNotification,
    markAllRead,
    clearAll,
    dispatchAction,
  };
}
