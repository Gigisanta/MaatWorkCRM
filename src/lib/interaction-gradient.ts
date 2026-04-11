import { differenceInDays } from 'date-fns';
import type { InteractionGradient } from '@/types/client';

export function getInteractionGradient(lastInteractionDate: Date | null): InteractionGradient {
  if (!lastInteractionDate) {
    return { color: 'text-red-500', label: 'Sin contacto', urgency: 'high' };
  }

  const days = differenceInDays(new Date(), lastInteractionDate);

  if (days <= 7) {
    return { color: 'text-green-500', label: 'Reciente', urgency: 'low' };
  }
  if (days <= 30) {
    return { color: 'text-yellow-500', label: 'Regular', urgency: 'medium' };
  }
  return { color: 'text-red-500', label: 'Atencion', urgency: 'high' };
}