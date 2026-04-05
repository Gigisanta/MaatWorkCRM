// Zod schemas for Contact validation
import { z } from 'zod';

const tagWithValueSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional().default('#8b5cf6'),
  value: z.number().optional().default(0),
});

export const contactCreateSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  emoji: z.string().optional().nullable(),
  segment: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  pipelineStageId: z.string().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  tags: z.array(tagWithValueSchema).optional(),
});

export const contactUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  emoji: z.string().optional().nullable(),
  segment: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  // Use cuid() which generates IDs like clxxxxx or custom IDs like contact_roberto
  pipelineStageId: z.string().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
});

export const contactQuerySchema = z.object({
  organizationId: z.string().optional(),
  stage: z.string().optional().nullable(),
  segment: z.string().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
  search: z.string().optional().nullable(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type ContactCreateInput = z.infer<typeof contactCreateSchema>;
export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>;
export type ContactQueryInput = z.infer<typeof contactQuerySchema>;
