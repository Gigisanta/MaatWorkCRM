# Testing System Overhaul - Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Achieve 80%+ test coverage across the MaatWork CRM codebase with comprehensive unit, integration, component, and E2E tests that all pass.

**Architecture:**三层测试策略:
1. **Unit tests** (Vitest) - lib functions, schemas, utilities
2. **Component tests** (Vitest + React Testing Library) - React components
3. **Integration tests** (Vitest) - API routes
4. **E2E tests** (Playwright) - critical user flows

**Tech Stack:** Vitest 2.x, @testing-library/react, @testing-library/jest-dom, @vitest/coverage-v8, Playwright

---

## Phase 0: Diagnóstico y Arreglos Inmediatos

### Task 0.1: Fix failing permission tests

**Files:**
- Modify: `src/lib/__tests__/permissions.test.ts:34-36, 65-67`

The tests claim `advisor` and `staff` do NOT have `team:view`, but the actual code (`src/lib/permissions.ts:43-44`) grants `team:view` to both roles. The tests are wrong.

- [ ] **Step 1: Fix advisor test**
Edit `src/lib/__tests__/permissions.test.ts` line 35:
```typescript
    it('does NOT have team:view', () => {
      expect(hasPermission('advisor', 'team:view')).toBe(true); // FIXED: advisor HAS team:view
    }),
```
Change `toBe(false)` → `toBe(true)`

- [ ] **Step 2: Fix staff test**
Edit line 66:
```typescript
    it('does NOT have team:view', () => {
      expect(hasPermission('staff', 'team:view')).toBe(true); // FIXED: staff HAS team:view
    }),
```

- [ ] **Step 3: Run tests to verify all pass**
Run: `bun run test`
Expected: ALL PASS (27 tests)

---

## Phase 1: Unit Tests - Lib Functions

### Task 1.1: Comprehensive utils.test.ts

**Files:**
- Modify: `src/lib/__tests__/utils.test.ts`

- [ ] **Step 1: Add tests for `cn` utility edge cases**
```typescript
it('should handle undefined values', () => {
  expect(cn('foo', undefined, 'bar')).toBe('foo bar');
});

it('should handle null values', () => {
  expect(cn('foo', null, 'bar')).toBe('foo bar');
});

it('should handle empty strings', () => {
  expect(cn('', 'bar')).toBe('bar');
});

it('should merge conflicting tailwind classes (rightmost wins)', () => {
  expect(cn('px-2 px-4')).toBe('px-4');
});

it('should combine conditional classes', () => {
  const isActive = true;
  expect(cn('base', isActive && 'active')).toBe('base active');
  expect(cn('base', !isActive && 'active')).toBe('base');
});
```

- [ ] **Step 2: Run tests**
Run: `bun run test -- src/lib/__tests__/utils.test.ts`

### Task 1.2: New test file - roles.test.ts

**Files:**
- Create: `src/lib/__tests__/roles.test.ts`

