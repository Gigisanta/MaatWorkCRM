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
  emoji: text("emoji").default("👤"),
  pipelineStageId: text("pipeline_stage_id").references(() => pipelineStages.id),
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
  description: text("description"),
  order: integer("order").notNull().default(0),
  color: text("color").notNull().default("#6366f1"),
  wipLimit: integer("wip_limit"),
  slaHours: integer("sla_hours"),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Pipeline Stage History ─────────────────────────────────────
export const pipelineStageHistory = pgTable("pipeline_stage_history", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  fromStageId: text("from_stage_id").references(() => pipelineStages.id),
  toStageId: text("to_stage_id").references(() => pipelineStages.id),
  reason: text("reason"),
  changedByUserId: text("changed_by_user_id").references(() => users.id),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
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

export const tags = pgTable("tags", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  scope: text("scope", {
    enum: ["contact", "meeting", "note"],
  })
    .notNull()
    .default("contact"),
  name: text("name").notNull(),
  color: text("color").notNull().default("#6366f1"),
  icon: text("icon"),
  description: text("description"),
  pipelineStageId: text("pipeline_stage_id").references(() => pipelineStages.id),
  isAutoAssign: boolean("is_auto_assign").default(false),
  businessLine: text("business_line", {
    enum: ["inversiones", "zurich", "patrimonial"],
  }),
  isSystem: boolean("is_system").default(false),
  createdByUserId: text("created_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tagRules = pgTable("tag_rules", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  tagId: text("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  conditions: jsonb("conditions").notNull(),
  isActive: boolean("is_active").default(true),
  lastEvaluatedAt: timestamp("last_evaluated_at"),
  createdByUserId: text("created_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contactTags = pgTable("contact_tags", {
  id: text("id").primaryKey(),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  tagId: text("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
  monthlyPremium: integer("monthly_premium"),
  policyNumber: text("policy_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const segments = pgTable("segments", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  filters: jsonb("filters").notNull(),
  isDynamic: boolean("is_dynamic").default(true),
  contactCount: integer("contact_count").default(0),
  lastRefreshedAt: timestamp("last_refreshed_at"),
  refreshSchedule: text("refresh_schedule"),
  ownerId: text("owner_id").references(() => users.id),
  isShared: boolean("is_shared").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
