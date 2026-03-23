// Zod schemas for Deal validation
import { z } from 'zod';

export const dealCreateSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  contactId: z.string().optional().nullable(),
  stageId: z.string().optional().nullable(),
  title: z.string().min(1, 'Title is required').max(255),
  value: z.number().min(0).optional().default(0),
  probability: z.number().int().min(0).max(100).optional().default(50),
  expectedCloseDate: z.string().datetime().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
});

export const dealUpdateSchema = dealCreateSchema.partial();

export const dealQuerySchema = z.object({
  stageId: z.string().optional(),
  contactId: z.string().optional(),
  assignedTo: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  organizationId: z.string().optional(),
});

export type DealCreateInput = z.infer<typeof dealCreateSchema>;
export type DealUpdateInput = z.infer<typeof dealUpdateSchema>;
export type DealQueryInput = z.infer<typeof dealQuerySchema>;
