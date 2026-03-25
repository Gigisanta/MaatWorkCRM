# Performance Optimization Plan Phase 2 — MaatWork CRM v3

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Continuar reduciendo uso de memoria y bundle size con optimizaciones de Next.js 16, React 19, y patrones avanzados.

**Architecture:** Optimizaciones avanzadas independientes que no dependen una de otra.

**Tech Stack:** Next.js 16.1, React 19.2, TypeScript, Prisma, TanStack Query, Turbopack

---

## Phase 6: React 19 / Next.js 16 Optimizations

### 6.1 Enable React Compiler (babel plugin)

**File to modify:** `next.config.ts`

**Task 1: Install and configure React Compiler**
- [ ] **Step 1:** Install babel plugin

```bash
bun add @babel/plugin-transform-react-compiler
```

- [ ] **Step 2:** Update next.config.ts

```typescript
experimental: {
  optimizePackageImports: ['recharts', 'framer-motion', 'date-fns', '@dnd-kit/core', '@dnd-kit/sortable', 'lucide-react'],
  reactCompiler: true,
},
```

- [ ] **Step 3:** Run dev to verify

```bash
bun run dev 2>&1 | head -30
```

- [ ] **Step 4:** Commit

```bash
git add next.config.ts package.json
git commit -m "perf: enable React Compiler for automatic memoization"
```

---

### 6.2 Implement Cache Components (Next.js 16 'use cache')

**Goal:** Use the new `'use cache'` directive for expensive data fetches.

**Files to analyze:**
- `src/app/dashboard/dashboard-content.tsx` — Stats queries
- `src/app/contacts/page.tsx` — Contact list queries
- `src/app/pipeline/page.tsx` — Pipeline queries

**Task 2: Add 'use cache' to expensive data fetches**
- [ ] **Step 1:** Read dashboard content to find fetch patterns

```bash
grep -n "useQuery\|fetch\|await" src/app/dashboard/dashboard-content.tsx | head -30
```

- [ ] **Step 2:** Create server-side cache functions for static/dynamic data

```typescript
// src/lib/cache/dashboard-stats.ts
'use cache';

export async function getDashboardStats(organizationId: string) {
  cacheLife('minutes'); // Cache for 5 minutes
  cacheTag('dashboard', organizationId); // Tag for invalidation

  const stats = await db.stats.findMany({
    where: { organizationId },
    // ...
  });

  return stats;
}
```

- [ ] **Step 3:** Commit

---

### 6.3 Optimize proxy.ts (middleware replacement in Next.js 16)

**File to modify:** `proxy.ts`

**Task 3: Review and optimize proxy**
- [ ] **Step 1:** Read current proxy.ts

```bash
cat proxy.ts
```

- [ ] **Step 2:** Ensure no heavy operations blocking the proxy

```typescript
// Lightweight proxy - only rewrite/redirect/headers
export function proxy(request: NextRequest) {
  // Check auth token only - no DB calls
  const token = request.cookies.get('auth-token');
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  // ...
}
```

- [ ] **Step 3:** Commit

---

## Phase 7: Bundle Size Reduction

### 7.1 Audit and remove unused packages

**Task 4: Run bundle analyzer and depcheck**
- [ ] **Step 1:** Run depcheck to find unused packages

```bash
npx depcheck 2>/dev/null | head -50
```

- [ ] **Step 2:** Check for packages in package.json that might not be used

```bash
grep -E "^\s+\"" package.json | cut -d'"' -f2 | head -30
```

- [ ] **Step 3:** Verify heavy packages are only imported where needed
- [ ] **Step 4:** Commit any removals

---

### 7.2 Tree-shake heavy dependencies

**Goal:** Ensure heavy libraries like recharts, framer-motion are properly tree-shaken.

**Task 5: Verify optimizePackageImports is working**
- [ ] **Step 1:** Check next.config.ts has heavy packages

```bash
grep -A3 "optimizePackageImports" next.config.ts
```

- [ ] **Step 2:** Add any missing heavy libraries

```typescript
optimizePackageImports: [
  'recharts',
  'framer-motion',
  'date-fns',
  '@dnd-kit/core',
  '@dnd-kit/sortable',
  'lucide-react',
  'sonner', // Added sonner
],
```

- [ ] **Step 3:** Commit

---

### 7.3 Analyze bundle with Turbopack analyzer

**Task 6: Run bundle analysis**
- [ ] **Step 1:** Run analyze script

```bash
npm run analyze 2>&1 | tail -50
```

- [ ] **Step 2:** Review `.next/analyze/` output
- [ ] **Step 3:** Identify top 5 largest imports
- [ ] **Step 4:** Create tasks for any needed lazy loading

---

## Phase 8: Memory & Performance

### 8.1 Implement connection pooling for Prisma

**File to modify:** `prisma/schema.prisma`

**Task 7: Configure Prisma connection pool**
- [ ] **Step 1:** Add relationMode for serverless

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
  relationMode = "prisma" // For serverless compatibility
}
```

- [ ] **Step 2:** Run db:generate

```bash
bun run db:generate
```

- [ ] **Step 3:** Commit

---

### 8.2 Optimize SQLite for development (Prisma)

**Goal:** Since this uses SQLite (not Postgres), optimize for it.

**Task 8: Add SQLite-specific optimizations**
- [ ] **Step 1:** Check if using SQLite

```bash
grep "provider.*sqlite" prisma/schema.prisma
```

- [ ] **Step 2:** Add performance settings in db.ts

```typescript
// Add to db.ts
const db = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=5&statement_cache_size=500',
    },
  },
});
```

- [ ] **Step 3:** Commit

---

### 8.3 Add React.useActionState for form mutations

**Goal:** Replace useTransition with newer React 19 patterns.

**Files to modify:**
- Contact forms
- Task creation forms

**Task 9: Update to React 19 useActionState**
- [ ] **Step 1:** Find forms using useTransition

```bash
grep -rn "useTransition" src/ | head -10
```

- [ ] **Step 2:** Update to useActionState

```typescript
// Before
const [isPending, startTransition] = useTransition();
startTransition(() => { saveContact(); });

