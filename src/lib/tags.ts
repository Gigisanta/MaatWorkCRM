import { db } from '@/lib/db';

const DEFAULT_TAGS = [
  // Business Lines
  { name: 'Options (zurich)', color: '#003399', icon: 'briefcase', description: 'Business line - Options Zurich' },
  { name: 'Invest (zurich)', color: '#0055CC', icon: 'trending-up', description: 'Business line - Invest Zurich' },
  { name: 'Impact (zurich)', color: '#0077FF', icon: 'zap', description: 'Business line - Impact Zurich' },
  { name: 'InvestorsTrust', color: '#10B981', icon: 'shield', description: 'Business line - Investors Trust' },
  { name: 'Balanz', color: '#F59E0B', icon: 'bar-chart-2', description: 'Business line - Balanz' },
  { name: 'Auto', color: '#6B7280', icon: 'car', description: 'Business line - Auto' },
  { name: 'Hogar', color: '#4B5563', icon: 'home', description: 'Business line - Hogar' },
  // Channel (Lands Broker - el que pidio el cliente)
  { name: 'Lands Broker', color: '#8B5CF6', icon: 'globe', description: 'Canal de adquisicion - Lands Broker' },
  // Investment Profiles
  { name: 'Conservador', color: '#3B82F6', icon: 'shield', description: 'Perfil de riesgo - Conservador' },
  { name: 'Moderado', color: '#8B5CF6', icon: 'balance', description: 'Perfil de riesgo - Moderado' },
  { name: 'Agresivo', color: '#EF4444', icon: 'flame', description: 'Perfil de riesgo - Agresivo' },
  { name: 'Muy Agresivo', color: '#DC2626', icon: 'alert-triangle', description: 'Perfil de riesgo - Muy Agresivo' },
  // Client Types
  { name: 'VIP', color: '#10B981', icon: 'star', description: 'Tipo de cliente - VIP' },
  { name: 'Premium', color: '#F59E0B', icon: 'award', description: 'Tipo de cliente - Premium' },
  { name: 'Standard', color: '#6B7280', icon: 'user', description: 'Tipo de cliente - Standard' },
  { name: 'Nuevo', color: '#06B6D4', icon: 'user-plus', description: 'Tipo de cliente - Nuevo' },
] as const;

export async function ensureDefaultTags(organizationId: string) {
  // Check if tags already exist for this organization
  const existingTags = await db.tag.findMany({
    where: { organizationId },
    select: { id: true, name: true },
  });

  if (existingTags.length > 0) {
    // Tags already exist, just return them
    return db.tag.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  // Create all default tags (Prisma generates the id via @default(cuid()))
  await Promise.all(
    DEFAULT_TAGS.map((tag) =>
      db.tag.create({
        data: {
          organizationId,
          name: tag.name,
          color: tag.color,
          icon: tag.icon,
          description: tag.description,
        },
      })
    )
  );

  return db.tag.findMany({
    where: { organizationId },
    orderBy: { name: 'asc' },
  });
}