- [ ] **Step 1: Write tests for all role helpers**
```typescript
import { describe, it, expect } from 'vitest';
import {
  canCreateTeam, canUpdateTeam, canDeleteTeam, canManageTeam,
  canViewAllContacts, canDeleteContacts, canManageUsers,
  isManagerOrAdmin, isAdmin, getRoleDisplayName,
  getAvailableRoles, requiresManagerSelection,
} from '@/lib/roles';

describe('canCreateTeam', () => {
  it('returns true for owner, admin, developer, manager', () => {
    expect(canCreateTeam('owner')).toBe(true);
    expect(canCreateTeam('admin')).toBe(true);
    expect(canCreateTeam('developer')).toBe(true);
    expect(canCreateTeam('manager')).toBe(true);
  });
  it('returns false for advisor, staff, member', () => {
    expect(canCreateTeam('advisor')).toBe(false);
    expect(canCreateTeam('staff')).toBe(false);
    expect(canCreateTeam('member')).toBe(false);
  });
});

describe('canUpdateTeam', () => {
  it('returns true for owner, admin, developer, manager', () => {
    expect(canUpdateTeam('owner')).toBe(true);
    expect(canUpdateTeam('admin')).toBe(true);
    expect(canUpdateTeam('developer')).toBe(true);
    expect(canUpdateTeam('manager')).toBe(true);
  });
  it('returns false for advisor, staff, member', () => {
    expect(canUpdateTeam('advisor')).toBe(false);
    expect(canUpdateTeam('staff')).toBe(false);
    expect(canUpdateTeam('member')).toBe(false);
  });
});

describe('canDeleteTeam', () => {
  it('returns true for owner, admin, developer only', () => {
    expect(canDeleteTeam('owner')).toBe(true);
    expect(canDeleteTeam('admin')).toBe(true);
    expect(canDeleteTeam('developer')).toBe(true);
  });
  it('returns false for manager, advisor, staff, member', () => {
    expect(canDeleteTeam('manager')).toBe(false);
    expect(canDeleteTeam('advisor')).toBe(false);
    expect(canDeleteTeam('staff')).toBe(false);
    expect(canDeleteTeam('member')).toBe(false);
  });
});

describe('canManageTeam', () => {
  it('returns true for admin, developer, owner, manager', () => {
    ['admin', 'developer', 'owner', 'manager'].forEach(role => {
      expect(canManageTeam(role)).toBe(true);
    });
  });
  it('returns false for advisor, staff, member', () => {
    ['advisor', 'staff', 'member'].forEach(role => {
      expect(canManageTeam(role)).toBe(false);
    });
  });
});

describe('canViewAllContacts', () => {
  it('returns true for admin, owner, developer', () => {
    expect(canViewAllContacts('admin')).toBe(true);
    expect(canViewAllContacts('owner')).toBe(true);
    expect(canViewAllContacts('developer')).toBe(true);
  });
  it('returns false for manager, advisor, staff, member', () => {
    ['manager', 'advisor', 'staff', 'member'].forEach(role => {
      expect(canViewAllContacts(role)).toBe(false);
    });
  });
});

describe('canDeleteContacts', () => {
  it('returns true for admin, owner, developer', () => {
    ['admin', 'owner', 'developer'].forEach(role => {
      expect(canDeleteContacts(role)).toBe(true);
    });
  });
  it('returns false for manager, advisor, staff, member', () => {
    ['manager', 'advisor', 'staff', 'member'].forEach(role => {
      expect(canDeleteContacts(role)).toBe(false);
    });
  });
});

describe('canManageUsers', () => {
  it('returns true for admin, owner, developer', () => {
    ['admin', 'owner', 'developer'].forEach(role => {
      expect(canManageUsers(role)).toBe(true);
    });
  });
  it('returns false for manager', () => {
    expect(canManageUsers('manager')).toBe(false);
  });
});

describe('isManagerOrAdmin', () => {
  it('returns true for admin, manager, owner, developer', () => {
    ['admin', 'manager', 'owner', 'developer'].forEach(role => {
      expect(isManagerOrAdmin(role)).toBe(true);
    });
  });
  it('returns false for advisor, staff, member', () => {
    ['advisor', 'staff', 'member'].forEach(role => {
      expect(isManagerOrAdmin(role)).toBe(false);
    });
  });
});

describe('isAdmin', () => {
  it('returns true for admin, developer', () => {
    expect(isAdmin('admin')).toBe(true);
    expect(isAdmin('developer')).toBe(true);
  });
  it('returns false for owner, manager, advisor, staff, member', () => {
    ['owner', 'manager', 'advisor', 'staff', 'member'].forEach(role => {
      expect(isAdmin(role)).toBe(false);
    });
  });
});

describe('getRoleDisplayName', () => {
  it('returns Spanish names for standard roles', () => {
    expect(getRoleDisplayName('admin')).toBe('Administrador');
    expect(getRoleDisplayName('manager')).toBe('Gerente');
    expect(getRoleDisplayName('advisor')).toBe('Asesor');
    expect(getRoleDisplayName('owner')).toBe('Dueño');
    expect(getRoleDisplayName('staff')).toBe('Personal');
    expect(getRoleDisplayName('member')).toBe('Miembro');
    expect(getRoleDisplayName('developer')).toBe('Desarrollador');
  });
  it('returns original for unknown roles', () => {
    expect(getRoleDisplayName('unknown')).toBe('unknown');
  });
});

describe('getAvailableRoles', () => {
  it('returns 4 roles for registration', () => {
    const roles = getAvailableRoles();
    expect(roles).toHaveLength(4);
    expect(roles.map(r => r.value)).toEqual(['advisor', 'manager', 'staff', 'owner']);
  });
});

describe('requiresManagerSelection', () => {
  it('returns true only for advisor', () => {
    expect(requiresManagerSelection('advisor')).toBe(true);
    ['owner', 'manager', 'staff', 'admin', 'developer', 'member'].forEach(role => {
      expect(requiresManagerSelection(role)).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run tests**
Run: `bun run test -- src/lib/__tests__/roles.test.ts`

### Task 1.3: Zod Schema Validation Tests

**Files:**
- Create: `src/lib/__tests__/schemas.test.ts`

- [ ] **Step 1: Write schema validation tests**
```typescript
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
// Import actual schemas from the project
import { contactSchema } from '@/lib/schemas/contact';
import { dealSchema } from '@/lib/schemas/deal';
import { taskSchema } from '@/lib/schemas/task';
import { goalSchema } from '@/lib/schemas/goal';
import { planningSchema } from '@/lib/schemas/planning';

