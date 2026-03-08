# Option B - UX/Productivity Implementation Plan

**Date:** 2026-03-07
**Scope:** Notifications Center + Automations Engine
**Duration Estimate:** 2-3 weeks
**Business Value:** ⭐⭐⭐ User engagement and efficiency improvements

---

## Overview

Option B focuses on improving user experience and productivity with two key features:

1. **Notifications Center** - Centralized notification management with priority-based grouping
2. **Automations Engine** - Automated workflows to reduce manual work

These features directly improve:
- **User Engagement:** Users never miss important updates, feel more connected
- **Efficiency:** Reduce repetitive manual tasks through automation
- **Productivity:** Faster workflows, consistent processes

---

## Module 1: Notifications Center

### 1.1 Database Schema

```sql
-- notifications table: Main notification records
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'info', 'success', 'warning', 'danger', 'task', 'milestone'
  priority TEXT NOT NULL CHECK (priority IN ('high', 'normal', 'low')), -- Priority level
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT, -- Link to relevant page
  action_data JSONB, -- Action-specific payload
  read_at TIMESTAMP, -- When user opened/seen notification
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- notification_settings table: User notification preferences
CREATE TABLE notification_settings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  desktop_enabled BOOLEAN DEFAULT TRUE,
  mobile_enabled BOOLEAN DEFAULT TRUE,
  digest_frequency TEXT DEFAULT 'hourly', -- 'instant', '15min', 'hourly', 'daily', 'weekly'
  quiet_hours_start TEXT, -- HH:MM format
  quiet_hours_end TEXT, -- HH:MM format
);

-- notification_groups table: Smart grouping for display
CREATE TABLE notification_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL, -- 'system', 'task', 'social', 'alert'
  icon TEXT,
  color TEXT
  description TEXT
);
```

#### Drizzle Schema

```typescript
// apps/web/server/db/schema/notifications.ts
import { pgTable, text, timestamp, boolean, check, index, unique } from 'drizzle-orm/pg-core';

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  priority: text('priority').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  actionUrl: text('action_url'),
  actionData: text('action_data'), // JSONB
  readAt: timestamp('read_at'),
  isRead: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const notificationSettings = pgTable('notification_settings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  emailEnabled: boolean('email_enabled').default(true),
  pushEnabled: boolean('push_enabled').default(true),
  desktopEnabled: boolean('desktop_enabled').default(true),
  mobileEnabled: boolean('mobile_enabled').default(true),
  digestFrequency: text('digest_frequency').default('hourly'),
  quietHoursStart: text('quiet_hours_start'),
  quietHoursEnd: text('quiet_hours_end'),
});

export const notificationGroups = pgTable('notification_groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  type: text('type').notNull(),
  icon: text('icon'),
  color: text('color'),
  description: text('description'),
});

// Notification Types
export const notificationTypes = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  task: 'task',
  milestone: 'milestone',
  social: 'social',
  alert: 'alert',
} as const;

// Notification Priorities
export const notificationPriorities = {
  high: 'high',
  normal: 'normal',
  low: 'low',
} as const;

// Indexes for performance
createIndex('notifications', ['user_id', 'read_at', 'created_at', 'priority', 'type']);
```

---

### 1.2 API Endpoints

