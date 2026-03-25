# Performance Optimization Plan — MaatWork CRM v3

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce memory usage, bundle size, and CPU consumption during development and production by implementing targeted optimizations across the entire stack.

**Architecture:** Multi-phase approach starting with critical/quick wins, moving to architectural improvements, and finishing with advanced optimizations. Each phase is independent and can be validated before proceeding.

**Tech Stack:** Next.js 16, React 19, TypeScript, Prisma, TanStack Query, Tailwind CSS 4, Turbopack, Vercel (production)

---

## Executive Summary

| Phase | Items | Effort | Impact | Priority |
|-------|-------|--------|--------|----------|
| 1. Critical Fixes | 8 | Low | High | P0 |
| 2. High-Impact Optimizations | 10 | Medium | High | P1 |
| 3. Medium-Impact Optimizations | 8 | Medium | Medium | P2 |
| 4. Infrastructure | 6 | High | High | P3 |
| 5. Advanced Optimizations | 5 | High | Medium | P4 |

---

## Phase 1: Critical Fixes (Quick Wins)

### 1.1 Remove all console.log from production code

**Files to modify:**
- `src/lib/db.ts:26-32,36-42` — Remove JSON logging and slow query console
- `src/lib/logger.ts` — Remove or guard with NODE_ENV check
- `src/lib/audit.ts` — Guard with development check
- `src/lib/google-calendar/sync-engine.ts:4` — Remove 4 console.log statements
- `src/app/contacts/components/contact-drawer.tsx:2` — Remove 2 console.log
- `src/app/api/calendar/disconnect/route.ts:3` — Remove 3 console.log

**Task 1: Remove/guard console.log in db.ts**
- [ ] **Step 1:** Read `src/lib/db.ts` to identify all logging statements

```bash
grep -n "console\." src/lib/db.ts
```

- [ ] **Step 2:** Edit `src/lib/db.ts:23-44` to remove the $on query hook entirely (or make it development-only)

```typescript
// REPLACE lines 23-44 with:
// Only register query hook in development
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db as any).$on('query', (e: unknown) => {
    const event = e as { timestamp: Date; query: string; params: string; duration: number };
    if (event.duration > SLOW_QUERY_THRESHOLD) {
      console.warn(JSON.stringify({
        level: 'warn',
        msg: 'slow_query',
        query: event.query,
        duration_ms: event.duration,
        threshold: SLOW_QUERY_THRESHOLD
      }))
    }
  })
}
```

- [ ] **Step 3:** Commit

```bash
git add src/lib/db.ts
git commit -m "fix: remove console.log from Prisma query logging in production"
```

**Task 2: Remove console.log from sync-engine.ts**
- [ ] **Step 1:** Read and identify logging lines

```bash
grep -n "console\." src/lib/google-calendar/sync-engine.ts
```

- [ ] **Step 2:** Replace all `console.log` with a conditional logger that respects NODE_ENV

```typescript
// Add at top of file:
const debug = process.env.NODE_ENV === 'development'
  ? (msg: string, ...args: unknown[]) => console.log(`[SyncEngine] ${msg}`, ...args)
  : (..._: unknown[]) => {};

// Replace all console.log calls with debug()
```

- [ ] **Step 3:** Commit

```bash
git add src/lib/google-calendar/sync-engine.ts
git commit -m "fix: guard debug logs in sync-engine"
```

**Task 3: Remove remaining console.log statements**
- [ ] **Step 1:** Find all remaining console statements

```bash
grep -rn "console\.\(log\|debug\|info\)" --include="*.ts" --include="*.tsx" src/ | grep -v node_modules
```

- [ ] **Step 2:** For each file, either remove the statement or wrap in `if (process.env.NODE_ENV === 'development')`
- [ ] **Step 3:** Commit each fix

---

### 1.2 Fix Prisma slow query logging in production

**File to modify:** `src/lib/db.ts`

**Task 4: Make slow query threshold production-safe**
- [ ] **Step 1:** The SLOW_QUERY_THRESHOLD check runs in production via the $on hook. Verify it's inside the development guard added in Task 1
- [ ] **Step 2:** If not guarded, wrap the entire $on registration in `if (process.env.NODE_ENV === 'development')`

```typescript
if (process.env.NODE_ENV === 'development') {
  const SLOW_QUERY_THRESHOLD = 1000 // ms
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db as any).$on('query', (e: unknown) => {
    // ... slow query detection ...
  })
}
```

- [ ] **Step 3:** Commit

