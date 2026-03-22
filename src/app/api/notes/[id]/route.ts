import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';

// DELETE /api/notes/[id] - Delete a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    logger.debug({ operation: 'deleteNote', requestId }, 'Deleting note');

    const { id } = await params;

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
