import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { hasPermission, normalizeRole } from '@/lib/permissions';
import { logger } from '@/lib/logger';
import {
  financialPlanSchema,
  financialPlanUpdateSchema,
} from '@/lib/schemas/planning';

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

    if (!isOwner) {
      if (hasPermission(userRole, 'contacts:read:team') && isTeamMember) {
        // Allow
      } else if (!hasPermission(userRole, 'contacts:read:all')) {
        logger.warn({ operation: 'getFinancialPlan', requestId, contactId }, 'Forbidden');
        const response = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        response.headers.set('x-request-id', requestId);
        return response;
      }
    }

    const financialPlan = await db.financialPlan.findUnique({
      where: { contactId },
      include: {
        metasVida: true,
        instruments: true,
        asignacionesEstrategicas: true,
        obligacionesNegociables: true,
        riesgos: true,
      },
    });

    logger.info({ operation: 'getFinancialPlan', requestId, contactId, duration_ms: Date.now() - start }, 'Financial plan fetched');
    const response = NextResponse.json(financialPlan);
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

    if (!isOwner) {
      if (hasPermission(userRole, 'contacts:update:team') && isTeamMember) {
        // Allow
      } else if (!hasPermission(userRole, 'contacts:update:all')) {
        logger.warn({ operation: 'upsertFinancialPlan', requestId, contactId }, 'Forbidden');
        const response = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        response.headers.set('x-request-id', requestId);
        return response;
      }
    }

    const body = await request.json();
    const parsed = financialPlanSchema.safeParse(body);
    if (!parsed.success) {
      logger.warn({ operation: 'upsertFinancialPlan', requestId, errors: parsed.error.flatten() }, 'Validation failed');
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    // Upsert: delete existing related records and create new ones
    const existing = await db.financialPlan.findUnique({ where: { contactId } });

    const plan = await db.financialPlan.upsert({
      where: { contactId },
      create: {
        contactId,
        edad: data.edad,
        profesion: data.profesion,
        objetivo: data.objetivo,
        perfilRiesgo: data.perfilRiesgo ?? null,
        aporteMensual: data.aporteMensual ?? null,
        aporteInicial: data.aporteInicial ?? null,
        horizonteMeses: data.horizonteMeses ?? null,
        tipoAporte: data.tipoAporte ?? null,
        ingresosMensuales: data.ingresosMensuales ?? null,
        gastosMensuales: data.gastosMensuales ?? null,
        fondoEmergenciaMeses: data.fondoEmergenciaMeses ?? null,
        fondoEmergenciaActual: data.fondoEmergenciaActual ?? null,
        patrimonioActivos: data.patrimonioActivos ?? null,
        patrimonioDeudas: data.patrimonioDeudas ?? null,
        config: data.config ? JSON.stringify(data.config) : null,
        ia: data.ia ? JSON.stringify(data.ia) : null,
        proyeccion: data.proyeccion ? JSON.stringify(data.proyeccion) : null,
      },
      update: {
        edad: data.edad,
        profesion: data.profesion,
        objetivo: data.objetivo,
        perfilRiesgo: data.perfilRiesgo ?? null,
        aporteMensual: data.aporteMensual ?? null,
        aporteInicial: data.aporteInicial ?? null,
        horizonteMeses: data.horizonteMeses ?? null,
        tipoAporte: data.tipoAporte ?? null,
        ingresosMensuales: data.ingresosMensuales ?? null,
        gastosMensuales: data.gastosMensuales ?? null,
        fondoEmergenciaMeses: data.fondoEmergenciaMeses ?? null,
        fondoEmergenciaActual: data.fondoEmergenciaActual ?? null,
        patrimonioActivos: data.patrimonioActivos ?? null,
        patrimonioDeudas: data.patrimonioDeudas ?? null,
        config: data.config ? JSON.stringify(data.config) : null,
        ia: data.ia ? JSON.stringify(data.ia) : null,
        proyeccion: data.proyeccion ? JSON.stringify(data.proyeccion) : null,
      },
    });

    // Delete existing related records
    await db.metaVida.deleteMany({ where: { financialPlanId: plan.id } });
    await db.planInstrument.deleteMany({ where: { financialPlanId: plan.id } });
    await db.asignacionEstrategica.deleteMany({ where: { financialPlanId: plan.id } });
    await db.obligacionNegociable.deleteMany({ where: { financialPlanId: plan.id } });
    await db.riesgo.deleteMany({ where: { financialPlanId: plan.id } });

    // Create related records
    if (data.metasVida && data.metasVida.length > 0) {
      await db.metaVida.createMany({
        data: data.metasVida.map(m => ({
          financialPlanId: plan.id,
          nombre: m.nombre,
          montoObjetivo: m.montoObjetivo ?? null,
          fechaEstimada: m.fechaEstimada ? new Date(m.fechaEstimada) : null,
          prioridad: m.prioridad ?? null,
          notes: m.notes ?? null,
        })),
      });
    }

    if (data.instruments && data.instruments.length > 0) {
      await db.planInstrument.createMany({
        data: data.instruments.map(i => ({
          financialPlanId: plan.id,
          nombre: i.nombre,
          tipo: i.tipo ?? null,
          claseActivo: i.claseActivo ?? null,
          emisor: i.emisor ?? null,
          moneda: i.moneda ?? null,
          rendimientoEsperado: i.rendimientoEsperado ?? null,
          participacion: i.participacion ?? null,
          isin: i.isin ?? null,
          notas: i.notas ?? null,
        })),
      });
    }

    if (data.asignacionesEstrategicas && data.asignacionesEstrategicas.length > 0) {
      await db.asignacionEstrategica.createMany({
        data: data.asignacionesEstrategicas.map(a => ({
          financialPlanId: plan.id,
          claseActivo: a.claseActivo,
          porcentaje: a.porcentaje,
          descripcion: a.descripcion ?? null,
        })),
      });
    }

    if (data.obligacionesNegociables && data.obligacionesNegociables.length > 0) {
      await db.obligacionNegociable.createMany({
        data: data.obligacionesNegociables.map(o => ({
          financialPlanId: plan.id,
          acreedor: o.acreedor,
          tipo: o.tipo ?? null,
          saldoPendiente: o.saldoPendiente ?? null,
          tasaInteres: o.tasaInteres ?? null,
          cuotaMensual: o.cuotaMensual ?? null,
          fechaVencimiento: o.fechaVencimiento ? new Date(o.fechaVencimiento) : null,
          origen: o.origen ?? null,
          notas: o.notas ?? null,
        })),
      });
    }

    if (data.riesgos && data.riesgos.length > 0) {
      await db.riesgo.createMany({
        data: data.riesgos.map(r => ({
          financialPlanId: plan.id,
          nombre: r.nombre,
          tipo: r.tipo ?? null,
          probabilidad: r.probabilidad ?? null,
          impacto: r.impacto ?? null,
          mitigacion: r.mitigacion ?? null,
          severity: r.severity ?? null,
        })),
      });
    }

    // Fetch complete plan with relations
    const completePlan = await db.financialPlan.findUnique({
      where: { id: plan.id },
      include: {
        metasVida: true,
        instruments: true,
        asignacionesEstrategicas: true,
        obligacionesNegociables: true,
        riesgos: true,
      },
    });

    logger.info({ operation: 'upsertFinancialPlan', requestId, contactId, planId: plan.id, duration_ms: Date.now() - start }, 'Financial plan upserted');
    const response = NextResponse.json(completePlan);
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

    if (!isOwner) {
      if (hasPermission(userRole, 'contacts:delete:team') && isTeamMember) {
        // Allow
      } else if (!hasPermission(userRole, 'contacts:delete:all')) {
        logger.warn({ operation: 'deleteFinancialPlan', requestId, contactId }, 'Forbidden');
        const response = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        response.headers.set('x-request-id', requestId);
        return response;
      }
    }

    await db.financialPlan.deleteMany({ where: { contactId } });

    logger.info({ operation: 'deleteFinancialPlan', requestId, contactId, duration_ms: Date.now() - start }, 'Financial plan deleted');
    const response = NextResponse.json({ ok: true });
    response.headers.set('x-request-id', requestId);
    return response;
  } catch (error) {
    logger.error({ err: error, operation: 'deleteFinancialPlan', requestId, duration_ms: Date.now() - start }, 'Failed to delete financial plan');
    const errorResponse = NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    errorResponse.headers.set('x-request-id', requestId);
    return errorResponse;
  }
}