describe('contactSchema', () => {
  it('parses valid contact data', () => {
    const valid = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      organizationId: 'org-123',
    };
    const result = contactSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const invalid = { name: 'John', email: 'not-an-email' };
    const result = contactSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const invalid = { name: '', email: 'john@example.com' };
    const result = contactSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('dealSchema', () => {
  it('parses valid deal data', () => {
    const valid = {
      title: 'Big Deal',
      value: 50000,
      stageId: 'stage-1',
      organizationId: 'org-123',
    };
    const result = dealSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects negative deal value', () => {
    const invalid = { title: 'Deal', value: -100, stageId: 'stage-1' };
    const result = dealSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('taskSchema', () => {
  it('parses valid task data', () => {
    const valid = {
      title: 'Follow up',
      status: 'pending',
      dueDate: '2026-04-30',
    };
    const result = taskSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const invalid = { title: 'Task', status: 'invalid_status' };
    const result = taskSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('goalSchema', () => {
  it('parses valid goal data', () => {
    const valid = {
      type: 'revenue',
      targetValue: 100000,
      startDate: '2026-04-01',
      endDate: '2026-04-30',
      teamId: 'team-1',
    };
    const result = goalSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects endDate before startDate', () => {
    const invalid = {
      type: 'revenue',
      targetValue: 100000,
      startDate: '2026-04-30',
      endDate: '2026-04-01',
      teamId: 'team-1',
    };
    const result = goalSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Check if schemas export Zod schemas properly**
Read `src/lib/schemas/contact.ts`, `src/lib/schemas/deal.ts`, etc. and adjust imports if needed

- [ ] **Step 3: Run tests**
Run: `bun run test -- src/lib/__tests__/schemas.test.ts`

### Task 1.4: Task Utils Tests

**Files:**
- Create: `src/lib/__tests__/task-utils.test.ts`
- Read: `src/lib/task-utils.ts`

- [ ] **Step 1: Write unit tests for task-utils.ts**
Read the file first to understand available functions

### Task 1.5: Auth Helpers Tests

**Files:**
- Create: `src/lib/__tests__/auth-helpers.test.ts`
- Read: `src/lib/auth-helpers.ts` and `src/lib/auth-helpers-client.ts`

### Task 1.6: Goal Health & Pipeline Stages Tests

**Files:**
- Create: `src/lib/__tests__/goal-health.test.ts`
- Read: `src/lib/goal-health.ts`

- [ ] **Step 1: Write unit tests**
Read the source files and write comprehensive tests

---

## Phase 2: Component Tests (React Testing Library)

### Task 2.1: Install RTL and needed dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install @testing-library/react**
Run: `bun add -D @testing-library/react @testing-library/dom`

- [ ] **Step 2: Update vitest setup**
Modify `src/test/setup.ts` to add RTL setup

### Task 2.2: UI Component Tests

**Files:**
- Create: `src/components/__tests__/ui/button.test.tsx`
- Create: `src/components/__tests__/ui/badge.test.tsx`
- Create: `src/components/__tests__/ui/card.test.tsx`

- [ ] **Step 1: Write button tests**
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    expect(container.firstChild).toHaveClass('destructive');
  });

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Task 2.3: Goals Component Tests

**Files:**
- Create: `src/components/__tests__/goals/goal-card.test.tsx`
- Create: `src/components/__tests__/goals/goal-progress-bar.test.tsx`
- Create: `src/components/__tests__/goals/goal-type-badge.test.tsx`

---

## Phase 3: Integration Tests - API Routes

### Task 3.1: API Route Integration Test Setup

**Files:**
- Modify: `vitest.config.mts`

- [ ] **Step 1: Add MSW or use direct handler testing**
Configure Vitest for API route testing with proper Prisma mock

### Task 3.2: Auth API Tests

**Files:**
- Create: `src/app/api/__tests__/auth.test.ts`

- [ ] **Step 1: Write integration tests for auth routes**
Test login, register, logout endpoints

### Task 3.3: Contacts API Tests

**Files:**
- Create: `src/app/api/__tests__/contacts.test.ts`

### Task 3.4: Goals API Tests

**Files:**
- Create: `src/app/api/__tests__/goals.test.ts`

---

## Phase 4: E2E Testing - Playwright

### Task 4.1: Playwright Configuration

**Files:**
- Create: `playwright.config.ts`

- [ ] **Step 1: Create Playwright config**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

### Task 4.2: E2E Test Suite

**Files:**
- Modify: `e2e/login.spec.ts` (expand existing)
- Create: `e2e/dashboard.spec.ts`
- Create: `e2e/contacts.spec.ts`

- [ ] **Step 1: Expand login E2E tests**
- [ ] **Step 2: Add dashboard E2E tests**
- [ ] **Step 3: Add contacts CRUD E2E tests**

---

## Phase 5: Coverage & CI Configuration

### Task 5.1: Verify 80% Coverage

**Files:**
- Modify: `vitest.config.mts`

- [ ] **Step 1: Run coverage report**
Run: `bun run test:coverage`

- [ ] **Step 2: Fix any coverage gaps** (identified after coverage report)

---

## Task Count Summary

| Phase | Tasks |
|-------|-------|
| Phase 0 | 1 (3 steps) |
| Phase 1 | 6 tasks |
| Phase 2 | 3 tasks |
| Phase 3 | 4 tasks |
| Phase 4 | 3 tasks |
| Phase 5 | 2 tasks |
| **Total** | **19 tasks** |

## Execution Approach

**Recommended: Subagent-Driven with parallel agents**

Use `superpowers:subagent-driven-development`:
- Agent 1: Phase 0 (fix failing tests) + Phase 1.1-1.3 (lib tests, roles, schemas)
- Agent 2: Phase 1.4-1.6 (task-utils, auth-helpers, goal-health)
- Agent 3: Phase 2 (component tests)
- Agent 4: Phase 3 (API integration tests)
- Agent 5: Phase 4 (E2E/Playwright)
- After all agents: Phase 5 (coverage verification)

Then run final verification: `bun run test:coverage` and `bun run test:ci`
