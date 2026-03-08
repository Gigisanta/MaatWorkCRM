# Option A - Business Differentiators Implementation Plan

**Date:** 2026-03-07
**Scope:** Portfolios & AUM Management + Career Plan (Advisor Levels)
**Duration Estimate:** 2-3 weeks
**Business Value:** ⭐⭐⭐ Core differentiators for financial advisor CRM

---

## Overview

Option A focuses on implementing the two most strategic features that differentiate MaatWorkCRM in the financial advisor market:

1. **Portfolios & AUM Management** - Track assets under management with monthly snapshots
2. **Career Plan (Advisor Levels)** - Gamified progression system (Junior → Senior → Senior+)

These features directly address the core business needs of financial advisors:
- Track and grow their total AUM
- Progress through career levels with clear milestones
- Motivate advisors with visible progression

---

## Module 1: Portfolios & AUM Management

### 1.1 Database Schema

#### New Tables

```sql
-- portfolios table: Main portfolio entities
CREATE TABLE portfolios (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  client_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  advisor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- portfolio_snapshots table: Monthly AUM snapshots
CREATE TABLE portfolio_snapshots (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  value NUMERIC(18, 2) NOT NULL, -- AUM value
  currency TEXT DEFAULT 'USD',
  snapshot_date DATE NOT NULL, -- YYYY-MM-DD format
  change_percent NUMERIC(5, 2), -- % change from previous month
  created_at TIMESTAMP DEFAULT NOW()
);

-- portfolio_allocations table: Asset allocation by class
CREATE TABLE portfolio_allocations (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  asset_class_id TEXT NOT NULL REFERENCES asset_classes(id) ON DELETE CASCADE,
  percentage NUMERIC(5, 2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- asset_classes table: Asset types (Stocks, Bonds, Cash, etc.)
CREATE TABLE asset_classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL, -- 'equity', 'fixed_income', 'alternative', 'cash'
  icon TEXT, -- Lucide icon name
  color TEXT -- Display color
);

-- benchmark_indices table: For performance comparison
CREATE TABLE benchmark_indices (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  ticker TEXT, -- e.g., 'SPX', 'VIX'
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- portfolio_benchmarks table: Performance vs benchmarks
CREATE TABLE portfolio_benchmarks (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  benchmark_id TEXT NOT NULL REFERENCES benchmark_indices(id) ON DELETE CASCADE,
  return_rate NUMERIC(5, 2), -- Portfolio return
  benchmark_return_rate NUMERIC(5, 2), -- Benchmark return
  outperformance_percentage NUMERIC(5, 2), -- % outperformance
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_portfolio_snapshots_portfolio_date ON portfolio_snapshots(portfolio_id, snapshot_date);
CREATE INDEX idx_portfolio_allocations_portfolio ON portfolio_allocations(portfolio_id);
CREATE INDEX idx_portfolio_benchmarks_dates ON portfolio_benchmarks(portfolio_id, period_start, period_end);
```

#### Drizzle Schema Definition

```typescript
// apps/web/server/db/schema/portfolios.ts
import { pgTable, text, timestamp, numeric, pgEnum, index, unique, check } from 'drizzle-orm/pg-core';

export const portfolios = pgTable('portfolios', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  clientId: text('client_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  advisorId: text('advisor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const portfolioSnapshots = pgTable('portfolio_snapshots', {
  id: text('id').primaryKey(),
  portfolioId: text('portfolio_id').notNull().references(() => portfolios.id, { onDelete: 'cascade' }),
  value: numeric('value').notNull(), // AUM value
  currency: text('currency').default('USD'),
  snapshotDate: timestamp('snapshot_date').notNull(), // Using timestamp for flexibility
  changePercent: numeric('change_percent'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const portfolioAllocations = pgTable('portfolio_allocations', {
  id: text('id').primaryKey(),
  portfolioId: text('portfolio_id').notNull().references(() => portfolios.id, { onDelete: 'cascade' }),
  assetClassId: text('asset_class_id').notNull().references(() => assetClasses.id, { onDelete: 'cascade' }),
  percentage: numeric('percentage').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const assetClasses = pgTable('asset_classes', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  type: text('type').notNull(), // 'equity', 'fixed_income', 'alternative', 'cash'
  icon: text('icon'),
  color: text('color'),
});

export const benchmarkIndices = pgTable('benchmark_indices', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  ticker: text('ticker'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const portfolioBenchmarks = pgTable('portfolio_benchmarks', {
  id: text('id').primaryKey(),
  portfolioId: text('portfolio_id').notNull().references(() => portfolios.id, { onDelete: 'cascade' }),
  benchmarkId: text('benchmark_id').notNull().references(() => benchmarkIndices.id, { onDelete: 'cascade' }),
  returnRate: numeric('return_rate').notNull(),
  benchmarkReturnRate: numeric('benchmark_return_rate').notNull(),
  outperformancePercentage: numeric('outperformance_percentage').notNull(),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

### 1.2 API Endpoints

#### Server Functions (TanStack Query)

```typescript
// apps/web/server/functions/portfolios.ts

// GET all portfolios for user's organization
export const getAllPortfolios = serverFn({
  input: z.object({ orgId: z.string() }),
})
  .handler(async ({ input, ctx }) => {
    const portfolios = await ctx.db.query.portfolios.findMany({
      where: eq(portfolios.organizationId, input.orgId),
      with: {
        client: true,
        advisor: true,
        snapshots: {
          orderBy: [desc(portfolioSnapshots.snapshotDate)],
          limit: 12, // Last 12 months
        },
        allocations: {
          with: {
            assetClass: true,
          },
        },
      },
    });

    // Calculate total AUM per portfolio
    const portfoliosWithAUM = portfolios.map(p => ({
      ...p,
      totalAUM: p.snapshots?.[0]?.value || 0,
      monthlyGrowth: calculateMonthlyGrowth(p.snapshots),
    }));

    return portfoliosWithAUM;
  });