```bash
git add src/lib/db.ts
git commit -m "fix: guard Prisma slow query logging to development only"
```

---

### 1.3 Separate layout.tsx from client providers

**Files to modify:**
- `src/app/layout.tsx` — Remove 'use client', become pure Server Component
- `src/app/providers.tsx` — Already has 'use client', fine as-is

**Task 5: Verify layout.tsx is Server Component**
- [ ] **Step 1:** Read current `src/app/layout.tsx`

```bash
head -1 src/app/layout.tsx
```

Expected output: Should NOT contain `'use client'`

- [ ] **Step 2:** If `'use client'` exists at line 1, remove it. The file currently shows no 'use client' directive, which is correct.
- [ ] **Step 3:** Verify `src/app/providers.tsx` starts with `'use client'` — it does, so ProvidersWrapper is correctly a client boundary.

```bash
head -1 src/app/providers.tsx
```

- [ ] **Step 4:** Commit (if any changes made)

```bash
git add src/app/layout.tsx
git commit -m "perf: layout.tsx is pure Server Component"
```

---

### 1.4 Add production-only console removal via next.config

**File to modify:** `next.config.ts`

**Task 6: Configure compiler to remove console in production**
- [ ] **Step 1:** Read current `next.config.ts`

```bash
cat next.config.ts
```

- [ ] **Step 2:** Add `removeConsole` to compiler options

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  serverExternalPackages: ['@prisma/client', 'prisma'],
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
      ? ["log", "debug", "info"]
      : [],
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
  },
  experimental: {
    optimizePackageImports: ['recharts', 'framer-motion', 'date-fns', '@dnd-kit/core', '@dnd-kit/sortable', 'lucide-react'],
  },
  transpilePackages: ['recharts', 'framer-motion', 'date-fns'],
};

export default nextConfig;
```

- [ ] **Step 3:** Commit

```bash
git add next.config.ts
git commit -m "perf: remove console methods from production bundle"
```

---

### 1.5 Improve TanStack Query staleTime configuration

**Files to modify:**
- `src/components/providers.tsx` — Update QueryClient defaults

**Task 7: Optimize TanStack Query defaults**
- [ ] **Step 1:** Read `src/components/providers.tsx`

```bash
cat src/components/providers.tsx
```

- [ ] **Step 2:** Update with better defaults and add gcTime

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth-context';
import { QuickActionsProvider } from '@/lib/quick-actions-context';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // 5 minutes stale time - reduce unnecessary refetches
        staleTime: 5 * 60 * 1000,
        // 10 minutes garbage collection - keep unused data longer
        gcTime: 10 * 60 * 1000,
        // Don't refetch on window focus in dev (causes excessive API calls)
        refetchOnWindowFocus: process.env.NODE_ENV !== 'development',
        // Single retry on failure
        retry: 1,
        // Exponential backoff delay
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        // Keep failed mutations in cache for retry
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <QuickActionsProvider>
          {children}
        </QuickActionsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 3:** Commit

```bash
git add src/components/providers.tsx
git commit -m "perf: optimize TanStack Query defaults for reduced network/cpu"
```

---

### 1.6 Delete dead code and backup files

**Files to delete:**
- `src/lib/rate-limit.backup.ts`
- Any other `.backup.ts`, `.old.ts`, `.bak.ts` files

**Task 8: Remove backup files**
- [ ] **Step 1:** Find all backup files

```bash
find src -name "*.backup.*" -o -name "*.bak.*" -o -name "*.old.*" 2>/dev/null
```

- [ ] **Step 2:** Remove identified files

```bash
rm src/lib/rate-limit.backup.ts
```

- [ ] **Step 3:** Commit

```bash
git add -A && git commit -m "chore: remove dead code and backup files"
```

---

## Phase 2: High-Impact Optimizations

### 2.1 Convert heavy client pages to hybrid architecture

**Goal:** Reduce the number of 'use client' pages by extracting pure presentational components.

**Task 9: Create Server Component wrapper for dashboard**

**Files to modify:**
- `src/app/dashboard/page.tsx` — Extract to wrapper + client component

- [ ] **Step 1:** Read current `src/app/dashboard/page.tsx` (already read earlier — it's 344 lines)

The page currently has:
- `useAuth()` hook call
- Multiple `useQuery()` calls
- Presentation logic mixed with state

- [ ] **Step 2:** Create `src/app/dashboard/dashboard-content.tsx` (new file)

```typescript
'use client';