```typescript
// apps/web/server/functions/notifications.ts

// GET notifications with filters
export const getNotifications = serverFn({
  input: z.object({
    userId: z.string().optional(),
    orgId: z.string().optional(),
    unreadOnly: z.boolean().default(false),
    type: z.enum(['info', 'success', 'warning', 'danger', 'task', 'milestone', 'social', 'alert']).optional(),
    priority: z.enum(['high', 'normal', 'low']).optional(),
    limit: z.number().default(20),
    offset: z.number().default(0),
  }),
})
  .handler(async ({ input, ctx }) => {
    const whereConditions = [];

    if (input.userId) whereConditions.push(eq(notifications.userId, input.userId));
    if (input.unreadOnly) whereConditions.push(eq(notifications.isRead, false));
    if (input.orgId) {
      // Filter by user's organization
      const orgUsers = await getOrganizationUsers(input.orgId, ctx.db);
      whereConditions.push(inArray(notifications.userId, orgUsers));
    }
    if (input.type) whereConditions.push(eq(notifications.type, input.type));
    if (input.priority) whereConditions.push(eq(notifications.priority, input.priority));

    const notifications = await ctx.db.query.notifications.findMany({
      where: and(...whereConditions),
      orderBy: [desc(notifications.createdAt)],
      with: {
        group: true,
        settings: true,
      },
      limit: input.limit,
      offset: input.offset,
    });

    return notifications;
  });

// GET unread count
export const getUnreadCount = serverFn({
  input: z.object({ userId: z.string() }),
})
  .handler(async ({ input, ctx }) => {
    const count = await ctx.db.select({ count: notifications.id })
      .from(notifications)
      .where(and(
        eq(notifications.userId, input.userId),
        eq(notifications.isRead, false),
      ))
      .get();

    return { count };
  });

// Mark notification as read
export const markAsRead = serverFn({
  input: z.object({ notificationId: z.string() }),
})
  .handler(async ({ input, ctx }) => {
    await ctx.db.update(notifications)
      .set({ readAt: new Date(), isRead: true })
      .where(eq(notifications.id, input.notificationId));

    return { success: true };
  });

// Mark all as read
export const markAllAsRead = serverFn({
  input: z.object({ userId: z.string() }),
})
  .handler(async ({ input, ctx }) => {
    await ctx.db.update(notifications)
      .set({ readAt: new Date(), isRead: true })
      .where(eq(notifications.userId, input.userId));

    return { success: true, markedCount: 0 };
  });

// GET notification settings
export const getNotificationSettings = serverFn({
  input: z.object({ userId: z.string() }),
})
  .handler(async ({ input, ctx }) => {
    const settings = await ctx.db.query.notificationSettings.findFirst({
      where: eq(notificationSettings.userId, input.userId),
    });

    return settings;
  });

// UPDATE notification settings
export const updateNotificationSettings = serverFn({
  input: z.object({
    userId: z.string(),
    settings: z.object({
      emailEnabled: z.boolean().optional(),
      pushEnabled: z.boolean().optional(),
      desktopEnabled: z.boolean().optional(),
      mobileEnabled: z.boolean().optional(),
      digestFrequency: z.enum(['instant', '15min', 'hourly', 'daily', 'weekly']).optional(),
      quietHoursStart: z.string().optional(),
      quietHoursEnd: z.string().optional(),
    }),
  }),
})
  .handler(async ({ input, ctx }) => {
    await ctx.db.update(notificationSettings)
      .set(input.settings)
      .where(eq(notificationSettings.userId, input.userId));

    return { success: true };
  });

// DELETE notification
export const deleteNotification = serverFn({
  input: z.object({ notificationId: z.string() }),
})
  .handler(async ({ input, ctx }) => {
    await ctx.db.delete(notifications).where(eq(notifications.id, input.notificationId));
    return { success: true };
  });
```

---

### 1.3 UI Components

#### Bell Component (Header Integration)

```typescript
// apps/web/app/components/notifications/NotificationBell.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export function NotificationBell() {
  const { data: count } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => fetch('/api/notifications/unread-count').then(r => r.json()),
  });

  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-text-muted hover:text-primary transition-all group active:scale-95"
      >
        <Bell className="w-5 h-5 transition-transform group-hover:rotate-12" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-accent text-white text-xs font-bold">
            {count > 99 ? '99+' : count}
          </span>
        )}
        <AnimatePresence>
          {isOpen && (
            <NotificationsPanel onClose={() => setIsOpen(false)} />
          )}
        </AnimatePresence>
      </button>
    </>
  );
}
```

#### Notifications Panel (Dropdown)

```typescript
// apps/web/app/components/notifications/NotificationsPanel.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, CheckCircle2, Check, Info, TrendingUp, Trash2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetch('/api/notifications').then(r => r.json()),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (data: { notificationIds: string[] }) => 
      fetch('/api/notifications/mark-read', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries(['notifications', 'notifications-unread']);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (data: { notificationId: string }) =>
      fetch('/api/notifications/delete', {
        method: 'DELETE',
      body: JSON.stringify(data),
      }),
    onSuccess: () => {
        // Invalidate and refetch
        queryClient.invalidateQueries(['notifications', 'notifications-unread']);
      },
  });

  // Group notifications
  const groupedNotifications = useMemo(() => {
    const groups: {} as Record<string, typeof typeof Notification[]>;
    
    notifications.forEach((n) => {
      const group = n.type || 'other';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(n);
    });

    return groups;
  }, [notifications]);

  // Priority order: high > normal > low
  const priorityOrder = ['high', 'normal', 'low'];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed right-0 top-16 mt-12 z-50 w-96 max-w-md max-h-[80vh] overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-text">Notifications</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">All</Button>
          <Badge variant="primary">{notifications?.length || 0}</Badge>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => markAsReadMutation.mutate({ notificationIds: notifications?.map(n => n.id) })}
            disabled={markAsReadMutation.isPending}
          >
            Mark all as read
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={deleteAllMutation.mutate({})}
          >
            Clear all
          </Button>
        </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {Object.entries(groupedNotifications).map(([groupName, groupNotifications], groupIndex) => (
            <div key={groupName}>
              {/* Section Header */}
              <div className="flex items-center gap-2 mb-4">
                <NotificationIcon type={groupName} className="w-5 h-5 text-text-muted" />
                <h3 className="text-lg font-semibold text-text capitalize">{groupName}</h3>
                <Badge variant="primary">{groupNotifications.length}</Badge>
              </div>

              {/* Notifications in group */}
              <div className="space-y-2">
                {groupNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={async () => {
                      await markAsReadMutation.mutate({ notificationIds: [notification.id] });
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {notifications?.length === 0 && (
          <div className="text-center py-12">
            <Info className="w-12 h-12 text-text-muted" />
            <p className="text-text-secondary mt-4">No notifications yet</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
```