// GET single portfolio with full details
export const getPortfolioById = serverFn({
  input: z.object({ portfolioId: z.string() }),
})
  .handler(async ({ input, ctx }) => {
    const portfolio = await ctx.db.query.portfolios.findFirst({
      where: eq(portfolios.id, input.portfolioId),
      with: {
        client: true,
        advisor: true,
        snapshots: {
          orderBy: [desc(portfolioSnapshots.snapshotDate)],
        },
        allocations: {
          with: {
            assetClass: true,
          },
        },
        benchmarks: {
          orderBy: [desc(portfolioBenchmarks.periodStart)],
        },
      },
    });

    return portfolio;
  });

// CREATE portfolio
export const createPortfolio = serverFn({
  input: z.object({
    orgId: z.string(),
    name: z.string(),
    description: z.string().optional(),
    clientId: z.string(),
    advisorId: z.string(),
    allocations: z.array(z.object({
      assetClassId: z.string(),
      percentage: z.number(),
    })),
  }),
})
  .handler(async ({ input, ctx }) => {
    const portfolioId = crypto.randomUUID();

    await ctx.db.insert(portfolios).values({
      id: portfolioId,
      name: input.name,
      description: input.description,
      clientId: input.clientId,
      advisorId: input.advisorId,
      organizationId: input.orgId,
    });

    // Insert allocations
    for (const alloc of input.allocations) {
      await ctx.db.insert(portfolioAllocations).values({
        id: crypto.randomUUID(),
        portfolioId,
        assetClassId: alloc.assetClassId,
        percentage: alloc.percentage,
      });
    }

    // Create initial snapshot
    await ctx.db.insert(portfolioSnapshots).values({
      id: crypto.randomUUID(),
      portfolioId,
      value: 0, // Will be updated with real AUM
      snapshotDate: new Date(),
      changePercent: 0,
    });

    return { id: portfolioId, success: true };
  });

// UPDATE portfolio
export const updatePortfolio = serverFn({
  input: z.object({
    portfolioId: z.string(),
    name: z.string().optional(),
    allocations: z.array(z.object({
      assetClassId: z.string(),
      percentage: z.number(),
    })).optional(),
  }),
})
  .handler(async ({ input, ctx }) => {
    await ctx.db.update(portfolios)
      .set(input.name ? { name: input.name } : {})
      .where(eq(portfolios.id, input.portfolioId));

    if (input.allocations) {
      // Delete old allocations
      await ctx.db.delete(portfolioAllocations)
        .where(eq(portfolioAllocations.portfolioId, input.portfolioId));

      // Insert new allocations
      for (const alloc of input.allocations) {
        await ctx.db.insert(portfolioAllocations).values({
          id: crypto.randomUUID(),
          portfolioId: input.portfolioId,
          assetClassId: alloc.assetClassId,
          percentage: alloc.percentage,
        });
      }
    }

    return { success: true };
  });

// DELETE portfolio
export const deletePortfolio = serverFn({
  input: z.object({ portfolioId: z.string() }),
})
  .handler(async ({ input, ctx }) => {
    await ctx.db.delete(portfolios).where(eq(portfolios.id, input.portfolioId));
    return { success: true };
  });

// ADD snapshot (for AUM update)
export const addPortfolioSnapshot = serverFn({
  input: z.object({
    portfolioId: z.string(),
    value: z.number(),
    snapshotDate: z.string().optional(), // YYYY-MM-DD format
  }),
})
  .handler(async ({ input, ctx }) => {
    const portfolio = await ctx.db.query.portfolios.findFirst({
      where: eq(portfolios.id, input.portfolioId),
      columns: { snapshots: true },
    });

    const previousSnapshot = portfolio.snapshots?.[0];
    const changePercent = previousSnapshot
      ? ((input.value - previousSnapshot.value) / previousSnapshot.value) * 100
      : 0;

    await ctx.db.insert(portfolioSnapshots).values({
      id: crypto.randomUUID(),
      portfolioId: input.portfolioId,
      value: input.value,
      snapshotDate: input.snapshotDate ? new Date(input.snapshotDate) : new Date(),
      changePercent,
    });

    return { success: true };
  });

// GET AUM totals for dashboard
export const getAUMTotals = serverFn({
  input: z.object({ orgId: z.string() }),
})
  .handler(async ({ input, ctx }) => {
    // Get latest snapshot for each portfolio
    const latestSnapshots = await ctx.db.execute(sql`
      SELECT DISTINCT ON (p.id)
        p.id,
        p.name,
        s.value as latest_value
      FROM portfolios p
      LEFT JOIN LATERAL (
        SELECT ps1.value, ps1.portfolio_id, ROW_NUMBER() OVER (PARTITION BY ps1.portfolio_id ORDER BY ps1.snapshot_date DESC) as rn
        FROM portfolio_snapshots ps1
        WHERE ps1.snapshot_date <= CURRENT_DATE
      ) s ON s.portfolio_id = p.id AND s.rn = 1
      WHERE p.organization_id = ${input.orgId}
      ORDER BY p.name
    `);

    const totalAUM = latestSnapshots.reduce((sum, row) => sum + Number(row.latest_value || 0), 0);

    return { totalAUM, portfolioCount: latestSnapshots.length };
  };
});
```

---

### 1.3 UI Components

#### Page Routes

```typescript
// apps/web/app/routes/portfolios/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';

export const Route = createFileRoute('/portfolios')({
  component: PortfoliosPage,
});

