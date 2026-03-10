// ============================================================
// MaatWork CRM — Drizzle Schema: Contact Enhancements
// ============================================================
// Tables: contactAliases, contactFieldHistory, contactStageInteractions
// Database: PostgreSQL (Neon)
// ============================================================

import { boolean, index, integer, pgTable, real, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { organizations, users } from "./auth";
import { contacts, pipelineStages } from "./crm";

/**
 * contactAliases
 * Alternative names for contacts to improve matching accuracy across
 * AUM imports, Calendar events, and other sources.
 */
export const contactAliases = pgTable(
  "contact_aliases",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    alias: text("alias").notNull(),
    aliasNormalized: text("alias_normalized").notNull(),
    source: text("source").notNull(),
    confidence: real("confidence").notNull().default(1.0),
    isVerified: boolean("is_verified").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    contactAliasesNormalizedIdx: index("idx_contact_aliases_normalized").on(table.aliasNormalized),
    contactAliasesContactIdx: index("idx_contact_aliases_contact").on(table.contactId),
    contactAliasesUnique: uniqueIndex("contact_aliases_unique").on(table.contactId, table.aliasNormalized),
  }),
);

/**
 * contactFieldHistory
 * Audit trail of field changes for contacts.
 * Enables rollback capability and change tracking.
 */
export const contactFieldHistory = pgTable(
  "contact_field_history",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    fieldName: text("field_name").notNull(),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    changedByUserId: text("changed_by_user_id")
      .notNull()
      .references(() => users.id),
    changedAt: timestamp("changed_at").defaultNow().notNull(),
  },
  (table) => ({
    contactFieldHistoryIdx: index("idx_contact_field_history").on(table.contactId, table.changedAt),
  }),
);

/**
 * contactStageInteractions
 * Interaction counts per contact per stage (for Kanban metrics).
 * Tracks how many times a contact has moved into/out of each pipeline stage.
 */
export const contactStageInteractions = pgTable(
  "contact_stage_interactions",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    pipelineStageId: text("pipeline_stage_id")
      .notNull()
      .references(() => pipelineStages.id, { onDelete: "cascade" }),
    interactionCount: integer("interaction_count").notNull().default(0),
    lastInteractionAt: timestamp("last_interaction_at").defaultNow().notNull(),
  },
  (table) => ({
    contactStageUnique: uniqueIndex("contact_stage_interactions_unique").on(table.contactId, table.pipelineStageId),
    contactInteractionsIdx: index("idx_contact_stage_interactions_contact").on(table.contactId),
    stageInteractionsIdx: index("idx_contact_stage_interactions_stage").on(table.pipelineStageId),
  }),
);
