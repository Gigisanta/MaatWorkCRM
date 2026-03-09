// ============================================================
// MaatWork CRM — Drizzle Schema: Metrics & Interactions
// ============================================================
// Tables: contactInteractions, dailyUserMetrics, typeof pipelineFunnelMetrics
// Database: PostgreSQL (Neon)
// ============================================================

import { integer, pgTable, text, timestamp, real } from "drizzle-orm/pg-core";
import { organizations, users } from "./auth";
import { contacts, pipelineStages } from "./crm";

// ── Interaction Types ──────────────────────────────────────────
export const interactionTypes = [
  "call",           // Phone call
  "email",          // Email sent/received
  "meeting",        // In-person or video meeting
  "note",           // Note added
  "whatsapp",      // WhatsApp message
  "task_completed", // Task completed for contact
] as const;

export type InteractionType = typeof interactionTypes[number];

// ── Contact Interactions ───────────────────────────────────────
// Track every interaction with a contact
export const contactInteractions = pgTable("contact_interactions", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  type: text("type", { enum: interactionTypes }).notNull(),
  content: text("content"),           // Summary or notes
  duration: integer("duration"),       // Duration in minutes (for calls/meetings)
  outcome: text("outcome"),             // Result: positive, neutral, negative
  nextAction: text("next_action"),     // What to do next
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Daily User Metrics ───────────────────────────────────────
// Aggregated daily metrics per user
export const dailyUserMetrics = pgTable("daily_user_metrics", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  teamId: text("team_id"),             // Optional team association
  date: timestamp("date").notNull(),    // Day (normalized to midnight)
  
  // Contact metrics
  contactsCreated: integer("contacts_created").default(0),
  contactsTouched: integer("contacts_touched").default(0),  // Contacts with interactions
  
  // Interaction metrics
  totalInteractions: integer("total_interactions").default(0),
  callsCompleted: integer("calls_completed").default(0),
  emailsSent: integer("emails_sent").default(0),
  meetingsHeld: integer("meetings_held").default(0),
  notesAdded: integer("notes_added").default(0),
  whatsappSent: integer("whatsapp_sent").default(0),
  
  // Task metrics
  tasksCreated: integer("tasks_created").default(0),
  tasksCompleted: integer("tasks_completed").default(0),
  
  // Pipeline metrics
  contactsMovedForward: integer("contacts_moved_forward").default(0),
  contactsMovedBackward: integer("contacts_moved_backward").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Pipeline Funnel Metrics ───────────────────────────────────
// Track conversion rates between stages over time
export const pipelineFunnelMetrics = pgTable("pipeline_funnel_metrics", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  
  period: text("period").notNull(),    // "daily", "weekly", "monthly"
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  stageId: text("stage_id")
    .notNull()
    .references(() => pipelineStages.id),
  
  // Funnel data for this stage in this period
  contactsAtStart: integer("contacts_at_start").default(0),  // Contacts in stage at period start
  contactsEntered: integer("contacts_entered").default(0),   // New contacts entering stage
  contactsExited: integer("contacts_exited").default(0),     // Contacts leaving stage
  contactsAtEnd: integer("contacts_at_end").default(0),      // Contacts in stage at period end
  
  // Conversion metrics
  conversionRateIn: real("conversion_rate_in"),    // % of contacts that entered vs total
  conversionRateOut: real("conversion_rate_out"),  // % of contacts that exited vs total
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Contact Stage History Extended ─────────────────────────────
// Enhanced pipeline stage history with timestamps for SLA tracking
export const contactStageHistory = pgTable("contact_stage_history", {
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
  enteredAt: timestamp("entered_at").notNull(),  // When contact entered current stage
  exitedAt: timestamp("exited_at"),             // When contact left (null if still in stage)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Type Exports ───────────────────────────────────────────────
export type ContactInteraction = typeof contactInteractions.$inferSelect;
export type NewContactInteraction = typeof contactInteractions.$inferInsert;
export type DailyUserMetric = typeof dailyUserMetrics.$inferSelect;
export type NewDailyUserMetric = typeof dailyUserMetrics.$inferInsert;
export type PipelineFunnelMetric = typeof pipelineFunnelMetrics.$inferSelect;
export type NewPipelineFunnelMetric = typeof pipelineFunnelMetrics.$inferInsert;
export type ContactStageHistory = typeof contactStageHistory.$inferSelect;
export type NewContactStageHistory = typeof contactStageHistory.$inferInsert;