// After
const [saveState, saveContact] = useActionState(async, null);
// React 19 auto-manages pending state
```

- [ ] **Step 3:** Commit

---

## Phase 9: Loading Performance

### 9.1 Add View Transitions for route changes

**Goal:** Use Next.js 16 View Transitions API for smoother navigation.

**Task 10: Enable View Transitions**
- [ ] **Step 1:** Add ViewTransition component to layout

```tsx
import { ViewTransition } from 'next-view-transition';

export default function Layout({ children }) {
  return (
    <ViewTransition>
      {children}
    </ViewTransition>
  );
}
```

- [ ] **Step 2:** Add CSS for transitions

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 200ms;
}
```

- [ ] **Step 3:** Commit

---

### 9.2 Optimize images with next/image blur placeholders

**Task 11: Add blur placeholders to all next/image usages**
- [ ] **Step 1:** Find images without blurDataURL

```bash
grep -rn "next/image" src/ | grep -v blurDataURL | head -10
```

- [ ] **Step 2:** Add blur placeholders for user avatars, contact photos

```tsx
<Image
  src={avatar}
  alt={name}
  width={40}
  height={40}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

- [ ] **Step 3:** Commit

---

### 9.3 Add preload hints for critical routes

**Task 12: Add route prefetching**
- [ ] **Step 1:** Read sidebar to find navigation links

```bash
grep -n "Link\|href=" src/components/layout/app-sidebar.tsx | head -20
```

- [ ] **Step 2:** Add prefetch to critical links

```tsx
<Link href="/dashboard" prefetch>
  Dashboard
</Link>
```

- [ ] **Step 3:** Commit

---

## Phase 10: Database Query Optimization

### 10.1 Add Prisma select to reduce data transfer

**Goal:** Only fetch needed fields instead of entire objects.

**Task 13: Optimize Prisma queries with select**
- [ ] **Step 1:** Find queries without select

```bash
grep -rn "findMany\|findFirst" src/lib/ | head -20
```

- [ ] **Step 2:** Add select to reduce payload

```typescript
// Before
const contacts = await db.contact.findMany();

// After
const contacts = await db.contact.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    company: true,
    pipelineStage: { select: { name: true, color: true } },
  },
});
```

- [ ] **Step 3:** Commit

---

### 10.2 Add cursor-based pagination for lists

**Task 14: Implement cursor pagination**
- [ ] **Step 1:** Find list endpoints using offset pagination

```bash
grep -rn "skip.*take\|page.*limit" src/app/api/ | head -10
```

- [ ] **Step 2:** Convert to cursor pagination for large lists

```typescript
// Before
const page = parseInt(searchParams.get('page') || '1');
const contacts = await db.contact.findMany({
  skip: (page - 1) * 20,
  take: 20,
});

// After
const cursor = searchParams.get('cursor');
const contacts = await db.contact.findMany({
  take: 21, // Take one extra to determine if there's a next page
  cursor: cursor ? { id: cursor } : undefined,
  skip: cursor ? 1 : 0,
});
```

- [ ] **Step 3:** Commit

---

## Phase 11: Client State Optimization

### 11.1 Split heavy client components

**Task 15: Identify and split heavy client components**
- [ ] **Step 1:** Find large client components (>500 lines)

```bash
wc -l src/app/**/*.tsx | sort -rn | head -10
```

- [ ] **Step 2:** Split into smaller, focused components
- [ ] **Step 3:** Commit

---

### 11.2 Add useCallback for event handlers

**Task 16: Wrap expensive callbacks with useCallback**
- [ ] **Step 1:** Find callbacks without useCallback in contact-table

```bash
grep -n "onClick\|onChange\|onToggle" src/app/contacts/components/contact-table.tsx | head -10
```

- [ ] **Step 2:** Add useCallback wrappers

```typescript
const handleContactClick = useCallback((contact: Contact) => {
  setSelectedContact(contact);
}, []);

const handleToggleSelect = useCallback((contactId: string) => {
  setSelectedContacts(prev =>
    prev.includes(contactId)
      ? prev.filter(id => id !== contactId)
      : [...prev, contactId]
  );
}, []);
```

- [ ] **Step 3:** Commit

---

### 11.3 Optimize re-renders with key props

**Task 17: Ensure proper key props in lists**
- [ ] **Step 1:** Find lists with index as key

```bash
grep -rn "map.*, \i\b" src/ | head -10
```

- [ ] **Step 2:** Replace with stable IDs

```tsx
// Before
{items.map((item, i) => <div key={i}>...</div>)}

// After
{items.map((item) => <div key={item.id}>...</div>)}
```

- [ ] **Step 3:** Commit

---

## Validation

### Post-optimization verification

```bash
# 1. Build succeeds
npm run build 2>&1 | tail -20

# 2. Memory usage dev
ps aux | grep "next dev" | grep -v grep

# 3. Bundle size
du -sh .next/

# 4. Type check
npm run type-check 2>&1 | tail -10
```

---

## Dependencies

```
Phase 6 (React 19) ─┬─ Phase 7 (Bundle)
Phase 7 ────────────┼─ Phase 8 (Memory)
Phase 8 ────────────┼─ Phase 9 (Loading)
Phase 9 ────────────┼─ Phase 10 (Database)
Phase 10 ───────────┴─ Phase 11 (Client State)
```

All phases are independent and can run in parallel via subagents.