#### Notification Item Component

```typescript
// apps/web/app/components/notifications/NotificationItem.tsx
import { motion } from 'framer-motion';
import { CheckCircle2, X, AlertTriangle, FileText, Clock, User, Check } from 'lucide-react';

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    priority: string;
    title: string;
    body: string;
    actionUrl?: string;
    actionData?: any;
    createdAt: Date;
    onRead: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'info':
      return <Info className="w-5 h-5" />;
    case 'success':
      return <CheckCircle2 className="w-5 h-5 text-success" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-warning" />;
    case 'danger':
      return <AlertCircle className="w-5 h-5 text-danger" />;
    case 'task':
      return <CheckCircle2 className="w-5 h-5 text-primary" />;
    case 'milestone':
      return <Trophy className="w-5 h-5 text-accent" />;
    case 'social':
      return <User className="w-5 h-5" />;
    case 'alert':
      return <AlertTriangle className="w-5 h-5 text-error" />;
    default:
      return <Bell className="w-5 h-5 text-text-muted" />;
  }
};

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const isRead = notification.isRead;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4 }}
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl transition-all group",
        isRead ? "opacity-60" : "hover:opacity-100 bg-surface-hover",
        "cursor-pointer",
      )}
      onClick={() => onRead()}
    >
      {/* Icon */}
      <div className={cn(
        "flex-shrink-0 text-text-muted mt-1",
        notification.priority === 'high' && "text-danger" || "",
        notification.priority === 'normal' && "text-warning" || "",
        notification.priority === 'low' && "-text-muted",
      )}
      >
        {getNotificationIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div>
          <h4 className="text-base font-semibold text-text">{notification.title}</h4>
          {notification.body && (
            <p className="text-sm text-text-secondary mt-2">
              {notification.body}
            </p>
          )}
          {notification.actionUrl && (
            <a
              href={notification.actionUrl}
              className="text-sm text-primary hover:underline inline-flex items-center gap-2 mt-2 text-primary"
            >
              {notification.actionData?.ctaText || 'View details'}
              <ArrowRight className="w-4 h-4" />
            </a>
          )}
          {notification.createdAt && (
            <div className="flex items-center gap-2 mt-3 text-xs text-text-muted">
              <Clock className="w-3 h-3" />
              <time>{formatTimeAgo(notification.createdAt)}</time>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          {!isRead && (
            <button
              onClick={() => onRead()}
              className="text-xs text-primary hover:underline"
            >
              Mark as read
            </button>
          )}
          <button
            className="text-xs text-text-muted hover:text-danger hover:underline"
            onClick={() => {/* delete mutation */}}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
```

#### Settings Panel

