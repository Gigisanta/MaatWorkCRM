# MaatWork CRM v3 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar todas las features de CRM solicitadas + arreglar deuda técnica crítica para hacer el proyecto mantenible y testeable.

**Architecture:** El proyecto usa Next.js 16 App Router + Prisma + TanStack Query. Las improvements se hacen siguiendo patrones existentes: splits de archivos grandes, hooks reutilizables, y componentes pequeños.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.6, Prisma 6, TanStack Query v5, Tailwind CSS v4, shadcn/ui, Framer Motion, Zod

---

## RESUMEN EJECUTIVO

| Phase | Priority | Work | Risk |
|-------|----------|------|------|
| 1 | CRITICAL | TypeScript fixes + split 5 files >1000 lines | Low |
| 2 | HIGH | /clients page + interaction features | Medium |
| 3 | HIGH | Email buttons UI (welcome, meeting invite) | Low |
| 4 | MEDIUM | Activity panel improvements | Medium |
| 5 | MEDIUM | Reclutamiento UI module | Low |
| 6 | LOW | Tests for API routes | Low |

---

## PHASE 1: CRITICAL TECHNICAL DEBT FIX

### Task 1.1: Split `calendar/page.tsx` (1,740 lines → 5 files)

**DEPENDS ON:** None
**NOTE:** Before starting, run `grep -n "^function\|^export function\|^const\|^export const" src/app/calendar/page.tsx` to identify component boundaries. The line ranges below are approximate guides based on file size - verify with actual grep.

**Files:**
- Create: `src/app/calendar/components/calendar-page.tsx` (main page wrapper)
- Create: `src/app/calendar/components/week-view.tsx` (WeekView component)
- Create: `src/app/calendar/components/agenda-view.tsx` (AgendaView component)
- Create: `src/app/calendar/components/event-dialog.tsx` (EventDialog)
- Create: `src/app/calendar/components/event-detail-drawer.tsx` (EventDetailDrawer)
- Modify: `src/app/calendar/page.tsx` (imports + thin wrapper)

- [ ] **Step 1: Create `src/app/calendar/components/week-view.tsx`**
  - Run: `grep -n "function WeekView\|export.*WeekView" src/app/calendar/page.tsx`
  - Extract WeekView + related hooks/state (likely lines 200-600)
  - Keep props interface clean: `{ events, onEventClick, currentDate }`

- [ ] **Step 2: Create `src/app/calendar/components/agenda-view.tsx`**
  - Run: `grep -n "function AgendaView\|export.*AgendaView" src/app/calendar/page.tsx`
  - Extract AgendaView (likely lines 601-900)

- [ ] **Step 3: Create `src/app/calendar/components/event-dialog.tsx`**
  - Run: `grep -n "function EventDialog\|export.*EventDialog" src/app/calendar/page.tsx`
  - Extract EventDialog (likely lines 901-1200)

- [ ] **Step 4: Create `src/app/calendar/components/event-detail-drawer.tsx`**
  - Run: `grep -n "function EventDetailDrawer\|export.*EventDetailDrawer" src/app/calendar/page.tsx`
  - Extract EventDetailDrawer (likely lines 1201-1500)

- [ ] **Step 5: Create `src/app/calendar/components/calendar-page.tsx`**
  - Main orchestrator: imports all sub-components
  - Handles data fetching with TanStack Query
  - State for view mode (week/month/agenda)
  - Remaining code (types, constants, helpers) goes here (likely lines 1-200 + 1501-1740)

- [ ] **Step 6: Replace `src/app/calendar/page.tsx` with thin wrapper**
  - Just exports default function that imports CalendarPage
  - `export default function CalendarPage() { return <CalendarPageClient /> }`

### Task 1.2: Split `teams/page.tsx` (1,730 lines → 4 files)

**DEPENDS ON:** Task 1.1 (see pattern for extraction)
**NOTE:** Run `grep -n "^function\|^export function\|^const\|^export const" src/app/teams/page.tsx` first to identify components.

**Files:**
- Create: `src/app/teams/components/teams-page.tsx`
- Create: `src/app/teams/components/team-detail-drawer.tsx`
- Create: `src/app/teams/components/create-team-dialog.tsx`
- Create: `src/app/teams/components/goal-card.tsx`
- Modify: `src/app/teams/page.tsx` (thin wrapper)