import * as React from "react";
import { Loader2, Target, Users, CheckSquare, TrendingUp } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { useSidebar } from "@/lib/sidebar-context";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { format, isToday, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";

// ... rest of the current page content (move the whole file here)
```

- [ ] **Step 3:** Update `src/app/dashboard/page.tsx` to be a thin wrapper

```typescript
// src/app/dashboard/page.tsx
import { DashboardContent } from "./dashboard-content";

export default function DashboardPage() {
  return <DashboardContent />;
}
```

- [ ] **Step 4:** Commit

```bash
git add src/app/dashboard/page.tsx src/app/dashboard/dashboard-content.tsx
git commit -m "refactor: split dashboard into thin server wrapper and client component"
```

**Note:** This is a refactor only — the page still behaves the same but now the routing layer is a Server Component.

---

### 2.2 Add lazy loading for heavy components

**Goal:** Use `next/dynamic` to defer loading of heavy components until needed.

**Files to create/modify:**
- `src/app/contacts/components/contact-table.tsx`
- `src/app/pipeline/page.tsx`
- `src/app/reports/page.tsx`

**Task 10: Add dynamic import for contact drawer**

- [ ] **Step 1:** Read `src/app/contacts/page.tsx` to find dynamic import pattern

```bash
grep -n "dynamic" src/app/contacts/page.tsx | head -20
```

- [ ] **Step 2:** Verify Suspense boundaries are in place. If ContactDrawer already uses dynamic, check the loading state

- [ ] **Step 3:** Ensure ContactDrawer has a proper loading skeleton (not generic)

```typescript
// src/app/contacts/components/contact-drawer-skeleton.tsx
export function ContactDrawerSkeleton() {
  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0E0F12] border-l border-white/10 z-50">
      <div className="p-6 space-y-4">
        <div className="h-8 w-32 bg-white/5 rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-white/5 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4:** Commit

```bash
git add src/app/contacts/components/contact-drawer-skeleton.tsx
git commit -m "perf: add skeleton loading component for contact drawer"
```

---

### 2.3 Add bundle analyzer configuration

**File to modify:** `next.config.ts`

**Task 11: Enable Turbopack bundle analyzer (Next.js 16.1+)**
- [ ] **Step 1:** Update next.config.ts with bundleAnalyzer

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ... existing config ...
  experimental: {
    optimizePackageImports: ['recharts', 'framer-motion', 'date-fns', '@dnd-kit/core', '@dnd-kit/sortable', 'lucide-react'],
    // Enable bundle analyzer for identifying large dependencies
    bundleAnalyzer: process.env.ANALYZE === 'true',
  },
  // ... rest ...
};

export default nextConfig;
```

- [ ] **Step 2:** Add analyze script to package.json

```bash
grep -n '"analyze"' package.json || echo '"analyze": "ANALYZE=true next build" not found'
```

- [ ] **Step 3:** Add the script if missing

```bash
# Edit package.json to add:
"analyze": "ANALYZE=true next build",
```

- [ ] **Step 4:** Commit

```bash
git add next.config.ts package.json
git commit -m "perf: add bundle analyzer configuration"
```

---

### 2.4 Add Prisma database indexes

**File to modify:** `prisma/schema.prisma`

**Task 12: Add missing indexes for query performance**
- [ ] **Step 1:** Read current schema

```bash
cat prisma/schema.prisma
```

- [ ] **Step 2:** Add indexes to commonly queried fields. Common patterns:

```prisma
model Task {
  // ... existing fields ...

  @@index([organizationId, status])
  @@index([assignedTo])
  @@index([dueDate])
  @@index([priority])
}

model Deal {
  // ... existing fields ...

  @@index([organizationId, stageId])
  @@index([contactId])
  @@index([value])
}

model Contact {
  // ... existing fields ...

  @@index([organizationId])
  @@index([pipelineStageId])
  @@index([assignedTo])
}

