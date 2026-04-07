# Admin User Management Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Admin tab in /settings into a full user management panel where admin/owner/developer roles can view and manage all app users, their roles, teams, and permissions.

**Architecture:** The Admin tab currently only shows role change requests. We will expand it into a tabbed panel with 4 sub-sections: (1) Users List, (2) Role Requests, (3) Teams Overview, (4) Activity Logs. New API endpoints will be created for user activation/deactivation, manager assignment, and team membership management.

**Tech Stack:** Next.js 15 App Router, TanStack Query v5, Prisma ORM, shadcn/ui components.

**CRITICAL patterns to follow:**
- Use `db` from `@/lib/db` (NOT `prisma` from `@/lib/prisma`)
- Use `getUserFromSession` from `@/lib/auth-helpers` (NOT `getServerSession(auth)`)
- The `getUserFromSession` helper already normalizes the role — do NOT call `normalizeRole()` again
- The `users:manage` permission already covers activation/deactivation — do NOT add a separate `users:activate` permission

---

## File Map

### New Files to Create

| File | Responsibility |
|------|---------------|
| `src/app/api/admin/users/route.ts` | GET all org users (paginated, filterable); POST invite user directly to org |
| `src/app/api/admin/users/[id]/route.ts` | GET single user full details; PUT update user fields; DELETE user |
| `src/app/api/admin/users/[id]/activate/route.ts` | PUT toggle `isActive` (block last owner) |
| `src/app/api/admin/users/[id]/manager/route.ts` | PUT assign/change `managerId` |
| `src/app/api/admin/teams/route.ts` | GET all teams with member counts and leader info |
| `src/app/api/admin/teams/[id]/members/route.ts` | GET team members; POST add member; DELETE remove member |
| `src/app/api/admin/audit-logs/route.ts` | GET recent audit logs for the org |
| `src/components/admin/user-management-table.tsx` | User table with search, filter, sort, pagination |
| `src/components/admin/user-detail-drawer.tsx` | Slide-over drawer with full user details + edit actions |
| `src/app/settings/components/admin-panel.tsx` | Container component with 4 tabs |

### Existing Files to Modify

| File | Change |
|------|--------|
| `src/app/settings/page.tsx:1361-1459` | Replace inline Admin TabsContent with `<AdminPanel />` |
| `src/lib/auth-helpers-client.ts` | Add `canViewAuditLogs(role)`; fix `canViewAllContacts` and `canDeleteContacts` |
| `src/types/auth.ts` | Add `UserWithTeams` and `AuditLog` types |

---

## Task Decomposition

### Phase 1: API Endpoints

#### Task 1: Admin API routes
**Files:**
- Create: `src/app/api/admin/users/route.ts`
- Create: `src/app/api/admin/users/[id]/route.ts`
- Create: `src/app/api/admin/users/[id]/activate/route.ts`
- Create: `src/app/api/admin/users/[id]/manager/route.ts`
- Create: `src/app/api/admin/teams/route.ts`
- Create: `src/app/api/admin/teams/[id]/members/route.ts`
- Create: `src/app/api/admin/audit-logs/route.ts`

- [ ] **Step 1: Create GET+POST `/api/admin/users`**

Create `src/app/api/admin/users/route.ts`. Follow the exact same pattern as `src/app/api/organizations/[id]/members/route.ts` for auth (`getUserFromSession`) and db (`db`).

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth-helpers';
import { hasPermission } from '@/lib/permissions';
import { db } from '@/lib/db';  // ← CORRECT import

