import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { hasPermission, normalizeRole } from '@/lib/roles';
import { logger } from '@/lib/db/logger';

export const dynamic = 'force-dynamic';

// POST /api/contacts/import/confirm - Confirm and execute import
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'importContactsConfirm', requestId }, 'Starting import confirmation');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'importContactsConfirm', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = normalizeRole(user.role);
    if (!hasPermission(userRole, 'contacts:create')) {
      logger.warn({ operation: 'importContactsConfirm', requestId }, 'Forbidden: insufficient permissions');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const contacts = body.contacts as Array<{
      name: string;
      email: string | null;
      phone: string | null;
      company: string | null;
      segment: string | null;
      source: string | null;
      emoji: string;
      assignedTo: string;
      organizationId: string;
      lastInteractionDate: Date;
    }>;

    if (!contacts || contacts.length === 0) {
      logger.warn({ operation: 'importContactsConfirm', requestId }, 'No contacts to import');
      return NextResponse.json({ error: 'No contacts to import' }, { status: 400 });
    }

    // Verify all contacts belong to user's organization
    for (const contact of contacts) {
      if (contact.organizationId !== user.organizationId) {
        logger.warn({ operation: 'importContactsConfirm', requestId }, 'Organization mismatch in contact');
        return NextResponse.json({ error: 'Organization mismatch detected' }, { status: 400 });
      }
    }

    // Get default pipeline stage
    const defaultStage = await db.pipelineStage.findFirst({
      where: { organizationId: user.organizationId as string, isDefault: true },
    });

    // Create all contacts
    const created = await db.contact.createMany({
      data: contacts.map(c => ({
        name: c.name,
        email: c.email,
        phone: c.phone,
        company: c.company,
        segment: c.segment,
        source: c.source,
        emoji: c.emoji || '👤',
        assignedTo: c.assignedTo || user.id,
        organizationId: c.organizationId,
        pipelineStageId: defaultStage?.id ?? null,
        lastInteractionDate: c.lastInteractionDate,
      })),
    });

    logger.info({
      operation: 'importContactsConfirm',
      requestId,
      createdCount: created.count,
      duration_ms: Date.now() - start,
    }, 'Contacts imported successfully');

    return NextResponse.json({ created: created.count });
  } catch (error) {
    logger.error({
      err: error,
      operation: 'importContactsConfirm',
      requestId,
      duration_ms: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : String(error),
    }, 'Failed to import contacts');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}