model PipelineStage {
  // ... existing fields ...

  @@index([organizationId])
  @@index([pipelineId])
}
```

- [ ] **Step 3:** Run Prisma migrate or db push to apply

```bash
bun run db:push
```

- [ ] **Step 4:** Commit schema changes

```bash
git add prisma/schema.prisma
git commit -m "perf: add database indexes for frequently queried fields"
```

---

### 2.5 Reduce refetchInterval polling frequency

**Files to modify:**
- `src/components/layout/app-sidebar.tsx` — Notifications polling

**Task 13: Reduce notification polling from 60s to 5min**
- [ ] **Step 1:** Find refetchInterval in sidebar

```bash
grep -n "refetchInterval" src/components/layout/app-sidebar.tsx
```

- [ ] **Step 2:** Update to 5 minutes (300000ms) or remove if not critical

```typescript
// Change:
refetchInterval: 60 * 1000,
// To:
refetchInterval: 5 * 60 * 1000, // 5 minutes
```

- [ ] **Step 3:** Commit

```bash
git add src/components/layout/app-sidebar.tsx
git commit -m "perf: reduce notification polling from 60s to 5min"
```

---

### 2.6 Split large auth context

**Files to modify:**
- `src/lib/auth-context.tsx` — Split into smaller contexts

**Task 14: Extract linked providers state**
- [ ] **Step 1:** Read auth-context to understand the linkedProviders usage

```bash
grep -n "linkedProviders" src/lib/auth-context.tsx
```

- [ ] **Step 2:** Create a separate context for linked providers

```typescript
// src/lib/linked-accounts-context.tsx
'use client';

import React, { createContext, useContext, useCallback } from 'react';

interface LinkedAccountsContextType {
  linkedProviders: string[];
  setLinkedProviders: (providers: string[]) => void;
  addLinkedProvider: (provider: string) => void;
}

const LinkedAccountsContext = createContext<LinkedAccountsContextType | undefined>(undefined);

export function LinkedAccountsProvider({ children }: { children: React.ReactNode }) {
  const [linkedProviders, setLinkedProviders] = React.useState<string[]>([]);

  const addLinkedProvider = useCallback((provider: string) => {
    setLinkedProviders(prev => prev.includes(provider) ? prev : [...prev, provider]);
  }, []);

  return (
    <LinkedAccountsContext.Provider value={{ linkedProviders, setLinkedProviders, addLinkedProvider }}>
      {children}
    </LinkedAccountsContext.Provider>
  );
}

export function useLinkedAccounts() {
  const context = useContext(LinkedAccountsContext);
  if (!context) {
    throw new Error('useLinkedAccounts must be used within LinkedAccountsProvider');
  }
  return context;
}
```

- [ ] **Step 3:** Commit

```bash
git add src/lib/linked-accounts-context.tsx
git commit -m "refactor: extract linked accounts to separate context"
```

---

### 2.7 Optimize font loading

**File to modify:** `src/app/layout.tsx`

**Task 15: Add latin-extended subset and preload**
- [ ] **Step 1:** Update font configuration to include latin-extended if needed for Spanish

```typescript
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin", "latin-ext"], // Add extended for Spanish accents
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  preload: true, // Preload fonts for faster LCP
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  display: "swap",
  preload: true,
});
```

- [ ] **Step 2:** Commit

```bash
git add src/app/layout.tsx
git commit -m "perf: add latin-extended font subsets and enable preloading"
```

---

### 2.8 Add image size optimization

**File to modify:** `next.config.ts`

**Task 16: Configure custom image sizes**
- [ ] **Step 1:** Update next.config.ts image configuration

```typescript
images: {
  remotePatterns: [{ protocol: "https", hostname: "**" }],
  formats: ["image/avif", "image/webp"],
  minimumCacheTTL: 31536000,
  // Optimize for common device sizes
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
},
```

- [ ] **Step 2:** Commit

```bash
git add next.config.ts
git commit -m "perf: configure custom image sizes for better responsive loading"
```

---

### 2.9 Replace img tags with next/image

**Files to modify:**
- `src/lib/generatePlan.ts` — Uses `<img>` tag

**Task 17: Replace native img with next/image**
- [ ] **Step 1:** Find img tags in generatePlan.ts

```bash
grep -n "<img" src/lib/generatePlan.ts
```

- [ ] **Step 2:** Replace with Image component from next/image

```typescript
import Image from 'next/image';

// Replace:
// <img src={url} alt={alt} />

// With:
// <Image src={url} alt={alt} width={800} height={600} />
```

- [ ] **Step 3:** Commit

```bash
git add src/lib/generatePlan.ts
git commit -m "perf: replace img tags with next/image for optimization"
```

---

### 2.10 Enable Vercel Analytics and Speed Insights

**File to modify:** `src/app/layout.tsx`

**Task 18: Uncomment analytics**
- [ ] **Step 1:** Read layout.tsx lines 56-57 (currently commented)

```bash
sed -n '56,57p' src/app/layout.tsx
```

- [ ] **Step 2:** Uncomment the imports

```typescript
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
```

- [ ] **Step 3:** Add components after ProvidersWrapper (before closing body)

```tsx
<ProvidersWrapper>
  {children}
  <Analytics />
  <SpeedInsights />
