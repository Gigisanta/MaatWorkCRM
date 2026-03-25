import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { hasPermission, normalizeRole } from '@/lib/permissions';
import { logger } from '@/lib/logger';

// Helper to check if targetUserId is in the team managed by managerId
async function isInTeam(targetUserId: string, managerId: string): Promise<boolean> {
  const teamMember = await db.user.findFirst({
    where: {
      id: targetUserId,
      managerId: managerId,
    },
    select: { id: true },
  });
  return !!teamMember;
}

// GET /api/contacts/[id]/planning - Get financial plan for a contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'getFinancialPlan', requestId }, 'Fetching financial plan');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'getFinancialPlan', requestId }, 'Unauthorized access attempt');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const { id: contactId } = await params;

    // Get contact to check permissions
    const contact = await db.contact.findUnique({
      where: { id: contactId },
      select: { assignedTo: true, organizationId: true },
    });

    if (!contact) {
      logger.warn({ operation: 'getFinancialPlan', requestId, contactId }, 'Contact not found');
      const response = NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const userRole = normalizeRole(user.role);
    const isOwner = contact.assignedTo === user.id;
    const isTeamMember = contact.assignedTo
      ? await isInTeam(contact.assignedTo, user.id)
      : false;

    // Check read permissions
    if (!isOwner) {
      if (hasPermission(userRole, 'contacts:read:team') && isTeamMember) {
        // Allow
      } else if (!hasPermission(userRole, 'contacts:read:all')) {
        logger.warn({ operation: 'getFinancialPlan', requestId, contactId }, 'Forbidden: insufficient permissions');
        const response = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        response.headers.set('x-request-id', requestId);
        return response;
      }
    }

    // Planning models (financialPlan, metaVida, planInstrument, asignacionEstrategica,
    // obligacionNegociable, riesgo) do not exist in the schema — return empty response
    logger.info({ operation: 'getFinancialPlan', requestId, contactId, duration_ms: Date.now() - start }, 'Financial plan fetched successfully');
    const response = NextResponse.json(null);
    response.headers.set('x-request-id', requestId);
    return response;
  } catch (error) {
    logger.error({ err: error, operation: 'getFinancialPlan', requestId, duration_ms: Date.now() - start }, 'Failed to fetch financial plan');
    const errorResponse = NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    errorResponse.headers.set('x-request-id', requestId);
    return errorResponse;
  }
}

// POST /api/contacts/[id]/planning - Create or update financial plan (upsert)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'upsertFinancialPlan', requestId }, 'Upserting financial plan');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'upsertFinancialPlan', requestId }, 'Unauthorized access attempt');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const { id: contactId } = await params;

    // Get contact to check permissions
    const contact = await db.contact.findUnique({
      where: { id: contactId },
      select: { assignedTo: true, organizationId: true },
    });

    if (!contact) {
      logger.warn({ operation: 'upsertFinancialPlan', requestId, contactId }, 'Contact not found');
      const response = NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const userRole = normalizeRole(user.role);
    const isOwner = contact.assignedTo === user.id;
    const isTeamMember = contact.assignedTo
      ? await isInTeam(contact.assignedTo, user.id)
      : false;

    // Check update permissions
    if (!isOwner) {
      if (hasPermission(userRole, 'contacts:update:team') && isTeamMember) {
        // Allow
      } else if (!hasPermission(userRole, 'contacts:update:all')) {
        logger.warn({ operation: 'upsertFinancialPlan', requestId, contactId }, 'Forbidden: insufficient permissions');
        const response = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        response.headers.set('x-request-id', requestId);
        return response;
      }
    }

    // Planning models (financialPlan, metaVida, planInstrument, asignacionEstrategica,
    // obligacionNegociable, riesgo) do not exist in the schema — return not implemented
    logger.info({ operation: 'upsertFinancialPlan', requestId, contactId, duration_ms: Date.now() - start }, 'Financial plan upsert skipped — models not in schema');
    const response = NextResponse.json(
      { error: 'Planning feature unavailable — models not defined in schema' },
      { status: 501 }
    );
    response.headers.set('x-request-id', requestId);
    return response;
  } catch (error) {
    logger.error({ err: error, operation: 'upsertFinancialPlan', requestId, duration_ms: Date.now() - start }, 'Failed to upsert financial plan');
    const errorResponse = NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    errorResponse.headers.set('x-request-id', requestId);
    return errorResponse;
  }
}

// DELETE /api/contacts/[id]/planning - Delete financial plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'deleteFinancialPlan', requestId }, 'Deleting financial plan');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'deleteFinancialPlan', requestId }, 'Unauthorized access attempt');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const { id: contactId } = await params;

    // Get contact to check permissions
    const contact = await db.contact.findUnique({
      where: { id: contactId },
      select: { assignedTo: true },
    });

    if (!contact) {
      logger.warn({ operation: 'deleteFinancialPlan', requestId, contactId }, 'Contact not found');
      const response = NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const userRole = normalizeRole(user.role);
    const isOwner = contact.assignedTo === user.id;
    const isTeamMember = contact.assignedTo
      ? await isInTeam(contact.assignedTo, user.id)
      : false;

    // Check delete permissions
    if (!isOwner) {
      if (hasPermission(userRole, 'contacts:delete:team') && isTeamMember) {
        // Allow
      } else if (!hasPermission(userRole, 'contacts:delete:all')) {
        logger.warn({ operation: 'deleteFinancialPlan', requestId, contactId }, 'Forbidden: insufficient permissions');
        const response = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        response.headers.set('x-request-id', requestId);
        return response;
      }
    }

    // Planning models (financialPlan, metaVida, planInstrument, asignacionEstrategica,
    // obligacionNegociable, riesgo) do not exist in the schema — return not implemented
    logger.info({ operation: 'deleteFinancialPlan', requestId, contactId, duration_ms: Date.now() - start }, 'Financial plan delete skipped — models not in schema');
    const response = NextResponse.json(
      { error: 'Planning feature unavailable — models not defined in schema' },
      { status: 501 }
    );
    response.headers.set('x-request-id', requestId);
    return response;
  } catch (error) {
    logger.error({ err: error, operation: 'deleteFinancialPlan', requestId, duration_ms: Date.now() - start }, 'Failed to delete financial plan');
    const errorResponse = NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    errorResponse.headers.set('x-request-id', requestId);
    return errorResponse;
  }
}
