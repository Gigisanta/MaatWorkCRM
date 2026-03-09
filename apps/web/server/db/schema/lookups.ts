import { pgTable, text } from "drizzle-orm/pg-core";

export const lookupAssetClass = pgTable("lookup_asset_class", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
});

export const lookupTaskStatus = pgTable("lookup_task_status", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
});

export const lookupPriority = pgTable("lookup_priority", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
});

export const lookupNotificationType = pgTable("lookup_notification_type", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
});