</ProvidersWrapper>
```

- [ ] **Step 4:** Install packages if not present

```bash
bun add @vercel/analytics @vercel/speed-insights
```

- [ ] **Step 5:** Commit

```bash
git add src/app/layout.tsx package.json
git commit -m "perf: enable Vercel Analytics and Speed Insights"
```

---

## Phase 3: Medium-Impact Optimizations

### 3.1 Implement component-level code splitting

**Goal:** Use React.lazy and Suspense for components that aren't immediately visible.

**Task 19: Lazy load recharts on reports page**
- [ ] **Step 1:** Read reports page

```bash
cat src/app/reports/page.tsx | head -50
```

- [ ] **Step 2:** Add lazy loading for chart components

```typescript
'use client';

import dynamic from 'next/dynamic';

// Lazy load heavy chart components
const RevenueChart = dynamic(() => import("@/components/charts/revenue-chart"), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-white/5 rounded-lg" />
});

const PipelineChart = dynamic(() => import("@/components/charts/pipeline-chart"), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-white/5 rounded-lg" />
});
```

- [ ] **Step 3:** Commit

```bash
git add src/app/reports/page.tsx
git commit -m "perf: lazy load chart components on reports page"
```

---

### 3.2 Optimize lucide-react imports

**Goal:** Use direct icon imports instead of barrel imports to reduce bundle size.

**Files to check/modify:**
- `src/components/layout/command-palette.tsx` — Imports 14+ icons

**Task 20: Use tree-shakeable icon imports**
- [ ] **Step 1:** Read command-palette imports

```bash
head -30 src/components/layout/command-palette.tsx
```

- [ ] **Step 2:** The current import style `import { BarChart3, Users, ... } from "lucide-react"` IS tree-shakeable when using `optimizePackageImports`. Verify it's in next.config.ts

```bash
grep -A5 "optimizePackageImports" next.config.ts
```

Expected: Should include 'lucide-react'

- [ ] **Step 3:** If not, add it

```typescript
optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion', 'date-fns', '@dnd-kit/core', '@dnd-kit/sortable'],
```

- [ ] **Step 4:** Commit

```bash
git add next.config.ts
git commit -m "perf: ensure lucide-react is in optimizePackageImports"
```

---

### 3.3 Add useMemo for expensive computations

**Files to modify:**
- `src/app/dashboard/page.tsx` — already has useMemo for deals filtering
- `src/app/pipeline/page.tsx` — has filteredStages useMemo

**Task 21: Audit and optimize memoization**
- [ ] **Step 1:** Run React DevTools Profiler or check for unnecessary re-renders

```bash
# Look for useMemo patterns that might be missing
grep -n "React.useMemo\|useMemo" src/app/dashboard/page.tsx | head -10
```

- [ ] **Step 2:** Add useMemo for any expensive derived data not already memoized
- [ ] **Step 3:** Commit

---

### 3.4 Configure SWR for client-side caching

**Goal:** Implement proper caching strategy for client-side data fetching.

**Task 22: Set up cache configuration for TanStack Query**
- [ ] **Step 1:** The current setup in providers.tsx already has gcTime of 10 minutes
- [ ] **Step 2:** For specific heavy queries, add fetchPolicy

```typescript
// In dashboard page
const { data: stats } = useQuery({
  queryKey: ["dashboard-stats", user?.organizationId],
  queryFn: async () => {
    // ...
  },
  enabled: !!user?.organizationId && isAuthenticated,
  staleTime: 5 * 60 * 1000, // Consider data fresh for 5 min
  gcTime: 30 * 60 * 1000, // Keep in cache for 30 min
});
```

- [ ] **Step 3:** Commit

---

### 3.5 Remove unused dependencies

**Task 23: Audit package.json for unused packages**
- [ ] **Step 1:** Run depcheck tool

```bash
npx depcheck --json | head -100
```

- [ ] **Step 2:** Identify truly unused packages
- [ ] **Step 3:** Remove with `bun remove <package>`
- [ ] **Step 4:** Commit

---

### 3.6 Add loading skeletons for routes

**Goal:** Improve perceived performance with route-level skeletons.

**Files to create:**
- `src/app/dashboard/loading.tsx`
- `src/app/contacts/loading.tsx`
- `src/app/pipeline/loading.tsx`

**Task 24: Create loading.tsx for dashboard**
- [ ] **Step 1:** Create `src/app/dashboard/loading.tsx`

```typescript
export default function DashboardLoading() {
  return (
    <div className="min-h-screen gradient-bg">
      <div className="lg:pl-[220px]">
        <div className="p-6">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="h-4 w-48 bg-white/5 rounded animate-pulse mb-2" />
            <div className="h-8 w-64 bg-white/5 rounded animate-pulse" />
          </div>
          {/* KPI cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
            <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2:** Copy similar patterns to other route loading files
- [ ] **Step 3:** Commit

---

### 3.7 Optimize middleware (proxy.ts) in Next.js 16

**File to check:** `proxy.ts` (if exists) or `middleware.ts`

**Task 25: Review proxy for unnecessary processing**
- [ ] **Step 1:** Find proxy/middleware file

```bash
ls -la proxy.ts middleware.ts 2>/dev/null || echo "No proxy/middleware found"
```

- [ ] **Step 2:** If exists, read and optimize any heavy processing
- [ ] **Step 3:** Commit

---

### 3.8 Add route segment config for caching

**Files to modify:**
- `src/app/api/*/route.ts` — Add cache headers

**Task 26: Add cache headers to API routes**
- [ ] **Step 1:** For read-only API routes, add caching

```typescript
export async function GET(request: Request) {
  // ... existing code ...

  // Add cache headers
  return Response.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
```

- [ ] **Step 2:** Apply to appropriate routes (dashboard stats, etc.)
- [ ] **Step 3:** Commit

---

## Phase 4: Infrastructure Optimizations

### 4.1 Set up Edge Config for feature flags

**Goal:** Use Vercel Edge Config instead of environment variables for dynamic config.

**Files to create:**
- `src/lib/edge-config.ts`

**Task 27: Create Edge Config client**
- [ ] **Step 1:** Install @vercel/edge-config

```bash
bun add @vercel/edge-config
```

- [ ] **Step 2:** Create client with lazy initialization

```typescript
// src/lib/edge-config.ts
import { EdgeConfig } from '@vercel/edge-config';

let edgeConfig: EdgeConfig | null = null;

export function getEdgeConfig() {
  if (!edgeConfig) {
    edgeConfig new EdgeConfig({
      url: process.env.EDGE_CONFIG_URL,
      token: process.env.EDGE_CONFIG_TOKEN,
    });
  }
  return edgeConfig;
}

export async function getFeatureFlag(flag: string): Promise<boolean> {
  try {
    const config = getEdgeConfig();
    const value = await config.get(flag);
    return value === 'true' || value === true;
  } catch {
    return false; // Default to false if Edge Config unavailable
  }
}
```

- [ ] **Step 3:** Commit

---

### 4.2 Configure Redis for session caching

**Goal:** Use Upstash Redis for caching sessions and expensive queries.

**Files to create:**
- `src/lib/redis.ts`

**Task 28: Create Redis client with lazy init**
- [ ] **Step 1:** Install @upstash/redis

```bash
bun add @upstash/redis
```

- [ ] **Step 2:** Create client

```typescript
// src/lib/redis.ts
import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

export function getRedis() {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

// Cache helper with TTL
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await getRedis().get<T>(key);
    return data ?? null;
  } catch {
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
  try {
    await getRedis().set(key, JSON.stringify(value), { ex: ttlSeconds });
  } catch {
    // Silently fail - cache is optional
  }
}
```

- [ ] **Step 3:** Commit

---

### 4.3 Add API response caching

**Files to modify:**
- `src/app/api/dashboard/stats/route.ts` — Add caching layer

**Task 29: Implement cache-aside pattern for dashboard stats**
- [ ] **Step 1:** Read current dashboard stats route

```bash
cat src/app/api/dashboard/stats/route.ts 2>/dev/null || echo "File not found"
```

- [ ] **Step 2:** Add Redis caching

```typescript
import { cacheGet, cacheSet } from '@/lib/redis';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    return Response.json({ error: 'Missing organizationId' }, { status: 400 });
  }

  const cacheKey = `dashboard:stats:${organizationId}`;

  // Try cache first
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return Response.json(cached, {
      headers: { 'X-Cache': 'HIT' }
    });
  }

  // Fetch fresh data
  const stats = await fetchDashboardStats(organizationId);

  // Cache for 5 minutes
  await cacheSet(cacheKey, stats, 300);

  return Response.json(stats, {
    headers: { 'X-Cache': 'MISS' }
  });
}
```

- [ ] **Step 3:** Commit

---

### 4.4 Add database connection pooling

**File to modify:** `prisma/schema.prisma`

**Task 30: Configure Prisma connection pool**
- [ ] **Step 1:** Add connection pool configuration to schema

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // Connection pool settings for serverless
  relationMode = "prisma"
}

generator client {
  // ... existing config
}

model PipelineStage {
  // ... existing fields

  // Separate indexes for pool mode
  @@index([organizationId])
}
```

- [ ] **Step 2:** Ensure DATABASE_URL includes pool settings

```bash
grep "DATABASE_URL" .env 2>/dev/null | head -1
```

The URL should include: `?pgbouncer=true` for PgBouncer or connection pooler

- [ ] **Step 3:** Commit

---

### 4.5 Configure Upstash Rate Limiting

**Files to modify:**
- API routes that need rate limiting

**Task 31: Implement rate limiting middleware**
- [ ] **Step 1:** Install @upstash/ratelimit

```bash
bun add @upstash/ratelimit
```

- [ ] **Step 2:** Create rate limit utility

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { getRedis } from './redis';

// Rate limiter for authenticated users
export const authedRateLimit = new Ratelimit({
  redis: getRedis(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
  analytics: true,
});

// Rate limiter for public endpoints
export const publicRateLimit = new Ratelimit({
  redis: getRedis(),
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
});
```

- [ ] **Step 3:** Apply to API routes

```typescript
import { publicRateLimit } from '@/lib/rate-limit';

export async function GET(request: Request) {
  const { success } = await publicRateLimit.limit(request.url);
  if (!success) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }
  // ... rest of handler
}
```

- [ ] **Step 4:** Commit

---

### 4.6 Set up proper logging for production

**Files to modify:**
- `src/lib/logger.ts` — Replace console.log with structured logger

**Task 32: Create production-safe logger**
- [ ] **Step 1:** Replace simple console.log with structured logging

```typescript
// src/lib/logger.ts
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

const currentLevel: LogLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'debug';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] <= LOG_LEVELS[currentLevel];
}

