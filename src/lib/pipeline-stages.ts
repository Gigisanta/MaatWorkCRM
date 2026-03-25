import { db } from '@/lib/db';

const DEFAULT_STAGES = [
  { id: 'stage-prospecto', name: 'Prospecto', color: '#6366f1', order: 1, isDefault: true, wipLimit: null },
  { id: 'stage-contactado', name: 'Contactado', color: '#8b5cf6', order: 2, isDefault: false, wipLimit: 10 },
  { id: 'stage-primera-reunion', name: 'Primera reunión', color: '#f59e0b', order: 3, isDefault: false, wipLimit: 8 },
  { id: 'stage-segunda-reunion', name: 'Segunda reunión', color: '#3b82f6', order: 4, isDefault: false, wipLimit: 5 },
  { id: 'stage-apertura', name: 'Apertura', color: '#10b981', order: 5, isDefault: false, wipLimit: null },
  { id: 'stage-cliente', name: 'Cliente', color: '#22c55e', order: 6, isDefault: false, wipLimit: null },
  { id: 'stage-caido', name: 'Caído', color: '#ef4444', order: 7, isDefault: false, wipLimit: null },
  { id: 'stage-cuenta-vacia', name: 'Cuenta vacía', color: '#f97316', order: 8, isDefault: false, wipLimit: null },
] as const;

export async function ensureDefaultPipelineStages(organizationId: string) {
  const existingStages = await db.pipelineStage.findFirst({
    where: { organizationId },
    select: { id: true },
  });

  if (existingStages) {
    return db.pipelineStage.findMany({
      where: { organizationId },
      orderBy: { order: 'asc' },
    });
  }

  const createdStages = await Promise.all(
    DEFAULT_STAGES.map((stage) =>
      db.pipelineStage.create({
        data: {
          id: stage.id,
          organizationId,
          name: stage.name,
          color: stage.color,
          order: stage.order,
          isDefault: stage.isDefault ?? false,
          isActive: true,
          wipLimit: stage.wipLimit,
        },
      })
    )
  );

  return createdStages;
}