- [ ] **Step 1: Extract TeamDetailDrawer to `components/team-detail-drawer.tsx`**
  - Run: `grep -n "function TeamDetailDrawer\|export.*TeamDetailDrawer" src/app/teams/page.tsx`
  - Likely lines 300-800

- [ ] **Step 2: Extract CreateTeamDialog to `components/create-team-dialog.tsx`**
  - Run: `grep -n "function CreateTeamDialog\|export.*CreateTeamDialog" src/app/teams/page.tsx`
  - Likely lines 801-1100

- [ ] **Step 3: Extract GoalCard to `components/goal-card.tsx`**
  - Run: `grep -n "function GoalCard\|export.*GoalCard" src/app/teams/page.tsx`
  - Likely lines 1101-1300

- [ ] **Step 4: Create teams-page.tsx as orchestrator**
  - Remaining code + TanStack Query data fetching

- [ ] **Step 5: Replace teams/page.tsx with thin wrapper**

### Task 1.3: Split `settings/page.tsx` (1,649 lines → 5 files)

**DEPENDS ON:** Task 1.2
**NOTE:** Run `grep -n "function.*Tab\|export.*Tab\|case 'profile'\|case 'organization'" src/app/settings/page.tsx` first.

**Files:**
- Create: `src/app/settings/components/settings-page.tsx`
- Create: `src/app/settings/components/profile-tab.tsx`
- Create: `src/app/settings/components/organization-tab.tsx`
- Create: `src/app/settings/components/notifications-tab.tsx`
- Create: `src/app/settings/components/admin-tab.tsx`
- Modify: `src/app/settings/page.tsx`

- [ ] **Step 1: Extract profile-tab.tsx**
  - Run: `grep -n "profileTab\|case 'profile'" src/app/settings/page.tsx`
  - Likely lines 400-700

- [ ] **Step 2: Extract organization-tab.tsx**
  - Likely lines 701-1000

- [ ] **Step 3: Extract notifications-tab.tsx**
  - Likely lines 1001-1300

- [ ] **Step 4: Extract admin-tab.tsx**
  - Likely lines 1301-1600

- [ ] **Step 5: Create settings-page.tsx orchestrator**
  - Tab switching logic, shared state

- [ ] **Step 6: Replace settings/page.tsx with thin wrapper**

### Task 1.4: Split `tasks/page.tsx` (1,210 lines → 4 files)

**Files:**
- Create: `src/app/tasks/components/task-dialog.tsx`
- Create: `src/app/tasks/components/task-card.tsx`
- Create: `src/app/tasks/components/task-group.tsx`
- Create: `src/app/tasks/components/tasks-page.tsx`
- Modify: `src/app/tasks/page.tsx`

- [ ] **Step 1: Extract TaskDialog, TaskCard, TaskGroup**
- [ ] **Step 2: Create tasks-page.tsx orchestrator**
- [ ] **Step 3: Replace tasks/page.tsx**

### Task 1.5: Split `contact-drawer.tsx` (1,067 lines → 3 files)

**DEPENDS ON:** Task 1.4
**NOTE:** After this task, `contact-drawer.tsx` becomes a thin wrapper that imports `contact-drawer-wrapper.tsx`. Task 3.1 (email button) will modify `contact-drawer-wrapper.tsx`, NOT the original file.

**Files:**
- Create: `src/app/contacts/components/contact-detail-tabs.tsx`
- Create: `src/app/contacts/components/contact-info-section.tsx`
- Create: `src/app/contacts/components/contact-drawer-wrapper.tsx`
- Modify: `src/app/contacts/components/contact-drawer.tsx` (becomes thin wrapper)

- [ ] **Step 1: Extract tabs (Details, Financial, Notes, Activity) to `contact-detail-tabs.tsx`**
  - Run: `grep -n "function.*Tab\|export.*Tab" src/app/contacts/components/contact-drawer.tsx`

- [ ] **Step 2: Extract contact info section to `contact-info-section.tsx`**
  - Header area with avatar, name, company

- [ ] **Step 3: Create `contact-drawer-wrapper.tsx` with full logic**
  - This is the file Task 3.1 will modify for email button
  - Keep clean props interface

- [ ] **Step 4: Replace `contact-drawer.tsx` with thin wrapper**
  - Just imports and re-exports from wrapper

### Task 1.6: Replace `any` with proper types + split dashboard

**Critical files:**
- `src/app/dashboard/dashboard-content.tsx` (10+ any, 730 lines)
- `src/app/contacts/components/PlanningDialogContext.tsx` (8+ any)

