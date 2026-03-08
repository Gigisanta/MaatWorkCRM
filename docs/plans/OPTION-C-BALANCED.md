# Option C - Balanced Implementation Plan

**Date:** 2026-03-07
**Scope:** Mixed approach - Core business differentiators + UX/Productivity features
**Duration Estimate:** 6 weeks
**Business Value:** ⭐⭐⭐ Diversified value with lower risk profile

---

## Overview

Option C provides a balanced implementation strategy that delivers a mix of both business differentiators and UX/productivity improvements. This approach:

- **Diversifies Risk**: Spreads development across multiple feature areas
- **Faster Value Delivery**: Ships smaller, incremental updates every 2 weeks
- **Market Validation**: Tests both business logic and user engagement features
- **Flexible Pivot**: Can adjust scope based on early user feedback

### Phases

**Phase 1 (Week 1-2): Foundation + Quick Wins**
- Implement Notifications Center (high engagement, fast to ship)
- Set up automations infrastructure (foundational work)

**Phase 2 (Week 3-4): Business Logic Core**
- Implement Portfolios module (core business differentiator)
- Career plan foundation (basic levels and progression)

**Phase 3 (Week 5-6): Advanced Features**
- Automations Engine (comprehensive workflow automation)
- Advanced analytics and reporting
- Complete career plan gamification

---

## Phase 1: Foundation + Quick Wins (Week 1-2)

### Module 1: Notifications Center

#### 1.1 Database Schema

```sql
-- notifications table: Main notification records
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'info', 'success', 'warning', 'danger', 'task', 'milestone'
  priority TEXT NOT NULL CHECK (priority IN ('high', 'normal', 'low')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT,
  action_data JSONB,
  read_at TIMESTAMP,
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
  digest_frequency TEXT DEFAULT 'hourly',
  quiet_hours_start TEXT,
  quiet_hours_end TEXT
);
```

#### Drizzle Schema

```typescript
// apps/web/server/db/schema/notifications.ts
import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  priority: text('priority').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  actionUrl: text('action_url'),
  actionData: text('action_data'),
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
```

#### 1.2 API Endpoints

```typescript
// apps/web/server/functions/notifications.ts

export const getNotifications = serverFn({
  input: z.object({
    userId: z.string(),
    unreadOnly: z.boolean().default(false),
    type: z.string().optional(),
    priority: z.string().optional(),
    limit: z.number().default(20),
    offset: z.number().default(0),
  }),
})
  .handler(async ({ input, ctx }) => {
    const whereConditions = [eq(notifications.userId, input.userId)];

    if (input.unreadOnly) whereConditions.push(eq(notifications.isRead, false));
    if (input.type) whereConditions.push(eq(notifications.type, input.type));
    if (input.priority) whereConditions.push(eq(notifications.priority, input.priority));

    const notifications = await ctx.db.query.notifications.findMany({
      where: and(...whereConditions),
      orderBy: [desc(notifications.createdAt)],
      limit: input.limit,
      offset: input.offset,
    });

    return notifications;
  });

export const markAsRead = serverFn({
  input: z.object({ notificationId: z.string() }),
})
  .handler(async ({ input, ctx }) => {
    await ctx.db.update(notifications)
      .set({ readAt: new Date(), isRead: true })
      .where(eq(notifications.id, input.notificationId));

    return { success: true };
  });

export const markAllAsRead = serverFn({
  input: z.object({ userId: z.string() }),
})
  .handler(async ({ input, ctx }) => {
    await ctx.db.update(notifications)
      .set({ readAt: new Date(), isRead: true })
      .where(eq(notifications.userId, input.userId));

    return { success: true };
  });

export const deleteNotification = serverFn({
  input: z.object({ notificationId: z.string() }),
})
  .handler(async ({ input, ctx }) => {
    await ctx.db.delete(notifications).where(eq(notifications.id, input.notificationId));
    return { success: true };
  });
```

#### 1.3 UI Components

