// Zod schemas for Goal validation
import { z } from 'zod';

export const goalTypeEnum = z.enum(['new_aum', 'new_clients', 'meetings', 'revenue', 'custom']);
export const goalStatusEnum = z.enum(['draft', 'active', 'completed', 'missed', 'cancelled', 'archived']);
export const goalHealthEnum = z.enum(['on-track', 'at-risk', 'off-track', 'achieved']);
export const goalPrivacyEnum = z.enum(['private', 'team', 'company']);
export const progressMethodEnum = z.enum(['automatic', 'manual']);

export const userGoalCreateSchema = z.object({
  teamGoalId: z.string().optional().nullable(),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional().nullable(),
  type: goalTypeEnum,
  targetValue: z.number().positive('Target value must be positive'),
  currentValue: z.number().min(0).optional().default(0),
  unit: z.string().optional().default('count'),
  period: z.string().optional(), // Format: 2026-03
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2020).max(2100).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  status: goalStatusEnum.optional().default('active'),
  health: goalHealthEnum.optional(),
  progressMethod: progressMethodEnum.optional().default('manual'),
  parentGoalId: z.string().optional().nullable(),
  linkedDeals: z.array(z.string()).optional().default([]),
  linkedContacts: z.array(z.string()).optional().default([]),
  privacy: goalPrivacyEnum.optional().default('private'),
});

export const userGoalUpdateSchema = userGoalCreateSchema.partial();

export const userGoalQuerySchema = z.object({
  status: goalStatusEnum.optional(),
  type: goalTypeEnum.optional(),
  period: z.string().optional(),
  teamGoalId: z.string().optional(),
  health: goalHealthEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type UserGoalCreateInput = z.infer<typeof userGoalCreateSchema>;
export type UserGoalUpdateInput = z.infer<typeof userGoalUpdateSchema>;
export type UserGoalQueryInput = z.infer<typeof userGoalQuerySchema>;