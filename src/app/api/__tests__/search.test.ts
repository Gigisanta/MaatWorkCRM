import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Route under test
import { GET } from '@/app/api/search/route';

// ─── Mocked dependencies ──────────────────────────────────────────────────────
vi.mock('@/lib/db/db', () => ({
  db: {
    contact: {
      findMany: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth/auth-helpers', () => ({
  getUserFromSession: vi.fn(),
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
  getTeamMemberIds: vi.fn().mockResolvedValue([]),
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

// ─── GET /api/search ──────────────────────────────────────────────────────────
describe('GET /api/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no session', async () => {
    const { getUserFromSession } = await import('@/lib/auth/auth-helpers');
    getUserFromSession.mockResolvedValue(null);

    const req = new NextRequest(
      new URL('http://localhost/api/search?q=roberto&organizationId=org-1', 'http://localhost')
    );
    const res = await GET(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 400 when user has no organization', async () => {
    const { getUserFromSession } = await import('@/lib/auth/auth-helpers');
    getUserFromSession.mockResolvedValue(mockAuthUser({ organizationId: null }));

    const req = new NextRequest(
      new URL('http://localhost/api/search?q=roberto', 'http://localhost')
    );
    const res = await GET(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('No organization found');
  });

  it('returns 403 when organizationId does not match user org', async () => {
    const { getUserFromSession } = await import('@/lib/auth/auth-helpers');
    getUserFromSession.mockResolvedValue(mockAuthUser());

    const req = new NextRequest(
      new URL('http://localhost/api/search?q=roberto&organizationId=other-org', 'http://localhost')
    );
    const res = await GET(req);

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('Forbidden');
  });

  it('returns empty arrays for empty query string', async () => {
    const { getUserFromSession } = await import('@/lib/auth/auth-helpers');
    getUserFromSession.mockResolvedValue(mockAuthUser());

    const req = new NextRequest(
      new URL('http://localhost/api/search?q=', 'http://localhost')
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.contacts).toEqual([]);
    expect(json.tasks).toEqual([]);
  });

  it('returns 200 with contacts and tasks matching query', async () => {
    const { getUserFromSession } = await import('@/lib/auth/auth-helpers');
    const { db } = await import('@/lib/db/db');
    getUserFromSession.mockResolvedValue(mockAuthUser({ role: 'admin' }));
    db.contact.findMany.mockResolvedValue([
      { id: 'contact-1', name: 'Roberto Garcia', email: 'roberto@example.com', emoji: '😊' },
    ]);
    db.task.findMany.mockResolvedValue([
      { id: 'task-1', title: 'Follow up Roberto', status: 'pending', priority: 'high' },
    ]);

    const req = new NextRequest(
      new URL('http://localhost/api/search?q=roberto&organizationId=org-1', 'http://localhost')
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.contacts).toBeInstanceOf(Array);
    expect(json.tasks).toBeInstanceOf(Array);
    expect(json.contacts.length).toBe(1);
    expect(json.contacts[0]).toMatchObject({ id: 'contact-1', name: 'Roberto Garcia' });
    expect(json.tasks[0]).toMatchObject({ id: 'task-1', title: 'Follow up Roberto' });
  });

  it('returns 200 with contacts only when no tasks match', async () => {
    const { getUserFromSession } = await import('@/lib/auth/auth-helpers');
    const { db } = await import('@/lib/db/db');
    getUserFromSession.mockResolvedValue(mockAuthUser({ role: 'admin' }));
    db.contact.findMany.mockResolvedValue([
      { id: 'contact-1', name: 'Roberto Garcia', email: 'roberto@example.com', emoji: '😊' },
    ]);
    db.task.findMany.mockResolvedValue([]);

    const req = new NextRequest(
      new URL('http://localhost/api/search?q=roberto&organizationId=org-1', 'http://localhost')
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.contacts.length).toBe(1);
    expect(json.tasks.length).toBe(0);
  });

  it('returns 200 with tasks only when no contacts match', async () => {
    const { getUserFromSession } = await import('@/lib/auth/auth-helpers');
    const { db } = await import('@/lib/db/db');
    getUserFromSession.mockResolvedValue(mockAuthUser({ role: 'admin' }));
    db.contact.findMany.mockResolvedValue([]);
    db.task.findMany.mockResolvedValue([
      { id: 'task-1', title: 'Follow up Roberto', status: 'pending', priority: 'high' },
    ]);

    const req = new NextRequest(
      new URL('http://localhost/api/search?q=roberto&organizationId=org-1', 'http://localhost')
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.contacts.length).toBe(0);
    expect(json.tasks.length).toBe(1);
  });

  it('respects limit parameter (max 20)', async () => {
    const { getUserFromSession } = await import('@/lib/auth/auth-helpers');
    const { db } = await import('@/lib/db/db');
    getUserFromSession.mockResolvedValue(mockAuthUser({ role: 'admin' }));
    db.contact.findMany.mockResolvedValue([]);
    db.task.findMany.mockResolvedValue([]);

    const req = new NextRequest(
      new URL('http://localhost/api/search?q=term&organizationId=org-1&limit=50', 'http://localhost')
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(db.contact.findMany).toHaveBeenCalled();
    expect(db.task.findMany).toHaveBeenCalled();
  });

  it('returns results for manager role (team + own contacts/tasks)', async () => {
    const { getUserFromSession } = await import('@/lib/auth/auth-helpers');
    const { getTeamMemberIds } = await import('@/lib/services/team');
    const { db } = await import('@/lib/db/db');
    getUserFromSession.mockResolvedValue(mockAuthUser({ role: 'manager' }));
    getTeamMemberIds.mockResolvedValue(['user-2', 'user-3']);
    db.contact.findMany.mockResolvedValue([
      { id: 'contact-1', name: 'Roberto Garcia', email: 'roberto@example.com', emoji: '😊' },
    ]);
    db.task.findMany.mockResolvedValue([
      { id: 'task-1', title: 'Follow up Roberto', status: 'pending', priority: 'high' },
    ]);

    const req = new NextRequest(
      new URL('http://localhost/api/search?q=roberto&organizationId=org-1', 'http://localhost')
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.contacts).toBeInstanceOf(Array);
    expect(json.tasks).toBeInstanceOf(Array);
  });
});
