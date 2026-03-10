import { timestamp, pgTable, text, integer, numeric, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { contacts } from "./crm";

export const aumSnapshots = pgTable("aum_snapshots", {
  id: text("id").primaryKey(),
  advisorId: text("advisor_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  
  snapshotDate: timestamp("snapshot_date").notNull(),
  period: text("period", {
    enum: ["daily", "weekly", "monthly", "quarterly", "yearly"],
  }).notNull().default("monthly"),
  
  totalAum: integer("total_aum").notNull(),
  previousAum: integer("previous_aum"),
  
  newMoney: integer("new_money").default(0),
  marketGains: integer("market_gains").default(0),
  withdrawals: integer("withdrawals").default(0),
  fees: integer("fees").default(0),
  
  numberOfClients: integer("number_of_clients").default(0),
  numberOfAccounts: integer("number_of_accounts").default(0),
  
  averageAccountSize: integer("average_account_size"),
  medianAccountSize: integer("median_account_size"),
  
  newClients: integer("new_clients").default(0),
  lostClients: integer("lost_clients").default(0),
  
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aumByClient = pgTable("aum_by_client", {
  id: text("id").primaryKey(),
  snapshotId: text("snapshot_id")
    .references(() => aumSnapshots.id, { onDelete: "cascade" })
    .notNull(),
  contactId: text("contact_id")
    .references(() => contacts.id, { onDelete: "cascade" })
    .notNull(),
  
  value: integer("value").notNull(),
  previousValue: integer("previous_value"),
  
  change: integer("change"),
  changePercentage: integer("change_percentage"),
  
  numberOfAccounts: integer("number_of_accounts").default(1),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const advisorMetrics = pgTable("advisor_metrics", {
  id: text("id").primaryKey(),
  advisorId: text("advisor_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  
  totalAum: integer("total_aum").default(0),
  totalClients: integer("total_clients").default(0),
  activeClients: integer("active_clients").default(0),
  
  averageAumPerClient: integer("average_aum_per_client"),
  medianAumPerClient: integer("median_aum_per_client"),
  
  ytdRevenue: integer("ytd_revenue").default(0),
  mtdRevenue: integer("mtd_revenue").default(0),
  
  ytdCommissions: integer("ytd_commissions").default(0),
  mtdCommissions: integer("mtd_commissions").default(0),
  
  trailingTwelveMonthRevenue: integer("trailing_twelve_month_revenue").default(0),
  trailingTwelveMonthCommissions: integer("trailing_twelve_month_commissions").default(0),
  
  clientRetentionRate: integer("client_retention_rate"),
  clientGrowthRate: integer("client_growth_rate"),
  aumGrowthRate: integer("aum_growth_rate"),
  
  averageClientTenureMonths: integer("average_client_tenure_months"),
  
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const commissionRecords = pgTable("commission_records", {
  id: text("id").primaryKey(),
  advisorId: text("advisor_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  contactId: text("contact_id")
    .references(() => contacts.id, { onDelete: "set null" }),
  
  date: timestamp("date").notNull(),
  
  type: text("type", {
    enum: ["trailer_fee", "front_end_load", "back_end_load", "management_fee", "performance_fee", "consulting_fee"],
  }).notNull(),
  
  grossAmount: integer("gross_amount").notNull(),
  dealerSplit: integer("dealer_split").default(0),
  netAmount: integer("net_amount").notNull(),
  
  aumAtTime: integer("aum_at_time"),
  
  description: text("description"),
  reference: text("reference"),
  
  status: text("status", {
    enum: ["pending", "paid", "cancelled"],
  }).default("pending"),
  
  paidAt: timestamp("paid_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AumSnapshot = typeof aumSnapshots.$inferSelect;
export type NewAumSnapshot = typeof aumSnapshots.$inferInsert;
export type AumByClient = typeof aumByClient.$inferSelect;
export type AdvisorMetrics = typeof advisorMetrics.$inferSelect;
export type CommissionRecord = typeof commissionRecords.$inferSelect;

export const aumContactSnapshots = pgTable(
  "aum_contact_snapshots",
  {
    id: text("id").primaryKey(),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id),
    date: text("date").notNull(),
    aumTotal: numeric("aum_total", { precision: 18, scale: 6 }).notNull(),
  },
  (table) => ({
    aumContactSnapshotsUnique: uniqueIndex("aum_contact_snapshots_unique").on(table.contactId, table.date),
  })
);