export async function GET(req: NextRequest) {
  const currentUser = await getUserFromSession(req);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(currentUser.role, 'users:manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || '';
  const isActive = searchParams.get('isActive');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const where: Record<string, unknown> = {
    members: { some: { organizationId: currentUser.organizationId } },
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(role && { role }),
    ...(isActive !== null && isActive !== undefined && { isActive: isActive === 'true' }),
  };

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, name: true, email: true, image: true, role: true,
        isActive: true, careerLevel: true, phone: true, createdAt: true,
        managerId: true,
        manager: { select: { id: true, name: true, email: true } },
        members: {
          where: { organizationId: currentUser.organizationId },
          select: { role: true, organizationId: true },
        },
        teamMembers: {
          include: { team: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, limit });
}

export async function POST(req: NextRequest) {
  // Admin invite/create user directly in the organization
  const currentUser = await getUserFromSession(req);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(currentUser.role, 'users:manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { email, name, role, organizationRole } = await req.json();

  // Re-use the exact same pattern from /api/organizations/[id]/members/route.ts POST
  // Find or create user by email, then add Member record
  // See src/app/api/organizations/[id]/members/route.ts lines 52-143 for full pattern
  ...
}
```

- [ ] **Step 2: Create GET+PUT+DELETE `/api/admin/users/[id]`**

Create `src/app/api/admin/users/[id]/route.ts`:
- GET: Return full user details (same select as the list endpoint, but single user)
- PUT: Update `role` (validate against whitelist: `admin`, `manager`, `advisor`, `staff`, `member` — block `owner` and `developer`), `careerLevel`, `phone`, `isActive`. Use same pattern as `src/app/api/users/[id]/role/route.ts`
- DELETE: Soft-delete or hard-delete user. Remove all Member and TeamMember records. Block deleting the last owner. Return `{ success: true }` or error.

- [ ] **Step 3: Create PUT `/api/admin/users/[id]/activate`**

Create `src/app/api/admin/users/[id]/activate/route.ts`:
- PUT: Toggle `isActive`. Block deactivating the last user with `owner` role in the org.
- Uses `db.user.update({ where: { id }, data: { isActive } })`

- [ ] **Step 4: Create PUT `/api/admin/users/[id]/manager`**

Create `src/app/api/admin/users/[id]/manager/route.ts`:
- PUT: Set `managerId` to new value (or null to remove). Validate that the target manager exists and has `canBeManager` permission. Prevent circular manager assignments.

- [ ] **Step 5: Create GET `/api/admin/teams`**

Create `src/app/api/admin/teams/route.ts`:
- List all teams in `currentUser.organizationId` with leader info and member count.
- Include full team member list with user roles.

- [ ] **Step 6: Create GET+POST+DELETE `/api/admin/teams/[id]/members`**

Create `src/app/api/admin/teams/[id]/members/route.ts`:
- GET: List all members of a specific team with their roles.
- POST: Add a user to the team. Validate user exists and is a member of the org.
- DELETE: Remove a user from the team. Block removing the team leader.
- All actions require `users:manage` permission.

- [ ] **Step 7: Create GET `/api/admin/audit-logs`**

Create `src/app/api/admin/audit-logs/route.ts`:
- List audit logs for `currentUser.organizationId`, most recent first.
- Include user info for who performed the action.
- Return: `{ auditLogs: AuditLog[], total }`

#### Task 2: Client-side permission helpers
**Files:**
- Modify: `src/lib/auth-helpers-client.ts`

- [ ] **Step 1: Add `canViewAuditLogs` helper**

```ts
export function canViewAuditLogs(role: string): boolean {
  return ['admin', 'owner', 'developer'].includes(role);
}
```

- [ ] **Step 2: Fix `canViewAllContacts` and `canDeleteContacts`**

Replace the current implementations to match server (exclude manager):
```ts
export function canViewAllContacts(role: string): boolean {
  return ['admin', 'owner', 'developer'].includes(role);
}

export function canDeleteContacts(role: string): boolean {
  return ['admin', 'owner', 'developer'].includes(role);
}
```

---

### Phase 2: UI Components

#### Task 3: User Management Table Component
**Files:**
- Create: `src/components/admin/user-management-table.tsx`

- [ ] **Step 1: Create UserManagementTable component**

A full data table with:
- Search input (debounced 300ms, filters by name/email via `?search=`)
- Role filter dropdown (All, Admin, Owner, Manager, Advisor, Staff, Member — via `?role=`)
- Status filter (Active, Inactive — via `?isActive=true|false`)
- Sortable columns: Name, Email, Role, Status, Created At
- Pagination (page, limit controls)
- Row click → opens UserDetailDrawer
- Each row: avatar, name, email, system role badge, org role badge (from `members[0].role`), active/inactive badge, manager name, team count, created date
- Bulk select checkboxes + bulk actions dropdown (Deactivate Selected, Change Role)

```tsx
interface UserManagementTableProps {
  onUserSelect: (user: UserWithTeams) => void;
}
```

Use TanStack Query `useQuery` to fetch from `/api/admin/users` with proper params.

#### Task 4: User Detail Drawer Component
**Files:**
- Create: `src/components/admin/user-detail-drawer.tsx`

- [ ] **Step 1: Create UserDetailDrawer component**

A slide-over drawer (Sheet from shadcn/ui) from the right:
- Header: avatar, name, email, created date
- Status toggle: "Activo" / "Inactivo" — calls PUT `/api/admin/users/[id]/activate`
- Editable fields (all via PUT `/api/admin/users/[id]`):
  - Rol del sistema (select)
  - Nivel de carrera (select: junior, mid, senior, lead)
  - Teléfono (input)
  - Manager (select with search — fetches from `/api/auth/managers`)
- Team memberships list: team name, role badge, joined date — with remove button (DELETE `/api/admin/teams/[id]/members/[memberId]`)
- Danger zone:
  - "Eliminar usuario" button → DELETE `/api/admin/users/[id]` → confirm alert
- "Guardar cambios" button → PUT `/api/admin/users/[id]`

#### Task 5: Admin Panel Container
**Files:**
- Create: `src/app/settings/components/admin-panel.tsx`

- [ ] **Step 1: Create AdminPanel with 4 tabs**

Tabs: **Usuarios**, **Solicitudes de Rol**, **Equipos**, **Registro de Actividad**

- **Usuarios**: `<UserManagementTable onUserSelect={...} />` + `<UserDetailDrawer />`
- **Solicitudes de Rol**: Refactor the existing inline code from `settings/page.tsx:1367-1457` into this component. Uses `useQuery(['roleRequests'])` + `useMutation` for approve/reject. Fetch from `/api/role-requests?organizationId=...&status=pending`.
- **Equipos**: Fetch from `/api/admin/teams`. Display cards per team with:
  - Team name + leader + member count
  - Expand to show member list with roles
  - Inline "Añadir miembro" button → POST `/api/admin/teams/[id]/members`
  - Inline remove member button → DELETE `/api/admin/teams/[id]/members/[memberId]`
- **Registro de Actividad**: Fetch from `/api/admin/audit-logs`. Display as a timeline list:
  - User avatar + name, action description, entity type, timestamp
  - Empty state when no logs

#### Task 6: Integrate AdminPanel into Settings Page
**Files:**
- Modify: `src/app/settings/page.tsx:1361-1459`

- [ ] **Step 1: Replace Admin TabsContent with AdminPanel component**

Replace the inline Admin TabsContent (lines 1364-1459) with:
```tsx
<TabsContent value="admin">
  <AdminPanel />
</TabsContent>
```

The TabsTrigger access control already exists at line 653: `{user && canManageUsers(user.role) && (<TabsTrigger value="admin">...)}`.

---

### Phase 3: Polish & Verification

#### Task 7: Type definitions
**Files:**
- Modify: `src/types/auth.ts`

- [ ] **Step 1: Add `UserWithTeams` and `AuditLog` types**

```ts
export interface UserWithTeams extends AuthUser {
  manager: Pick<AuthUser, 'id' | 'name' | 'email'> | null;
  members: { role: string; organizationId: string }[];
  teamMembers: { team: { id: string; name: string }; role: string; joinedAt: Date }[];
  isActive: boolean;
  careerLevel: string | null;
  phone: string | null;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  user: { id: string; name: string; email: string };
  createdAt: string;
  metadata?: Record<string, unknown>;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
}
```

#### Task 8: Build and test
**Files:**
- Run: `bun run build`

- [ ] **Step 1: Run build and fix any TypeScript errors**

- [ ] **Step 2: Test locally** — navigate to /settings → Admin tab:
  1. Users table loads and displays all org users ✓
  2. Search by name/email works ✓
  3. Role filter works ✓
  4. Status filter works ✓
  5. Clicking a user opens the detail drawer ✓
  6. Toggling active/inactive works (PUT /api/admin/users/[id]/activate) ✓
  7. Changing role and saving works (PUT /api/admin/users/[id]) ✓
  8. Changing manager works (PUT /api/admin/users/[id]/manager) ✓
  9. Removing a user from a team works (DELETE /api/admin/teams/[id]/members/[memberId]) ✓
  10. Teams tab shows all teams with member counts ✓
  11. Audit logs tab shows recent activity ✓
  12. Non-admin users cannot see the Admin tab ✓
  13. Role request approve/reject still works ✓
  14. Delete user works ✓

- [ ] **Step 3: Deploy to Vercel**

---

## Dependency Graph

```
Task 1 ───────────────────────────────────────────┐
  ↓ API routes (users + teams + audit-logs)        │
Task 2 ───────────────────────────────────────────┤
  ↓ Client helpers (fix permissions)               │
Task 3 ─────────────┐                            │
  ↓ User table        │                           │
Task 4 ─────────────┼─── Task 5 ─────────────────┤
  ↓ User drawer       │     ↓ AdminPanel           │
Task 6 ─────────────┴────────────────────────────┤
  ↓ Integrate into settings                         │
Task 7 ───────────────────────────────────────────┤
  ↓ Add types                                       │
Task 8 ───────────────────────────────────────────┘
  ↓ Build + test + deploy
```

Tasks 3 and 4 run in parallel (different files).
Task 5 depends on 3+4.
Task 6 depends on 5.
Tasks 7+8 run after everything else.

---

## Rollback Plan

If a task breaks the build:
1. `git stash` to save in-progress work
2. Run `bun run build` to confirm baseline works
3. `git stash pop` to restore
4. Fix the specific broken file before continuing

If a task breaks production:
1. Revert the specific commit for that task
2. Investigate the issue
3. Re-implement with the fix
