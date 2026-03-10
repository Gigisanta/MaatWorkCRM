// ============================================================
// MaatWork CRM — Drizzle Schema: System Module
// ============================================================
// Tables: notifications, trainingMaterials, auditLogs
// Database: PostgreSQL (Neon)
// ============================================================

import { boolean, integer, jsonb, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";
import { organizations, users } from "./auth";
import { teams } from "./collaboration";

// ── Notifications ────────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: ["info", "success", "warning", "error", "task", "goal", "contact"],
  })
    .notNull()
    .default("info"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  actionUrl: text("action_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Training Materials (Capacitaciones) ──────────────────────
export const trainingMaterials = pgTable("training_materials", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url"),
  content: text("content"),
  category: text("category", {
    enum: ["course", "video", "document", "guide", "other"],
  })
    .notNull()
    .default("document"),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Audit Logs (complete action registry) ────────────────────
export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id),
  userId: text("user_id").references(() => users.id),
  action: text("action", {
    enum: ["create", "update", "delete", "login", "logout", "export", "invite"],
  }).notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  description: text("description"),
  oldData: jsonb("old_data"),
  newData: jsonb("new_data"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dailyMetricsUser = pgTable("daily_metrics_user", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  teamId: text("team_id").references(() => teams.id),
  date: timestamp("date").notNull(),
  numNewProspects: integer("num_new_prospects").default(0),
  numContactsTouched: integer("num_contacts_touched").default(0),
  numNotes: integer("num_notes").default(0),
  numTasksCompleted: integer("num_tasks_completed").default(0),
  aumTotal: real("aum_total").default(0),
  liquidBalanceTotal: real("liquid_balance_total").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const automationConfigs = pgTable("automation_configs", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  triggerType: text("trigger_type", {
    enum: ["pipeline_stage_change", "contact_created", "task_overdue", "meeting_scheduled"],
  }).notNull(),
  triggerConfig: jsonb("trigger_config"),
  enabled: boolean("enabled").notNull().default(true),
  config: jsonb("config"),
  webhookUrl: text("webhook_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Feedback System ─────────────────────────────────────────
export const feedback = pgTable("feedback", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: ["bug", "feature", "improvement", "other"],
  }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status", {
    enum: ["pending", "in_progress", "completed", "rejected"],
  })
    .notNull()
    .default("pending"),
  priority: text("priority", {
    enum: ["low", "medium", "high"],
  })
    .notNull()
    .default("medium"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Career Plan Levels ───────────────────────────────────────
export const careerPlanLevels = pgTable("career_plan_levels", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  category: text("category", {
    enum: ["asesor", "manager"],
  }).notNull(),
  level: text("level").notNull(),
  levelNumber: integer("level_number").notNull(),
  index: integer("index").notNull(),
  percentage: real("percentage").notNull(),
  annualGoalUsd: real("annual_goal_usd").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── User Career Progress ────────────────────────────────────
export const userCareerProgress = pgTable("user_career_progress", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  levelId: text("level_id").references(() => careerPlanLevels.id),
  currentLevelId: text("current_level_id").references(() => careerPlanLevels.id),
  annualProduction: real("annual_production").default(0),
  progressPercentage: real("progress_percentage").default(0),
  lastCalculatedAt: timestamp("last_calculated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