```typescript
// apps/web/app/components/notifications/NotificationBell.tsx
import { useState } from 'react';
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
    </button>
  );
}
```

### Module 2: Automations Infrastructure (Foundation)

#### 2.1 Database Schema

```sql
-- automations table: Automation rule definitions
CREATE TABLE automations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL,
  action_type TEXT NOT NULL,
  action_config JSONB,
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
  action_result TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Drizzle Schema

```typescript
// apps/web/server/db/schema/automations.ts
import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const automations = pgTable('automations', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  triggerType: text('trigger_type').notNull(),
  triggerConfig: text('trigger_config').notNull(),
  actionType: text('action_type').notNull(),
  actionConfig: text('action_config'),
  enabled: boolean('enabled').default(true),
  lastTriggeredAt: timestamp('last_triggered_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const automationLogs = pgTable('automation_logs', {
  id: text('id').primaryKey(),
  automationId: text('automation_id').notNull().references(() => automations.id, { onDelete: 'cascade' }),
  triggeredAt: timestamp('triggered_at').notNull(),
  triggerData: text('trigger_data'),
  actionResult: text('action_result').notNull(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## Phase 2: Business Logic Core (Week 3-4)

### Module 3: Portfolios Management

#### 3.1 Database Schema

```sql
-- portfolios table: Client investment portfolios
CREATE TABLE portfolios (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'individual', 'joint', 'trust', 'corporate'
  custodian TEXT, -- Brokerage/custodian name
  account_number TEXT,
  total_value DECIMAL(15,2) DEFAULT 0,
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- portfolio_allocations table: Asset allocation breakdown
CREATE TABLE portfolio_allocations (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  asset_class TEXT NOT NULL, -- 'stocks', 'bonds', 'cash', 'real_estate', 'alternatives', 'crypto'
  percentage DECIMAL(5,2) NOT NULL, -- Must sum to 100 per portfolio
  value DECIMAL(15,2),
  target_percentage DECIMAL(5,2), -- Target allocation for rebalancing
  created_at TIMESTAMP DEFAULT NOW()
);

-- portfolio_snapshots table: Monthly AUM tracking
CREATE TABLE portfolio_snapshots (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Format: 'YYYY-MM'
  total_aum DECIMAL(15,2) NOT NULL,
  net_contributions DECIMAL(15,2),
  net_withdrawals DECIMAL(15,2),
  performance_return DECIMAL(8,4), -- Monthly return percentage
  benchmark_return DECIMAL(8,4),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Drizzle Schema

```typescript
// apps/web/server/db/schema/portfolios.ts
import { pgTable, text, timestamp, decimal } from 'drizzle-orm/pg-core';

export const portfolios = pgTable('portfolios', {
  id: text('id').primaryKey(),
  contactId: text('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  custodian: text('custodian'),
  accountNumber: text('account_number'),
  totalValue: decimal('total_value', { precision: 15, scale: 2 }).default('0'),
  lastSyncedAt: timestamp('last_synced_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const portfolioAllocations = pgTable('portfolio_allocations', {
  id: text('id').primaryKey(),
  portfolioId: text('portfolio_id').notNull().references(() => portfolios.id, { onDelete: 'cascade' }),
  assetClass: text('asset_class').notNull(),
  percentage: decimal('percentage', { precision: 5, scale: 2 }).notNull(),
  value: decimal('value', { precision: 15, scale: 2 }),
  targetPercentage: decimal('target_percentage', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const portfolioSnapshots = pgTable('portfolio_snapshots', {
  id: text('id').primaryKey(),
  portfolioId: text('portfolio_id').notNull().references(() => portfolios.id, { onDelete: 'cascade' }),
  month: text('month').notNull(),
  totalAum: decimal('total_aum', { precision: 15, scale: 2 }).notNull(),
  netContributions: decimal('net_contributions', { precision: 15, scale: 2 }),
  netWithdrawals: decimal('net_withdrawals', { precision: 15, scale: 2 }),
  performanceReturn: decimal('performance_return', { precision: 8, scale: 4 }),
  benchmarkReturn: decimal('benchmark_return', { precision: 8, scale: 4 }),
  createdAt: timestamp('created_at').defaultNow(),
});
```

#### 3.2 API Endpoints

```typescript
// apps/web/server/functions/portfolios.ts

export const getPortfolios = serverFn({
  input: z.object({
    contactId: z.string(),
  }),
})
  .handler(async ({ input, ctx }) => {
    const portfolios = await ctx.db.query.portfolios.findMany({
      where: eq(portfolios.contactId, input.contactId),
      with: {
        allocations: true,
        snapshots: {
          orderBy: [desc(portfolioSnapshots.month)],
          limit: 12,
        },
      },
    });

    return portfolios;
  });

export const createPortfolio = serverFn({
  input: z.object({
    contactId: z.string(),
    name: z.string(),
    type: z.enum(['individual', 'joint', 'trust', 'corporate']),
    custodian: z.string().optional(),
    accountNumber: z.string().optional(),
  }),
})
  .handler(async ({ input, ctx }) => {
    const portfolioId = crypto.randomUUID();

    await ctx.db.insert(portfolios).values({
      id: portfolioId,
      contactId: input.contactId,
      name: input.name,
      type: input.type,
      custodian: input.custodian,
      accountNumber: input.accountNumber,
      totalValue: '0',
      createdAt: new Date(),
    });

    return { id: portfolioId, success: true };
  });

export const updatePortfolioAllocation = serverFn({
  input: z.object({
    portfolioId: z.string(),
    allocations: z.array(z.object({
      assetClass: z.string(),
      percentage: z.number(),
      targetPercentage: z.number().optional(),
    })),
  }),
})
  .handler(async ({ input, ctx }) => {
    // Delete existing allocations
    await ctx.db.delete(portfolioAllocations)
      .where(eq(portfolioAllocations.portfolioId, input.portfolioId));

    // Insert new allocations
    await ctx.db.insert(portfolioAllocations).values(
      input.allocations.map((alloc, index) => ({
        id: crypto.randomUUID(),
        portfolioId: input.portfolioId,
        assetClass: alloc.assetClass,
        percentage: alloc.percentage.toString(),
        targetPercentage: alloc.targetPercentage?.toString(),
        createdAt: new Date(),
      }))
    );

    return { success: true };
  });
```

#### 3.3 UI Components

```typescript
// apps/web/app/components/portfolios/PortfolioCard.tsx
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';

export function PortfolioCard({ portfolio }: { portfolio: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card interactive rounded-xl p-6 hover:scale-[1.02] transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-text">{portfolio.name}</h3>
          <p className="text-sm text-text-muted">{portfolio.custodian}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-text">${formatNumber(portfolio.totalValue)}</p>
          <p className="text-sm text-text-muted">Account: {portfolio.accountNumber}</p>
        </div>
      </div>

      {/* Performance */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-surface/50 rounded-lg">
          <DollarSign className="w-5 h-5 mx-auto mb-1 text-primary" />
          <p className="text-xs text-text-muted">YTD Return</p>
          <p className={portfolio.ytdReturn >= 0 ? 'text-success' : 'text-danger'}>
            {portfolio.ytdReturn >= 0 ? '+' : ''}{portfolio.ytdReturn}%
          </p>
        </div>
        <div className="text-center p-3 bg-surface/50 rounded-lg">
          <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
          <p className="text-xs text-text-muted">1Y Return</p>
          <p className={portfolio.oneYearReturn >= 0 ? 'text-success' : 'text-danger'}>
            {portfolio.oneYearReturn >= 0 ? '+' : ''}{portfolio.oneYearReturn}%
          </p>
        </div>
        <div className="text-center p-3 bg-surface/50 rounded-lg">
          <PieChart className="w-5 h-5 mx-auto mb-1 text-primary" />
          <p className="text-xs text-text-muted">vs Benchmark</p>
          <p className={portfolio.benchmarkDelta >= 0 ? 'text-success' : 'text-danger'}>
            {portfolio.benchmarkDelta >= 0 ? '+' : ''}{portfolio.benchmarkDelta}%
          </p>
        </div>
      </div>

      {/* Allocation Chart */}
      <div className="h-32">
        <AllocationChart allocations={portfolio.allocations} />
      </div>
    </motion.div>
  );
}
```

### Module 4: Career Plan (Foundation)

#### 4.1 Database Schema

```sql
-- advisor_levels table: Career progression levels
CREATE TABLE advisor_levels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL, -- 'Junior', 'Senior', 'Senior+'
  description TEXT,
  icon TEXT,
  color TEXT,
  min_aum DECIMAL(15,2), -- Minimum AUM to reach this level
  min_clients INTEGER, -- Minimum number of clients
  min_certifications INTEGER, -- Minimum certifications required
  order_index INTEGER NOT NULL UNIQUE
);

-- advisor_progress table: Track advisor progress
CREATE TABLE advisor_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level_id TEXT NOT NULL REFERENCES advisor_levels(id) ON DELETE CASCADE,
  current_aum DECIMAL(15,2) DEFAULT 0,
  client_count INTEGER DEFAULT 0,
  certification_count INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  achievements JSONB, -- JSON array of achievements
  last_updated_at TIMESTAMP DEFAULT NOW()
);

-- advisor_milestones table: Achievement milestones
CREATE TABLE advisor_milestones (
  id TEXT PRIMARY KEY,
  level_id TEXT NOT NULL REFERENCES advisor_levels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  requirement_type TEXT, -- 'aum', 'clients', 'certifications', 'special'
  requirement_value JSONB,
  unlocked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Drizzle Schema

```typescript
// apps/web/server/db/schema/career.ts
import { pgTable, text, timestamp, decimal, integer, jsonb } from 'drizzle-orm/pg-core';

export const advisorLevels = pgTable('advisor_levels', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  color: text('color'),
  minAum: decimal('min_aum', { precision: 15, scale: 2 }),
  minClients: integer('min_clients'),
  minCertifications: integer('min_certifications'),
  orderIndex: integer('order_index').notNull().unique(),
});

export const advisorProgress = pgTable('advisor_progress', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  levelId: text('level_id').notNull().references(() => advisorLevels.id, { onDelete: 'cascade' }),
  currentAum: decimal('current_aum', { precision: 15, scale: 2 }).default('0'),
  clientCount: integer('client_count').default(0),
  certificationCount: integer('certification_count').default(0),
  progressPercentage: decimal('progress_percentage', { precision: 5, scale: 2 }).default('0'),
  achievements: jsonb('achievements'),
  lastUpdatedAt: timestamp('last_updated_at').defaultNow(),
});

export const advisorMilestones = pgTable('advisor_milestones', {
  id: text('id').primaryKey(),
  levelId: text('level_id').notNull().references(() => advisorLevels.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  icon: text('icon'),
  requirementType: text('requirement_type'),
  requirementValue: jsonb('requirement_value'),
  unlockedAt: timestamp('unlocked_at'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## Phase 3: Advanced Features (Week 5-6)

### Module 5: Automations Engine (Complete)

#### 5.1 API Endpoints (Complete)

```typescript
// apps/web/server/functions/automations.ts

export const createAutomation = serverFn({
  input: z.object({
    userId: z.string(),
    name: z.string(),
    description: z.string(),
    triggerType: z.enum(['contact_status', 'task_due_date', 'goal_threshold', 'custom_event']),
    triggerConfig: z.object({}),
    actionType: z.enum(['send_email', 'create_task', 'send_notification', 'update_deal', 'custom_action']),
    actionConfig: z.object({}),
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
      triggerConfig: input.triggerConfig as any,
      actionType: input.actionType,
      actionConfig: input.actionConfig as any,
      enabled: input.enabled,
      createdAt: new Date(),
    });

    return { id: automationId, success: true };
  });

export const triggerAutomation = serverFn({
  input: z.object({ automationId: z.string() }),
})
  .handler(async ({ input, ctx }) => {
    const automation = await ctx.db.query.automations.findFirst({
      where: eq(automations.id, input.automationId),
    });

    const result = await executeAutomation(automation, ctx);

    await ctx.db.insert(automationLogs).values({
      id: crypto.randomUUID(),
      automationId: automation.id,
      triggeredAt: new Date(),
      triggerData: {},
      actionResult: 'success',
      errorMessage: null,
    });

    await ctx.db.update(automations)
      .set({ lastTriggeredAt: new Date() })
      .where(eq(automations.id, automation.id));

    return { result };
  });
```

### Module 6: Advanced Analytics

#### 6.1 API Endpoints

```typescript
// apps/web/server/functions/analytics.ts

export const getPortfolioPerformance = serverFn({
  input: z.object({
    portfolioId: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
})
  .handler(async ({ input, ctx }) => {
    const snapshots = await ctx.db.query.portfolioSnapshots.findMany({
      where: and(
        eq(portfolioSnapshots.portfolioId, input.portfolioId),
        input.startDate ? gte(portfolioSnapshots.month, input.startDate) : undefined,
        input.endDate ? lte(portfolioSnapshots.month, input.endDate) : undefined,
      ),
      orderBy: [asc(portfolioSnapshots.month)],
    });

    const performance = {
      monthlyReturns: snapshots.map(s => ({
        month: s.month,
        return: s.performanceReturn,
      })),
      ytdReturn: snapshots.reduce((acc, s) => acc + parseFloat(s.performanceReturn || '0'), 0),
      avgReturn: snapshots.reduce((acc, s) => acc + parseFloat(s.performanceReturn || '0'), 0) / snapshots.length,
    };

    return performance;
  });

export const getAdvisorStats = serverFn({
  input: z.object({ userId: z.string() }),
})
  .handler(async ({ input, ctx }) => {
    const progress = await ctx.db.query.advisorProgress.findFirst({
      where: eq(advisorProgress.userId, input.userId),
      with: {
        level: true,
      },
    });

    const stats = {
      currentLevel: progress.level.name,
      aum: progress.currentAum,
      clients: progress.clientCount,
      certifications: progress.certificationCount,
      progress: progress.progressPercentage,
      milestones: progress.achievements,
    };

    return stats;
  });
```

---

## Implementation Tasks

### Phase 1: Foundation + Quick Wins (Week 1-2)

#### Week 1 (Days 1-5)
- [ ] **1.1** Create database schema for notifications
  - `apps/web/server/db/schema/notifications.ts`
  - Run migrations

- [ ] **1.2** Implement notifications API endpoints
  - `apps/web/server/functions/notifications.ts`
  - CRUD operations

- [ ] **1.3** Build notification bell component
  - `apps/web/app/components/notifications/NotificationBell.tsx`
  - Integrate with header

- [ ] **1.4** Create automations database schema
  - `apps/web/server/db/schema/automations.ts`
  - Run migrations

- [ ] **1.5** Build basic automations API
  - `apps/web/server/functions/automations.ts`
  - CRUD operations

#### Week 2 (Days 6-10)
- [ ] **2.1** Implement notifications panel
  - Grouping by type/priority
  - Mark as read/delete functionality

- [ ] **2.2** Build notifications settings page
  - Route: `/app/routes/_app/notifications/settings`
  - Channel toggles, digest frequency

- [ ] **2.3** Integrate notifications with auth
  - Show in sidebar
  - Use better-auth context

- [ ] **2.4** Create sample automations
  - Contact welcome email
  - Task reminder notification
  - Goal milestone notification

- [ ] **2.5** Add Inngest integration
  - Scheduled automation execution
  - Event triggers

### Phase 2: Business Logic Core (Week 3-4)

#### Week 3 (Days 11-15)
- [ ] **3.1** Create portfolios database schema
  - `apps/web/server/db/schema/portfolios.ts`
  - Run migrations

- [ ] **3.2** Implement portfolios API endpoints
  - `apps/web/server/functions/portfolios.ts`
  - CRUD + allocation updates

- [ ] **3.3** Build portfolio card component
  - `apps/web/app/components/portfolios/PortfolioCard.tsx`
  - Performance metrics display

- [ ] **3.4** Create portfolios page
  - Route: `/app/routes/_app/portfolios`
  - List view, create modal

- [ ] **3.5** Implement allocation chart
  - `apps/web/app/components/portfolios/AllocationChart.tsx`
  - Pie chart visualization

#### Week 4 (Days 16-20)
- [ ] **4.1** Create career plan database schema
  - `apps/web/server/db/schema/career.ts`
  - Run migrations

- [ ] **4.2** Implement career plan API
  - `apps/web/server/functions/career.ts`
  - Progress tracking

- [ ] **4.3** Build career plan page
  - Route: `/app/routes/_app/career-plan`
  - Level display, progress bars

- [ ] **4.4** Create level progression component
  - Visual level badges
  - Milestone tracking

- [ ] **4.5** Set up monthly AUM snapshots
  - Inngest cron job
  - Automated tracking

### Phase 3: Advanced Features (Week 5-6)

#### Week 5 (Days 21-25)
- [ ] **5.1** Complete automations engine
  - Full trigger/action system
  - Condition logic

- [ ] **5.2** Build automation builder wizard
  - `apps/web/app/components/automations/AutomationBuilder.tsx`
  - Step-by-step creation

- [ ] **5.3** Create automations dashboard
  - Route: `/app/routes/_app/automations`
  - List, logs, manual trigger

- [ ] **5.4** Implement analytics API
  - `apps/web/server/functions/analytics.ts`
  - Portfolio performance
  - Advisor stats

- [ ] **5.5** Build analytics dashboard
  - Performance charts
  - Trend analysis

#### Week 6 (Days 26-30)
- [ ] **6.1** Add email integration
  - SMTP configuration
  - Email templates

- [ ] **6.2** Implement advanced analytics
  - Benchmark comparisons
  - ROI calculations

- [ ] **6.3** Complete career plan gamification
  - Achievement badges
  - Progress animations

- [ ] **6.4** Integration testing
  - End-to-end workflows
  - User feedback loops

- [ ] **6.5** Polish and optimization
  - Fix linting errors
  - Fix TypeScript errors
  - Performance tuning

---

## Summary

### Total Implementation Time
- **Phase 1 (Week 1-2):** Foundation + Quick Wins (10 days)
- **Phase 2 (Week 3-4):** Business Logic Core (10 days)
- **Phase 3 (Week 5-6):** Advanced Features (10 days)

### Success Criteria
- [ ] Database schemas created and migrated
- [ ] All API endpoints implemented and tested
- [ ] All UI components built with premium design system
- [ ] Responsive on all devices
- [ ] Linting passes
- [ ] TypeScript strict mode with no errors
- [ ] Manual testing completed
- [ ] Integration with existing modules verified
- [ ] User feedback collected and incorporated

### Deliverables
1. **Notifications Center** - Centralized notification management
2. **Automations Infrastructure** - Foundation for workflow automation
3. **Portfolios Management** - Client investment portfolio tracking
4. **Career Plan Foundation** - Basic level progression system
5. **Complete Automations Engine** - Full workflow automation
6. **Advanced Analytics** - Performance tracking and insights

### Risk Profile: LOW
- Diversified feature set reduces dependency on single module
- Incremental delivery every 2 weeks enables quick feedback
- Flexibility to adjust scope based on early results
- Lower technical complexity per phase

---

**This plan provides a balanced implementation strategy that delivers value incrementally while building towards a comprehensive feature set.**