export const logger = {
  error: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog('error')) {
      console.error(JSON.stringify({ level: 'error', message, ...meta, timestamp: new Date().toISOString() }));
    }
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog('warn')) {
      console.warn(JSON.stringify({ level: 'warn', message, ...meta, timestamp: new Date().toISOString() }));
    }
  },
  info: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog('info')) {
      console.info(JSON.stringify({ level: 'info', message, ...meta, timestamp: new Date().toISOString() }));
    }
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog('debug')) {
      console.debug(JSON.stringify({ level: 'debug', message, ...meta, timestamp: new Date().toISOString() }));
    }
  },
};
```

- [ ] **Step 2:** Commit

---

## Phase 5: Advanced Optimizations

### 5.1 Memory optimization for development

**Files to modify:**
- `package.json` — Add NODE_OPTIONS for memory limit

**Task 33: Set Node.js memory limit for dev**
- [ ] **Step 1:** Update dev script to limit memory

```json
{
  "scripts": {
    "dev": "bun run dev:quick",
    "dev:start": "NODE_OPTIONS='--max-old-space-size=2048' next dev -p 3000 2>&1 | tee dev.log"
  }
}
```

- [ ] **Step 2:** Commit

---

### 5.2 Implement partial prerendering (PPR) hints

**Goal:** Use Next.js streaming for faster TTFB.

**Task 34: Add Suspense boundaries strategically**
- [ ] **Step 1:** Identify slow data dependencies in pages
- [ ] **Step 2:** Wrap in Suspense with streaming

```typescript
import { Suspense } from 'react';

