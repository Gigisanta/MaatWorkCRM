import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';

// GET /api/training - List training materials with category filter
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'listTrainingMaterials', requestId }, 'Listing training materials');

    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!organizationId) {
      logger.warn({ operation: 'listTrainingMaterials', requestId }, 'Validation failed: organizationId is required');
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { organizationId };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [materials, total] = await Promise.all([
      db.trainingMaterial.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.trainingMaterial.count({ where }),
    ]);

    logger.info({ operation: 'listTrainingMaterials', requestId, count: materials.length, total, duration_ms: Date.now() - start }, 'Training materials listed successfully');

    return NextResponse.json({
      materials,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'listTrainingMaterials', requestId, duration_ms: Date.now() - start }, 'Failed to list training materials');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}

// POST /api/training - Create a new training material
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'createTrainingMaterial', requestId }, 'Creating training material');

    const body = await request.json();
    const {
      organizationId,
      title,
      description,
      url,
      content,
      category,
      createdBy,
    } = body;

    if (!organizationId || !title) {
      logger.warn({ operation: 'createTrainingMaterial', requestId }, 'Validation failed: organizationId and title are required');
      return NextResponse.json({ error: 'organizationId and title are required' }, { status: 400, headers: { 'x-request-id': requestId } });
    }

    const material = await db.trainingMaterial.create({
      data: {
        organizationId,
        title,
        description,
        url,
        content,
        category: category || 'other',
        createdBy,
      },
    });

    logger.info({ operation: 'createTrainingMaterial', requestId, materialId: material.id, duration_ms: Date.now() - start }, 'Training material created successfully');

    return NextResponse.json(material, { status: 201, headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error({ err: error, operation: 'createTrainingMaterial', requestId, duration_ms: Date.now() - start }, 'Failed to create training material');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: { 'x-request-id': requestId } });
  }
}
