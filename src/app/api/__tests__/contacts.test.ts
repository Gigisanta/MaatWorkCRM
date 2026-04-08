/**
 * Integration tests for Contacts API routes
 *
 * Tests: GET/POST /api/contacts and GET/PUT/DELETE /api/contacts/[id]
 *
 * Strategy:
 * - Mock @/lib/db, @/lib/auth-helpers, @/lib/permissions, @/lib/logger
 *   via inline vi.mock factories (hoisted — no top-level variable references
 *   in factories, so no TDZ issues)
 * - Import route modules after all vi.mock calls
 * - Directly call route handlers with mocked NextRequest objects
 * - Verify DB calls, status codes, and response shapes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

// ─── Mocks — all defined inline so no TDZ issues with hoisted vi.mock ────────

vi.mock('@/lib/db', () => ({
  db: {
    contact: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    pipelineStage: {
      findFirst: vi.fn(),
    },
    tag: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    contactTag: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    note: {
      deleteMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/goal-tracking', () => ({
  trackGoalProgress: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

// ─── Mock refs — defined outside imports so tests can configure them ─────────

const getUserFromSession = vi.fn();
const hasPermission = vi.fn();
const normalizeRole = vi.fn((role: string) => role);

vi.mock('@/lib/auth-helpers', () => ({
  getUserFromSession,
}));

vi.mock('@/lib/permissions', () => ({
  hasPermission,
  normalizeRole,
}));

// ─── Route module imports — must come AFTER all vi.mock calls ─────────────────
// Relative paths from: src/app/api/__tests__/contacts.test.ts
//   ../contacts/route         → src/app/api/contacts/route.ts
//   ../contacts/[id]/route    → src/app/api/contacts/[id]/route.ts
import * as listRoute from '../contacts/route';
import * as detailRoute from '../contacts/[id]/route';

// ─── Auth helpers ─────────────────────────────────────────────────────────────

async function setAuth(user: Record<string, unknown> | null) {
  getUserFromSession.mockResolvedValue(user);
}

function setPermission(permission: string, granted: boolean) {
  hasPermission.mockImplementation((_role: string, perm: string) => {
    if (perm === permission) return granted;
    return false;
  });
}

// ─── Request builder ─────────────────────────────────────────────────────────

function buildRequest(
  method: string,
  options: {
    body?: unknown;
    searchParams?: Record<string, string>;
  } = {}
): NextRequest {
  const { body, searchParams = {} } = options;
  const url = new URL('http://localhost/api/contacts');
  for (const [k, v] of Object.entries(searchParams)) {
    url.searchParams.set(k, v);
  }

  const init: RequestInit = {
    method,
    headers: {
      'content-type': 'application/json',
      'x-request-id': 'test-request-id',
    },
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  return new NextRequest(url, init);
}

function buildParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

// ─── Shared fixtures ─────────────────────────────────────────────────────────

const mockAdminUser = {
  id: 'admin123',
  email: 'admin@maatwork.com',
  name: 'Admin User',
  role: 'admin',
  isActive: true,
  organizationId: 'org_abc',
};

const mockAdvisorUser = {
  id: 'advisor123',
  email: 'advisor@maatwork.com',
  name: 'Advisor User',
  role: 'advisor',
  isActive: true,
  organizationId: 'org_abc',
};

const mockManagerUser = {
  id: 'manager123',
  email: 'manager@maatwork.com',
  name: 'Manager User',
  role: 'manager',
  isActive: true,
  organizationId: 'org_abc',
};

const mockContact = {
  id: 'cmneufsxp0001l104e4k1gi2z',
  organizationId: 'org_abc',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+34 600 000 000',
  company: 'Acme Corp',
  emoji: '👤',
  segment: 'enterprise',
  source: 'web',
  pipelineStageId: 'stage_1',
  assignedTo: 'advisor123',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
  tags: [] as unknown[],
  pipelineStage: { id: 'stage_1', name: 'Lead', color: '#8b5cf6', order: 1 },
  assignedUser: { id: 'advisor123', name: 'Advisor User', email: 'advisor@maatwork.com', image: null },
  deals: [] as unknown[],
  tasks: [] as unknown[],
};

const mockContactList = [
  { ...mockContact, _count: { deals: 2, tasks: 3 } },
  { ...mockContact, id: 'cmneufsxp0002l104e4k1gi2z', name: 'Jane Smith', _count: { deals: 1, tasks: 1 } },
];

// ─── GET /api/contacts ─────────────────────────────────────────────────────────

describe('GET /api/contacts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasPermission.mockReturnValue(false);
  });

  it('returns 401 when no user session', async () => {
    await setAuth(null);
    const req = buildRequest('GET', { searchParams: { organizationId: 'org_abc' } });
    const res = await listRoute.GET(req);
    expect(res.status).toBe(401);
  });

  it('admin with contacts:read:all returns paginated contacts list', async () => {
    await setAuth(mockAdminUser);
    setPermission('contacts:read:all', true);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.contact.findMany).mockResolvedValue(mockContactList);
    // @ts-expect-error - mock
    vi.mocked(db.contact.count).mockResolvedValue(2);

    const req = buildRequest('GET', { searchParams: { organizationId: 'org_abc' } });
    const res = await listRoute.GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.contacts).toHaveLength(2);
    expect(json.pagination.total).toBe(2);
    expect(vi.mocked(db.contact.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: 'org_abc' }, skip: 0, take: 50 })
    );
  });

  it('admin respects pagination params', async () => {
    await setAuth(mockAdminUser);
    setPermission('contacts:read:all', true);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.contact.findMany).mockResolvedValue([]);
    // @ts-expect-error - mock
    vi.mocked(db.contact.count).mockResolvedValue(0);

    const req = buildRequest('GET', { searchParams: { organizationId: 'org_abc', page: '3', limit: '25' } });
    const res = await listRoute.GET(req);

    expect(res.status).toBe(200);
    expect(vi.mocked(db.contact.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 50, take: 25 })
    );
  });

  it('admin applies search filter', async () => {
    await setAuth(mockAdminUser);
    setPermission('contacts:read:all', true);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.contact.findMany).mockResolvedValue([]);
    // @ts-expect-error - mock
    vi.mocked(db.contact.count).mockResolvedValue(0);

    const req = buildRequest('GET', { searchParams: { organizationId: 'org_abc', search: 'john' } });
    const res = await listRoute.GET(req);

    expect(res.status).toBe(200);
    expect(vi.mocked(db.contact.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([expect.objectContaining({ name: { contains: 'john' } })]),
        }),
      })
    );
  });

  it('admin applies stage and segment filters', async () => {
    await setAuth(mockAdminUser);
    setPermission('contacts:read:all', true);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.contact.findMany).mockResolvedValue([]);
    // @ts-expect-error - mock
    vi.mocked(db.contact.count).mockResolvedValue(0);

    const req = buildRequest('GET', {
      searchParams: { organizationId: 'org_abc', stage: 'stage_1', segment: 'enterprise' },
    });
    const res = await listRoute.GET(req);

    expect(res.status).toBe(200);
    expect(vi.mocked(db.contact.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ pipelineStageId: 'stage_1', segment: 'enterprise' }),
      })
    );
  });

  it('admin applies assignedTo filter', async () => {
    await setAuth(mockAdminUser);
    setPermission('contacts:read:all', true);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.contact.findMany).mockResolvedValue([]);
    // @ts-expect-error - mock
    vi.mocked(db.contact.count).mockResolvedValue(0);

    const req = buildRequest('GET', {
      searchParams: { organizationId: 'org_abc', assignedTo: 'advisor123' },
    });
    const res = await listRoute.GET(req);

    expect(res.status).toBe(200);
    expect(vi.mocked(db.contact.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ assignedTo: 'advisor123' }),
      })
    );
  });

  it('admin cannot access another org contacts', async () => {
    await setAuth(mockAdminUser);
    setPermission('contacts:read:all', true);

    const req = buildRequest('GET', { searchParams: { organizationId: 'org_other' } });
    const res = await listRoute.GET(req);

    expect(res.status).toBe(403);
  });

  it('admin requires organizationId when none in session', async () => {
    await setAuth({ ...mockAdminUser, organizationId: null });
    setPermission('contacts:read:all', true);

    const req = buildRequest('GET', {});
    const res = await listRoute.GET(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('organizationId');
  });

  it('manager with contacts:read:team sees own + team contacts', async () => {
    await setAuth(mockManagerUser);
    setPermission('contacts:read:team', true);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.user.findMany).mockResolvedValue([{ id: 'member1' }]);
    // @ts-expect-error - mock
    vi.mocked(db.contact.findMany).mockResolvedValue([]);
    // @ts-expect-error - mock
    vi.mocked(db.contact.count).mockResolvedValue(0);

    const req = buildRequest('GET', { searchParams: { organizationId: 'org_abc' } });
    const res = await listRoute.GET(req);

    expect(res.status).toBe(200);
    expect(vi.mocked(db.user.findMany)).toHaveBeenCalledWith({
      where: { managerId: 'manager123' },
      select: { id: true },
    });
    expect(vi.mocked(db.contact.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { assignedTo: 'manager123' },
            { assignedTo: { in: ['member1'] } },
          ]),
        }),
      })
    );
  });

  it('advisor with contacts:read:own sees only own contacts', async () => {
    await setAuth(mockAdvisorUser);
    setPermission('contacts:read:own', true);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.contact.findMany).mockResolvedValue([]);
    // @ts-expect-error - mock
    vi.mocked(db.contact.count).mockResolvedValue(0);

    const req = buildRequest('GET', { searchParams: { organizationId: 'org_abc' } });
    const res = await listRoute.GET(req);

    expect(res.status).toBe(200);
    expect(vi.mocked(db.contact.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ assignedTo: 'advisor123' }),
      })
    );
  });

  it('returns 403 when no contact read permission', async () => {
    await setAuth(mockAdvisorUser);
    const req = buildRequest('GET', { searchParams: { organizationId: 'org_abc' } });
    const res = await listRoute.GET(req);
    expect(res.status).toBe(403);
  });

  it('returns 500 on unexpected error', async () => {
    await setAuth(mockAdminUser);
    setPermission('contacts:read:all', true);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.contact.findMany).mockRejectedValue(new Error('DB connection failed'));

    const req = buildRequest('GET', { searchParams: { organizationId: 'org_abc' } });
    const res = await listRoute.GET(req);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Error interno del servidor');
  });

  it('includes interactionCount in contact list response', async () => {
    await setAuth(mockAdminUser);
    setPermission('contacts:read:all', true);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.contact.findMany).mockResolvedValue(mockContactList);
    // @ts-expect-error - mock
    vi.mocked(db.contact.count).mockResolvedValue(2);

    const req = buildRequest('GET', { searchParams: { organizationId: 'org_abc' } });
    const res = await listRoute.GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    // interactionCount = deals count + tasks count
    expect(json.contacts[0].interactionCount).toBe(5); // 2 deals + 3 tasks
    expect(json.contacts[1].interactionCount).toBe(2); // 1 deal + 1 task
  });
});

// ─── POST /api/contacts ────────────────────────────────────────────────────────

describe('POST /api/contacts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasPermission.mockReturnValue(false);
  });

  it('returns 401 when no user session', async () => {
    await setAuth(null);
    const req = buildRequest('POST', { body: { organizationId: 'org_abc', name: 'Test' } });
    const res = await listRoute.POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 403 when user lacks contacts:create permission', async () => {
    await setAuth(mockAdvisorUser);
    setPermission('contacts:create', false);
    const req = buildRequest('POST', { body: { organizationId: 'org_abc', name: 'Test' } });
    const res = await listRoute.POST(req);
    expect(res.status).toBe(403);
  });

  it('returns 400 when name is empty', async () => {
    await setAuth(mockAdminUser);
    setPermission('contacts:create', true);
    const req = buildRequest('POST', { body: { organizationId: 'org_abc', name: '' } });
    const res = await listRoute.POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Validation failed');
  });

  it('returns 400 when email is invalid', async () => {
    await setAuth(mockAdminUser);
    setPermission('contacts:create', true);
    const req = buildRequest('POST', {
      body: { organizationId: 'org_abc', name: 'Test', email: 'not-email' },
    });
    const res = await listRoute.POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when organizationId is missing and not in session', async () => {
    await setAuth({ ...mockAdminUser, organizationId: null });
    setPermission('contacts:create', true);
    const req = buildRequest('POST', { body: { name: 'Test' } });
    const res = await listRoute.POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 403 when target org differs from user org', async () => {
    await setAuth(mockAdminUser);
    setPermission('contacts:create', true);
    const req = buildRequest('POST', { body: { organizationId: 'org_other', name: 'Test' } });
    const res = await listRoute.POST(req);
    expect(res.status).toBe(403);
  });

  it('creates contact with valid data and returns 201', async () => {
    await setAuth(mockAdminUser);
    setPermission('contacts:create', true);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.pipelineStage.findFirst).mockResolvedValue(null);
    // @ts-expect-error - mock
    vi.mocked(db.contact.create).mockResolvedValue(mockContact);
    // @ts-expect-error - mock
    vi.mocked(db.contact.findUnique).mockResolvedValue({ ...mockContact, tags: [] });

    const req = buildRequest('POST', {
      body: { organizationId: 'org_abc', name: 'John Doe', email: 'john@example.com' },
    });
    const res = await listRoute.POST(req);

    expect(res.status).toBe(201);
    expect(vi.mocked(db.contact.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: 'org_abc',
          name: 'John Doe',
          email: 'john@example.com',
        }),
      })
    );
  });

  it('uses default stage when none provided', async () => {
    await setAuth(mockAdminUser);
    setPermission('contacts:create', true);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.pipelineStage.findFirst).mockResolvedValue({
      id: 'default_stage',
      isDefault: true,
    });
    // @ts-expect-error - mock
    vi.mocked(db.contact.create).mockResolvedValue(mockContact);
    // @ts-expect-error - mock
    vi.mocked(db.contact.findUnique).mockResolvedValue({ ...mockContact, tags: [] });

    const req = buildRequest('POST', { body: { organizationId: 'org_abc', name: 'No Stage Contact' } });
    const res = await listRoute.POST(req);

    expect(res.status).toBe(201);
    expect(vi.mocked(db.pipelineStage.findFirst)).toHaveBeenCalledWith({
      where: { organizationId: 'org_abc', isDefault: true },
    });
  });

  it('returns 500 on unexpected error', async () => {
    await setAuth(mockAdminUser);
    setPermission('contacts:create', true);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.pipelineStage.findFirst).mockRejectedValue(new Error('DB error'));

    const req = buildRequest('POST', { body: { organizationId: 'org_abc', name: 'Test' } });
    const res = await listRoute.POST(req);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Error interno del servidor');
  });
});

// ─── GET /api/contacts/[id] ────────────────────────────────────────────────────

describe('GET /api/contacts/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasPermission.mockReturnValue(false);
  });

  it('returns 401 when no user session', async () => {
    await setAuth(null);
    const req = buildRequest('GET');
    const res = await detailRoute.GET(req, buildParams('cmneufsxp0001l104e4k1gi2z'));
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid ID format', async () => {
    await setAuth(mockAdminUser);
    const req = buildRequest('GET');
    const res = await detailRoute.GET(req, buildParams('invalid-id'));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('ID inválido');
  });

  it('returns 404 when contact not found', async () => {
    await setAuth(mockAdminUser);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.contact.findUnique).mockResolvedValue(null);

    const req = buildRequest('GET');
    const res = await detailRoute.GET(req, buildParams('cmneufsxp0001l104e4k1gi2z'));

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe('Contacto no encontrado');
  });

  it('returns contact with relations when found', async () => {
    await setAuth(mockAdminUser);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.contact.findUnique).mockResolvedValue(mockContact);

    const req = buildRequest('GET');
    const res = await detailRoute.GET(req, buildParams('cmneufsxp0001l104e4k1gi2z'));

    expect(res.status).toBe(200);
    expect(vi.mocked(db.contact.findUnique)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'cmneufsxp0001l104e4k1gi2z' },
        include: expect.objectContaining({
          tags: true,
          pipelineStage: true,
          assignedUser: true,
          deals: true,
          tasks: true,
        }),
      })
    );
  });

  it('returns 500 on unexpected error', async () => {
    await setAuth(mockAdminUser);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.contact.findUnique).mockRejectedValue(new Error('DB failure'));

    const req = buildRequest('GET');
    const res = await detailRoute.GET(req, buildParams('cmneufsxp0001l104e4k1gi2z'));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Error interno del servidor');
  });
});

// ─── PUT /api/contacts/[id] ───────────────────────────────────────────────────

describe('PUT /api/contacts/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasPermission.mockReturnValue(false);
  });

  it('returns 401 when no user session', async () => {
    await setAuth(null);
    const req = buildRequest('PUT', { body: { name: 'Updated' } });
    const res = await detailRoute.PUT(req, buildParams('cmneufsxp0001l104e4k1gi2z'));
    expect(res.status).toBe(401);
  });

  it('returns 404 when contact not found', async () => {
    await setAuth(mockAdminUser);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.contact.findUnique).mockResolvedValue(null);

    const req = buildRequest('PUT', { body: { name: 'Updated' } });
    const res = await detailRoute.PUT(req, buildParams('cmneufsxp0001l104e4k1gi2z'));

    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid ID format', async () => {
    await setAuth(mockAdminUser);
    const req = buildRequest('PUT', { body: { name: 'Updated' } });
    const res = await detailRoute.PUT(req, buildParams('bad-id'));
    expect(res.status).toBe(400);
  });

  it('returns 403 when non-owner has no contacts:update:all permission', async () => {
    await setAuth({ ...mockAdvisorUser, id: 'different_advisor' });
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.contact.findUnique).mockResolvedValue({ ...mockContact, assignedTo: 'other_advisor' });
    // @ts-expect-error - mock
    vi.mocked(db.user.findFirst).mockResolvedValue(null);

    const req = buildRequest('PUT', { body: { name: 'Updated' } });
    const res = await detailRoute.PUT(req, buildParams('cmneufsxp0001l104e4k1gi2z'));

    expect(res.status).toBe(403);
  });

  it('owner can update own contact', async () => {
    await setAuth(mockAdvisorUser);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.contact.findUnique).mockResolvedValue({ ...mockContact, assignedTo: 'advisor123' });
    // @ts-expect-error - mock
    vi.mocked(db.contact.update).mockResolvedValue({ ...mockContact, name: 'Updated Name' });

    const req = buildRequest('PUT', { body: { name: 'Updated Name' } });
    const res = await detailRoute.PUT(req, buildParams('cmneufsxp0001l104e4k1gi2z'));

    expect(res.status).toBe(200);
    expect(vi.mocked(db.contact.update)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'cmneufsxp0001l104e4k1gi2z' },
        data: expect.objectContaining({ name: 'Updated Name' }),
      })
    );
  });

  it('admin with contacts:update:all can update any contact', async () => {
    await setAuth(mockAdminUser);
    setPermission('contacts:update:all', true);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.contact.findUnique).mockResolvedValue({ ...mockContact, assignedTo: 'other_user' });
    // @ts-expect-error - mock
    vi.mocked(db.contact.update).mockResolvedValue(mockContact);

    const req = buildRequest('PUT', { body: { name: 'Admin Updated' } });
    const res = await detailRoute.PUT(req, buildParams('cmneufsxp0001l104e4k1gi2z'));

    expect(res.status).toBe(200);
  });

  it('non-admin cannot reassign contact without contacts:update:all', async () => {
    await setAuth(mockAdvisorUser);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.contact.findUnique).mockResolvedValue({ ...mockContact, assignedTo: 'advisor123' });

    const req = buildRequest('PUT', { body: { assignedTo: 'new_user' } });
    const res = await detailRoute.PUT(req, buildParams('cmneufsxp0001l104e4k1gi2z'));

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain('administradores');
  });

  it('admin can reassign contact', async () => {
    await setAuth(mockAdminUser);
    setPermission('contacts:update:all', true);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.contact.findUnique).mockResolvedValue({ ...mockContact, assignedTo: 'advisor123' });
    // @ts-expect-error - mock
    vi.mocked(db.contact.update).mockResolvedValue({ ...mockContact, assignedTo: 'new_user' });

    const req = buildRequest('PUT', { body: { assignedTo: 'new_user' } });
    const res = await detailRoute.PUT(req, buildParams('cmneufsxp0001l104e4k1gi2z'));

    expect(res.status).toBe(200);
    expect(vi.mocked(db.contact.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ assignedTo: 'new_user' }) })
    );
  });

  it('returns 400 when name is empty string', async () => {
    await setAuth(mockAdvisorUser);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.contact.findUnique).mockResolvedValue({ ...mockContact, assignedTo: 'advisor123' });

    const req = buildRequest('PUT', { body: { name: '' } });
    const res = await detailRoute.PUT(req, buildParams('cmneufsxp0001l104e4k1gi2z'));

    expect(res.status).toBe(400);
  });

  it('returns 400 when email format is invalid', async () => {
    await setAuth(mockAdvisorUser);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.contact.findUnique).mockResolvedValue({ ...mockContact, assignedTo: 'advisor123' });

    const req = buildRequest('PUT', { body: { email: 'bad-email' } });
    const res = await detailRoute.PUT(req, buildParams('cmneufsxp0001l104e4k1gi2z'));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Validation failed');
    expect(json.details).toHaveProperty('email');
  });

  it('returns 500 on unexpected error', async () => {
    await setAuth(mockAdminUser);
    setPermission('contacts:update:all', true);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.contact.findUnique).mockRejectedValue(new Error('DB failure'));

    const req = buildRequest('PUT', { body: { name: 'Updated' } });
    const res = await detailRoute.PUT(req, buildParams('cmneufsxp0001l104e4k1gi2z'));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Error interno del servidor');
  });
});

// ─── DELETE /api/contacts/[id] ───────────────────────────────────────────────

describe('DELETE /api/contacts/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasPermission.mockReturnValue(false);
  });

  it('returns 401 when no user session', async () => {
    await setAuth(null);
    const req = buildRequest('DELETE');
    const res = await detailRoute.DELETE(req, buildParams('cmneufsxp0001l104e4k1gi2z'));
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid ID format', async () => {
    await setAuth(mockAdminUser);
    const req = buildRequest('DELETE');
    const res = await detailRoute.DELETE(req, buildParams('not-valid'));
    expect(res.status).toBe(400);
  });

  it('returns 404 when contact not found', async () => {
    await setAuth(mockAdminUser);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.contact.findUnique).mockResolvedValue(null);

    const req = buildRequest('DELETE');
    const res = await detailRoute.DELETE(req, buildParams('cmneufsxp0001l104e4k1gi2z'));

    expect(res.status).toBe(404);
  });

  it('returns 403 when non-owner lacks contacts:delete:all permission', async () => {
    await setAuth({ ...mockAdvisorUser, id: 'other_advisor' });
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.contact.findUnique).mockResolvedValue({ ...mockContact, assignedTo: 'advisor123' });
    // @ts-expect-error - mock
    vi.mocked(db.user.findFirst).mockResolvedValue(null);

    const req = buildRequest('DELETE');
    const res = await detailRoute.DELETE(req, buildParams('cmneufsxp0001l104e4k1gi2z'));

    expect(res.status).toBe(403);
  });

  it('owner can delete own contact', async () => {
    await setAuth(mockAdvisorUser);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.contact.findUnique).mockResolvedValue({ ...mockContact, assignedTo: 'advisor123' });
    // @ts-expect-error - mock
    vi.mocked(db.$transaction).mockResolvedValue([]);

    const req = buildRequest('DELETE');
    const res = await detailRoute.DELETE(req, buildParams('cmneufsxp0001l104e4k1gi2z'));

    expect(res.status).toBe(200);
    expect(vi.mocked(db.$transaction)).toHaveBeenCalledWith([
      expect.objectContaining({}),
      expect.objectContaining({}),
      expect.objectContaining({}),
    ]);
  });

  it('admin with contacts:delete:all can delete any contact', async () => {
    await setAuth(mockAdminUser);
    setPermission('contacts:delete:all', true);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.contact.findUnique).mockResolvedValue({ ...mockContact, assignedTo: 'other_user' });
    // @ts-expect-error - mock
    vi.mocked(db.$transaction).mockResolvedValue([]);

    const req = buildRequest('DELETE');
    const res = await detailRoute.DELETE(req, buildParams('cmneufsxp0001l104e4k1gi2z'));

    expect(res.status).toBe(200);
  });

  it('deletes contact with cascade (contactTags, notes)', async () => {
    await setAuth(mockAdvisorUser);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.contact.findUnique).mockResolvedValue({ ...mockContact, assignedTo: 'advisor123' });
    // @ts-expect-error - mock
    vi.mocked(db.$transaction).mockResolvedValue([]);

    const req = buildRequest('DELETE');
    const res = await detailRoute.DELETE(req, buildParams('cmneufsxp0001l104e4k1gi2z'));

    expect(res.status).toBe(200);
    const txCall = vi.mocked(db.$transaction).mock.calls[0];
    expect(txCall).toHaveLength(3);
  });

  it('returns 500 on unexpected error', async () => {
    await setAuth(mockAdminUser);
    setPermission('contacts:delete:all', true);
    const { db } = await import('@/lib/db');
    // @ts-expect-error - mock
    vi.mocked(db.contact.findUnique).mockRejectedValue(new Error('DB failure'));

    const req = buildRequest('DELETE');
    const res = await detailRoute.DELETE(req, buildParams('cmneufsxp0001l104e4k1gi2z'));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Error interno del servidor');
  });
});
