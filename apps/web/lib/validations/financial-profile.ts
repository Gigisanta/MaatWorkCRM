import { z } from "zod";

export const financialProfileSchema = z.object({
  annualIncome: z.number().min(0).optional(),
  netWorth: z.number().min(0).optional(),
  liquidAssets: z.number().min(0).optional(),
  otherAssets: z.number().min(0).optional(),
  liabilities: z.number().min(0).optional(),

  riskTolerance: z.enum(["conservative", "moderate", "aggressive"]).optional(),
  investmentHorizon: z.enum(["short_term", "medium_term", "long_term"]).optional(),
  investmentExperience: z.enum(["none", "beginner", "intermediate", "advanced"]).optional(),

  primaryGoal: z
    .enum(["retirement", "wealth_building", "education", "income_generation", "capital_preservation"])
    .optional(),
  secondaryGoal: z.string().optional(),
  targetReturn: z.number().min(0).max(100).optional(),
  timeHorizonYears: z.number().min(0).max(100).optional(),

  maritalStatus: z.enum(["single", "married", "divorced", "widowed"]).optional(),
  dependents: z.number().min(0).max(20).optional(),
  spouseEmployed: z.enum(["yes", "no", "n/a"]).optional(),
  spouseIncome: z.number().min(0).optional(),

  employmentStatus: z.enum(["employed", "self_employed", "retired", "student", "unemployed"]).optional(),
  occupation: z.string().optional(),
  employer: z.string().optional(),
  yearsAtEmployer: z.number().min(0).optional(),

  taxBracket: z.string().optional(),
  taxId: z.string().optional(),
  legalResidence: z.string().optional(),

  hasLifeInsurance: z.enum(["yes", "no"]).optional(),
  lifeInsuranceAmount: z.number().min(0).optional(),
  hasDisabilityInsurance: z.enum(["yes", "no"]).optional(),

  hasWill: z.enum(["yes", "no"]).optional(),
  hasTrust: z.enum(["yes", "no"]).optional(),
  estateBeneficiaries: z.string().optional(),

  financialNotes: z.string().optional(),
  specialConsiderations: z.string().optional(),
});

export type FinancialProfileFormData = z.infer<typeof financialProfileSchema>;