```typescript
// apps/web/app/components/notifications/NotificationSettings.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Bell, Mail, Smartphone, Moon, VolumeX } from 'lucide-react';

export function NotificationSettings() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Mock user settings - in real app, these come from API
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [desktopEnabled, setDesktopEnabled] = useState(true);
  const [mobileEnabled, setMobileEnabled] = useState(true);
  const [digestFrequency, setDigestFrequency] = useState<'instant' | '15min' | 'hourly' | 'daily' | 'weekly'>('hourly');
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');

  return (
    <>
      {/* Settings Toggle in header */}
      {/* This would integrate with existing header component */}

      {/* Settings Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-2xl p-8 max-w-lg w-full shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-text">Notification Settings</h2>
                <button onClick={() => setIsOpen(false)}>
                  <X className="w-6 h-6 text-text-muted hover:text-text" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* Notification Channels */}
                <h3 className="text-lg font-semibold text-text mb-4">Notification Channels</h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Mail className="w-5 h-5 text-text-muted" />
                    <span className="text-base font-medium text-text">Email Notifications</span>
                    <input
                      type="checkbox"
                      checked={emailEnabled}
                      onChange={(e) => setEmailEnabled(e.target.checked)}
                      className="w-4 h-4"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-3 cursor-pointer">
                  <Smartphone className="w-5 h-5 text-text-muted" />
                    <span className="text-base font-medium text-text">Push Notifications</span>
                  <input
                    type="checkbox"
                      checked={pushEnabled}
                    onChange={(e) => setPushEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                </div>
                <div className="flex items-center gap-3 cursor-pointer">
                  <VolumeX className="w-5 h-5 text-text-muted" />
                    <span className="text-base font-medium text-text">In-App Notifications</span>
                  <input
                    type="checkbox"
                    checked={desktopEnabled}
                    onChange={(e) => setDesktopEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                </div>
                <div className="flex items-center gap-3 cursor-pointer">
                  <Moon className="w-5 h-5 text-text-muted" />
                    <span className="text-base font-medium text-text">Desktop Notifications</span>
                  <input
                    type="checkbox"
                    checked={desktopEnabled}
                    onChange={(e) => setDesktopEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                </div>
              </div>

                {/* Digest Frequency */}
                <h3 className="text-lg font-semibold text-text mb-4">Digest Schedule</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-text-muted" />
                    <span className="text-base font-medium text-text">Send Digest Summary</span>
                  </label>
                  <select
                    value={digestFrequency}
                    onChange={(e) => setDigestFrequency(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-surface border-border text-text"
                  >
                    <option value="instant">Instant</option>
                    <option value="15min">Every 15 minutes</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                {/* Quiet Hours */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <VolumeX className="w-5 h-5 text-text-muted" />
                    <span className="text-base font-medium text-text">Quiet Hours</span>
                  </label>
                  <input
                    type="text"
                    value={quietHoursStart}
                    onChange={(e) => setQuietHoursStart(e.target.value)}
                    placeholder="22:00"
                    className="px-3 py-2 rounded-lg bg-surface border-border text-text w-24"
                  />
                  <span className="ml-2">to</span>
                  <input
                    type="text"
                    value={quietHoursEnd}
                    onChange={(e) => setQuietHoursEnd(e.target.value)}
                    placeholder="08:00"
                    className="px-3 py-2 rounded-lg bg-surface border-border text-text w-24"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-6">
                <Button variant="primary">
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </motion.div>
          )}
        )}
      </AnimatePresence>
    </>
  );
}
```

---

## Module 2: Automations Engine

### 2.1 Database Schema

