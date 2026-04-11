import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Route under test
import { GET, POST } from '@/app/api/tasks/route';

// ─── Mutable mock refs (reset in beforeEach) ────────────────────────────────────
let mockGetUserFromSession = vi.fn();
let mockDbTaskFindMany = vi.fn();
let mockDbTaskCount = vi.fn();
let mockDbTaskCreate = vi.fn();
let mockGetTeamMemberIds = vi.fn().mockResolvedValue([]);

// ─── Mocked dependencies ──────────────────────────────────────────────────────
vi.mock('@/lib/db/db', () => ({
  db: {
    task: {
      findMany: (...args: unknown[]) => mockDbTaskFindMany(...args),
      count: (...args: unknown[]) => mockDbTaskCount(...args),
      create: (...args: unknown[]) => mockDbTaskCreate(...args),
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

vi.mock('@/lib/services/team', () => ({
  getTeamMemberIds: (...args: unknown[]) => mockGetTeamMemberIds(...args),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

const mockTask = {
  id: 'task-1',
  title: 'Follow up with Roberto',
  description: 'Send proposal email',
  status: 'pending',
  priority: 'high',
  dueDate: new Date('2026-04-20'),
  assignedTo: 'user-1',
  contactId: 'contact-1',
  organizationId: 'org-1',
  isRecurrent: false,
  recurrenceRule: null,
  parentTaskId: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  assignedUser: { id: 'user-1', name: 'Test User', email: 'test@maat.work', image: null },
  contact: { id: 'contact-1', name: 'Roberto Garcia', email: 'roberto@example.com', company: 'Acme' },
};

// ─── GET /api/tasks ────────────────────────────────────────────────────────────
describe('GET /api/tasks', () => {
  beforeEach(() => {
    mockGetUserFromSession = vi.fn();
    mockDbTaskFindMany = vi.fn();
    mockDbTaskCount = vi.fn();
    mockGetTeamMemberIds = vi.fn().mockResolvedValue([]);
  });

  it('returns 401 when no session', async () => {
    mockGetUserFromSession.mockResolvedValue(null);

    const req = new NextRequest(
      new URL('http://localhost/api/tasks?organizationId=org-1', 'http://localhost')
    );
    const res = await GET(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 400 when organizationId is missing', async () => {
    mockGetUserFromSession.mockResolvedValue(mockAuthUser());

    const req = new NextRequest(new URL('http://localhost/api/tasks', 'http://localhost'));
    const res = await GET(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('organizationId es requerido');
  });

  it('returns 403 when organizationId does not match user org', async () => {
    mockGetUserFromSession.mockResolvedValue(mockAuthUser());

    const req = new NextRequest(
      new URL('http://localhost/api/tasks?organizationId=other-org', 'http://localhost')
    );
    const res = await GET(req);

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('Forbidden');
  });

  it('returns 200 with tasks array on success', async () => {
    mockGetUserFromSession.mockResolvedValue(mockAuthUser({ role: 'admin' }));
    mockDbTaskFindMany.mockResolvedValue([mockTask]);
    mockDbTaskCount.mockResolvedValue(1);

    const req = new NextRequest(
      new URL('http://localhost/api/tasks?organizationId=org-1', 'http://localhost')
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.tasks).toBeInstanceOf(Array);
    expect(json.tasks.length).toBe(1);
    expect(json.tasks[0]).toMatchObject({ id: 'task-1', title: 'Follow up with Roberto' });
    expect(json.pagination).toMatchObject({ total: 1, page: 1, limit: 20 });
  });

  it('returns 200 with filtered tasks by status', async () => {
    mockGetUserFromSession.mockResolvedValue(mockAuthUser({ role: 'admin' }));
    mockDbTaskFindMany.mockResolvedValue([mockTask]);
    mockDbTaskCount.mockResolvedValue(1);

    const req = new NextRequest(
      new URL('http://localhost/api/tasks?organizationId=org-1&status=pending', 'http://localhost')
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.tasks).toBeInstanceOf(Array);
  });

  it('returns 200 with paginated results', async () => {
    mockGetUserFromSession.mockResolvedValue(mockAuthUser({ role: 'admin' }));
    mockDbTaskFindMany.mockResolvedValue([mockTask]);
    mockDbTaskCount.mockResolvedValue(50);

    const req = new NextRequest(
      new URL('http://localhost/api/tasks?organizationId=org-1&page=2&limit=10', 'http://localhost')
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.pagination).toMatchObject({
      page: 2,
      limit: 10,
      total: 50,
      totalPages: 5,
    });
  });
});

// ─── POST /api/tasks ──────────────────────────────────────────────────────────
describe('POST /api/tasks', () => {
  beforeEach(() => {
    mockGetUserFromSession = vi.fn();
    mockDbTaskCreate = vi.fn();
  });

  it('returns 401 when no session', async () => {
    mockGetUserFromSession.mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ organizationId: 'org-1', title: 'New Task' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 400 when title is missing', async () => {
    mockGetUserFromSession.mockResolvedValue(mockAuthUser());

    const req = new NextRequest('http://localhost/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ organizationId: 'org-1' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when organizationId is missing', async () => {
    mockGetUserFromSession.mockResolvedValue(mockAuthUser());

    const req = new NextRequest('http://localhost/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'New Task' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid status value', async () => {
    mockGetUserFromSession.mockResolvedValue(mockAuthUser());

    const req = new NextRequest('http://localhost/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ organizationId: 'org-1', title: 'New Task', status: 'invalid-status' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid priority value', async () => {
    mockGetUserFromSession.mockResolvedValue(mockAuthUser());

    const req = new NextRequest('http://localhost/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ organizationId: 'org-1', title: 'New Task', priority: 'invalid-priority' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 403 when orgId in body does not match user org', async () => {
    mockGetUserFromSession.mockResolvedValue(mockAuthUser());

    const req = new NextRequest('http://localhost/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ organizationId: 'other-org', title: 'New Task' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('Forbidden');
  });

  it('returns 201 with created task on success', async () => {
    mockGetUserFromSession.mockResolvedValue(mockAuthUser());
    mockDbTaskCreate.mockResolvedValue(mockTask);

    const req = new NextRequest('http://localhost/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        organizationId: 'org-1',
        title: 'Follow up with Roberto',
        description: 'Send proposal email',
        status: 'pending',
        priority: 'high',
      }),
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toMatchObject({ id: 'task-1', title: 'Follow up with Roberto' });
  });
});