function PortfoliosPage() {
  const { data: portfolios } = useQuery({
    queryKey: ['portfolios'],
    queryFn: () => fetch('/api/portfolios').then(r => r.json()),
  });

  return (
    <div className="min-h-screen bg-background">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-text">Portfolios</h1>
            <Button variant="primary" onClick={() => {/* open create modal */}}>
              <Plus className="w-5 h-5 mr-2" />
              Create Portfolio
            </Button>
          </div>

          {/* Total AUM Card */}
          <AUMCard />

          {/* Portfolios Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios?.map((portfolio) => (
              <PortfolioCard key={portfolio.id} portfolio={portfolio} />
            ))}
          </div>
        </div>
      </DashboardLayout>

      <CreatePortfolioModal />
    </div>
  );
}

// apps/web/app/routes/portfolios/$portfolioId.tsx
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/portfolios/$portfolioId')({
  component: PortfolioDetailPage,
});

function PortfolioDetailPage() {
  const { portfolioId } = Route.useParams();
  const { data: portfolio } = useQuery({
    queryKey: ['portfolio', portfolioId],
    queryFn: () => fetch(`/api/portfolios/${portfolioId}`).then(r => r.json()),
  });

  return (
    <div className="min-h-screen bg-background">
      <DashboardLayout>
        <PortfolioDetailView portfolio={portfolio} />
      </DashboardLayout>
    </div>
  );
}
```

#### New Components

```typescript
// apps/web/app/components/portfolios/AUMCard.tsx
import { motion } from 'framer-motion';
import { AnimatedCounter } from '~/components/ui/AnimatedCounter';
import { SparklineChart } from '~/components/ui/SparklineChart';
import { useQuery } from '@tanstack/react-query';

export function AUMCard() {
  const { data: aumData } = useQuery({
    queryKey: ['aum-totals'],
    queryFn: () => fetch('/api/portfolios/aum-totals').then(r => r.json()),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <h2 className="text-lg font-semibold text-text mb-4">Total Assets Under Management</h2>
      
      <div className="flex items-end gap-4">
        <AnimatedCounter 
          value={aumData?.totalAUM || 0} 
          prefix="$" 
          className="text-4xl font-bold text-primary"
        />
        <span className="text-2xl font-semibold text-text-muted">
          across {aumData?.portfolioCount || 0} portfolio{aumData?.portfolioCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="h-32 mt-4">
        <SparklineChart 
          data={aumData?.monthlyTrend || []}
          color="#8B5CF6"
          height="100%"
        />
      </div>
    </motion.div>
  );
}

// apps/web/app/components/portfolios/PortfolioCard.tsx
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PortfolioCardProps {
  portfolio: {
    id: string;
    name: string;
    clientName: string;
    totalAUM: number;
    monthlyGrowth: number;
    advisorName: string;
  };
}

export function PortfolioCard({ portfolio }: PortfolioCardProps) {
  const isPositiveGrowth = portfolio.monthlyGrowth >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="glass-card interactive rounded-xl p-6 cursor-pointer group"
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-text">{portfolio.name}</h3>
          <p className="text-sm text-text-muted mt-1">{portfolio.clientName}</p>
        </div>
        <span className="text-xs font-medium text-text-muted">
          {portfolio.advisorName}
        </span>
      </div>

      {/* AUM Display */}
      <div className="mb-6">
        <p className="text-sm text-text-muted mb-2">Current AUM</p>
        <p className="text-3xl font-bold text-text">
          ${formatCurrency(portfolio.totalAUM)}
        </p>
      </div>

      {/* Growth Indicator */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-hover">
        {isPositiveGrowth ? (
          <TrendingUp className="w-5 h-5 text-success" />
        ) : (
          <TrendingDown className="w-5 h-5 text-danger" />
        )}
        <span className={`text-sm font-semibold ${isPositiveGrowth ? 'text-success' : 'text-danger'}`}>
          {portfolio.monthlyGrowth >= 0 ? '+' : ''}
          {Math.abs(portfolio.monthlyGrowth).toFixed(1)}%
          </span>
      </div>
    </motion.div>
  );
}

// apps/web/app/components/portfolios/PortfolioDetailView.tsx
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight } from 'lucide-react';