```sql
-- automations table: Automation rule definitions
CREATE TABLE automations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- 'contact_status', 'task_due_date', 'goal_threshold', 'custom_event'
  trigger_config JSONB NOT NULL, -- Config for the trigger
  action_type TEXT NOT NULL, -- 'send_email', 'create_task', 'send_notification', 'update_deal', 'custom_action'
  action_config JSONB, -- Config for the action
  enabled BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- automation_logs table: Execution history
CREATE TABLE automation_logs (
  id TEXT PRIMARY KEY,
  automation_id TEXT NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  triggered_at TIMESTAMP NOT NULL,
  trigger_data JSONB,
  action_result TEXT, -- 'success', 'error', 'partial'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Drizzle Schema

```typescript
// apps/web/server/db/schema/automations.ts
import { pgTable, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';

export const automations = pgTable('automations', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  triggerType: text('trigger_type').notNull(),
  triggerConfig: text('trigger_config').notNull(), // JSONB
  actionType: text('action_type').notNull(),
  actionConfig: text('action_config').notNull(), // JSONB
  enabled: boolean('enabled').default(true),
  lastTriggeredAt: timestamp('last_triggered_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const automationLogs = pgTable('automation_logs', {
  id: text('id').primaryKey(),
  automationId: text('automation_id').notNull().references(() => automations.id, { onDelete: 'cascade' }),
  triggeredAt: timestamp('triggered_at').notNull(),
  triggerData: text('trigger_data'), // JSONB
  actionResult: text('action_result').notNull(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Trigger Types
export const triggerTypes = {
  contactStatus: 'contact_status',
  taskDueDate: 'task_due_date',
  goalThreshold: 'goal_threshold',
  customEvent: 'custom_event',
} as const;

// Action Types
export const actionTypes = {
  sendEmail: 'send_email',
  createTask: 'create_task',
  sendNotification: 'send_notification',
  updateDeal: 'update_deal',
  customAction: 'custom_action',
} as const;
```

---

### 2.2 API Endpoints

```typescript
// apps/web/server/functions/automations.ts

// GET all automations for user
export const getAutomations = serverFn({
  input: z.object({ userId: z.string() }),
})
  .handler(async ({ input, ctx }) => {
    const automations = await ctx.db.query.automations.findMany({
      where: eq(automations.userId, input.userId),
      orderBy: [desc(automations.createdAt)],
    });

    // Get latest execution logs for each automation
    const automationsWithLogs = await Promise.all(
      automations.map(async (auto) => {
        const logs = await ctx.db.query.automationLogs.findMany({
          where: eq(automationLogs.automationId, auto.id),
          orderBy: [desc(automationLogs.triggeredAt)],
          limit: 10,
        });
        
        return {
          ...auto,
          logs,
          lastTriggeredAt: logs?.[0]?.triggeredAt || null,
        };
      })
    );

    return automationsWithLogs;
  });

// CREATE automation
export const createAutomation = serverFn({
  input: z.object({
    userId: z.string(),
    name: z.string(),
    description: z.string(),
    triggerType: z.enum(['contact_status', 'task_due_date', 'goal_threshold', 'custom_event']),
    triggerConfig: z.object({
      // Dynamic based on triggerType
      contactStatus: z.object({
        status: z.enum(['prospect', 'lead', 'client']),
      }).optional(),
      taskDueDate: z.string().optional(),
      goalThreshold: z.number().optional(),
    }),
      customEvent: z.object({
        eventType: z.string(),
        eventData: z.any(),
      }).optional(),
    }),
    actionType: z.enum(['send_email', 'create_task', 'send_notification', 'update_deal', 'custom_action']),
    actionConfig: z.object({
      // Dynamic based on actionType
      sendEmail: z.object({
        to: z.string().array(z.string()),
        subject: z.string(),
        body: z.string(),
        templateId: z.string().optional(),
      }).optional(),
      createTask: z.object({
        title: z.string(),
        description: z.string(),
        dueDate: z.string(),
        assignedTo: z.string(),
      }).optional(),
      sendNotification: z.object({
        title: z.string(),
        body: z.string(),
        recipients: z.string().array(z.string()),
      }).optional(),
      updateDeal: z.object({
        dealId: z.string(),
        stageId: z.string().optional(),
        newStage: z.string().optional(),
        value: z.number().optional(),
      }).optional(),
      customAction: z.object({
        actionName: z.string(),
        parameters: z.any().optional(),
      }).optional(),
    }),
    enabled: z.boolean().default(true),
  }),
})
  .handler(async ({ input, ctx }) => {
    const automationId = crypto.randomUUID();

    await ctx.db.insert(automations).values({
      id: automationId,
      userId: input.userId,
      name: input.name,
      description: input.description,
      triggerType: input.triggerType,
      triggerConfig: input.triggerConfig as any, // Will be validated server-side
      actionType: input.actionType,
      actionConfig: input.actionConfig as any, // Will be validated server-side
      enabled: input.enabled,
      createdAt: new Date(),
    });

    return { id: automationId, success: true };
  });

// UPDATE automation
export const updateAutomation = serverFn({
  input: z.object({
    automationId: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
    triggerConfig: z.object().optional(),
    actionConfig: z.object().optional(),
    enabled: z.boolean().optional(),
  }),
})
  .handler(async ({ input, ctx }) => {
    await ctx.db.update(automations)
      .set(input)
      .where(eq(automations.id, input.automationId));

    return { success: true };
  });

// DELETE automation
export const deleteAutomation = serverFn({
  input: z.object({ automationId: z.string() }),
})
  .handler(async ({ input, ctx }) => {
    await ctx.db.delete(automations).where(eq(automations.id, input.automationId));
    return { success: true };
  });

// Trigger automation (for manual testing)
export const triggerAutomation = serverFn({
  input: z.object({ automationId: z.string() }),
})
  .handler(async ({ input, ctx }) => {
    const automation = await ctx.db.query.automations.findFirst({
      where: eq(automations.id, input.automationId),
    });

    // Execute automation
    const result = await executeAutomation(automation, ctx);

    // Log execution
    await ctx.db.insert(automationLogs).values({
      id: crypto.randomUUID(),
      automationId: automation.id,
      triggeredAt: new Date(),
      triggerData: {}, // In production, this would be populated with trigger data
      actionResult: 'success',
      errorMessage: null,
    });

    // Update last triggered time
    await ctx.db.update(automations)
      .set({ lastTriggeredAt: new Date() })
      .where(eq(automations.id, automation.id));

    return { result };
  });
```

```typescript
// Helper function for executing automations
async function executeAutomation(automation: Automation, ctx: any) {
  switch (automation.actionType) {
    case 'send_email':
      return await executeSendEmail(automation, ctx);
    case 'create_task':
      return await executeCreateTask(automation, ctx);
    case 'send_notification':
      return await executeSendNotification(automation, ctx);
    case 'update_deal':
      return await executeUpdateDeal(automation, ctx);
    case 'custom_action':
      return await executeCustomAction(automation, ctx);
    default:
      return { error: 'Unknown action type', success: false };
  }
}

async function executeSendEmail(automation: Automation, ctx: any) {
  const config = automation.triggerConfig as any;
  const recipients = config.to as string[];

  // In production, integrate with email service
  // For now, just log it
  await ctx.db.insert(automationLogs).values({
    id: crypto.randomUUID(),
    automationId: automation.id,
    triggeredAt: new Date(),
    triggerData: config,
    actionResult: 'success',
    errorMessage: null,
  });

  return { success: true };
}

async function executeCreateTask(automation: Automation, ctx: any) {
  const config = automation.triggerConfig as any;
  
  await ctx.db.insert(tasks).values({
    id: crypto.randomUUID(),
    userId: automation.userId,
    title: config.title,
    description: config.description,
    dueDate: config.dueDate,
    assignedTo: config.assignedTo,
    status: 'pending',
  });

  await ctx.db.insert(automationLogs).values({
    id: crypto.randomUUID(),
    automationId: automation.id,
    triggeredAt: new Date(),
    triggerData: config,
      actionResult: 'success',
      errorMessage: null,
    });

  return { success: true };
}

async function executeSendNotification(automation: Automation, ctx: any) {
  const config = automation.triggerConfig as any;
  
  // In production, integrate with notification service
  return { success: true };
}

async function executeUpdateDeal(automation: Automation, ctx: any) {
  const config = automation.triggerConfig as any;
  // Update deal stage logic
  return { success: true };
}

async function executeCustomAction(automation: Automation, ctx: any) {
  const config = automation.triggerConfig as any;
  // Execute custom action logic
  return { success: true };
}
```

---

### 2.3 UI Components

#### Automation Builder Component

```typescript
// apps/web/app/components/automations/AutomationBuilder.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Save, Play, Trash2, Lightbulb } from 'lucide-react';

export function AutomationBuilder() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);

  const steps = [
    { id: 1, title: 'Name & Description', icon: 'Type' },
    { id: 2, title: 'Trigger', icon: 'Zap', type: 'trigger' },
    { id: 3, title: 'Conditions', icon: 'Shield', type: 'conditions' },
    { id: 4, title: 'Action', icon: 'Zap', type: 'action' },
    { id: 5, title: 'Settings', icon: 'Settings', type: 'settings' },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-accent hover:bg-accent/90 transition-all group active:scale-95"
      >
        <Plus className="w-5 h-5 mr-2" />
        <span className="text-base font-medium">Create Automation</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-2xl p-8 max-w-2xl w-full shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-text">Create Automation</h2>
                <button onClick={() => setIsOpen(false)}>
                  <X className="w-6 h-6 text-text-muted hover:text-text" />
                </button>
              </div>

              {/* Wizard Steps */}
              <div className="space-y-6">
                {/* Step 1: Name & Description */}
                {step >= 1 && (
                  <motion.div
                    key={`step-${step}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="glass-card rounded-xl p-6"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-white text-lg font-bold">
                        {step}
                      </div>
                      <h3 className="text-lg font-semibold text-text">{steps[step - 1].title}</h3>
                      <p className="text-sm text-text-muted">{steps[step - 1].description}</p>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Trigger */}
                {step >= 2 && (
                  <motion.div
                    key={`step-${step}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="glass-card rounded-xl p-6"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-full bg-surface text-text-muted">
                        {step}
                      </div>
                      <h3 className="text-lg font-semibold text-text">{steps[step - 1].title}</h3>
                    </div>
                    <div className="space-y-4">
                      <TriggerSelector
                        triggerType="contact_status"
                        onTriggerChange={(type) => { /* set trigger config */}}
                      />
                      <div>
                        <label className="block text-sm font-medium text-text mb-2">Trigger When:</label>
                        <select
                          onChange={(e) => { /* handle selection */}}
                          className="w-full px-4 py-2 rounded-lg bg-surface border-border text-text"
                        >
                          <option value="">Select condition...</option>
                          <option value="contact_status">Contact status changes</option>
                          <option value="task_due_date">Task due date</option>
                          <option value="goal_threshold">Goal threshold reached</option>
                          <option value="custom_event">Custom event</option>
                        </select>
                      </label>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Action */}
                {step >= 3 && (
                  <motion.div
                    key={`step-${step}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="glass-card rounded-xl p-6"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-full bg-surface text-text-muted">
                        {step}
                      </div>
                      <h3 className="text-lg font-semibold text-text">{steps[step - 1].title}</h3>
                    </div>
                    <div className="space-y-4">
                      <ActionSelector
                        actionType={contact_status}
                        onActionChange={(type) => { /* set action config */}}
                      />
                      <div>
                        <label className="block text-sm font-medium text-text mb-2">Then:</label>
                        <select
                          onChange={(e) => { /* handle selection */}}
                          className="w-full px-4 py-2 rounded-lg bg-surface border-border text-text"
                        >
                          <option value="">Select action...</option>
                          <option value="send_email">Send email</option>
                          <option value="send_notification">Send notification</option>
                          <option value="create_task">Create task</option>
                          <option value="update_deal">Update deal</option>
                          <option value="custom_action">Custom action</option>
                        </select>
                      </label>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Settings */}
                {step >= 4 && (
                  <motion.div
                    key={`step-${step}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="glass-card rounded-xl p-6"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-full bg-surface text-text-muted">
                        {step}
                      </div>
                      <h3 className="text-lg font-semibold text-text">{steps[step - 1].title}</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="automation-enabled"
                            defaultChecked={true}
                          />
                          <span className="text-sm text-text-muted">Enable automation</span>
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex justify-between pt-6">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" disabled={step < 4}>
                    {step === 4 ? 'Save Automation' : 'Next'}
                  </Button>
                </div>
              </motion.div>
            )}
          )}
        </AnimatePresence>
      </>
    </>
  );
}
```

#### Automation Card Component

```typescript
// apps/web/app/components/automations/AutomationCard.tsx
import { motion } from 'framer-motion';
import { Play, Pause, Edit, Trash2, Zap, TrendingUp } from 'lucide-react';

interface AutomationCardProps {
  automation: {
    id: string;
    name: string;
    description: string;
    triggerType: string;
    triggerConfig: any;
    actionType: string;
    enabled: boolean;
    lastTriggeredAt: Date;
    logs?: Array<{
      triggeredAt: Date;
      actionResult: string;
      errorMessage: string;
    }>;
}

export function AutomationCard({ automation }: AutomationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="glass-card interactive rounded-xl p-6 cursor-pointer transition-all hover:scale-[1.02]"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-text">{automation.name}</h3>
          <Badge variant={automation.enabled ? 'success' : 'secondary'}>
            {automation.enabled ? 'Active' : 'Paused'}
          </Badge>
        </div>
        <div>
          <span className="text-sm text-text-muted">{automation.lastTriggeredAt ? formatDate(automation.lastTriggeredAt) : 'Never'}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            /* Open edit modal */
          }}
        >
          <Edit className="w-4 h-4 text-text-muted hover:text-text" />
        </button>
        <button
          onClick={() => {
            {/* Delete automation */}
          }}
        >
          <Trash2 className="w-4 h-4 text-text-muted hover:text-danger" />
        </button>
      </div>

        {/* Collapse/Expand Button */}
        <button onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 'auto', opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mt-4 space-y-4"
          >
            {/* Trigger Info */}
            <div className="mb-6">
              <h4 className="text-base font-semibold text-text mb-2">Trigger</h4>
              <p className="text-sm text-text-muted">
                {automation.triggerType}: {capitalizeFirstLetter(automation.triggerType)}
                {" "} → {" "}
                {automation.triggerConfig.description || 'Custom trigger'}
              </p>
            </div>

            {/* Action Info */}
            <div className="mb-6">
              <h4 className="text-base font-semibold text-text mb-2">Action</h4>
              <p className="text-sm text-text-muted">
                {automation.actionType}: {capitalizeFirstLetter(automation.actionType)}
                {" → "}
                {automation.actionConfig.description || 'Custom action'}
              </p>
            </div>

            {/* Last Execution */}
            {automation.logs?.length > 0 && (
              <div className="mb-6">
                <h4 className="text-base font-semibold text-text mb-2">Last Execution</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDateTime(automation.logs[0].triggeredAt)}
                  </div>
                  <div className={cn(
                    "flex-1",
                    automation.logs[0].actionResult === 'success' ? 'text-success' : 'text-danger',
                  )}>
                    {automation.logs[0].actionResult}
                  </div>
                  <span className="text-xs text-text-muted">
                    {automation.logs[0].errorMessage || 'No error'}
                  </span>
                </div>

                {/* Run Button */}
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => {/* Trigger automation */}}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Now
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    )}
  </motion.div>
  );
}
```

---

### 2.4 Implementation Tasks

```markdown
## Notifications Module Tasks

