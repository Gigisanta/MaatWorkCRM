export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth/auth-helpers";
import { db } from "@/lib/db/db";
import { logger } from "@/lib/db/logger";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  try {
    const session = await getUserFromSession(request);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get("organizationId");

    if (!organizationId || organizationId !== session.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch recent activity in parallel
    const [recentContacts, recentTasks, recentNotes] = await Promise.all([
      // Last 3 contacts created
      db.contact.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, name: true, createdAt: true, emoji: true },
      }),
      // Last 3 completed tasks
      db.task.findMany({
        where: {
          organizationId,
          status: "completed",
          completedAt: { not: null },
        },
        orderBy: { completedAt: "desc" },
        take: 3,
        select: { id: true, title: true, completedAt: true },
      }),
      // Last 2 notes (entityType = contact) — fail loudly so we know something broke
      db.note.findMany({
        where: { organizationId, entityType: "contact" },
        orderBy: { createdAt: "desc" },
        take: 2,
        select: {
          id: true,
          content: true,
          createdAt: true,
          entityId: true,
        },
      }),
    ]);

    // Combine and sort by date
    const activities = [
      ...recentContacts.map((c) => ({
        id: `contact-${c.id}`,
        type: "contact_created" as const,
        title: `${c.emoji ?? "👤"} ${c.name}`,
        description: "Nuevo contacto creado",
        timestamp: c.createdAt.toISOString(),
        href: `/contacts`,
      })),
      ...recentTasks.map((t) => ({
        id: `task-${t.id}`,
        type: "task_completed" as const,
        title: `✓ ${t.title}`,
        description: "Tarea completada",
        timestamp: t.completedAt!.toISOString(),
        href: `/tasks`,
      })),
      ...recentNotes.map((n) => ({
        id: `note-${n.id}`,
        type: "note_added" as const,
        title: `Nota agregada`,
        description: n.content.slice(0, 60) + (n.content.length > 60 ? "..." : ""),
        timestamp: n.createdAt.toISOString(),
        href: `/contacts`,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);

    return NextResponse.json({ activities });
  } catch (error) {
    logger.error({ operation: 'dashboard:activity', requestId, error: error instanceof Error ? error.message : String(error) }, 'Error fetching dashboard activity');
    return NextResponse.json({ activities: [] });
  }
}