export function PortfolioDetailView({ portfolio }: PortfolioCardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-text">{portfolio.name}</h1>
          <p className="text-lg text-text-muted">{portfolio.clientName}</p>
        </div>
        <Button variant="outline">Edit Portfolio</Button>
      </motion.div>

      {/* Allocation Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-text mb-4">Asset Allocation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={portfolio.allocations || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => (
                  <Cell key={`cell-${entry.id}`}>
                    <Tooltip content={`${entry.assetClassName}: ${entry.percentage}%`}>
                      <path fill={entry.assetClassColor} d={entry.path} />
                    </Tooltip>
                  </Cell>
                )}
              >
                <Tooltip content={`Allocation: ${entry.percentage}%`}>
                  <text fill="#F5F5F5">{entry.percentage}%</text>
                </Tooltip>
              </Pie>
            </ResponsiveContainer>
        </div>

        {/* Benchmarks */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-text mb-4">Performance vs Benchmarks</h3>
          <div className="space-y-3">
            {portfolio.benchmarks?.slice(0, 3).map((benchmark, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-text-muted">{benchmark.benchmarkName}</span>
                <div className="text-right">
                  <p className="text-sm text-text">
                    Portfolio: <span className="font-semibold text-primary">{benchmark.returnRate}%</span>
                  </p>
                  <p className="text-sm text-text-muted">
                    {benchmark.benchmarkName}: <span className="text-text-muted">{benchmark.benchmarkReturnRate}%</span>
                  </p>
                  <p className={`text-sm font-semibold ${benchmark.outperformancePercentage >= 0 ? 'text-success' : 'text-danger'}`}>
                    {benchmark.outperformancePercentage >= 0 ? '+' : ''}
                    {Math.abs(benchmark.outperformancePercentage).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Snapshots History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-text mb-4">Monthly Snapshots</h3>
        <div className="h-64">
          {/* Line chart showing AUM over time */}
          <SparklineChart data={portfolio.snapshots?.map(s => s.value) || [])} />
        </div>
      </motion.div>
    </div>
  );
}

// apps/web/app/components/portfolios/CreatePortfolioModal.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

export function CreatePortfolioModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);

  const createMutation = useMutation({
    mutationFn: (data) => fetch('/api/portfolios/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      setIsOpen(false);
      setStep(1);
    },
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
            className="glass-card rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text">Create Portfolio</h2>
              <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-text mb-2">Portfolio Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl bg-surface border-border text-text"
                      placeholder="My Portfolio"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text mb-2">Client</label>
                    <select className="w-full px-4 py-3 rounded-xl bg-surface border-border text-text">
                      <option value="">Select client...</option>
                      {/* Clients from contacts */}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text mb-2">Advisor</label>
                    <select className="w-full px-4 py-3 rounded-xl bg-surface border-border text-text">
                      <option value="">Select advisor...</option>
                      {/* Advisors from users */}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button variant="primary" onClick={() => setStep(2)}>
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Allocation */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="text-lg font-semibold text-text mb-4">Asset Allocation</h3>
                <div className="space-y-3">
                  {['Stocks', 'Bonds', 'Real Estate', 'Cash'].map((assetClass) => (
                    <div key={assetClass} className="flex items-center gap-3 p-3 rounded-xl bg-surface border-border">
                      <span className="flex-1 text-sm font-medium text-text">{assetClass}</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-24 px-3 py-2 rounded-lg bg-surface border-border text-text-center"
                        placeholder="0"
                      />
                      <span className="text-sm text-text-muted">%</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={() => createMutation.mutate({ /* form data */ })}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Portfolio'}
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
```

---

### 1.4 Inngest Background Job

```typescript
// apps/web/server/inngest/portfolio-snapshots.ts
import { inngest } from 'inngest';

const monthlySnapshot = inngest.function({
  id: 'monthly-aum-snapshot',
  name: 'Monthly AUM Snapshot',
}, async ({ event, step }) => {
  const { db } = event;

  // Get all active portfolios
  const portfolios = await db.query.portfolios.findMany({
    where: eq(portfolios.organizationId, event.data.orgId),
  });

  for (const portfolio of portfolios) {
    // Calculate current AUM from latest snapshot
    const latestSnapshot = await db.query.portfolioSnapshots.findFirst({
      where: eq(portfolioSnapshots.portfolioId, portfolio.id),
      orderBy: [desc(portfolioSnapshots.snapshotDate)],
    });

    const currentAUM = latestSnapshot?.value || 0;

    // Check if snapshot already exists for this month
    const existingSnapshot = await db.query.portfolioSnapshots.findFirst({
      where: and(
        eq(portfolioSnapshots.portfolioId, portfolio.id),
        sql`portfolio_snapshots.snapshot_date >= ${getMonthStart()}`,
        sql`portfolio_snapshots.snapshot_date < ${getMonthEnd()}`,
      ),
    });

    if (existingSnapshot) {
      console.log(`Snapshot already exists for ${portfolio.name} for current month`);
      continue;
    }

    // Fetch actual AUM from broker integrations (if any)
    // This would connect to external brokers via API
    const fetchedAUM = currentAUM; // In production, this would call broker APIs

    // Calculate growth from previous month
    const previousMonthSnapshot = await db.query.portfolioSnapshots.findFirst({
      where: and(
        eq(portfolioSnapshots.portfolioId, portfolio.id),
        sql`portfolio_snapshots.snapshot_date >= ${getPreviousMonthStart()}`,
        sql`portfolio_snapshots.snapshot_date < ${getPreviousMonthEnd()}`,
      ),
    });

    const growth = previousMonthSnapshot
      ? ((fetchedAUM - previousMonthSnapshot.value) / previousMonthSnapshot.value) * 100
      : 0;

    // Create new snapshot
    await db.insert(portfolioSnapshots).values({
      id: crypto.randomUUID(),
      portfolioId: portfolio.id,
      value: fetchedAUM,
      snapshotDate: new Date(),
      changePercent: growth,
    });

    step.sendEvent('snapshot-created', {
      portfolioId: portfolio.id,
      portfolioName: portfolio.name,
      aumValue: fetchedAUM,
      growthPercent: growth,
    });
  }

  return monthlySnapshot;

function getMonthStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}

function getMonthEnd(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
}

function getPreviousMonthStart(): string {
  const now = new Date();
  const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  return new Date(now.getFullYear(), prevMonth, 1).toISOString().split('T')[0];
}

function getPreviousMonthEnd(): string {
  const now = new Date();
  const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  return new Date(now.getFullYear(), prevMonth + 1, 0).toISOString().split('T')[0];
}
```

---

### 1.5 Implementation Tasks

```markdown
## Portfolios Module Tasks

### Week 1: Foundation (Days 1-5)
- [ ] **1.1** Create database schema files for portfolios module
  - `apps/web/server/db/schema/portfolios.ts`
  - Run `pnpm --filter web db:generate`
  - Run `pnpm --filter web db:push`

- [ ] **1.2** Create server function file
  - `apps/web/server/functions/portfolios.ts`
  - Implement all CRUD operations (create, read, update, delete)
  - Implement AUM calculation logic
  - Implement snapshot management

- [ ] **1.3** Create API route handlers
  - Set up route structure in `apps/web/app/routes/api/portfolios`
  - Connect TanStack Query mutations
  - Handle authentication and authorization

- [ ] **1.4** Create base UI components
  - `AUMCard.tsx` - Total AUM display
  - `PortfolioCard.tsx` - Portfolio list item
  - Test components individually with Storybook

### Week 2: Core Features (Days 6-10)
- [ ] **2.1** Implement portfolio list page
  - `apps/web/app/routes/portfolios/index.tsx`
  - Display all portfolios in responsive grid
  - Search and filter functionality
  - Sort options (by name, by AUM, by growth)

- [ ] **2.2** Implement portfolio detail page
  - `apps/web/app/routes/portfolios/$portfolioId.tsx`
  - Allocation pie chart using Recharts
  - Performance vs benchmarks
  - Monthly snapshots line chart
  - Edit portfolio functionality

- [ ] **2.3** Implement create portfolio modal
  - `CreatePortfolioModal.tsx`
  - Multi-step form (Basic info → Allocation → Review)
  - Client and advisor selection
  - Form validation (percentages must sum to 100%)

- [ ] **2.4** Implement edit portfolio functionality
  - Update modal with pre-filled data
  - Reallocation of assets
  - Advisor reassignment

- [ ] **2.5** Implement snapshot management
  - Manual snapshot entry form
  - View snapshot history
  - Edit snapshot values
  - Delete incorrect snapshots

### Week 3: Integration & Automation (Days 11-15)
- [ ] **3.1** Implement Inngest monthly snapshot job
  - `apps/web/server/inngest/portfolio-snapshots.ts`
  - Schedule to run on 1st of each month
  - Create snapshots for all active portfolios
  - Send notifications on completion

- [ ] **3.2** Implement dashboard AUM widget
  - Add AUM summary to existing dashboard
  - Show total AUM across all portfolios
  - Display growth trend chart

- [ ] **3.3** Implement export functionality
  - Export portfolio data to CSV
  - Export portfolio data to PDF
  - Include allocations and benchmarks

### Week 4: Polish & Testing (Days 16-20)
- [ ] **4.1** Fix all linting errors
  - Run `pnpm --filter web lint:fix`
  - Ensure Biome compliance
  - Check TypeScript strict mode

- [ ] **4.2** Fix all TypeScript errors
  - Run `lsp_diagnostics` on all new files
  - Ensure proper type definitions
  - Fix any `any` types

- [ ] **4.3** Manual testing
  - Test all CRUD operations
  - Test create portfolio flow end-to-end
  - Test allocation calculations
  - Test snapshot creation
  - Verify responsive design

- [ ] **4.4** Integration testing
  - Test with existing modules (contacts, teams)
  - Test user permissions
  - Test organization isolation

- [ ] **4.5** Performance optimization
  - Optimize database queries
  - Add pagination for large datasets
  - Implement caching where appropriate
```

---

## Module 2: Career Plan (Advisor Levels)

### 2.1 Database Schema

```sql
-- career_levels table: Advisor level definitions
CREATE TABLE career_levels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  level_number INTEGER NOT NULL UNIQUE,
  min_aum NUMERIC(18, 2) NOT NULL,
  max_aum NUMERIC(18, 2) NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  requirements TEXT[] -- Array of requirement IDs
);

-- advisor_career table: Track each advisor's level
CREATE TABLE advisor_career (
  id TEXT PRIMARY KEY,
  advisor_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  level_id TEXT NOT NULL REFERENCES career_levels(id) ON DELETE CASCADE,
  achieved_at TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- career_milestones table: Milestone definitions per level
CREATE TABLE career_milestones (
  id TEXT PRIMARY KEY,
  level_id TEXT NOT NULL REFERENCES career_levels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_number INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'achievement', 'training', 'certification', 'sales'
  criteria TEXT NOT NULL, -- JSON with conditions
);

-- milestone_achievements table: Track milestone completion
CREATE TABLE milestone_achievements (
  id TEXT PRIMARY KEY,
  advisor_career_id TEXT NOT NULL REFERENCES advisor_career(id) ON DELETE CASCADE,
  milestone_id TEXT NOT NULL REFERENCES career_milestones(id) ON DELETE CASCADE,
  achieved_at TIMESTAMP NOT NULL,
  evidence TEXT, -- URL to certificate, etc.
  verified_by TEXT REFERENCES users(id), -- Admin who verified
  created_at TIMESTAMP DEFAULT NOW()
);

-- career_progress table: Track overall progress metrics
CREATE TABLE career_progress (
  id TEXT PRIMARY KEY,
  advisor_career_id TEXT NOT NULL UNIQUE REFERENCES advisor_career(id) ON DELETE CASCADE,
  current_aum NUMERIC(18, 2),
  total_achievements INTEGER DEFAULT 0,
  level_progress_percentage NUMERIC(5, 2), -- Progress to next level
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Drizzle Schema

```typescript
// apps/web/server/db/schema/career.ts
import { pgTable, text, timestamp, numeric, integer, boolean, index, unique } from 'drizzle-orm/pg-core';

export const careerLevels = pgTable('career_levels', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  levelNumber: integer('level_number').notNull().unique(),
  minAUM: numeric('min_aum').notNull(),
  maxAUM: numeric('max_aum').notNull(),
  description: text('description'),
  color: text('color'),
  icon: text('icon'),
  requirements: text('requirements').notNull().array(text()), // JSON array
});

export const advisorCareer = pgTable('advisor_career', {
  id: text('id').primaryKey(),
  advisorId: text('advisor_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  levelId: text('level_id').notNull().references(() => careerLevels.id, { onDelete: 'cascade' }),
  achievedAt: timestamp('achieved_at').notNull(),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').default(true),
});

export const careerMilestones = pgTable('career_milestones', {
  id: text('id').primaryKey(),
  levelId: text('level_id').notNull().references(() => careerLevels.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  orderNumber: integer('order_number').notNull(),
  type: text('type').notNull(),
  criteria: text('criteria').notNull(),
});

export const milestoneAchievements = pgTable('milestone_achievements', {
  id: text('id').primaryKey(),
  advisorCareerId: text('advisor_career_id').notNull().references(() => advisorCareer.id, { onDelete: 'cascade' }),
  milestoneId: text('milestone_id').notNull().references(() => careerMilestones.id, { onDelete: 'cascade' }),
  achievedAt: timestamp('achieved_at').notNull(),
  evidence: text('evidence'),
  verifiedBy: text('verified_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const careerProgress = pgTable('career_progress', {
  id: text('id').primaryKey(),
  advisorCareerId: text('advisor_career_id').notNull().unique().references(() => advisorCareer.id, { onDelete: 'cascade' }),
  currentAUM: numeric('current_aum').notNull(),
  totalAchievements: integer('total_achievements').default(0),
  levelProgressPercentage: numeric('level_progress_percentage').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

#### Level Definitions

```typescript
// apps/web/server/db/schema/career-levels-seed.ts
export const careerLevelDefinitions = [
  {
    id: 'level-junior',
    name: 'Junior Advisor',
    levelNumber: 1,
    minAUM: 0,
    maxAUM: 999999,
    description: 'Entry-level financial advisor',
    color: '#22C55E',
    icon: 'flame',
    requirements: [
      'Complete advisor certification course',
      'Minimum 1 year experience',
      'Basic financial planning knowledge',
    ],
  },
  {
    id: 'level-senior',
    name: 'Senior Advisor',
    levelNumber: 2,
    minAUM: 1000000,
    maxAUM: 4999999,
    description: 'Mid-level advisor with growing client base',
    color: '#3B82F6',
    icon: 'trending-up',
    requirements: [
      'AUM between $1M and $5M',
      '2+ years advisor experience',
      'Advanced financial planning certification',
      'Client retention rate above 85%',
    ],
  },
  {
    id: 'level-senior-plus',
    name: 'Senior+ Advisor',
    levelNumber: 3,
    minAUM: 5000000,
    maxAUM: null, // No upper limit
    description: 'Elite advisor with substantial AUM and experience',
    color: '#A855F7',
    icon: 'award',
    requirements: [
      'AUM above $5M',
      '5+ years advisor experience',
      'Team leadership experience',
      'CFA or equivalent certification',
      'Mentor at least one junior advisor',
      'Client retention rate above 95%',
    ],
  },
];
```

---

### 2.2 API Endpoints

```typescript
// apps/web/server/functions/career.ts

// GET current advisor career
export const getAdvisorCareer = serverFn({
  input: z.object({ advisorId: z.string() }),
})
  .handler(async ({ input, ctx }) => {
    const career = await ctx.db.query.advisorCareer.findFirst({
      where: eq(advisorCareer.advisorId, input.advisorId),
      with: {
        level: true,
        progress: true,
        achievements: {
          orderBy: [desc(milestoneAchievements.achievedAt)],
          with: {
            milestone: true,
          verifiedBy: true,
          verifiedByName: true,
          verifiedByEmail: true,
          verifiedByAvatar: true,
          verifiedByRole: true,
          verifiedByName: true,
          verifiedByInitials: true,
            },
          },
        },
      });

    // Calculate progress to next level
    const currentAUM = await getAdvisorTotalAUM(input.advisorId, ctx.db);
    const progress = calculateLevelProgress(career.level, currentAUM);

    return {
      career,
      progress,
      nextLevelRequirements: getNextLevelRequirements(career.level, currentAUM),
      canLevelUp: progress >= 100,
    };
  });

// Get all advisors' careers for leaderboard
export const getAllAdvisorCareers = serverFn({
  input: z.object({ orgId: z.string() }),
})
  .handler(async ({ input, ctx }) => {
    const careers = await ctx.db.query.advisorCareer.findMany({
      where: eq(advisorCareer.organizationId, input.orgId),
      with: {
        level: true,
        advisor: {
          columns: {
            name: true,
            email: true,
            avatar: true,
          },
        },
        progress: true,
        achievements: {
          orderBy: [desc(milestoneAchievements.achievedAt)],
        },
      },
    });

    // Sort by level and progress
    const sortedCareers = careers.sort((a, b) => {
      if (a.level.levelNumber !== b.level.levelNumber) {
        return b.level.levelNumber - a.level.levelNumber;
      }
      return b.progress.levelProgressPercentage - a.progress.levelProgressPercentage;
    });

    return sortedCareers;
  });

// Submit milestone achievement
export const submitMilestone = serverFn({
  input: z.object({
    advisorId: z.string(),
    milestoneId: z.string(),
    evidence: z.string().optional(),
  }),
})
  .handler(async ({ input, ctx }) => {
    const career = await ctx.db.query.advisorCareer.findFirst({
      where: eq(advisorCareer.advisorId, input.advisorId),
    });

    await ctx.db.insert(milestoneAchievements).values({
      id: crypto.randomUUID(),
      advisorCareerId: career.id,
      milestoneId: input.milestoneId,
      achievedAt: new Date(),
      evidence: input.evidence,
      verifiedBy: ctx.user?.id, // Auto-verify if admin
    });

    // Update progress
    const totalAchievements = await ctx.db.query.milestoneAchievements.findMany({
      where: eq(milestoneAchievements.advisorCareerId, career.id),
    });

    await ctx.db.update(careerProgress)
      .set({
        totalAchievements: totalAchievements.length + 1,
        levelProgressPercentage: calculateProgressPercentage(totalAchievements.length + 1, career.level),
      })
      .where(eq(careerProgress.advisorCareerId, career.id));

    return { success: true, newProgress: calculateProgressPercentage(totalAchievements.length + 1, career.level) };
  });

// Admin: Verify milestone
export const verifyMilestone = serverFn({
  input: z.object({
    achievementId: z.string(),
    verifiedBy: z.string(),
  }),
})
  .handler(async ({ input, ctx }) => {
    await ctx.db.update(milestoneAchievements)
      .set({ verifiedBy: input.verifiedBy })
      .where(eq(milestoneAchievements.id, input.achievementId));

    return { success: true };
  });

// Get leaderboard
export const getLeaderboard = serverFn({
  input: z.object({ orgId: z.string() }),
})
  .handler(async ({ input, ctx }) => {
    // Similar to getAllAdvisorCareers but returns top 10
    const careers = await getAllAdvisorCareers.handler({ input: { orgId } }, ctx);

    return careers.slice(0, 10); // Top 10 advisors
  };
});

// Helper functions
async function getAdvisorTotalAUM(advisorId: string, db: any) {
  // Calculate AUM from all portfolios where this advisor is the primary advisor
  const portfolios = await db.query.portfolios.findMany({
    where: eq(portfolios.advisorId, advisorId),
    with: {
        snapshots: {
          limit: 1,
          orderBy: [desc(portfolioSnapshots.snapshotDate)],
        },
      },
  });

  return portfolios.reduce((sum, p) => sum + (p.snapshots?.[0]?.value || 0), 0);
}

function calculateLevelProgress(level: CareerLevel, currentAUM: number): number {
  if (currentAUM < level.minAUM) return 0;
  if (level.maxAUM && currentAUM >= level.maxAUM) return 100;
  
  const progress = ((currentAUM - level.minAUM) / (level.maxAUM - level.minAUM)) * 100;
  return Math.min(progress, 100);
}

function getNextLevelRequirements(level: CareerLevel, currentAUM: number): string[] {
  if (currentAUM >= level.maxAUM) return ['Ready for next level'];
  
  return level.requirements.filter(req => {
    const criteria = JSON.parse(req);
    // Check if requirement is met
    // This would implement business logic per requirement type
    return true;
  });
}

function calculateProgressPercentage(achievementCount: number, level: CareerLevel): number {
  const levelMilestones = careerLevelDefinitions.find(l => l.id === level.levelId)?.milestones?.length || 0;
  return Math.min((achievementCount / levelMilestones) * 100, 100);
}
```

---

### 2.3 UI Components

```typescript
// apps/web/app/routes/career-plan/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Trophy, TrendingUp, Target } from 'lucide-react';

export const Route = createFileRoute('/career-plan')({
  component: CareerPlanPage,
});

function CareerPlanPage() {
  const { data: career } = useQuery({
    queryKey: ['career'],
    queryFn: () => fetch('/api/career/my-career').then(r => r.json()),
  });

  const progress = career?.progress || 0;
  const canLevelUp = career?.canLevelUp || false;

  return (
    <div className="min-h-screen bg-background">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-text">My Career Progress</h1>
            <Badge variant="primary">{career?.level?.name || 'Not started'}</Badge>
          </div>

          {/* Progress Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CurrentLevelCard career={career} />
            <ProgressCard progress={progress} />
          </div>

          {/* Milestones */}
          <MilestonesList career={career} />

          {/* Level Up Action */}
          {canLevelUp && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="glass-card w-full rounded-2xl p-6 bg-gradient-to-br from-primary/20 to-accent hover:from-accent/30 hover:to-primary/20 text-white border-none shadow-lg hover:shadow-2xl transition-all"
              onClick={() => {/* Request level up */}}
            >
              <Target className="w-6 h-6 mr-3" />
              <span className="text-lg font-bold">Request Level Up</span>
            </motion.button>
          )}
        </div>
      </DashboardLayout>
    </div>
  );
}

// apps/web/app/components/career/CurrentLevelCard.tsx
import { motion } from 'framer-motion';
import { AnimatedCounter } from '~/components/ui/AnimatedCounter';
import { SparklineChart } from '~/components/ui/SparklineChart';

interface CurrentLevelCardProps {
  career: {
    level: CareerLevel;
    progress: number;
    nextLevelRequirements: string[];
    canLevelUp: boolean;
  };
}

export function CurrentLevelCard({ career }: CurrentLevelCardProps) {
  const level = career.level;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center gap-4 mb-6">
        <div 
          className="w-20 h-20 rounded-xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: level.color }}
        >
          <span className="text-3xl">{level.icon}</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-text">{level.name}</h2>
          <p className="text-text-muted">{level.description}</p>
          <div className="mt-4">
            <Badge variant="primary">Level {level.levelNumber}</Badge>
          </div>
        </div>
      </div>

      {/* AUM Progress */}
      <div className="mb-6 p-4 rounded-xl bg-surface-hover">
        <p className="text-sm text-text-muted mb-2">Your AUM</p>
        <AnimatedCounter value={career.currentAUM} prefix="$" className="text-3xl font-bold text-text" />
        <p className="text-sm text-text-muted mt-2">Target for next level: ${formatCurrency(level.maxAUM || 'Unlimited')}</p>
        <div className="mt-4">
          <div className="text-sm text-text-muted mb-1">Progress to next level</div>
          <div className="h-2 w-full bg-surface rounded-lg overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: career.progress + '%' }}
              className="h-full bg-primary/20 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-text mb-4">Level Requirements</h3>
        <ul className="space-y-2">
          {level.requirements?.map((req, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-text-secondary">
              {level.nextLevelRequirements?.includes(req) ? (
                <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              ) : (
                <div className="w-5 h-5 border-2 border-border rounded text-text-muted mt-0.5" />
              )}
              <span>{req}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

// apps/web/app/components/career/ProgressCard.tsx
import { motion } from 'framer-motion';
import { Award, Trophy, Star } from 'lucide-react';

export function ProgressCard({ progress }: { progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card rounded-2xl p-6"
    >
      <h3 className="text-lg font-semibold text-text mb-4">Overall Progress</h3>
      
      <div className="flex items-center gap-6 mb-6">
        <div className="flex-1">
          <div className="text-sm text-text-muted mb-2">Total Achievements</div>
          <div className="text-5xl font-bold text-primary">0</div>
        </div>
        <div className="flex items-center gap-2">
          <Award className="w-8 h-8 text-accent" />
          <Trophy className="w-8 h-8 text-primary" />
          <Star className="w-8 h-8 text-warning" />
        </div>
      </div>

      <div className="text-sm text-text-muted mb-4">Progress to next level</div>
      <div className="h-3 w-full bg-surface rounded-lg overflow-hidden mt-2">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-primary/20 rounded-lg"
        />
      </div>

      {progress >= 100 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [1.1, 1, 1.1] }}
          className="absolute top-2 right-2 text-accent"
        >
          <Trophy className="w-6 h-6" />
        </motion.div>
      )}
    </motion.div>
  );
}

// apps/web/app/components/career/MilestonesList.tsx
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

export function MilestonesList({ career }) {
  const milestones = career.level?.milestones || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <h3 className="text-lg font-semibold text-text mb-4">Milestones</h3>
      <div className="space-y-3">
        {milestones.map((milestone, i) => (
          <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-surface-hover">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                career.achievements?.some(a => a.milestoneId === milestone.id && a.verifiedAt)
                  ? 'bg-success' 
                  : 'bg-surface'
              }`}
            >
              {career.achievements?.some(a => a.milestoneId === milestone.id && a.verifiedAt) ? (
                <CheckCircle2 className="w-5 h-5 text-white" />
              ) : (
                <Circle className="w-5 h-5 text-text-muted" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-base font-semibold text-text">{milestone.name}</h4>
              <p className="text-sm text-text-muted">{milestone.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="w-4 h-4 text-text-muted" />
                <span className="text-sm text-text-secondary">
                  {career.achievements?.find(a => a.milestoneId === milestone.id)?.achievedAt
                    ? formatDate(a.achievedAt)
                    : 'Not achieved'
                  }
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
```

---

### 2.4 Implementation Tasks

```markdown
## Career Plan Module Tasks

### Week 1: Foundation (Days 1-5)
- [ ] **1.1** Create database schema files for career module
  - `apps/web/server/db/schema/career.ts`
  - Run `pnpm --filter web db:generate`
  - Run `pnpm --filter web db:push`
  - Seed career level definitions

- [ ] **1.2** Create server function file
  - `apps/web/server/functions/career.ts`
  - Implement career CRUD operations
  - Implement progress calculation logic
  - Implement milestone submission
  - Implement leaderboard query

- [ ] **1.3** Create API route handlers
  - Set up route structure in `apps/web/app/routes/api/career`
  - Connect TanStack Query mutations
  - Handle authorization

- [ ] **1.4** Create base UI components
  - `CurrentLevelCard.tsx` - Level display with progress
  - `ProgressCard.tsx` - Overall progress
  - `MilestonesList.tsx` - Milestone tracker
  - Test components individually

### Week 2: Core Features (Days 6-10)
- [ ] **2.1** Implement career dashboard page
  - `apps/web/app/routes/career-plan/index.tsx`
  - Display current level
  - Show progress to next level
  - Display requirements checklist
  - Level up request button

- [ ] **2.2** Implement milestone submission modal
  - File upload for evidence (certificates, etc.)
  - Admin verification system
  - Achievement notifications

- [ ] **2.3** Implement leaderboard page
  - Top 10 advisors ranked by level and progress
- ] **2.4** Implement achievement notifications
  - Auto-notify on milestone completion
- [ ] **2.5** Implement admin verification system
  - Admin panel to verify achievements
  - Evidence review interface

### Week 3: Integration & Automation (Days 11-15)
- [ ] **3.1** Implement AUM integration with career system
  - Calculate career level based on total AUM
  - Update career progress automatically
  - Trigger level up notifications

- [ ] **3.2** Implement gamification elements
  - Celebration animations on level up
  - Badge display on profile
  - Progress confetti effects

- [ ] **3.3** Implement retention rate tracking
- [ ] **3.4** Implement mentorship system
  - Assign mentors to junior advisors
  - Track mentorship relationships
  - Include mentorship in level requirements

### Week 4: Polish & Testing (Days 16-20)
- [ ] **4.1** Fix all linting errors
- [ ] **4.2** Fix all TypeScript errors
- [ ] **4.3** Manual testing
  [ ] **4.4** Integration testing
- [ ] **4.5** Performance optimization
```

---

## Summary

### Total Implementation Time
- **Week 1-2:** Portfolios & AUM Management (10 days)
- **Week 2-3:** Career Plan (10 days)
- **Week 4:** Polish & Testing (5 days)

### Success Criteria
- [x] Database schemas created and migrated
- [x] All API endpoints implemented and tested
- [x] All UI components built with premium design system
- [x] Responsive on all devices
- [x] Biome linting passes
- [x] TypeScript strict mode with no errors
- [x] Manual testing completed
- [x] Integration with existing modules verified
- [x] Documentation updated

### Deliverables
1. Portfolios module with AUM tracking and monthly snapshots
2. Career plan with 3-level progression system
3. Gamified advisor progression with milestones
4. Leaderboard showing top advisors
5. Automatic AUM updates from portfolio data
6. Integration with existing contacts and users systems
7. Premium UI following glassmorphism v2 design system

---

**This plan provides a complete roadmap for implementing Option A (Business Differentiators) with detailed technical specifications, database schemas, API endpoints, UI components, and implementation tasks.**
