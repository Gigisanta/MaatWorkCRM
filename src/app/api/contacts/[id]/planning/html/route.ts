import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { generatePlanHTML, type PlanData } from '@/lib/generatePlan';
import { logger } from '@/lib/db/logger';

// POST /api/contacts/[id]/planning/html - Generate HTML for financial plan
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'generatePlanHTML', requestId }, 'Generating plan HTML');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'generatePlanHTML', requestId }, 'Unauthorized access attempt');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    const body = await request.json();
    const { planData } = body as { planData: PlanData };

    if (!planData) {
      logger.warn({ operation: 'generatePlanHTML', requestId }, 'Missing planData');
      const response = NextResponse.json({ error: 'planData es requerido' }, { status: 400 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    // Generate HTML
    const html = generatePlanHTML(planData);

    logger.info({ operation: 'generatePlanHTML', requestId, duration_ms: Date.now() - start }, 'Plan HTML generated successfully');
    const response = NextResponse.json({ html });
    response.headers.set('x-request-id', requestId);
    return response;
  } catch (error) {
    logger.error({ err: error, operation: 'generatePlanHTML', requestId, duration_ms: Date.now() - start }, 'Failed to generate plan HTML');
    const errorResponse = NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    errorResponse.headers.set('x-request-id', requestId);
    return errorResponse;
  }
}
