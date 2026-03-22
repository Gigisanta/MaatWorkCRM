-- CreateTable
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
    "webUrl" TEXT,
    "asesorNombre" TEXT,
    "asesorTelefono" TEXT,
    "asesorMensajePredefinido" TEXT,
    "terminoFinanciero" TEXT,
    "usarTerminoIA" BOOLEAN NOT NULL DEFAULT false,
    "consejoFinal" TEXT,
    "usarConsejoIA" BOOLEAN NOT NULL DEFAULT false,
    "colorPrincipal" TEXT NOT NULL DEFAULT '#6366f1',
    "colorAcento" TEXT NOT NULL DEFAULT '#10b981',
    "logoUrl" TEXT,
    "proyeccionRetiro" TEXT,
    "gastosPrincipales" TEXT,
    "observaciones" TEXT,
    "wizardStep" INTEGER NOT NULL DEFAULT 1,
    "generatedHtml" TEXT,
    "editableHtml" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastGeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaVida" (
    "id" TEXT NOT NULL,
    "financialPlanId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "montoObjetivo" DOUBLE PRECISION,
    "fechaEstimada" TIMESTAMP(3),
    "prioridad" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetaVida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsignacionEstrategica" (
    "id" TEXT NOT NULL,
    "financialPlanId" TEXT NOT NULL,
    "claseActivo" TEXT NOT NULL,
    "porcentaje" DOUBLE PRECISION NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AsignacionEstrategica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanInstrument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ObligacionNegociable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Riesgo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinancialPlan_contactId_key" ON "FinancialPlan"("contactId");

-- CreateIndex
CREATE INDEX "FinancialPlan_contactId_idx" ON "FinancialPlan"("contactId");

-- CreateIndex
CREATE INDEX "MetaVida_financialPlanId_idx" ON "MetaVida"("financialPlanId");

-- CreateIndex
CREATE INDEX "AsignacionEstrategica_financialPlanId_idx" ON "AsignacionEstrategica"("financialPlanId");

-- CreateIndex
CREATE INDEX "PlanInstrument_financialPlanId_idx" ON "PlanInstrument"("financialPlanId");

-- CreateIndex
CREATE INDEX "ObligacionNegociable_financialPlanId_idx" ON "ObligacionNegociable"("financialPlanId");

-- CreateIndex
CREATE INDEX "Riesgo_financialPlanId_idx" ON "Riesgo"("financialPlanId");

-- AddForeignKey
ALTER TABLE "FinancialPlan" ADD CONSTRAINT "FinancialPlan_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaVida" ADD CONSTRAINT "MetaVida_financialPlanId_fkey" FOREIGN KEY ("financialPlanId") REFERENCES "FinancialPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionEstrategica" ADD CONSTRAINT "AsignacionEstrategica_financialPlanId_fkey" FOREIGN KEY ("financialPlanId") REFERENCES "FinancialPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanInstrument" ADD CONSTRAINT "PlanInstrument_financialPlanId_fkey" FOREIGN KEY ("financialPlanId") REFERENCES "FinancialPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObligacionNegociable" ADD CONSTRAINT "ObligacionNegociable_financialPlanId_fkey" FOREIGN KEY ("financialPlanId") REFERENCES "FinancialPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Riesgo" ADD CONSTRAINT "Riesgo_financialPlanId_fkey" FOREIGN KEY ("financialPlanId") REFERENCES "FinancialPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
