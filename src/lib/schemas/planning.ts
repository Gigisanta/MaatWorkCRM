// Zod schemas for Financial Planning validation
import { z } from 'zod';

// ===== Sub-schemas =====

export const metaVidaSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1, 'El nombre es requerido'),
  montoObjetivo: z.number().positive().optional().nullable(),
  fechaEstimada: z.string().datetime().optional().nullable(),
  prioridad: z.string().optional().nullable(), // baja, media, alta
  notes: z.string().optional().nullable(),
});

export const planInstrumentSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1, 'El nombre es requerido'),
  tipo: z.string().optional().nullable(), // ETF, Fondo, ACCIÓN, BONO, DEPÓSITO, etc.
  claseActivo: z.string().optional().nullable(),
  emisor: z.string().optional().nullable(),
  moneda: z.string().optional().nullable(),
  rendimientoEsperado: z.number().optional().nullable(),
  participacion: z.number().min(0).max(100).optional().nullable(),
  isin: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
});

export const asignacionEstrategicaSchema = z.object({
  id: z.string().optional(),
  claseActivo: z.string().min(1, 'La clase de activo es requerida'),
  porcentaje: z.number().min(0).max(100, 'El porcentaje debe estar entre 0 y 100'),
  descripcion: z.string().optional().nullable(),
});

export const obligacionNegociableSchema = z.object({
  id: z.string().optional(),
  acreedor: z.string().min(1, 'El acreedor es requerido'),
  tipo: z.string().optional().nullable(), // hipoteca, préstamo personal, tarjeta, etc.
  saldoPendiente: z.number().optional().nullable(),
  tasaInteres: z.number().optional().nullable(),
  cuotaMensual: z.number().optional().nullable(),
  fechaVencimiento: z.string().datetime().optional().nullable(),
  origen: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
});

export const riesgoSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1, 'El nombre es requerido'),
  tipo: z.string().optional().nullable(), // mercado, crédito, liquidez, operativo
  probabilidad: z.string().optional().nullable(), // baja, media, alta
  impacto: z.string().optional().nullable(), // bajo, medio, alto
  mitigacion: z.string().optional().nullable(),
  severity: z.string().optional().nullable(),
});

export const planningConfigSchema = z.object({
  webUrl: z.string().url().optional().nullable(),
  asesorNombre: z.string().optional().nullable(),
  asesorTelefono: z.string().optional().nullable(),
  colorPrincipal: z.string().optional().nullable(),
  colorAcento: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
});

export const planningIASchema = z.object({
  terminoFinanciero: z.string().optional().nullable(),
  usarTerminoIA: z.boolean().default(false),
  consejoFinal: z.string().optional().nullable(),
  usarConsejoIA: z.boolean().default(false),
});

export const planningProyeccionSchema = z.object({
  proyeccionRetiro: z.string().optional().nullable(),
  gastosPrincipales: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
});

// ===== Main schemas =====

export const financialPlanSchema = z.object({
  // Client profile (required for plan creation)
  edad: z.number().int().positive().optional(),
  profesion: z.string().optional().nullable(),
  objetivo: z.string().optional().nullable(),
  perfilRiesgo: z.enum(['Conservador', 'Moderado', 'Agresivo']).optional().nullable(),
  aporteMensual: z.number().positive().optional(),
  aporteInicial: z.number().min(0).optional().nullable(),
  horizonteMeses: z.number().int().positive().optional(),
  tipoAporte: z.enum(['mensual', 'trimestral', 'anual', 'unico', 'semanal', 'quincenal']).optional().nullable(),

  // Financial health
  ingresosMensuales: z.number().positive().optional().nullable(),
  gastosMensuales: z.number().positive().optional().nullable(),
  fondoEmergenciaMeses: z.number().int().nonnegative().optional().nullable(),
  fondoEmergenciaActual: z.number().min(0).optional().nullable(),
  patrimonioActivos: z.number().min(0).optional().nullable(),
  patrimonioDeudas: z.number().min(0).optional().nullable(),

  // Related data (arrays)
  metasVida: z.array(metaVidaSchema).optional(),
  instruments: z.array(planInstrumentSchema).optional(),
  asignacionesEstrategicas: z.array(asignacionEstrategicaSchema).optional(),
  obligacionesNegociables: z.array(obligacionNegociableSchema).optional(),
  riesgos: z.array(riesgoSchema).optional(),

  // Config
  config: planningConfigSchema.optional(),

  // AI
  ia: planningIASchema.optional(),

  // Proyeccion
  proyeccion: planningProyeccionSchema.optional(),
});

export const financialPlanUpdateSchema = financialPlanSchema.partial();
export const financialPlanCreateSchema = financialPlanSchema;

// ===== Types =====

export type MetaVidaInput = z.infer<typeof metaVidaSchema>;
export type PlanInstrumentInput = z.infer<typeof planInstrumentSchema>;
export type AsignacionEstrategicaInput = z.infer<typeof asignacionEstrategicaSchema>;
export type ObligacionNegociableInput = z.infer<typeof obligacionNegociableSchema>;
export type RiesgoInput = z.infer<typeof riesgoSchema>;
export type PlanningConfigInput = z.infer<typeof planningConfigSchema>;
export type PlanningIAInput = z.infer<typeof planningIASchema>;
export type PlanningProyeccionInput = z.infer<typeof planningProyeccionSchema>;
export type FinancialPlanInput = z.infer<typeof financialPlanSchema>;
export type FinancialPlanUpdateInput = z.infer<typeof financialPlanUpdateSchema>;
export type FinancialPlanCreateInput = z.infer<typeof financialPlanCreateSchema>;