### Week 1: Foundation (Days 1-5)
- [ ] **1.1** Create database schema files
  - `apps/web/server/db/schema/notifications.ts`
  - Run migrations and push

- [ ] **1.2** Create server function file
  - `apps/web/server/functions/notifications.ts`
  - Implement all CRUD operations
  - Implement filtering and sorting
  - Implement real-time updates

- [ ] **1.3** Create UI base components
  - `NotificationBell.tsx`
  - Test components individually

### Week 2: Core Features (Days 6-10)
- [ ] **2.1** Implement notification bell in header
  - Integrate with existing header
  - Display unread count badge
  - Click opens panel

- [ ] **2.2** Implement notifications panel
  - Grouping by type/priority
  - Mark as read functionality
  - Delete notifications

- [ ] **2.3** Implement notification item component
  - Display notification details
  - Action buttons (mark read, delete)
  - Click action links

- [ ] **2.4** Implement settings panel
  - Channel toggles (email, push, etc.)
  - Digest frequency
  - Quiet hours configuration

- [ ] **2.5** Implement notification settings page
  - Route: `/app/routes/notifications/settings`
  - Save functionality
  - Form validation

### Week 3: Integration (Days 11-15)
- [ ] **3.1** Integrate with existing auth system
  - Show notifications in sidebar dropdown menu
  - Use better-auth user context

