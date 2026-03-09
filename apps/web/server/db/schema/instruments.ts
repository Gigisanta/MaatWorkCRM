import { boolean, date, jsonb, numeric, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const instruments = pgTable(
  "instruments",
  {
    id: text("id").primaryKey(),
    symbol: text("symbol").notNull(),
    name: text("name").notNull(),
    assetClass: text("asset_class").notNull(),
    currency: text("currency").notNull(),
    isin: text("isin"),
    externalCodes: jsonb("external_codes").notNull().default("{}"),
    maturityDate: date("maturity_date"),
    couponRate: numeric("coupon_rate", { precision: 9, scale: 6 }),
    riskRating: text("risk_rating"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    instrumentSymbolUnique: uniqueIndex("instruments_symbol_unique").on(table.symbol),
  }),
);

export const instrumentAliases = pgTable(
  "instrument_aliases",
  {
    id: text("id").primaryKey(),
    instrumentId: text("instrument_id")
      .notNull()
      .references(() => instruments.id, { onDelete: "cascade" }),
    broker: text("broker").notNull(),
    code: text("code").notNull(),
  },
  (table) => ({
    instrumentAliasUnique: uniqueIndex("instrument_aliases_unique").on(table.instrumentId, table.broker, table.code),
  }),
);

export type Instrument = typeof instruments.$inferSelect;
export type NewInstrument = typeof instruments.$inferInsert;
export type InstrumentAlias = typeof instrumentAliases.$inferSelect;
export type NewInstrumentAlias = typeof instrumentAliases.$inferInsert;
