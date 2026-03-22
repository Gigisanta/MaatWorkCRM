'use client';

import * as React from 'react';

// Re-export the context-based hook
export { usePlanningDialogContext as usePlanningDialog } from './PlanningDialogContext';

// Keep the type for backwards compatibility
export interface PlanningFormData {
  // Step 1: Client
  edad?: number;
  profesion?: string;
  objetivo?: string;
  perfilRiesgo?: 'conservador' | 'moderado' | 'agresivo';
  aporteInicial?: number;
  aporteMensual?: number;
  horizonteMeses?: number;

  // Step 2: Health
  ingresosMensuales?: number;
  gastosMensuales?: number;
  fondoEmergenciaMeses?: number;
  fondoEmergenciaActual?: number;
  patrimonioActivos?: number;
  patrimonioDeudas?: number;

  // Step 3: Goals
  metas: Array<{
    id?: string;
    nombre: string;
    montoObjetivo?: number;
    fechaEstimada?: string;
    prioridad?: 'baja' | 'media' | 'alta';
    notes?: string;
  }>;
  proyeccionRetiro?: string;

  // Step 4: Portfolio
  instrumentos: Array<{
    id?: string;
    nombre: string;
    tipo?: string;
    claseActivo?: string;
    emisor?: string;
    moneda?: 'USD' | 'ARS' | 'Mix';
    rendimientoEsperado?: number;
    participacion?: number;
  }>;
  asignaciones: Array<{
    id?: string;
    claseActivo: string;
    porcentaje: number;
  }>;

  // Step 5: Final
  obligaciones: Array<{
    id?: string;
    acreedor: string;
    tipo?: string;
    saldoPendiente?: number;
    tasaInteres?: number;
    cuotaMensual?: number;
    fechaVencimiento?: string;
  }>;
  riesgos: Array<{
    id?: string;
    nombre: string;
    tipo?: string;
    probabilidad?: 'baja' | 'media' | 'alta';
    impacto?: 'bajo' | 'medio' | 'alto';
    mitigacion?: string;
    severity?: string;
  }>;
  usarTerminoIA?: boolean;
  terminoFinanciero?: string;
  usarConsejoIA?: boolean;
  consejoFinal?: string;
  colorPrincipal?: string;
  colorAcento?: string;
  asesorNombre?: string;
  asesorTelefono?: string;
  asesorMensajePredefinido?: string;
}