export default function DashboardPage() {
  return (
    <>
      {/* Static header loads immediately */}
      <DashboardHeader />

      {/* Dynamic content streams in */}
      <Suspense fallback={<KPICardsSkeleton />}>
        <KPICards />
      </Suspense>

      <Suspense fallback={<PipelineSkeleton />}>
        <Pipeline />
      </Suspense>
    </>
  );
}
```

- [ ] **Step 3:** Commit

---

### 5.3 Add cache headers for static assets

**File to modify:** `next.config.ts`

**Task 35: Configure aggressive caching for static assets**
- [ ] **Step 1:** Add headers configuration

```typescript
const nextConfig: NextConfig = {
  // ... existing config ...

  headers: async () => [
    {
      // Cache static JS/CSS for 1 year (immutable hashes)
      source: '/_next/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    {
      // Cache public static files
      source: '/public/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=86400, stale-while-revalidate=604800',
        },
      ],
    },
  ],
};
```

- [ ] **Step 2:** Commit

---

### 5.4 Add React Compiler (experimental)

**File to modify:** `next.config.ts`

**Task 36: Enable React Compiler for automatic memoization**
- [ ] **Step 1:** Install babel plugin

```bash
bun add @babel/plugin-transform-react-compiler
```

- [ ] **Step 2:** Update next.config.ts

```typescript
const nextConfig: NextConfig = {
  // ... existing config ...
  experimental: {
    // ... existing experimental options ...
    // React Compiler for automatic memoization
    reactCompiler: true,
  },
};
```

- [ ] **Step 3:** Verify compilation works

```bash
bun run dev 2>&1 | head -50
```

- [ ] **Step 4:** If issues arise, disable with `reactCompiler: false`
- [ ] **Step 5:** Commit if successful

---

### 5.5 Production build optimization

**Goal:** Verify and optimize production build output.

**Task 37: Run production build analysis**
- [ ] **Step 1:** Run build with bundle analyzer

```bash
npm run analyze
```

- [ ] **Step 2:** Review output in `.next/diagnostics/analyze/`
- [ ] **Step 3:** Identify top 5 largest bundles
- [ ] **Step 4:** For each, investigate if it can be:
  - Lazy loaded
  - Replaced with lighter alternative
  - Split into separate chunks
- [ ] **Step 5:** Apply findings as new tasks

---

## Validation & Testing

### Pre-optimization Baseline
Before starting, capture baseline metrics:

```bash
# Memory usage during dev
ps aux | grep "next dev" | grep -v grep

