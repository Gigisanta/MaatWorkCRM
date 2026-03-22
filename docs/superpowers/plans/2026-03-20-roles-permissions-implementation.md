# Sistema de Permisos Granulares - Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement granular role-based permissions with 3-layer auth architecture (proxy.ts, API guards, UI)

**Architecture:** JWT-based auth with proxy.ts for session verification and headers injection. API routes verify granular permissions using the new permissions system. UI conditionally renders based on permissions.

**Tech Stack:** Next.js 16 (proxy.ts), TypeScript, Jose for JWT, existing Prisma/DB setup

---

## Chunk 1: Core Permissions System

### Files
- Create: `src/lib/permissions.ts`
- Modify: `src/lib/auth-helpers.ts` (add imports and compatibility)

### Tasks

- [ ] **Step 1: Create `src/lib/permissions.ts` with all permission types and role mappings**

```typescript
// src/lib/permissions.ts

export type Permission =
  | 'contacts:read:own'
  | 'contacts:read:team'
  | 'contacts:read:all'
  | 'contacts:create'
  | 'contacts:update:own'
  | 'contacts:update:team'
  | 'contacts:update:all'
  | 'contacts:delete:own'
  | 'contacts:delete:team'
  | 'contacts:delete:all'
  | 'team:view'
  | 'users:manage'
  | 'settings:view'
  | 'settings:manage';

export type Role = 'admin' | 'developer' | 'owner' | 'manager' | 'advisor' | 'staff' | 'member';

export const ROLE_ALIASES: Record<string, Role> = {
  dueno: 'owner',
  asesor: 'advisor',
};

export function normalizeRole(role: string): Role {
  return ROLE_ALIASES[role] ?? (role as Role);
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'contacts:read:all', 'contacts:create', 'contacts:update:all', 'contacts:delete:all',
    'team:view', 'users:manage', 'settings:view', 'settings:manage',
  ],
  developer: [
    'contacts:read:all', 'contacts:create', 'contacts:update:all', 'contacts:delete:all',
    'team:view', 'users:manage', 'settings:view', 'settings:manage',
  ],
  owner: [
    'contacts:read:all', 'contacts:create', 'contacts:update:all', 'contacts:delete:all',
    'team:view', 'users:manage', 'settings:view', 'settings:manage',
  ],
  manager: [
    'contacts:read:own', 'contacts:read:team', 'contacts:create',
    'contacts:update:own', 'contacts:update:team',
    'contacts:delete:own', 'contacts:delete:team',
    'team:view',
  ],
  staff: [
    'contacts:read:all', 'contacts:create', 'contacts:update:all', 'contacts:delete:all',
  ],
  advisor: [
    'contacts:read:own', 'contacts:create', 'contacts:update:own',
  ],
  member: [
    'contacts:read:own', 'contacts:create', 'contacts:update:own',
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const normalizedRole = normalizeRole(role);
  return ROLE_PERMISSIONS[normalizedRole]?.includes(permission) ?? false;
}

export function canBeManager(role: string): boolean {
  const normalizedRole = normalizeRole(role);
  return ['manager', 'owner', 'admin', 'developer'].includes(normalizedRole);
}
```

- [ ] **Step 2: Update `src/lib/auth-helpers.ts` to add imports and compatibility**

Add at the top:
```typescript
import { hasPermission as newHasPermission, canBeManager as newCanBeManager, normalizeRole, type Permission } from './permissions';
```

Update existing functions to use new helpers (for backward compatibility):
```typescript
export { normalizeRole, hasPermission, canBeManager, ROLE_PERMISSIONS, ROLE_ALIASES, type Permission, type Role } from './permissions';
```

---

## Chunk 2: Middleware (proxy.ts)

### Files
- Create: `proxy.ts` (project root)

### Tasks

- [ ] **Step 1: Create `proxy.ts` at project root**

