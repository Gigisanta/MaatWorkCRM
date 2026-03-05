// ============================================================
// MaatWork CRM — Zod Validation Schemas
// ============================================================
// Shared validation schemas for forms, server functions, and API
// ============================================================

import { z } from "zod";

// ── Contacts ─────────────────────────────────────────────────
export const contactSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  status: z.enum(["lead", "prospect", "active", "inactive"]).default("lead"),
  tags: z.array(z.string()).default([]),
  segment: z.string().optional(),
  source: z.string().optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
});
export type ContactInput = z.infer<typeof contactSchema>;

// ── Deals ────────────────────────────────────────────────────
export const dealSchema = z.object({
  contactId: z.string().min(1, "Contacto requerido"),
  stageId: z.string().min(1, "Etapa requerida"),
  title: z.string().min(2, "Título requerido"),
  value: z.number().min(0).default(0),
  probability: z.number().min(0).max(100).default(50),
  assignedTo: z.string().optional(),
  expectedCloseDate: z.string().optional(),
});
export type DealInput = z.infer<typeof dealSchema>;

// ── Tasks ────────────────────────────────────────────────────
export const taskSchema = z.object({
  title: z.string().min(2, "Título requerido"),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).default("pending"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
  contactId: z.string().optional(),
  isRecurrent: z.boolean().default(false),
  recurrenceRule: z.string().optional(),
});
export type TaskInput = z.infer<typeof taskSchema>;

// ── Notes ────────────────────────────────────────────────────
export const noteSchema = z.object({
  entityType: z.enum(["contact", "deal", "task"]),
  entityId: z.string().min(1),
  content: z.string().min(1, "Contenido requerido"),
});
export type NoteInput = z.infer<typeof noteSchema>;

// ── Teams ────────────────────────────────────────────────────
export const teamSchema = z.object({
  name: z.string().min(2, "Nombre del equipo requerido"),
  description: z.string().optional(),
  leaderId: z.string().optional(),
});
export type TeamInput = z.infer<typeof teamSchema>;

// ── Team Goals ───────────────────────────────────────────────
export const teamGoalSchema = z.object({
  title: z.string().min(2, "Título requerido"),
  description: z.string().optional(),
  targetValue: z.number().min(1, "Valor objetivo requerido"),
  unit: z.string().default("count"),
  period: z.string().min(1, "Período requerido"),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});
export type TeamGoalInput = z.infer<typeof teamGoalSchema>;

// ── Calendar Events ──────────────────────────────────────────
export const calendarEventSchema = z.object({
  title: z.string().min(2, "Título requerido"),
  description: z.string().optional(),
  startAt: z.string().min(1, "Fecha inicio requerida"),
  endAt: z.string().min(1, "Fecha fin requerida"),
  location: z.string().optional(),
  type: z.enum(["meeting", "call", "event", "reminder"]).default("meeting"),
  teamId: z.string().optional(),
});
export type CalendarEventInput = z.infer<typeof calendarEventSchema>;

// ── Pipeline Stages ──────────────────────────────────────────
export const pipelineStageSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  color: z.string().default("#6366f1"),
  order: z.number().default(0),
});
export type PipelineStageInput = z.infer<typeof pipelineStageSchema>;

// ── Training Materials ───────────────────────────────────────
export const trainingMaterialSchema = z.object({
  title: z.string().min(2, "Título requerido"),
  description: z.string().optional(),
  url: z.string().url("URL inválida").optional().or(z.literal("")),
  content: z.string().optional(),
  category: z.enum(["course", "video", "document", "guide", "other"]).default("document"),
});
export type TrainingMaterialInput = z.infer<typeof trainingMaterialSchema>;

// ── Auth ─────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});
