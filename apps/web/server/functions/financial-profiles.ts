// ============================================================
// MaatWork CRM — Server Functions: Financial Profiles
// ============================================================

import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { financialProfiles } from "../db/schema";

export const getFinancialProfile = createServerFn({ method: "GET" })
  .inputValidator((input: { contactId: string }) => input)
  .handler(async ({ data }) => {
    const result = await db.select().from(financialProfiles).where(eq(financialProfiles.contactId, data.contactId));
    return result[0] ?? null;
  });

export const getFinancialProfilesByOrg = createServerFn({ method: "GET" })
  .inputValidator((input: { orgId: string }) => input)
  .handler(async ({ data }) => {
    // Get all contacts with their financial profiles for an org
    // This would require a join - for now return all profiles
    return db.select().from(financialProfiles);
  });

export const createFinancialProfile = createServerFn({ method: "POST" })
  .inputValidator((input: { data: Record<string, unknown> }) => input)
  .handler(async ({ data }) => {
    const id = crypto.randomUUID();
    await db.insert(financialProfiles).values({
      id,
      contactId: data.data.contactId as string,
      annualIncome: data.data.annualIncome as number | undefined,
      netWorth: data.data.netWorth as number | undefined,
      liquidAssets: data.data.liquidAssets as number | undefined,
      otherAssets: data.data.otherAssets as number | undefined,
      liabilities: data.data.liabilities as number | undefined,
      riskTolerance: data.data.riskTolerance as string | undefined,
      investmentHorizon: data.data.investmentHorizon as string | undefined,
      investmentExperience: data.data.investmentExperience as string | undefined,
      primaryGoal: data.data.primaryGoal as string | undefined,
      secondaryGoal: data.data.secondaryGoal as string | undefined,
      targetReturn: data.data.targetReturn as number | undefined,
      timeHorizonYears: data.data.timeHorizonYears as number | undefined,
      maritalStatus: data.data.maritalStatus as string | undefined,
      dependents: data.data.dependents as number | undefined,
      spouseEmployed: data.data.spouseEmployed as string | undefined,
      spouseIncome: data.data.spouseIncome as number | undefined,
      employmentStatus: data.data.employmentStatus as string | undefined,
      occupation: data.data.occupation as string | undefined,
      employer: data.data.employer as string | undefined,
      yearsAtEmployer: data.data.yearsAtEmployer as number | undefined,
      taxBracket: data.data.taxBracket as string | undefined,
      legalResidence: data.data.legalResidence as string | undefined,
      hasLifeInsurance: data.data.hasLifeInsurance as string | undefined,
      lifeInsuranceAmount: data.data.lifeInsuranceAmount as number | undefined,
      hasDisabilityInsurance: data.data.hasDisabilityInsurance as string | undefined,
      hasWill: data.data.hasWill as string | undefined,
      hasTrust: data.data.hasTrust as string | undefined,
      financialNotes: data.data.financialNotes as string | undefined,
      specialConsiderations: data.data.specialConsiderations as string | undefined,
    });
    return { id };
  });

export const updateFinancialProfile = createServerFn({ method: "POST" })
  .inputValidator((input: { contactId: string; data: Record<string, unknown> }) => input)
  .handler(async ({ data }) => {
    // 🛡️ Sentinel: Prevent Mass Assignment vulnerability
    const { contactId, id, ...safeData } = data.data;
    await db
      .update(financialProfiles)
      .set({ ...(safeData as any), updatedAt: new Date() })
      .where(eq(financialProfiles.contactId, contactId as string));
    return { contactId };
  });

export const deleteFinancialProfile = createServerFn({ method: "POST" })
  .inputValidator((input: { contactId: string }) => input)
  .handler(async ({ data }) => {
    await db.delete(financialProfiles).where(eq(financialProfiles.contactId, data.contactId));
    return { success: true };
  });