```typescript
// proxy.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'development-secret-change-in-production');

export async function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value;
  const url = new URL(request.url);

  // Public routes - skip auth
  if (url.pathname.startsWith('/login') || url.pathname.startsWith('/register')) {
    return NextResponse.next();
  }

  if (!sessionToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.userId as string);
    response.headers.set('x-user-role', payload.role as string);
    response.headers.set('x-user-manager-id', (payload.managerId as string) || '');
    return response;
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

- [ ] **Step 2: Verify Next.js version in package.json**

Run: `cat package.json | grep '"next"'`
Expected: version 16.x.x (for proxy.ts support)

---

## Chunk 3: Contacts API Routes - Permission Guards

### Files
- Modify: `src/app/api/contacts/route.ts`
- Modify: `src/app/api/contacts/[id]/route.ts`
- Modify: `src/app/api/contacts/[id]/tags/route.ts`

### Tasks

- [ ] **Step 1: Update `src/app/api/contacts/route.ts` - GET handler**

Find current GET handler and add permission-based filtering:

```typescript
// GET /api/contacts
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const userRole = normalizeRole(request.headers.get('x-user-role') as string);
  const managerId = request.headers.get('x-user-manager-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Admin/Staff/Owner/Developer see all contacts
  if (hasPermission(userRole, 'contacts:read:all')) {
    const contacts = await db.contact.findMany({
      where: { organizationId: user.organizationId },
    });
    return NextResponse.json(contacts);
  }

  // Manager sees team + own contacts
  if (hasPermission(userRole, 'contacts:read:team')) {
    const contacts = await db.contact.findMany({
      where: {
        organizationId: user.organizationId,
        OR: [
          { assignedToId: userId },
          { assignedToId: { in: await getTeamMemberIds(managerId) } },
        ],
      },
    });
    return NextResponse.json(contacts);
  }

  // Advisor/Member see only own contacts
  if (hasPermission(userRole, 'contacts:read:own')) {
    const contacts = await db.contact.findMany({
      where: {
        organizationId: user.organizationId,
        assignedToId: userId,
      },
    });
    return NextResponse.json(contacts);
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

- [ ] **Step 2: Update `src/app/api/contacts/[id]/route.ts` - permission checks on update/delete**

Add permission checks before update/delete operations:

```typescript
// In PATCH handler, before updating:
const contact = await db.contact.findUnique({ where: { id } });
if (!contact) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

// Check permission based on who owns the contact
if (contact.assignedToId !== userId) {
  if (hasPermission(userRole, 'contacts:update:team') && isTeamMember(contact.assignedToId, managerId)) {
    // Allow
  } else if (hasPermission(userRole, 'contacts:update:all')) {
    // Allow
  } else {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
```

- [ ] **Step 3: Update `src/app/api/contacts/[id]/tags/route.ts` similarly**

---

## Chunk 4: Teams API Routes - Auth + Permission Guards

### Files
- Modify: `src/app/api/teams/route.ts`
- Modify: `src/app/api/teams/[id]/route.ts`

### Tasks

- [ ] **Step 1: Update `src/app/api/teams/route.ts` - add auth and team:view check**

Add at the start of GET handler:
```typescript
const userId = request.headers.get('x-user-id');
const userRole = normalizeRole(request.headers.get('x-user-role') as string);

if (!userId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

if (!hasPermission(userRole, 'team:view')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

- [ ] **Step 2: Update `src/app/api/teams/[id]/route.ts` similarly**

---

## Chunk 5: UI - usePermission Hook

### Files
- Modify: `src/lib/use-require-auth.ts`

### Tasks

- [ ] **Step 1: Add `usePermission` hook to `use-require-auth.ts`**

Add after existing hooks:

```typescript
import { hasPermission, type Permission, type Role } from './permissions';

export function usePermission() {
  const { user } = useAuth();

  return {
    can: (permission: Permission) => {
      if (!user?.role) return false;
      return hasPermission(user.role, permission);
    },
    isAdmin: user ? hasPermission(user.role, 'users:manage') : false,
    isManager: user ? hasPermission(user.role, 'team:view') && !hasPermission(user.role, 'users:manage') : false,
    canViewTeam: user ? hasPermission(user.role, 'team:view') : false,
    canManageContacts: user ? hasPermission(user.role, 'contacts:delete:all') : false,
  };
}
```

---

## Chunk 6: Register API - Advisor Validation

### Files
- Modify: `src/app/api/auth/register/route.ts`

### Tasks

- [ ] **Step 1: Add manager validation for advisors**

Find the registration handler and add after role assignment:

```typescript
import { canBeManager } from '@/lib/permissions';

if (role === 'advisor' && !managerId) {
  return NextResponse.json(
    { error: 'Advisors must have a manager assigned' },
    { status: 400 }
  );
}

if (managerId) {
  const manager = await db.user.findUnique({ where: { id: managerId } });
  if (!manager || !canBeManager(manager.role)) {
    return NextResponse.json(
      { error: 'Invalid manager assignment' },
      { status: 400 }
    );
  }
}
```

---

## Chunk 7: Testing

### Files
- Create: `src/lib/__tests__/permissions.test.ts`

### Tasks

- [ ] **Step 1: Write permission tests**

```typescript
import { hasPermission, normalizeRole, canBeManager } from '../permissions';

describe('normalizeRole', () => {
  it('normalizes dueno to owner', () => {
    expect(normalizeRole('dueno')).toBe('owner');
  });
  it('normalizes asesor to advisor', () => {
    expect(normalizeRole('asesor')).toBe('advisor');
  });
  it('keeps known roles unchanged', () => {
    expect(normalizeRole('admin')).toBe('admin');
  });
});

describe('hasPermission', () => {
  it('admin has all contact permissions', () => {
    expect(hasPermission('admin', 'contacts:read:all')).toBe(true);
    expect(hasPermission('admin', 'contacts:delete:all')).toBe(true);
    expect(hasPermission('admin', 'team:view')).toBe(true);
  });

  it('advisor only has own contact permissions', () => {
    expect(hasPermission('advisor', 'contacts:read:own')).toBe(true);
    expect(hasPermission('advisor', 'contacts:read:all')).toBe(false);
    expect(hasPermission('advisor', 'team:view')).toBe(false);
  });

  it('manager has team view but not settings', () => {
    expect(hasPermission('manager', 'team:view')).toBe(true);
    expect(hasPermission('manager', 'settings:manage')).toBe(false);
  });

  it('staff has all contact permissions', () => {
    expect(hasPermission('staff', 'contacts:read:all')).toBe(true);
    expect(hasPermission('staff', 'contacts:delete:all')).toBe(true);
    expect(hasPermission('staff', 'team:view')).toBe(false);
  });
});

describe('canBeManager', () => {
  it('returns true for manager, owner, admin, developer', () => {
    expect(canBeManager('manager')).toBe(true);
    expect(canBeManager('owner')).toBe(true);
    expect(canBeManager('admin')).toBe(true);
    expect(canBeManager('developer')).toBe(true);
  });
  it('returns false for advisor, staff, member', () => {
    expect(canBeManager('advisor')).toBe(false);
    expect(canBeManager('staff')).toBe(false);
    expect(canBeManager('member')).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npm test -- src/lib/__tests__/permissions.test.ts`
Expected: All tests pass

---

## Chunk 8: Verification

### Tasks

- [ ] **Step 1: Manual verification checklist**

- [ ] Advisor cannot access /teams (gets 403)
- [ ] Manager can see team contacts in /teams
- [ ] Staff can see all contacts in /contacts
- [ ] Advisor sees only own contacts in /contacts
- [ ] Admin can manage users in settings

- [ ] **Step 2: Test with different users**

Create test users for each role and verify access patterns match the matrix in the spec.

---

## File Summary

| Action | File |
|--------|------|
| Create | `src/lib/permissions.ts` |
| Create | `proxy.ts` |
| Create | `src/lib/__tests__/permissions.test.ts` |
| Modify | `src/lib/auth-helpers.ts` |
| Modify | `src/lib/use-require-auth.ts` |
| Modify | `src/app/api/contacts/route.ts` |
| Modify | `src/app/api/contacts/[id]/route.ts` |
| Modify | `src/app/api/contacts/[id]/tags/route.ts` |
| Modify | `src/app/api/teams/route.ts` |
| Modify | `src/app/api/teams/[id]/route.ts` |
| Modify | `src/app/api/auth/register/route.ts` |

---

## Dependencies

1. `jose` - for JWT verification in proxy.ts (check if already installed: `npm list jose`)
2. Next.js 16+ required for `proxy.ts`

If `jose` not installed: `npm install jose`
