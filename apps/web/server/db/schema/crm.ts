// ============================================================
// MaatWork CRM — Drizzle Schema: CRM Core Module
// ============================================================
// Tables: contacts, pipelineStages, deals, notes, attachments, tasks
// Database: PostgreSQL (Neon)
// ============================================================

import { boolean, integer, jsonb, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";
import { organizations, users } from "./auth";

// ── Contacts ─────────────────────────────────────────────────
export const contacts = pgTable("contacts", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  position: text("position"),
  status: text("status", {
    enum: ["lead", "prospect", "active", "inactive"],
  })
    .notNull()
    .default("lead"),
  tags: jsonb("tags").$type<string[]>().default([]),
  segment: text("segment"),
  source: text("source"),
  assignedTo: text("assigned_to").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Pipeline Stages ──────────────────────────────────────────
export const pipelineStages = pgTable("pipeline_stages", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  order: integer("order").notNull().default(0),
  color: text("color").notNull().default("#6366f1"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Deals (contacts in pipeline stages) ──────────────────────
export const deals = pgTable("deals", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  stageId: text("stage_id")
    .notNull()
    .references(() => pipelineStages.id),
  title: text("title").notNull(),
  value: real("value").default(0),
  probability: integer("probability").default(50),
  assignedTo: text("assigned_to").references(() => users.id),
  expectedCloseDate: timestamp("expected_close_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Notes (polymorphic: contact, deal, task) ─────────────────
export const notes = pgTable("notes", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  entityType: text("entity_type", {
    enum: ["contact", "deal", "task"],
  }).notNull(),
  entityId: text("entity_id").notNull(),
  content: text("content").notNull(),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Attachments (polymorphic file uploads) ────────────────────
export const attachments = pgTable("attachments", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  entityType: text("entity_type", {
    enum: ["contact", "deal", "task", "note"],
  }).notNull(),
  entityId: text("entity_id").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedBy: text("uploaded_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Tasks & Reminders ────────────────────────────────────────
export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", {
    enum: ["pending", "in_progress", "completed", "cancelled"],
  })
    .notNull()
    .default("pending"),
  priority: text("priority", {
    enum: ["low", "medium", "high", "urgent"],
  })
    .notNull()
    .default("medium"),
  dueDate: timestamp("due_date"),
  assignedTo: text("assigned_to").references(() => users.id),
  contactId: text("contact_id").references(() => contacts.id),
  isRecurrent: boolean("is_recurrent").default(false),
  recurrenceRule: text("recurrence_rule"),
  parentTaskId: text("parent_task_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});
