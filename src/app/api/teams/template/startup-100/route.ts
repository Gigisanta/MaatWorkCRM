import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth/auth-helpers';
import { hasPermission } from '@/lib/roles';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  const user = await getUserFromSession(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only managers, owners, admins can download template
  if (!hasPermission(user.role, 'team:view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Create workbook with exact structure for importing contacts
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Plantilla
  const templateData = [
    ['NAME', 'EMAIL', 'PHONE', 'COMPANY', 'SEGMENT', 'SOURCE', 'TAGS', 'NOTES'],
    ['Juan García', 'juan@email.com', '+54 11 1234-5678', 'Empresa ABC', 'Premium', 'Referido', 'VIP, Lands Broker', 'Primer contacto'],
    ['María López', 'maria@email.com', '+54 11 9876-5432', 'Compañía XYZ', 'Standard', 'Evento', 'Nuevo', 'Meetup empresarial'],
    ['', '', '', '', '', '', '', ''],
    ['INSTRUCCIONES', '', '', '', '', '', '', ''],
    ['1. Complete una fila por cada contacto a importar', '', '', '', '', '', '', ''],
    ['2. La columna NAME es obligatoria', '', '', '', '', '', '', ''],
    ['3. SEGMENT: Premium, Standard, Corporativo', '', '', '', '', '', '', ''],
    ['4. SOURCE: Referido, Evento, Website, Lands Broker', '', '', '', '', '', '', ''],
    ['5. TAGS: Separe múltiples tags con coma', '', '', '', '', '', '', ''],
    ['6. Los contactos serán asignados automáticamente al usuario que importa', '', '', '', '', '', '', ''],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(templateData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 20 }, // NAME
    { wch: 30 }, // EMAIL
    { wch: 20 }, // PHONE
    { wch: 25 }, // COMPANY
    { wch: 12 }, // SEGMENT
    { wch: 15 }, // SOURCE
    { wch: 25 }, // TAGS
    { wch: 30 }, // NOTES
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla Contactos');

  // Sheet 2: Léeme
  const readmeData = [
    ['PLANTILLA STARTUP 100 — MAATWORK CRM', ''],
    ['', ''],
    ['¿Qué es esto?', 'Esta plantilla sirve para importar contactos masivos al CRM.'],
    ['¿Cómo usarla?', '1. Descargue esta plantilla'],
    ['', '2. Complete una fila por contacto'],
    ['', '3. Guarde como .xlsx o .csv'],
    ['', '4. Vaya a Contactos > Importar > Seleccione archivo'],
    ['', ''],
    [' COLUMNAS:', ''],
    ['NAME', 'Nombre completo del contacto (OBLIGATORIO)'],
    ['EMAIL', 'Correo electrónico'],
    ['PHONE', 'Teléfono con código de país'],
    ['COMPANY', 'Empresa donde trabaja'],
    ['SEGMENT', 'Premium | Standard | Corporativo'],
    ['SOURCE', 'Referido | Evento | Website | Lands Broker'],
    ['TAGS', 'Tags separados por coma. Ej: VIP, Lands Broker'],
    ['NOTES', 'Notas adicionales sobre el contacto'],
    ['', ''],
    ['NOTA:', 'Los contactos importados se asignarán automáticamente al usuario que realiza la importación.'],
  ];

  const readmeSheet = XLSX.utils.aoa_to_sheet(readmeData);
  readmeSheet['!cols'] = [{ wch: 20 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(workbook, readmeSheet, 'Léeme');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Startup100-Plantilla-MaatWork.xlsx"',
    },
  });
}