# Bundle size
du -sh .next/static 2>/dev/null

# Page load times (in browser DevTools)
# Network tab - Document load time
```

### Post-optimization Verification
After each phase, verify:

```bash
# 1. No console errors
bun run dev 2>&1 | grep -i error

# 2. No TypeScript errors
bun run type-check 2>&1 | tail -20

# 3. Build succeeds
bun run build 2>&1 | tail -30

# 4. Memory usage reduced
ps aux | grep "next dev" | grep -v grep
```

---

## Rollback Plan

If any optimization causes issues:

```bash
# Revert last commit
git revert HEAD

# Or revert specific file
git checkout HEAD~1 -- src/lib/db.ts
```

---

## Dependencies Between Phases

```
Phase 1 (Critical) ──┬── All subsequent phases depend on clean console output
                      └── Phase 2 can start independently

Phase 2 ────────────┬── Phase 3 can start independently
                      └── Phase 4 requires Phase 2 completion (caching layer)

Phase 3 ────────────┬── Phase 5 can start independently
                      └── Phase 4 requires Phase 2 completion

Phase 4 ────────────┘── Phase 5 builds on infrastructure

Phase 5 ────────────┘── Final optimization, no dependencies
```

---

## Estimated Timeline

| Phase | Estimated Time | Total Time |
|-------|---------------|------------|
| Phase 1: Critical Fixes | 30-45 min | 30-45 min |
| Phase 2: High-Impact | 2-3 hours | 2.5-3.5 hours |
| Phase 3: Medium-Impact | 2-3 hours | 4.5-6.5 hours |
| Phase 4: Infrastructure | 3-4 hours | 7.5-10.5 hours |
| Phase 5: Advanced | 2-3 hours | 9.5-13.5 hours |

---

## Files Summary

| Action | Files |
|--------|-------|
| Modify | `next.config.ts`, `package.json`, `src/lib/db.ts`, `src/lib/auth-context.tsx`, `src/components/providers.tsx`, `src/app/layout.tsx`, `src/app/dashboard/page.tsx`, `src/app/contacts/page.tsx`, `src/app/pipeline/page.tsx`, `src/app/reports/page.tsx`, `src/components/layout/app-sidebar.tsx`, `prisma/schema.prisma`, `src/app/api/*/route.ts` |
| Create | `src/app/dashboard/dashboard-content.tsx`, `src/app/dashboard/loading.tsx`, `src/app/contacts/loading.tsx`, `src/app/pipeline/loading.tsx`, `src/lib/linked-accounts-context.tsx`, `src/lib/edge-config.ts`, `src/lib/redis.ts`, `src/lib/rate-limit.ts`, `src/lib/logger.ts`, `src/app/contacts/components/contact-drawer-skeleton.tsx` |
| Delete | `src/lib/rate-limit.backup.ts` |
