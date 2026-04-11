export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  segment: string | null;
  source: string | null;
  assignedTo: { id: string; name: string } | null;
  lastInteractionDate: Date | null;
  interactionCount: number;
  isLandsClient: boolean;
  createdAt: Date;
}

export type InteractionUrgency = 'high' | 'medium' | 'low';

export interface InteractionGradient {
  color: string;
  label: string;
  urgency: InteractionUrgency;
}