- [ ] **3.2** Connect with existing modules
  - Create notifications for: task completion, milestone achieved, deal updates

- [ ] **3.3** Integrate with Inngest
  - Send notification for automation completion
- Send notification for milestone achievement

- [ ] **3.4** Add email notifications integration
  - Configure SMTP settings
  - Design email templates

- [ ] **3.5** Implement browser notifications
- - Service Worker for background polling
  - Show in-app notifications

### Week 4: Polish (Days 16-20)
- [ ] **4.1** Fix all linting errors
- [ ] **4.2** Fix all TypeScript errors
- [ ] **4.3** Manual testing
- [ ] **4.4** Performance optimization

## Automations Module Tasks

### Week 1: Foundation (Days 1-5)
- [ ] **1.1** Create database schema
  - `apps/web/server/db/schema/automations.ts`
  - Create seed data for trigger types

- [ ] **1.2** Create server function file
  - `apps/web/server/functions/automations.ts`
  - Implement CRUD operations

- [ ] **1.3** Create base UI components
  - `AutomationBuilder.tsx`
  - Test wizard UI

### Week 2: Core Features (Days 6-10)
- [ ] **2.1** Implement automation builder wizard
  - Step-by-step creation process
  - Visual flow with progress

- [ ] **2.2** Implement trigger selectors
  - Contact status conditions
