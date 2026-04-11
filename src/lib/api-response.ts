// Shared API response utilities for MaatWork CRM
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserFromSession } from './auth/auth-helpers';
import { logger } from './db/logger';

export function createRequestContext(request: NextRequest) {
  return {
    start: Date.now(),
    requestId: request.headers.get('x-request-id') || crypto.randomUUID(),
  };
}

export async function requireAuth(request: NextRequest) {
  const user = await getUserFromSession(request);
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), user: null };
  }
  return { error: null, user };
}

export function requireOrganizationAccess(organizationId: string | null, user: { organizationId: string | null }, requestId: string) {
  if (!organizationId) return { error: NextResponse.json({ error: 'organizationId es requerido' }, { status: 400 }), access: false };
  if (organizationId !== user.organizationId) {
    return { error: NextResponse.json({ error: 'No tienes acceso a esta organización' }, { status: 403 }), access: false };
  }
  return { error: null, access: true };
}

export function requireValidId(id: string, requestId: string) {
  if (!id || id.length < 1) {
    return { error: NextResponse.json({ error: 'ID inválido' }, { status: 400 }), valid: false };
  }
  return { error: null, valid: true };
}

export function paginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export function withErrorHandling(operation: string, handler: () => Promise<unknown>, requestId: string) {
  try {
    return { success: true, result: handler() };
  } catch (error) {
    logger.error({ err: error, operation, requestId }, 'Operation failed');
    return { success: false, error };
  }
}
