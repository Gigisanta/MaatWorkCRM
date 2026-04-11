import { db } from '@/lib/db/db';

const DEFAULT_STAGES = [
  { name: 'Prospecto', color: '#8B5CF6', order: 0, isDefault: true, wipLimit: null },
  { name: 'Contactado', color: '#3B82F6', order: 1, isDefault: false, wipLimit: 10 },
  { name: 'Primera Reunión', color: '#F59E0B', order: 2, isDefault: false, wipLimit: 8 },
  { name: 'Segunda Reunión', color: '#10B981', order: 3, isDefault: false, wipLimit: 5 },
  { name: 'Apertura', color: '#6366F1', order: 4, isDefault: false, wipLimit: null },
  { name: 'Cliente', color: '#22C55E', order: 5, isDefault: false, wipLimit: null },
  { name: 'Caído', color: '#EF4444', order: 6, isDefault: false, wipLimit: null },
  { name: 'Cuenta Vacía', color: '#6B7280', order: 7, isDefault: false, wipLimit: null },
] as const;

export async function ensureDefaultPipelineStages(organizationId: string) {
  // Check if stages already exist for this organization
  const existingStages = await db.pipelineStage.findMany({
    where: { organizationId },
    select: { id: true, name: true, order: true },
  });

  if (existingStages.length > 0) {
    // Stages already exist, just return them
    return db.pipelineStage.findMany({
      where: { organizationId },
      orderBy: { order: 'asc' },
    });
  }

  // Create all default stages (Prisma generates the id via @default(cuid()))
  await Promise.all(
    DEFAULT_STAGES.map((stage) =>
      db.pipelineStage.create({
        data: {
          organizationId,
          name: stage.name,
          color: stage.color,
          order: stage.order,
          isDefault: stage.isDefault,
          isActive: true,
          wipLimit: stage.wipLimit,
        },
      })
    )
  );

  return db.pipelineStage.findMany({
    where: { organizationId },
    orderBy: { order: 'asc' },
  });
}
