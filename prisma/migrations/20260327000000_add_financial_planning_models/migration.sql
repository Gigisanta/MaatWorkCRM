-- Migration: add_financial_planning_models
-- Created: 2026-03-27

-- Create FinancialPlan table
CREATE TABLE "FinancialPlan" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "edad" INTEGER,
    "profesion" TEXT,
    "objetivo" TEXT,
    "perfilRiesgo" TEXT,
    "aporteMensual" DOUBLE PRECISION,
    "aporteInicial" DOUBLE PRECISION,
    "horizonteMeses" INTEGER,
    "tipoAporte" TEXT,
    "ingresosMensuales" DOUBLE PRECISION,
    "gastosMensuales" DOUBLE PRECISION,
    "fondoEmergenciaMeses" INTEGER,
    "fondoEmergenciaActual" DOUBLE PRECISION,
    "patrimonioActivos" DOUBLE PRECISION,
    "patrimonioDeudas" DOUBLE PRECISION,
    "config" TEXT,
    "ia" TEXT,
    "proyeccion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinancialPlan_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on contactId
CREATE UNIQUE INDEX "FinancialPlan_contactId_key" ON "FinancialPlan"("contactId");
CREATE INDEX "FinancialPlan_contactId_idx" ON "FinancialPlan"("contactId");

-- Add foreign key to Contact (1:1 relationship)
ALTER TABLE "FinancialPlan" ADD CONSTRAINT "FinancialPlan_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE;

-- Create MetaVida table
CREATE TABLE "MetaVida" (
    "id" TEXT NOT NULL,
    "financialPlanId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "montoObjetivo" DOUBLE PRECISION,
    "fechaEstimada" TIMESTAMP(3),
    "prioridad" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MetaVida_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MetaVida_financialPlanId_idx" ON "MetaVida"("financialPlanId");
ALTER TABLE "MetaVida" ADD CONSTRAINT "MetaVida_financialPlanId_fkey"
    FOREIGN KEY ("financialPlanId") REFERENCES "FinancialPlan"("id") ON DELETE CASCADE;

-- Create PlanInstrument table
CREATE TABLE "PlanInstrument" (
    "id" TEXT NOT NULL,
    "financialPlanId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT,
    "claseActivo" TEXT,
    "emisor" TEXT,
    "moneda" TEXT,
    "rendimientoEsperado" DOUBLE PRECISION,
    "participacion" DOUBLE PRECISION,
    "isin" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlanInstrument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlanInstrument_financialPlanId_idx" ON "PlanInstrument"("financialPlanId");
ALTER TABLE "PlanInstrument" ADD CONSTRAINT "PlanInstrument_financialPlanId_fkey"
    FOREIGN KEY ("financialPlanId") REFERENCES "FinancialPlan"("id") ON DELETE CASCADE;

-- Create AsignacionEstrategica table
CREATE TABLE "AsignacionEstrategica" (
    "id" TEXT NOT NULL,
    "financialPlanId" TEXT NOT NULL,
    "claseActivo" TEXT NOT NULL,
    "porcentaje" DOUBLE PRECISION NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AsignacionEstrategica_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AsignacionEstrategica_financialPlanId_idx" ON "AsignacionEstrategica"("financialPlanId");
ALTER TABLE "AsignacionEstrategica" ADD CONSTRAINT "AsignacionEstrategica_financialPlanId_fkey"
    FOREIGN KEY ("financialPlanId") REFERENCES "FinancialPlan"("id") ON DELETE CASCADE;

-- Create ObligacionNegociable table
CREATE TABLE "ObligacionNegociable" (
    "id" TEXT NOT NULL,
    "financialPlanId" TEXT NOT NULL,
    "acreedor" TEXT NOT NULL,
    "tipo" TEXT,
    "saldoPendiente" DOUBLE PRECISION,
    "tasaInteres" DOUBLE PRECISION,
    "cuotaMensual" DOUBLE PRECISION,
    "fechaVencimiento" TIMESTAMP(3),
    "origen" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ObligacionNegociable_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ObligacionNegociable_financialPlanId_idx" ON "ObligacionNegociable"("financialPlanId");
ALTER TABLE "ObligacionNegociable" ADD CONSTRAINT "ObligacionNegociable_financialPlanId_fkey"
    FOREIGN KEY ("financialPlanId") REFERENCES "FinancialPlan"("id") ON DELETE CASCADE;

-- Create Riesgo table
CREATE TABLE "Riesgo" (
    "id" TEXT NOT NULL,
    "financialPlanId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT,
    "probabilidad" TEXT,
    "impacto" TEXT,
    "mitigacion" TEXT,
    "severity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Riesgo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Riesgo_financialPlanId_idx" ON "Riesgo"("financialPlanId");
ALTER TABLE "Riesgo" ADD CONSTRAINT "Riesgo_financialPlanId_fkey"
    FOREIGN KEY ("financialPlanId") REFERENCES "FinancialPlan"("id") ON DELETE CASCADE;

-- Add financialPlan relation to Contact (1:1 optional)
ALTER TABLE "Contact" ADD COLUMN "financialPlanId" TEXT;
CREATE UNIQUE INDEX "Contact_financialPlanId_key" ON "Contact"("financialPlanId");
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_financialPlanId_fkey"
    FOREIGN KEY ("financialPlanId") REFERENCES "FinancialPlan"("id") ON DELETE SET NULL;