**NOTE:** dashboard-content.tsx is 730 lines - while under 800 threshold, it has 10+ `any` casts making it a priority. Split it if it grows during type fixes, otherwise just fix types.

- [ ] **Step 1: Fix dashboard-content.tsx types**
  - Create types for KPI data, task data, goal data
  - Replace all `as any` with proper types
  - If after fixing types file exceeds 800 lines, split using same pattern as Tasks 1.1-1.5

- [ ] **Step 2: Fix PlanningDialogContext.tsx**
  - Create `PlanningContact`, `PlanningGoal` types
  - Add proper generic types to context

### Task 1.7: Fix TypeScript errors in zodResolver casts

**Files to fix:**
- `src/app/contacts/components/contact-drawer.tsx:223`
- `src/app/calendar/page.tsx:403`
- `src/app/tasks/page.tsx:515`
- `src/app/teams/page.tsx:413,418`

- [ ] **Step 1: Create proper schema types and use correct resolver typing**
  - The issue is `zodResolver(schema) as any` - should use proper generic typing

---

## PHASE 2: /CLIENTS PAGE + INTERACTION FEATURES

### Task 2.1: Create `/clients` route (new page)

**Files:**
- Create: `src/app/clients/page.tsx`
- Create: `src/app/clients/components/clients-page.tsx` (main component)
- Create: `src/app/clients/components/client-table.tsx`
- Create: `src/app/clients/components/client-filters.tsx`
- Create: `src/app/clients/components/client-stats.tsx`
- Create: `src/app/clients/components/client-detail-drawer.tsx`
- Create: `src/app/clients/loading.tsx`
- Modify: `src/app/clients/` (add to sidebar navigation)

- [ ] **Step 1: Create directory structure**
  - `mkdir -p src/app/clients/components`

- [ ] **Step 2: Create client types in `src/types/client.ts`**
  ```typescript
  interface Client {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    segment: string | null;
    source: string | null;
    assignedTo: { id: string; name: string } | null;
    lastInteractionDate: Date | null;
    interactionCount: number;
    isLandsClient: boolean;
    createdAt: Date;
  }
  ```

- [ ] **Step 3: Create clients-page.tsx with data fetching**
  - Use TanStack Query like contacts/page.tsx
  - Fetch from `/api/contacts` with interaction count

- [ ] **Step 4: Create client-table.tsx with gradient coloring**
  - Column for last interaction with color gradient
  - Badge "Lands" for source === "Lands Broker"

- [ ] **Step 5: Create client-filters.tsx**
  - Filter by segment, assignedTo, date range

- [ ] **Step 6: Create client-stats.tsx**
  - Total clients, avg interactions, overdue contacts

- [ ] **Step 7: Create client-detail-drawer.tsx**
  - Similar to contact-drawer but for clients view

- [ ] **Step 8: Add to sidebar navigation**
  - Modify `src/components/layout/app-sidebar.tsx`
  - Add `/clients` entry in PRINCIPAL section (or appropriate)
  - Use existing nav item pattern from sidebar

### Task 2.2: Add interaction counter to Contact model

**DEPENDS ON:** Task 2.1 (API must exist first)
**VERIFIED:** The `Interaction` model EXISTS in Prisma schema (lines 1028-1043) with `contactId` and `userId` relations. Task 2.1's `/clients` page can use this directly.

**Files:**
- Modify: `src/app/api/contacts/route.ts` (GET)
- Modify: `src/app/contacts/components/contact-table.tsx`

- [ ] **Step 1: Modify GET /api/contacts to include interaction count**
  - Add `include: { _count: { select: { interactions: true } } }` in Prisma query
  - Return `interactionCount` in response

- [ ] **Step 2: Display interaction count in contact-table.tsx**
  - Add column or badge showing count

### Task 2.3: Add gradient color for last interaction

**Files:**
- Create: `src/lib/interaction-gradient.ts`
- Modify: `src/app/clients/components/client-table.tsx`

- [ ] **Step 1: Create `src/lib/interaction-gradient.ts`**
  ```typescript
  export function getInteractionGradient(lastInteractionDate: Date | null): {
    color: string;
    label: string;
    urgency: 'high' | 'medium' | 'low';
  } {
    if (!lastInteractionDate) return { color: 'text-red-500', label: 'Sin contacto', urgency: 'high' };
    const days = differenceInDays(new Date(), lastInteractionDate);
    if (days <= 7) return { color: 'text-green-500', label: 'Reciente', urgency: 'low' };
    if (days <= 30) return { color: 'text-yellow-500', label: 'Regular', urgency: 'medium' };
    return { color: 'text-red-500', label: 'Atención', urgency: 'high' };
  }
  ```

