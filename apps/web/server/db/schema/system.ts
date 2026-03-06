// ============================================================
// MaatWork CRM — Drizzle Schema: System Module
// ============================================================
// Tables: notifications, trainingMaterials, auditLogs
// Database: PostgreSQL (Neon)
// ============================================================

import { pgTable, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users, organizations } from "./auth";

// ── Notifications ────────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: ["info", "success", "warning", "error", "task", "goal", "contact"],
  }).notNull().default("info"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  actionUrl: text("action_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Training Materials (Capacitaciones) ──────────────────────
export const trainingMaterials = pgTable("training_materials", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url"),
  content: text("content"),
  category: text("category", {
    enum: ["course", "video", "document", "guide", "other"],
  }).notNull().default("document"),
  createdBy: text("created_by").notNull().references(() => users.id),
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
