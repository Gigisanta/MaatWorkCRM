import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth-helpers';
import { hasPermission, normalizeRole } from '@/lib/permissions';
import { logger } from '@/lib/logger';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

// POST /api/contacts/import - Preview import (parse and validate file)
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'importContactsPreview', requestId }, 'Starting import preview');

    const user = await getUserFromSession(request);
    if (!user) {
      logger.warn({ operation: 'importContactsPreview', requestId }, 'Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = normalizeRole(user.role);
    if (!hasPermission(userRole, 'contacts:create')) {
      logger.warn({ operation: 'importContactsPreview', requestId }, 'Forbidden: insufficient permissions');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      logger.warn({ operation: 'importContactsPreview', requestId }, 'No file provided');
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

    if (data.length === 0) {
      return NextResponse.json({ error: 'El archivo esta vacio' }, { status: 400 });
    }

    // Validate required columns
    const required = ['Name'];
    const headers = Object.keys(data[0]);
    const missing = required.filter(c => !headers.includes(c));
    if (missing.length > 0) {
      logger.warn({ operation: 'importContactsPreview', requestId, missing }, 'Missing required columns');
      return NextResponse.json(
        { error: `Columnas requeridas faltantes: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    // Parse and validate rows
    const errors: string[] = [];
    const validContacts: Array<{
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
    }> = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as Record<string, unknown>;
      const rowNum = i + 2; // +2 for 1-based index and header row

      const name = String(row.Name || '').trim();
      if (!name) {
        errors.push(`Fila ${rowNum}: Nombre es requerido`);
        continue;
      }

      validContacts.push({
        name,
        email: row.Email ? String(row.Email).trim() || null : null,
        phone: row.Phone ? String(row.Phone).trim() || null : null,
        company: row.Company ? String(row.Company).trim() || null : null,
        segment: row.Segment ? String(row.Segment).trim() || null : null,
        source: row.Source ? String(row.Source).trim() || null : null,
        emoji: '👤',
        assignedTo: user.id,
        organizationId: user.organizationId as string,
        lastInteractionDate: new Date(),
      });
    }

    logger.info({
      operation: 'importContactsPreview',
      requestId,
      totalRows: data.length,
      validRows: validContacts.length,
      errorsCount: errors.length,
      duration_ms: Date.now() - start,
    }, 'Import preview completed');

    return NextResponse.json({
      totalRows: data.length,
      validRows: validContacts.length,
      errors: errors.slice(0, 10),
      preview: validContacts.slice(0, 5),
    });
  } catch (error) {
    logger.error({
      err: error,
      operation: 'importContactsPreview',
      requestId,
      duration_ms: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : String(error),
    }, 'Failed to preview import');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}