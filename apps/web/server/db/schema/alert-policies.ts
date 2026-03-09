// ============================================================
// MaatWork CRM — Drizzle Schema: Alert Policies
// ============================================================
// Table: alertPolicies
// Configurable alert policies by scope (user/team/global)
// Database: PostgreSQL (Neon)
// ============================================================

import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organizations, users } from "./auth";
import { teams } from "./collaboration";

// Alert Policy Scopes
export const ALERT_POLICY_SCOPES = ["user", "team", "global"] as const;
export type AlertPolicyScope = (typeof ALERT_POLICY_SCOPES)[number];

// Alert Policy Actions
export const ALERT_POLICY_ACTIONS = ["email", "push", "webhook"] as const;
export type AlertPolicyActionType = (typeof ALERT_POLICY_ACTIONS)[number];

// ── Alert Policies ─────────────────────────────────────────────
export const alertPolicies = pgTable("alert_policies", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  scope: text("scope", { enum: ALERT_POLICY_SCOPES }).notNull().default("global"),
  scopeId: text("scope_id"), // userId or teamId depending on scope
  // For user-scoped policies
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  // For team-scoped policies
  teamId: text("team_id").references(() => teams.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // 'contact_created', 'deal_won', 'task_completed', etc.
  condition: jsonb("condition"), // { field, operator, value }
  action: jsonb("action").notNull(), // { type: 'email' | 'push' | 'webhook', config }
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
