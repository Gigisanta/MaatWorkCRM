import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { isValidId } from '@/lib/id-validation';
import { getUserFromSession } from '@/lib/auth-helpers';

// DELETE /api/notes/[id] - Delete a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'deleteNote', requestId }, 'Deleting note');

    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'x-request-id': requestId } });
    }

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    const note = await db.note.findUnique({ where: { id } });
    if (!note) {
      return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404, headers: { 'x-request-id': requestId } });
    }
    if (note.authorId !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers: { 'x-request-id': requestId } });
    }

    await db.note.delete({
      where: { id },
    });

    logger.info(
      { operation: 'deleteNote', requestId, noteId: id, duration_ms: Date.now() - start },
      'Note deleted successfully'
    );

    return NextResponse.json({ success: true }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error(
      { err: error, operation: 'deleteNote', requestId, duration_ms: Date.now() - start },
      'Failed to delete note'
    );
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}
