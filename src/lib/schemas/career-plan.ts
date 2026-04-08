// Zod schemas for Career Plan validation
import { z } from 'zod';

export const careerPlanCategories = ['AGENTE F. JUNIOR', 'AGENTE F. SEMI-SENIOR', 'AGENTE F. SENIOR'] as const;

export const careerPlanLevelSchema = z.object({
  levelNumber: z.number().int().min(1).max(10),
  category: z.enum(careerPlanCategories),
  name: z.string().min(1, 'Nombre requerido'),
  annualGoalUsd: z.number().positive('El objetivo debe ser positivo'),
  percentage: z.number().min(0).max(100),
});

export const careerPlanLevelUpdateSchema = careerPlanLevelSchema.partial();

export type CareerPlanLevelInput = z.infer<typeof careerPlanLevelSchema>;
export type CareerPlanLevelUpdateInput = z.infer<typeof careerPlanLevelUpdateSchema>;

// Default career plan levels for initialization
export const DEFAULT_CAREER_PLAN_LEVELS: Omit<CareerPlanLevelInput, 'organizationId'>[] = [
  // Junior: Levels 1-5
  { levelNumber: 1, category: 'AGENTE F. JUNIOR', name: 'Agente F. Junior I', annualGoalUsd: 30000, percentage: 0 },
  { levelNumber: 2, category: 'AGENTE F. JUNIOR', name: 'Agente F. Junior II', annualGoalUsd: 42000, percentage: 0 },
  { levelNumber: 3, category: 'AGENTE F. JUNIOR', name: 'Agente F. Junior III', annualGoalUsd: 54000, percentage: 0 },
  { levelNumber: 4, category: 'AGENTE F. JUNIOR', name: 'Agente F. Junior IV', annualGoalUsd: 66000, percentage: 0 },
  { levelNumber: 5, category: 'AGENTE F. JUNIOR', name: 'Agente F. Junior V', annualGoalUsd: 84000, percentage: 0 },
  // Semi-Senior: Levels 6-8
  { levelNumber: 6, category: 'AGENTE F. SEMI-SENIOR', name: 'Agente F. Semi-Senior I', annualGoalUsd: 95000, percentage: 0 },
  { levelNumber: 7, category: 'AGENTE F. SEMI-SENIOR', name: 'Agente F. Semi-Senior II', annualGoalUsd: 105000, percentage: 0 },
  { levelNumber: 8, category: 'AGENTE F. SEMI-SENIOR', name: 'Agente F. Semi-Senior III', annualGoalUsd: 115000, percentage: 0 },
  // Senior: Levels 9-10
  { levelNumber: 9, category: 'AGENTE F. SENIOR', name: 'Agente F. Senior I', annualGoalUsd: 125000, percentage: 0 },
  { levelNumber: 10, category: 'AGENTE F. SENIOR', name: 'Agente F. Senior II', annualGoalUsd: 140000, percentage: 0 },
];