- [ ] **Step 2: Apply gradient in client-table.tsx**
  - Use badge/background color based on gradient

### Task 2.4: Add "Cliente Lands" label

**Files:**
- Modify: `src/app/clients/components/client-table.tsx`
- Modify: `src/app/contacts/components/contact-table.tsx` (optional)

- [ ] **Step 1: Add Lands badge when source === "Lands Broker"**
  ```tsx
  {client.source === 'Lands Broker' && (
    <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
      Lands
    </Badge>
  )}
  ```

---

## PHASE 3: EMAIL BUTTONS UI

### Task 3.1: Add "Send Welcome Email" button to contact-drawer

**Files:**
- Modify: `src/app/contacts/components/contact-drawer.tsx`
- Modify: `src/hooks/use-email.ts` (verify hook exists)

- [ ] **Step 1: Import useSendEmail hook in contact-drawer.tsx**
- [ ] **Step 2: Add button in contact header/actions area**
  ```tsx
  <Button
    variant="outline"
    size="sm"
    onClick={() => sendWelcomeEmail({ contactId: contact.id })}
    disabled={!contact.email || isSending}
  >
    <Mail className="h-4 w-4 mr-2" />
    Enviar Bienvenida
  </Button>
  ```

- [ ] **Step 3: Add mutation call with toast feedback**
  ```tsx
  const { mutate: sendWelcome, isPending } = useSendEmail();
  // onClick: sendWelcome({ contactId, userId: session.user.id })
  ```

### Task 3.2: Add "Send Meeting Invitation" button to calendar event detail

**DEPENDS ON:** Task 1.1 (must complete first - event-detail-drawer.tsx must exist)
**NOTE:** This modifies `src/app/calendar/components/event-detail-drawer.tsx` which is created in Task 1.1 Step 4. Do NOT begin until Task 1.1 is complete.

**Files:**
- Modify: `src/app/calendar/components/event-detail-drawer.tsx`
- Verify: `src/hooks/use-email.ts` has `sendMeetingInvitation`

- [ ] **Step 1: Add button in event detail view when event has client**
- [ ] **Step 2: Modal to select client email before sending**
- [ ] **Step 3: Handle success/error with toast**

### Task 3.3: Create reusable email button component

**Files:**
- Create: `src/components/ui/email-action-button.tsx`

- [ ] **Step 1: Create component with loading/success/error states**
  ```tsx
  interface EmailActionButtonProps {
    onClick: () => void;
    isLoading: boolean;
    isSuccess: boolean;
    label: string;
    icon: LucideIcon;
  }
  ```

---

## PHASE 4: ACTIVITY PANEL IMPROVEMENTS

### Task 4.1: Fix activity panel to show per-user metrics

**APPROACH:** Create NEW endpoint to avoid breaking existing component. The existing `/api/dashboard/activity` keeps backward-compatible, new `/api/dashboard/activity/by-user` provides per-user breakdown.

**Files:**
- Create: `src/app/api/dashboard/activity/by-user/route.ts` (NEW - non-breaking)
- Create: `src/app/reports/components/user-activity-panel.tsx`
- Modify: `src/app/reports/page.tsx` (add user selector + new panel)

- [ ] **Step 1: Create new `/api/dashboard/activity/by-user` endpoint**
  - Query param: `?userId=xxx` (required)
  - Returns per-user activity breakdown: `{ contactsCreated, tasksCompleted, meetings, byType }`
  - If no userId provided, return 400 error (explicit is better than implicit)

- [ ] **Step 2: Create `user-activity-panel.tsx` component**
  - User selector dropdown (Manager/Admin sees all users)
  - Shows: meetings count, tasks completed, contact interactions
  - Uses new `/by-user` endpoint

- [ ] **Step 3: Add to reports/page.tsx**
  - Add tab or section for user activity
  - Keep existing activity-overview.tsx unchanged

### Task 4.2: Add interaction type breakdown to activity

**Files:**
- Modify: `src/app/api/dashboard/activity/route.ts`

- [ ] **Step 1: Return breakdown by interaction type**
  ```json
  {
    "interactions": {
      "total": 45,
      "byType": {
        "call": 10,
        "email": 15,
        "meeting": 12,
        "note": 8
      }
    }
  }
  ```

