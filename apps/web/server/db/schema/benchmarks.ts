import { pgTable, text, timestamp, date, numeric, uniqueIndex, index } from "drizzle-orm/pg-core";
import { instruments } from "./instruments";

export const priceSnapshots = pgTable(
  "price_snapshots",
  {
    id: text("id").primaryKey(),
    instrumentId: text("instrument_id")
      .notNull()
      .references(() => instruments.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    open: numeric("open", { precision: 18, scale: 6 }),
    high: numeric("high", { precision: 18, scale: 6 }),
    low: numeric("low", { precision: 18, scale: 6 }),
    close: numeric("close", { precision: 18, scale: 6 }),
    volume: numeric("volume", { precision: 18, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    priceSnapshotsInstrumentDate: uniqueIndex("price_snapshots_instrument_date").on(
      table.instrumentId,
      table.date
    ),
  })
);

export const pricesDaily = pgTable(
  "prices_daily",
  {
    id: text("id").primaryKey(),
    instrumentId: text("instrument_id")
      .notNull()
      .references(() => instruments.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    open: numeric("open", { precision: 18, scale: 6 }),
    high: numeric("high", { precision: 18, scale: 6 }),
    low: numeric("low", { precision: 18, scale: 6 }),
    close: numeric("close", { precision: 18, scale: 6 }),
    adjustedClose: numeric("adjusted_close", { precision: 18, scale: 6 }),
    volume: numeric("volume", { precision: 18, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    pricesDailyInstrumentDate: uniqueIndex("prices_daily_instrument_date").on(
      table.instrumentId,
      table.date
    ),
  })
);

export const pricesIntraday = pgTable(
  "prices_intraday",
  {
    id: text("id").primaryKey(),
    instrumentId: text("instrument_id")
      .notNull()
      .references(() => instruments.id, { onDelete: "cascade" }),
    timestamp: timestamp("timestamp").notNull(),
    interval: text("interval", {
      enum: ["5m", "15m", "1h"],
    }).notNull(),
    open: numeric("open", { precision: 18, scale: 6 }),
    high: numeric("high", { precision: 18, scale: 6 }),
    low: numeric("low", { precision: 18, scale: 6 }),
    close: numeric("close", { precision: 18, scale: 6 }),
    volume: numeric("volume", { precision: 18, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    pricesIntradayInstrumentTimestampInterval: uniqueIndex(
      "prices_intraday_instrument_timestamp_interval"
    ).on(table.instrumentId, table.timestamp, table.interval),
    pricesIntradayInstrumentId: index("prices_intraday_instrument_id_idx").on(
      table.instrumentId
    ),
    pricesIntradayTimestamp: index("prices_intraday_timestamp_idx").on(
      table.timestamp
    ),
  })
);

export const metricDefinitions = pgTable(
  "metric_definitions",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    formula: text("formula"),
    category: text("category", {
      enum: ["return", "risk", "ratio"],
    }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    metricDefinitionsName: uniqueIndex("metric_definitions_name").on(table.name),
    metricDefinitionsCategory: index("metric_definitions_category_idx").on(
      table.category
    ),
  })
);

export type PriceSnapshot = typeof priceSnapshots.$inferSelect;
export type NewPriceSnapshot = typeof priceSnapshots.$inferInsert;
export type PricesDaily = typeof pricesDaily.$inferSelect;
export type NewPricesDaily = typeof pricesDaily.$inferInsert;
export type PricesIntraday = typeof pricesIntraday.$inferSelect;
export type NewPricesIntraday = typeof pricesIntraday.$inferInsert;
export type MetricDefinition = typeof metricDefinitions.$inferSelect;
export type NewMetricDefinition = typeof metricDefinitions.$inferInsert;
