import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { hasPermission, normalizeRole } from '@/lib/permissions';
import { financialPlanUpdateSchema } from '@/lib/schemas/planning';
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

    const financialPlan = await db.financialPlan.findUnique({
      where: { contactId },
      include: {
        metasVida: {
          orderBy: { order: 'asc' },
        },
        asignacionesEstrategicas: true,
        instrumentos: true,
        obligacionesNegociables: true,
        riesgos: true,
      },
    });

    logger.info({ operation: 'getFinancialPlan', requestId, contactId, duration_ms: Date.now() - start }, 'Financial plan fetched successfully');
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

    const body = await request.json();
    const parsed = financialPlanUpdateSchema.safeParse(body);

    if (!parsed.success) {
      logger.warn({ operation: 'upsertFinancialPlan', requestId, contactId }, 'Validation failed');
      const response = NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const data = parsed.data;

    // Check if plan exists
    const existingPlan = await db.financialPlan.findUnique({
      where: { contactId },
    });

    // Prepare main plan data
    const planData: any = {
      // Client profile
      edad: data.edad,
      profesion: data.profesion,
      objetivo: data.objetivo,
      perfilRiesgo: data.perfilRiesgo,
      aporteMensual: data.aporteMensual,
      aporteInicial: data.aporteInicial,
      horizonteMeses: data.horizonteMeses,
      tipoAporte: data.tipoAporte,
      // Financial health
      ingresosMensuales: data.ingresosMensuales,
      gastosMensuales: data.gastosMensuales,
      fondoEmergenciaMeses: data.fondoEmergenciaMeses,
      fondoEmergenciaActual: data.fondoEmergenciaActual,
      patrimonioActivos: data.patrimonioActivos,
      patrimonioDeudas: data.patrimonioDeudas,
      // Config
      webUrl: data.config?.webUrl,
      asesorNombre: data.config?.asesorNombre,
      asesorTelefono: data.config?.asesorTelefono,
      colorPrincipal: data.config?.colorPrincipal,
      colorAcento: data.config?.colorAcento,
      logoUrl: data.config?.logoUrl,
      // AI
      terminoFinanciero: data.ia?.terminoFinanciero,
      usarTerminoIA: data.ia?.usarTerminoIA,
      consejoFinal: data.ia?.consejoFinal,
      usarConsejoIA: data.ia?.usarConsejoIA,
      // Proyeccion
      proyeccionRetiro: data.proyeccion?.proyeccionRetiro,
      gastosPrincipales: data.proyeccion?.gastosPrincipales,
      observaciones: data.proyeccion?.observaciones,
    };

    // Clean up undefined values
    Object.keys(planData).forEach(key => {
      if (planData[key] === undefined) {
        delete planData[key];
      }
    });

    let result;

    if (existingPlan) {
      // Update existing plan
      result = await db.financialPlan.update({
        where: { id: existingPlan.id },
        data: planData,
        include: {
          metasVida: { orderBy: { order: 'asc' } },
          asignacionesEstrategicas: true,
          instrumentos: true,
          obligacionesNegociables: true,
          riesgos: true,
        },
      });
    } else {
      // Create new plan
      result = await db.financialPlan.create({
        data: {
          contactId,
          ...planData,
        },
        include: {
          metasVida: { orderBy: { order: 'asc' } },
          asignacionesEstrategicas: true,
          instrumentos: true,
          obligacionesNegociables: true,
          riesgos: true,
        },
      });
    }

    // Handle related data if provided
    if (data.metasVida !== undefined) {
      // Delete existing metas vida
      await db.metaVida.deleteMany({
        where: { financialPlanId: result.id },
      });
      // Create new metas vida
      if (data.metasVida.length > 0) {
        await db.metaVida.createMany({
          data: data.metasVida.map((meta, index) => ({
            financialPlanId: result.id,
            nombre: meta.nombre,
            montoObjetivo: meta.montoObjetivo ?? null,
            fechaEstimada: meta.fechaEstimada ? new Date(meta.fechaEstimada) : null,
            prioridad: meta.prioridad ?? null,
            notes: meta.notes ?? null,
            order: index,
          })),
        });
      }
    }

    if (data.instruments !== undefined) {
      // Delete existing instruments
      await db.planInstrument.deleteMany({
        where: { financialPlanId: result.id },
      });
      // Create new instruments
      if (data.instruments.length > 0) {
        await db.planInstrument.createMany({
          data: data.instruments.map(inst => ({
            financialPlanId: result.id,
            nombre: inst.nombre,
            tipo: inst.tipo ?? null,
            claseActivo: inst.claseActivo ?? null,
            emisor: inst.emisor ?? null,
            moneda: inst.moneda ?? null,
            rendimientoEsperado: inst.rendimientoEsperado ?? null,
            participacion: inst.participacion ?? null,
            isin: inst.isin ?? null,
            notas: inst.notas ?? null,
          })),
        });
      }
    }

    if (data.asignacionesEstrategicas !== undefined) {
      // Delete existing asignaciones
      await db.asignacionEstrategica.deleteMany({
        where: { financialPlanId: result.id },
      });
      // Create new asignaciones
      if (data.asignacionesEstrategicas.length > 0) {
        await db.asignacionEstrategica.createMany({
          data: data.asignacionesEstrategicas.map(asig => ({
            financialPlanId: result.id,
            claseActivo: asig.claseActivo,
            porcentaje: asig.porcentaje,
            descripcion: asig.descripcion ?? null,
          })),
        });
      }
    }

    if (data.obligacionesNegociables !== undefined) {
      // Delete existing obligaciones
      await db.obligacionNegociable.deleteMany({
        where: { financialPlanId: result.id },
      });
      // Create new obligaciones
      if (data.obligacionesNegociables.length > 0) {
        await db.obligacionNegociable.createMany({
          data: data.obligacionesNegociables.map(obl => ({
            financialPlanId: result.id,
            acreedor: obl.acreedor,
            tipo: obl.tipo ?? null,
            saldoPendiente: obl.saldoPendiente ?? null,
            tasaInteres: obl.tasaInteres ?? null,
            cuotaMensual: obl.cuotaMensual ?? null,
            fechaVencimiento: obl.fechaVencimiento ? new Date(obl.fechaVencimiento) : null,
            origen: obl.origen ?? null,
            notas: obl.notas ?? null,
          })),
        });
      }
    }

    if (data.riesgos !== undefined) {
      // Delete existing riesgos
      await db.riesgo.deleteMany({
        where: { financialPlanId: result.id },
      });
      // Create new riesgos
      if (data.riesgos.length > 0) {
        await db.riesgo.createMany({
          data: data.riesgos.map(r => ({
            financialPlanId: result.id,
            nombre: r.nombre,
            tipo: r.tipo ?? null,
            probabilidad: r.probabilidad ?? null,
            impacto: r.impacto ?? null,
            mitigacion: r.mitigacion ?? null,
            severity: r.severity ?? null,
          })),
        });
      }
    }

    // Fetch updated plan with all relations
    const updatedPlan = await db.financialPlan.findUnique({
      where: { id: result.id },
      include: {
        metasVida: { orderBy: { order: 'asc' } },
        asignacionesEstrategicas: true,
        instrumentos: true,
        obligacionesNegociables: true,
        riesgos: true,
      },
    });

    logger.info({ operation: 'upsertFinancialPlan', requestId, contactId, duration_ms: Date.now() - start }, 'Financial plan upserted successfully');
    const response = NextResponse.json(updatedPlan);
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

    // Delete plan (cascade will handle related records)
    await db.financialPlan.delete({
      where: { contactId },
    });

    logger.info({ operation: 'deleteFinancialPlan', requestId, contactId, duration_ms: Date.now() - start }, 'Financial plan deleted successfully');
    const response = NextResponse.json({ success: true });
    response.headers.set('x-request-id', requestId);
    return response;
  } catch (error) {
    logger.error({ err: error, operation: 'deleteFinancialPlan', requestId, duration_ms: Date.now() - start }, 'Failed to delete financial plan');
    const errorResponse = NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    errorResponse.headers.set('x-request-id', requestId);
    return errorResponse;
  }
}
