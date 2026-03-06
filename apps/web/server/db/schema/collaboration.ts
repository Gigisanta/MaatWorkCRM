// ============================================================
// MaatWork CRM — Drizzle Schema: Collaboration Module
// ============================================================
// Tables: teams, teamMembers, teamGoals, calendarEvents
// Database: PostgreSQL (Neon)
// ============================================================

import { integer, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";
import { organizations, users } from "./auth";

// ── Teams ────────────────────────────────────────────────────
export const teams = pgTable("teams", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  leaderId: text("leader_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Team Members ─────────────────────────────────────────────
export const teamMembers = pgTable("team_members", {
  id: text("id").primaryKey(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["member", "leader"] })
    .notNull()
    .default("member"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// ── Team Goals (monthly objectives with tracking) ────────────
export const teamGoals = pgTable("team_goals", {
  id: text("id").primaryKey(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  targetValue: real("target_value").notNull(),
  currentValue: real("current_value").notNull().default(0),
  unit: text("unit").notNull().default("count"),
  period: text("period").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status", {
    enum: ["active", "completed", "missed", "cancelled"],
  })
    .notNull()
    .default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Calendar Events (shared team calendar) ───────────────────
export const calendarEvents = pgTable("calendar_events", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  teamId: text("team_id").references(() => teams.id),
  title: text("title").notNull(),
  description: text("description"),
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),
  location: text("location"),
  type: text("type", {
    enum: ["meeting", "call", "event", "reminder"],
  })
    .notNull()
    .default("meeting"),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
