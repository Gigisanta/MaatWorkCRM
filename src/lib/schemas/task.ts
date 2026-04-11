// Zod schemas for Task validation
import { z } from 'zod';

export const taskStatusEnum = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);
export const taskPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);

export const taskCreateSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional().nullable(),
  status: taskStatusEnum.optional().default('pending'),
  priority: taskPriorityEnum.optional().default('medium'),
  dueDate: z.preprocess((val) => (val === "" ? null : val), z.string().datetime().nullable().optional()),
  assignedTo: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  isRecurrent: z.boolean().optional().default(false),
  recurrenceRule: z.string().optional().nullable(),
  parentTaskId: z.string().optional().nullable(),
});

export const taskUpdateSchema = taskCreateSchema.partial();

export const taskQuerySchema = z.object({
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  assignedTo: z.string().optional(),
  contactId: z.string().optional(),
  overdue: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  organizationId: z.string().optional(),
});

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;
