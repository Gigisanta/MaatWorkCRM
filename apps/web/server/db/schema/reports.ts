import { boolean, date, integer, jsonb, numeric, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { teams } from "./collaboration";
import { contacts } from "./crm";

export const scheduledReports = pgTable("scheduled_reports", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  scheduleCron: text("schedule_cron").notNull(),
  timezone: text("timezone").notNull().default("America/Argentina/Buenos_Aires"),
  nextRunAt: timestamp("next_run_at"),
  lastRunAt: timestamp("last_run_at"),
  ownerUserId: text("owner_user_id")
    .notNull()
    .references(() => users.id),
  targets: jsonb("targets").notNull().default("{}"),
  params: jsonb("params").notNull().default("{}"),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reportRuns = pgTable("report_runs", {
  id: text("id").primaryKey(),
  scheduledReportId: text("scheduled_report_id")
    .notNull()
    .references(() => scheduledReports.id, { onDelete: "cascade" }),
  runAt: timestamp("run_at").defaultNow().notNull(),
  status: text("status").notNull(),
  deliverySummary: jsonb("delivery_summary").notNull().default("{}"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activityEvents = pgTable("activity_events", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  advisorUserId: text("advisor_user_id").references(() => users.id),
  contactId: text("contact_id").references(() => contacts.id),
  type: text("type").notNull(),
  metadata: jsonb("metadata").notNull().default("{}"),
  occurredAt: timestamp("occurred_at").notNull(),
});

export const monthlyGoals = pgTable("monthly_goals", {
  id: text("id").primaryKey(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  newProspectsGoal: integer("new_prospects_goal").notNull().default(0),
  firstMeetingsGoal: integer("first_meetings_goal").notNull().default(0),
  secondMeetingsGoal: integer("second_meetings_goal").notNull().default(0),
  newClientsGoal: integer("new_clients_goal").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ScheduledReport = typeof scheduledReports.$inferSelect;
export type NewScheduledReport = typeof scheduledReports.$inferInsert;
export type ReportRun = typeof reportRuns.$inferSelect;
export type NewReportRun = typeof reportRuns.$inferInsert;
export type ActivityEvent = typeof activityEvents.$inferSelect;
export type NewActivityEvent = typeof activityEvents.$inferInsert;
export type MonthlyGoal = typeof monthlyGoals.$inferSelect;
export type NewMonthlyGoal = typeof monthlyGoals.$inferInsert;