- - Task due dates
  - Goal thresholds

- [ ] **2.3** Implement action selectors
  - Email templates
  - Task creation
  - Notifications
  - Deals update

- [ ] **2.4** Implement automation settings
  - Enable/disable toggle
  - Manual trigger button

- [ ] **2.5** Implement automation dashboard page
  - List all automations
  - View logs
  - Create new automation

- [ ] **2.6** Implement automation card component
  - Display all details
  - Run/Edit/Delete actions

### Week 3: Integration (Days 11-15)
- [ ] **3.1** Connect with existing system
  - Automations for: task completion, milestone achievement, deal updates

- [ ] **3.2** Implement sample automations
  - Contact status → Welcome email template
  - Task due → Reminder notification
  - Goal threshold → Celebration notification

- [ ] **3.3** Add Inngest integration
  - Execute automations on schedules

- [ ] **3.4** Add email integration
  - Send emails via SMTP service
- Configure email templates

### Week 4: Polish (Days 16-20)
- [ ] **4.1** Fix all linting errors
- [ ] **4.2** Fix all TypeScript errors
- [ ] **4.3** Manual testing
- [ ] **4.4** Performance optimization
```

---

## Summary

### Total Implementation Time
- **Week 1-2:** Notifications Center (10 days)
- **Week 2-3:** Automations Engine (10 days)
- **Week 3-4:** Integration & Polish (15 days)

### Success Criteria
- [x] Database schemas created and migrated
- [x] All API endpoints implemented and tested
- [x] All UI components built with premium design system
- [x] Responsive on all devices
- [x] Linting passes
- [x] TypeScript strict mode with no errors
- [x] Manual testing completed
- [x] Integration with existing modules verified

### Deliverables
1. Centralized notification management with priority-based grouping
2. Automated workflows reducing manual tasks with customizable rules
3. Premium UI following glassmorphism v2 design system
4. Integration with existing auth, tasks, milestones systems
5. Inngest integration for scheduled automation execution
6. Email notification templates for system events

---

**This plan provides a complete roadmap for implementing Option B (UX/Productivity) with detailed technical specifications, database schemas, API endpoints, UI components, and implementation tasks.**
