// ============================================================
// MaatWork CRM — Financial Profiles Schema
// Financial advisor-specific contact information
// ============================================================

import { timestamp, pgTable, text, integer, numeric } from "drizzle-orm/pg-core";
import { contacts } from "./crm";

export const financialProfiles = pgTable("financial_profiles", {
  id: text("id").primaryKey(),
  contactId: text("contact_id")
    .references(() => contacts.id, { onDelete: "cascade" })
    .notNull()
    .unique(),

  // Income & Wealth
  annualIncome: integer("annual_income"), // USD
  netWorth: integer("net_worth"), // USD
  liquidAssets: integer("liquid_assets"), // USD
  otherAssets: integer("other_assets"), // USD
  liabilities: integer("liabilities"), // USD

  // Risk Profile
  riskTolerance: text("risk_tolerance"), // conservative, moderate, aggressive
  investmentHorizon: text("investment_horizon"), // short_term, medium_term, long_term
  investmentExperience: text("investment_experience"), // none, beginner, intermediate, advanced

  // Investment Goals
  primaryGoal: text("primary_goal"), // retirement, wealth_building, education, income_generation, capital_preservation
  secondaryGoal: text("secondary_goal"),
  targetReturn: integer("target_return"), // percentage (e.g., 8 for 8%)
  timeHorizonYears: integer("time_horizon_years"),

  // Family Information
  maritalStatus: text("marital_status"), // single, married, divorced, widowed
  dependents: integer("dependents"), // number of dependents
  spouseEmployed: text("spouse_employed"), // yes, no, n/a
  spouseIncome: integer("spouse_income"), // USD

  // Employment
  employmentStatus: text("employment_status"), // employed, self_employed, retired, student, unemployed
  occupation: text("occupation"),
  employer: text("employer"),
  yearsAtEmployer: integer("years_at_employer"),

  // Tax & Legal
  taxBracket: text("tax_bracket"), // e.g., "35%"
  taxId: text("tax_id"), // encrypted
  legalResidence: text("legal_residence"), // country/state

  // Insurance
  hasLifeInsurance: text("has_life_insurance"), // yes, no
  lifeInsuranceAmount: integer("life_insurance_amount"),
  hasDisabilityInsurance: text("has_disability_insurance"), // yes, no

  // Estate Planning
  hasWill: text("has_will"), // yes, no
  hasTrust: text("has_trust"), // yes, no
  estateBeneficiaries: text("estate_beneficiaries"), // json array

  // Additional Notes
  financialNotes: text("financial_notes"), // detailed notes
  specialConsiderations: text("special_considerations"),

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type FinancialProfile = typeof financialProfiles.$inferSelect;
export type NewFinancialProfile = typeof financialProfiles.$inferInsert;
