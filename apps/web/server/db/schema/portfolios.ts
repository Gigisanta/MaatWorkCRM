import { boolean, integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { contacts } from "./crm";
import { instruments } from "./instruments";

export const portfolios = pgTable("portfolios", {
  id: text("id").primaryKey(),
  contactId: text("contact_id")
    .references(() => contacts.id, { onDelete: "cascade" })
    .notNull(),

  name: text("name").notNull(),
  description: text("description"),
  type: text("type", {
    enum: ["model", "client", "template"],
  })
    .notNull()
    .default("client"),

  totalValue: integer("total_value"),
  targetValue: integer("target_value"),
  cashBalance: integer("cash_balance"),

  riskProfile: text("risk_profile"),
  investmentStrategy: text("investment_strategy"),
  rebalanceThreshold: integer("rebalance_threshold").default(5),

  isActive: boolean("is_active").default(true),
  lastRebalancedAt: timestamp("last_rebalanced_at"),
  lastSyncedAt: timestamp("last_synced_at"),

  advisorId: text("advisor_id").references(() => users.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const portfolioAllocations = pgTable("portfolio_allocations", {
  id: text("id").primaryKey(),
  portfolioId: text("portfolio_id")
    .references(() => portfolios.id, { onDelete: "cascade" })
    .notNull(),

  assetClass: text("asset_class", {
    enum: ["equity", "fixed_income", "cash", "alternatives", "real_estate", "commodities"],
  }).notNull(),

  assetName: text("asset_name").notNull(),
  ticker: text("ticker"),
  isin: text("isin"),

  targetPercentage: numeric("target_percentage", { precision: 5, scale: 2 }),
  actualPercentage: numeric("actual_percentage", { precision: 5, scale: 2 }),

  shares: numeric("shares", { precision: 20, scale: 10 }),
  pricePerShare: integer("price_per_share"),
  value: integer("value"),
  costBasis: integer("cost_basis"),

  unrealizedGainLoss: integer("unrealized_gain_loss"),
  realizedGainLoss: integer("realized_gain_loss"),

  purchaseDate: timestamp("purchase_date"),
  lastUpdated: timestamp("last_updated"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const portfolioTransactions = pgTable("portfolio_transactions", {
  id: text("id").primaryKey(),
  portfolioId: text("portfolio_id")
    .references(() => portfolios.id, { onDelete: "cascade" })
    .notNull(),
  allocationId: text("allocation_id").references(() => portfolioAllocations.id, { onDelete: "set null" }),

  type: text("type", {
    enum: ["buy", "sell", "dividend", "interest", "deposit", "withdrawal", "transfer_in", "transfer_out"],
  }).notNull(),

  assetName: text("asset_name"),
  ticker: text("ticker"),

  shares: numeric("shares", { precision: 20, scale: 10 }),
  pricePerShare: integer("price_per_share"),
  totalAmount: integer("total_amount"),
  fees: integer("fees"),

  transactionDate: timestamp("transaction_date").notNull(),
  settlementDate: timestamp("settlement_date"),

  notes: text("notes"),
  brokerReference: text("broker_reference"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const portfolioSnapshots = pgTable("portfolio_snapshots", {
  id: text("id").primaryKey(),
  portfolioId: text("portfolio_id")
    .references(() => portfolios.id, { onDelete: "cascade" })
    .notNull(),

  snapshotDate: timestamp("snapshot_date").notNull(),

  totalValue: integer("total_value").notNull(),
  cashValue: integer("cash_value"),

  dailyReturn: numeric("daily_return", { precision: 8, scale: 4 }),
  weeklyReturn: numeric("weekly_return", { precision: 8, scale: 4 }),
  monthlyReturn: numeric("monthly_return", { precision: 8, scale: 4 }),
  ytdReturn: numeric("ytd_return", { precision: 8, scale: 4 }),

  benchmarkReturn: numeric("benchmark_return", { precision: 8, scale: 4 }),

  sharpeRatio: numeric("sharpe_ratio", { precision: 6, scale: 3 }),
  volatility: numeric("volatility", { precision: 6, scale: 3 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const portfolioTemplates = pgTable("portfolio_templates", {
  id: text("id").primaryKey(),
  code: text("code").unique(),
  name: text("name").notNull(),
  description: text("description"),
  createdByUserId: text("created_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const portfolioTemplateLines = pgTable("portfolio_template_lines", {
  id: text("id").primaryKey(),
  templateId: text("template_id")
    .notNull()
    .references(() => portfolioTemplates.id, { onDelete: "cascade" }),
  targetType: text("target_type").notNull(),
  assetClass: text("asset_class"),
  instrumentId: text("instrument_id").references(() => instruments.id),
  targetWeight: numeric("target_weight", { precision: 7, scale: 4 }).notNull(),
});

export const clientPortfolioAssignments = pgTable("client_portfolio_assignments", {
  id: text("id").primaryKey(),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id),
  portfolioId: text("portfolio_id")
    .notNull()
    .references(() => portfolioTemplates.id),
  status: text("status").notNull().default("active"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  notes: text("notes"),
  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clientPortfolioOverrides = pgTable("client_portfolio_overrides", {
  id: text("id").primaryKey(),
  assignmentId: text("assignment_id")
    .notNull()
    .references(() => clientPortfolioAssignments.id, { onDelete: "cascade" }),
  targetType: text("target_type").notNull(),
  assetClass: text("asset_class"),
  instrumentId: text("instrument_id").references(() => instruments.id),
  targetWeight: numeric("target_weight", { precision: 7, scale: 4 }).notNull(),
});

export const portfolioMonitoringSnapshot = pgTable("portfolio_monitoring_snapshot", {
  id: text("id").primaryKey(),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id),
  asOfDate: text("as_of_date").notNull(),
  totalDeviationPct: numeric("total_deviation_pct", { precision: 7, scale: 4 }).notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

export const portfolioMonitoringDetails = pgTable("portfolio_monitoring_details", {
  id: text("id").primaryKey(),
  snapshotId: text("snapshot_id")
    .notNull()
    .references(() => portfolioMonitoringSnapshot.id, { onDelete: "cascade" }),
  targetType: text("target_type").notNull(),
  assetClass: text("asset_class"),
  instrumentId: text("instrument_id").references(() => instruments.id),
  targetWeight: numeric("target_weight", { precision: 7, scale: 4 }).notNull(),
  actualWeight: numeric("actual_weight", { precision: 7, scale: 4 }).notNull(),
  deviationPct: numeric("deviation_pct", { precision: 7, scale: 4 }).notNull(),
});

export type Portfolio = typeof portfolios.$inferSelect;
export type NewPortfolio = typeof portfolios.$inferInsert;
export type PortfolioAllocation = typeof portfolioAllocations.$inferSelect;
export type NewPortfolioAllocation = typeof portfolioAllocations.$inferInsert;
export type PortfolioTransaction = typeof portfolioTransactions.$inferSelect;
export type PortfolioSnapshot = typeof portfolioSnapshots.$inferSelect;
