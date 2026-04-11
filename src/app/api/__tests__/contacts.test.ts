import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Route under test
import { GET, POST } from '@/app/api/contacts/route';

// ─── Mutable mock refs (reset in beforeEach) ────────────────────────────────────
let mockGetUserFromSession = vi.fn();
let mockDbContactFindMany = vi.fn();
let mockDbContactCount = vi.fn();
let mockDbContactCreate = vi.fn();
let mockDbContactFindUnique = vi.fn();
let mockDbInteractionGroupBy = vi.fn();
let mockDbPipelineStageFindFirst = vi.fn();
let mockTrackGoalProgress = vi.fn().mockResolvedValue(undefined);
let mockGetTeamMemberIds = vi.fn().mockResolvedValue([]);
let mockRevalidateTag = vi.fn();

// ─── Mocked dependencies ──────────────────────────────────────────────────────
vi.mock('@/lib/db/db', () => ({
  db: {
    contact: {
      findMany: (...args: unknown[]) => mockDbContactFindMany(...args),
      count: (...args: unknown[]) => mockDbContactCount(...args),
      create: (...args: unknown[]) => mockDbContactCreate(...args),
      findUnique: (...args: unknown[]) => mockDbContactFindUnique(...args),
    },
    interaction: {
      groupBy: (...args: unknown[]) => mockDbInteractionGroupBy(...args),
    },
    pipelineStage: {
      findFirst: (...args: unknown[]) => mockDbPipelineStageFindFirst(...args),
    },
    tag: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
    contactTag: {
      createMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth/auth-helpers', () => ({
  getUserFromSession: (...args: unknown[]) => mockGetUserFromSession(...args),
}));

vi.mock('@/lib/db/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/services/goal-tracking', () => ({
  trackGoalProgress: (...args: unknown[]) => mockTrackGoalProgress(...args),
}));

vi.mock('@/lib/services/team', () => ({
  getTeamMemberIds: (...args: unknown[]) => mockGetTeamMemberIds(...args),
}));

vi.mock('next/cache', () => ({
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
}));

// ─── Helpers ────────────────────────────────────────────────────────────────────
const mockAuthUser = (overrides: Partial<{
  id: string;
  role: string;
  organizationId: string | null;
}> = {}) => ({
  id: 'user-1',
  email: 'test@maat.work',
  name: 'Test User',
  role: 'admin',
  isActive: true,
  organizationId: 'org-1',
  ...overrides,
});

// ─── Test data ────────────────────────────────────────────────────────────────
const mockContact = {
  id: 'contact-1',
  name: 'Roberto Garcia',
  email: 'roberto@example.com',
  phone: '+1234567890',
  company: 'Acme Corp',
  emoji: '😊',
  segment: 'enterprise',
  source: 'website',
  pipelineStageId: 'stage-1',
  assignedTo: 'user-1',
  organizationId: 'org-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  tags: [],
  pipelineStage: { id: 'stage-1', name: 'Prospecto', color: '#8B5CF6', order: 0 },
  assignedUser: { id: 'user-1', name: 'Test User', email: 'test@maat.work', image: null },
};

// ─── GET /api/contacts ────────────────────────────────────────────────────────
describe('GET /api/contacts', () => {
  beforeEach(() => {
    mockGetUserFromSession = vi.fn();
    mockDbContactFindMany = vi.fn();
    mockDbContactCount = vi.fn();
    mockDbInteractionGroupBy = vi.fn();
    mockGetTeamMemberIds = vi.fn().mockResolvedValue([]);
  });

  it('returns 401 when no session', async () => {
    mockGetUserFromSession.mockResolvedValue(null);

    const req = new NextRequest(
      new URL('http://localhost/api/contacts?organizationId=org-1', 'http://localhost')
    );
    const res = await GET(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 403 when organizationId does not match user org', async () => {
    mockGetUserFromSession.mockResolvedValue(mockAuthUser());

    const req = new NextRequest(
      new URL('http://localhost/api/contacts?organizationId=other-org', 'http://localhost')
    );
    const res = await GET(req);

    expect(res.status).toBe(403);
  });

  it('returns 200 with contacts array for admin role', async () => {
    mockGetUserFromSession.mockResolvedValue(mockAuthUser({ role: 'admin' }));
    mockDbContactFindMany.mockResolvedValue([mockContact]);
    mockDbContactCount.mockResolvedValue(1);
    mockDbInteractionGroupBy.mockResolvedValue([]);

    const req = new NextRequest(
      new URL('http://localhost/api/contacts?organizationId=org-1', 'http://localhost')
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.contacts).toBeInstanceOf(Array);
    expect(json.contacts.length).toBe(1);
    expect(json.pagination).toMatchObject({ total: 1, page: 1 });
  });

  it('returns 200 with contacts array for manager role', async () => {
    mockGetUserFromSession.mockResolvedValue(mockAuthUser({ role: 'manager' }));
    mockDbContactFindMany.mockResolvedValue([mockContact]);
    mockDbContactCount.mockResolvedValue(1);
    mockDbInteractionGroupBy.mockResolvedValue([]);

    const req = new NextRequest(
      new URL('http://localhost/api/contacts?organizationId=org-1', 'http://localhost')
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.contacts).toBeInstanceOf(Array);
  });

  it('returns 200 with contacts array for advisor role', async () => {
    mockGetUserFromSession.mockResolvedValue(mockAuthUser({ role: 'advisor' }));
    mockDbContactFindMany.mockResolvedValue([mockContact]);
    mockDbContactCount.mockResolvedValue(1);
    mockDbInteractionGroupBy.mockResolvedValue([]);

    const req = new NextRequest(
      new URL('http://localhost/api/contacts?organizationId=org-1', 'http://localhost')
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.contacts).toBeInstanceOf(Array);
  });

  it('returns 200 for member role', async () => {
    mockGetUserFromSession.mockResolvedValue(mockAuthUser({ role: 'member' }));
    mockDbContactFindMany.mockResolvedValue([]);
    mockDbContactCount.mockResolvedValue(0);
    mockDbInteractionGroupBy.mockResolvedValue([]);

    const req = new NextRequest(
      new URL('http://localhost/api/contacts?organizationId=org-1', 'http://localhost')
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.contacts).toBeInstanceOf(Array);
  });
});

// ─── POST /api/contacts ────────────────────────────────────────────────────────
describe('POST /api/contacts', () => {
  beforeEach(() => {
    mockGetUserFromSession = vi.fn();
    mockDbContactCreate = vi.fn();
    mockDbContactFindUnique = vi.fn();
    mockDbPipelineStageFindFirst = vi.fn();
    mockTrackGoalProgress = vi.fn().mockResolvedValue(undefined);
    mockRevalidateTag = vi.fn();
  });

  it('returns 401 when no session', async () => {
    mockGetUserFromSession.mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/contacts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ organizationId: 'org-1', name: 'Roberto Garcia' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 400 for invalid input (missing name)', async () => {
    mockGetUserFromSession.mockResolvedValue(mockAuthUser({ role: 'admin' }));

    const req = new NextRequest('http://localhost/api/contacts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ organizationId: 'org-1' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Validation failed');
  });

  it('returns 400 for invalid input (bad email)', async () => {
    mockGetUserFromSession.mockResolvedValue(mockAuthUser({ role: 'admin' }));

    const req = new NextRequest('http://localhost/api/contacts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ organizationId: 'org-1', name: 'Roberto', email: 'not-an-email' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when organizationId is missing', async () => {
    mockGetUserFromSession.mockResolvedValue(mockAuthUser());

    const req = new NextRequest('http://localhost/api/contacts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Roberto Garcia' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 403 when orgId in body does not match user org', async () => {
    mockGetUserFromSession.mockResolvedValue(mockAuthUser({ role: 'admin' }));

    const req = new NextRequest('http://localhost/api/contacts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ organizationId: 'other-org', name: 'Roberto Garcia' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(403);
  });

  it('returns 201 with created contact on success', async () => {
    mockGetUserFromSession.mockResolvedValue(mockAuthUser({ role: 'admin' }));
    mockDbPipelineStageFindFirst.mockResolvedValue({ id: 'stage-1' });
    mockDbContactCreate.mockResolvedValue(mockContact);
    mockDbContactFindUnique.mockResolvedValue({ ...mockContact, tags: [] });

    const req = new NextRequest('http://localhost/api/contacts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        organizationId: 'org-1',
        name: 'Roberto Garcia',
        email: 'roberto@example.com',
      }),
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toMatchObject({ id: 'contact-1', name: 'Roberto Garcia' });
  });
});