---

## PHASE 5: RECLUTAMIENTO MODULE

### Task 5.1: Create `/reclutamiento` page

**Files:**
- Create: `src/app/reclutamiento/page.tsx`
- Create: `src/app/reclutamiento/components/reclutamiento-page.tsx`
- Create: `src/app/reclutamiento/components/startup-100-wizard.tsx`
- Create: `src/app/reclutamiento/loading.tsx`
- Modify: `src/components/layout/app-sidebar.tsx` (add nav item)

- [ ] **Step 1: Create page structure**
  - Similar pattern to /contacts

- [ ] **Step 2: Create wizard for Startup 100 process**
  - Step 1: Download template
  - Step 2: Fill Excel
  - Step 3: Upload/import
  - Step 4: Preview & confirm

- [ ] **Step 3: Integrate existing `/api/teams/template/startup-100`**
  - Add download button

- [ ] **Step 4: Integrate `/api/contacts/import`**
  - Reuse import flow from contacts

- [ ] **Step 5: Add to sidebar with proper icon**
  - Modify `src/components/layout/app-sidebar.tsx`
  - Add `/reclutamiento` entry in SISTEMA section
  - Use existing nav item pattern

---

## PHASE 6: TESTING

### Task 6.0: Setup test infrastructure

**DO THIS FIRST before any test tasks.** Without this, tests cannot run.

**Files:**
- Create: `tests/setup.ts` (Vitest global setup)
- Create: `tests/mocks/prisma.ts` (Prisma mock)
- Create: `tests/mocks/auth.ts` (auth session mock)
- Modify: `vitest.config.ts` or `vite.config.ts` (add test config)

- [ ] **Step 1: Check existing vitest config**
  - Run: `ls -la vitest.config.* vite.config.* tsconfig.* 2>/dev/null`
  - If vitest.config.ts exists, read it

- [ ] **Step 2: Create `tests/mocks/prisma.ts`**
  - Mock all Prisma model operations
  - Use `vi.mock('@/lib/db')` pattern

- [ ] **Step 3: Create `tests/mocks/auth.ts`**
  - Mock `getServerSession` and auth helpers
  - Return mock user with configurable role

- [ ] **Step 4: Create `tests/setup.ts`**
  - Global test setup
  - Database cleanup between tests

### Task 6.1: Add unit tests for API routes (critical routes first)

**DEPENDS ON:** Task 6.0 (must complete first)

**Files:**
- Create: `src/app/api/contacts/__tests__/route.test.ts`
- Create: `src/app/api/tasks/__tests__/route.test.ts`
- Create: `src/app/api/production/__tests__/route.test.ts`

**Testing approach:** Use Vitest + mock Prisma + mock auth session

- [ ] **Step 1: Test contacts CRUD**
  - GET /api/contacts - auth, pagination, filters
  - POST /api/contacts - validation, creation
  - GET /api/contacts/[id] - ownership
  - PUT /api/contacts/[id] - update
  - DELETE /api/contacts/[id] - soft/hard delete

- [ ] **Step 2: Test tasks CRUD**
  - Similar pattern to contacts

- [ ] **Step 3: Test production**
  - CRUD + hierarchical access (manager sees team)

### Task 6.2: Add integration tests for critical flows

**Files:**
- Create: `tests/integration/welcome-email.test.ts`
- Create: `tests/integration/meeting-invitation.test.ts`

- [ ] **Step 1: Test welcome email flow**
  - Create contact → send welcome → verify email sent

- [ ] **Step 2: Test meeting invitation flow**
  - Create calendar event → add client → send invitation

---

## FILE INVENTORY

### New Files to Create (Phase 1-5)
```
src/app/calendar/components/
├── week-view.tsx
├── agenda-view.tsx
├── event-dialog.tsx
├── event-detail-drawer.tsx
└── calendar-page.tsx

src/app/teams/components/
├── team-detail-drawer.tsx
├── create-team-dialog.tsx
├── goal-card.tsx
└── teams-page.tsx

src/app/settings/components/
├── profile-tab.tsx
├── organization-tab.tsx
├── notifications-tab.tsx
├── admin-tab.tsx
└── settings-page.tsx

src/app/tasks/components/
├── task-dialog.tsx
├── task-card.tsx
├── task-group.tsx
└── tasks-page.tsx

src/app/contacts/components/
├── contact-detail-tabs.tsx
├── contact-info-section.tsx
└── contact-drawer-wrapper.tsx

src/app/clients/
├── page.tsx
├── loading.tsx
└── components/
    ├── clients-page.tsx
    ├── client-table.tsx
    ├── client-filters.tsx
    ├── client-stats.tsx
    └── client-detail-drawer.tsx

src/app/reclutamiento/
├── page.tsx
├── loading.tsx
└── components/
    ├── reclutamiento-page.tsx
    └── startup-100-wizard.tsx

src/app/reports/components/
└── user-activity-panel.tsx

src/components/ui/
└── email-action-button.tsx

src/lib/
└── interaction-gradient.ts

src/types/
└── client.ts

src/app/api/contacts/__tests__/
└── route.test.ts

src/app/api/tasks/__tests__/
└── route.test.ts

src/app/api/production/__tests__/
└── route.test.ts

tests/integration/
├── welcome-email.test.ts
└── meeting-invitation.test.ts
```

### Files to Modify
```
src/app/calendar/page.tsx (thin wrapper)
src/app/teams/page.tsx (thin wrapper)
src/app/settings/page.tsx (thin wrapper)
src/app/tasks/page.tsx (thin wrapper)
src/app/contacts/components/contact-drawer.tsx (thin wrapper, becomes wrapper for drawer-wrapper)
src/app/contacts/components/contact-drawer-wrapper.tsx (email button added in Task 3.1)
src/app/clients/page.tsx (new page, add to sidebar in Task 2.1)
src/components/layout/app-sidebar.tsx (add /clients in Task 2.1, add /reclutamiento in Task 5.1)
src/app/api/contacts/route.ts (add interaction count in Task 2.2)
src/app/api/dashboard/activity/by-user/route.ts (NEW - Task 4.1)
src/app/reports/page.tsx (add user activity panel in Task 4.1)
src/app/dashboard/dashboard-content.tsx (fix any types in Task 1.6)
src/app/contacts/components/PlanningDialogContext.tsx (fix any types in Task 1.6)
```

---

## EXECUTION ORDER

### Recommended Implementation Order

1. **Phase 1 (Technical Debt)** - Do first, enables safer changes
   - 1.1 → 1.2 → 1.3 → 1.4 → 1.5 (split files - IN ORDER)
   - 1.6 → 1.7 (type fixes)

2. **Phase 2 (Clients Page)** - High visibility feature
   - 2.1 → 2.2 → 2.3 → 2.4

3. **Phase 3 (Email Buttons)** - Quick wins
   - 3.1 (depends on 1.5 completing)
   - 3.2 (depends on 1.1 completing)
   - 3.3 (can run in parallel with 3.1/3.2)

4. **Phase 4 (Activity Panel)** - Fix existing
   - 4.1 → 4.2 (can run in parallel with Phase 3)

5. **Phase 5 (Reclutamiento)** - New module
   - 5.1 (depends on Phase 1 completing)

6. **Phase 6 (Testing)** - Long term health
   - 6.0 (must run first)
   - 6.1 → 6.2

### Parallelization Notes
- Phase 1 tasks MUST run sequentially (1.1 → 1.2 → 1.3 → 1.4 → 1.5)
- Within Phase 1: Steps within each task can be parallelized
- Phase 2, 3, 4, 5 can run in parallel AFTER Phase 1
- Phase 6.0 must complete before 6.1/6.2

---

## ROLLBACK PLAN

If any phase causes issues:
1. Keep original file as `.backup` before modification
2. Each task commits independently
3. If breaking: `git checkout HEAD~1 -- affected-file.ts`

---

## VALIDATION CHECKLIST

After each task:
- [ ] `bun run lint` passes
- [ ] `bun run build` succeeds (or errors are pre-existing)
- [ ] Manual smoke test of the feature

After Phase 1:
- [ ] No file in `src/app/` exceeds 800 lines
- [ ] Zero `any` casts in dashboard-content.tsx and PlanningDialogContext.tsx

After Phase 2:
- [ ] `/clients` page loads with sample data
- [ ] Gradient colors display correctly
- [ ] "Lands" badge shows for correct clients

After Phase 3:
- [ ] "Enviar Bienvenida" button visible in contact drawer
- [ ] Email actually sends (check logs or inbox)

After Phase 4:
- [ ] Activity panel shows per-user breakdown
- [ ] Meeting count visible per client

After Phase 5:
- [ ] `/reclutamiento` accessible from sidebar
- [ ] Can download Startup 100 template
- [ ] Can import contacts from Excel
