'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { PlanningFormData } from './usePlanningDialog';

interface PlanningDialogContextValue {
  open: boolean;
  currentStep: number;
  totalSteps: number;
  formData: PlanningFormData;
  isGenerating: boolean;
  previewHtml: string | null;
  activeContactId: string | undefined;
  activeContactName: string | undefined;
  openDialog: (contactId?: string, contactName?: string) => void;
  closeDialog: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  updateFormData: (data: Partial<PlanningFormData>) => void;
  setActiveContact: (contactId: string, contactName: string) => void;
  onSave: () => Promise<void>;
  onPreview: () => Promise<void>;
}

// Transform frontend PlanningFormData to backend API format
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformFormDataToPlanData(data: PlanningFormData): any {
  return {
    // Client profile
    edad: data.edad || 0,
    profesion: data.profesion || '',
    objetivo: data.objetivo || '',
    perfilRiesgo: data.perfilRiesgo || 'moderado',
    aporteMensual: data.aporteMensual || 0,
    aporteInicial: data.aporteInicial,
    horizonteMeses: data.horizonteMeses || 12,
    // Financial health
    ingresosMensuales: data.ingresosMensuales,
    gastosMensuales: data.gastosMensuales,
    fondoEmergenciaMeses: data.fondoEmergenciaMeses,
    fondoEmergenciaActual: data.fondoEmergenciaActual,
    patrimonioActivos: data.patrimonioActivos,
    patrimonioDeudas: data.patrimonioDeudas,
    // Goals - transform metas to metasVida
    metasVida: data.metas?.map(m => ({
      id: m.id,
      nombre: m.nombre,
      montoObjetivo: m.montoObjetivo,
      fechaEstimada: m.fechaEstimada ? new Date(m.fechaEstimada) : null,
      prioridad: m.prioridad,
      notes: m.notes,
    })) || [],
    proyeccionRetiro: data.proyeccionRetiro,
    // Portfolio - transform field names
    instruments: data.instrumentos?.map(i => ({
      id: i.id,
      nombre: i.nombre,
      tipo: i.tipo,
      claseActivo: i.claseActivo,
      emisor: i.emisor,
      moneda: i.moneda,
      rendimientoEsperado: i.rendimientoEsperado,
      participacion: i.participacion,
    })) || [],
    // Transform asignaciones to asignacionesEstrategicas
    asignacionesEstrategicas: data.asignaciones?.map((a: { id?: string; claseActivo: string; porcentaje: number; descripcion?: string | null }) => ({
      id: a.id,
      claseActivo: a.claseActivo,
      porcentaje: a.porcentaje,
      descripcion: a.descripcion || null,
    })) || [],
    // Obligations - transform obligaciones to obligacionesNegociables
    obligacionesNegociables: data.obligaciones?.map((o: { id?: string; acreedor: string; tipo?: string | null; saldoPendiente?: number | null; tasaInteres?: number | null; cuotaMensual?: number | null; fechaVencimiento?: string | null }) => ({
      id: o.id,
      acreedor: o.acreedor,
      tipo: o.tipo || null,
      saldoPendiente: o.saldoPendiente ?? null,
      tasaInteres: o.tasaInteres ?? null,
      cuotaMensual: o.cuotaMensual ?? null,
      fechaVencimiento: o.fechaVencimiento ? new Date(o.fechaVencimiento) : null,
    })) || [],
    // Risks
    riesgos: data.riesgos?.map(r => ({
      id: r.id,
      nombre: r.nombre,
      tipo: r.tipo,
      probabilidad: r.probabilidad,
      impacto: r.impacto,
      mitigacion: r.mitigacion,
      severity: r.severity,
    })) || [],
    // AI
    usarTerminoIA: data.usarTerminoIA,
    terminoFinanciero: data.terminoFinanciero,
    usarConsejoIA: data.usarConsejoIA,
    consejoFinal: data.consejoFinal,
    // Branding
    colorPrincipal: data.colorPrincipal,
    colorAcento: data.colorAcento,
    // Advisor
    asesorNombre: data.asesorNombre,
    asesorTelefono: data.asesorTelefono,
    asesorMensajePredefinido: data.asesorMensajePredefinido,
    // Required by PlanData but not in formData
    gastosPrincipales: '',
  };
}

// Transform API response to frontend formData format
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformApiResponseToFormData(apiData: any): Partial<PlanningFormData> {
  if (!apiData) return {};

  return {
    // Client profile
    edad: apiData.edad,
    profesion: apiData.profesion,
    objetivo: apiData.objetivo,
    perfilRiesgo: apiData.perfilRiesgo?.toLowerCase() as 'conservador' | 'moderado' | 'agresivo',
    aporteMensual: apiData.aporteMensual,
    aporteInicial: apiData.aporteInicial,
    horizonteMeses: apiData.horizonteMeses,
    // Financial health
    ingresosMensuales: apiData.ingresosMensuales,
    gastosMensuales: apiData.gastosMensuales,
    fondoEmergenciaMeses: apiData.fondoEmergenciaMeses,
    fondoEmergenciaActual: apiData.fondoEmergenciaActual,
    patrimonioActivos: apiData.patrimonioActivos,
    patrimonioDeudas: apiData.patrimonioDeudas,
    // Goals
    metas: (apiData.metasVida || []).map((m: any) => ({
      id: m.id,
      nombre: m.nombre,
      montoObjetivo: m.montoObjetivo,
      fechaEstimada: m.fechaEstimada ? new Date(m.fechaEstimada).toISOString() : undefined,
      prioridad: m.prioridad as 'baja' | 'media' | 'alta',
      notes: m.notes,
    })),
    proyeccionRetiro: apiData.proyeccionRetiro,
    // Portfolio
    instrumentos: (apiData.instrumentos || []).map((i: any) => ({
      id: i.id,
      nombre: i.nombre,
      tipo: i.tipo,
      claseActivo: i.claseActivo,
      emisor: i.emisor,
      moneda: i.moneda as 'USD' | 'ARS' | 'Mix',
      rendimientoEsperado: i.rendimientoEsperado,
      participacion: i.participacion,
      isin: i.isin,
      notas: i.notas,
    })),
    asignaciones: (apiData.asignacionesEstrategicas || []).map((a: any) => ({
      id: a.id,
      claseActivo: a.claseActivo,
      porcentaje: a.porcentaje,
      descripcion: a.descripcion,
    })),
    // Obligations
    obligaciones: (apiData.obligacionesNegociables || []).map((o: any) => ({
      id: o.id,
      acreedor: o.acreedor,
      tipo: o.tipo,
      saldoPendiente: o.saldoPendiente,
      tasaInteres: o.tasaInteres,
      cuotaMensual: o.cuotaMensual,
      fechaVencimiento: o.fechaVencimiento ? new Date(o.fechaVencimiento).toISOString() : undefined,
      origen: o.origen,
      notas: o.notas,
    })),
    // Risks
    riesgos: (apiData.riesgos || []).map((r: any) => ({
      id: r.id,
      nombre: r.nombre,
      tipo: r.tipo,
      probabilidad: r.probabilidad as 'baja' | 'media' | 'alta',
      impacto: r.impacto as 'bajo' | 'medio' | 'alto',
      mitigacion: r.mitigacion,
      severity: r.severity,
    })),
    // AI
    usarTerminoIA: apiData.usarTerminoIA,
    terminoFinanciero: apiData.terminoFinanciero,
    usarConsejoIA: apiData.usarConsejoIA,
    consejoFinal: apiData.consejoFinal,
    // Branding
    colorPrincipal: apiData.colorPrincipal,
    colorAcento: apiData.colorAcento,
    // Advisor
    asesorNombre: apiData.asesorNombre,
    asesorTelefono: apiData.asesorTelefono,
    asesorMensajePredefinido: apiData.asesorMensajePredefinido,
    // Proyeccion
  };
}

const PlanningDialogContext = React.createContext<PlanningDialogContextValue | null>(null);

const defaultFormData: PlanningFormData = {
  metas: [],
  instrumentos: [],
  asignaciones: [],
  obligaciones: [],
  riesgos: [],
  perfilRiesgo: 'moderado',
  usarTerminoIA: false,
  usarConsejoIA: false,
  colorPrincipal: '#8B5CF6',
  colorAcento: '#10b981',
};

export function PlanningDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(1);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [previewHtml, setPreviewHtml] = React.useState<string | null>(null);
  const [activeContactId, setActiveContactId] = React.useState<string | undefined>(undefined);
  const [activeContactName, setActiveContactName] = React.useState<string | undefined>(undefined);

  const [formData, setFormData] = React.useState<PlanningFormData>(defaultFormData);

  const totalSteps = 5;

  const openDialog = React.useCallback(async (cid?: string, cname?: string) => {
    // Reset to default form data first
    setFormData(defaultFormData);
    setCurrentStep(1);
    setPreviewHtml(null);

    if (cid) setActiveContactId(cid);
    if (cname) setActiveContactName(cname);

    // Load existing financial plan data if contactId is provided
    if (cid) {
      try {
        const response = await fetch(`/api/contacts/${cid}/planning`, { credentials: 'include' });
        if (response.ok) {
          const apiData = await response.json();
          const existingData = transformApiResponseToFormData(apiData);
          if (existingData && Object.keys(existingData).length > 0) {
            setFormData({ ...defaultFormData, ...existingData });
          }
        }
      } catch (error) {
        console.error('Error loading existing financial plan:', error);
      }
    }

    setOpen(true);
  }, []);

  const closeDialog = React.useCallback(() => {
    setOpen(false);
    setCurrentStep(1);
    setPreviewHtml(null);
  }, []);

  const nextStep = React.useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep]);

  const prevStep = React.useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const goToStep = React.useCallback((step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  }, []);

  const updateFormData = React.useCallback((data: Partial<PlanningFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  const setActiveContact = React.useCallback((contactId: string, contactName: string) => {
    setActiveContactId(contactId);
    setActiveContactName(contactName);
  }, []);

  const onSave = React.useCallback(async () => {
    if (!activeContactId) {
      toast.error('No hay contacto seleccionado');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`/api/contacts/${activeContactId}/planning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          wizardStep: currentStep,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar el plan financiero');
      }

      toast.success('Plan financiero guardado');
    } catch (error) {
      toast.error('Error al guardar el plan financiero');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  }, [activeContactId, formData, currentStep]);

  const onPreview = React.useCallback(async () => {
    if (!activeContactId) {
      toast.error('No hay contacto seleccionado');
      return;
    }

    setIsGenerating(true);
    setPreviewHtml(null);

    try {
      // First save the data
      await fetch(`/api/contacts/${activeContactId}/planning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          wizardStep: currentStep,
        }),
      });

      // Then generate HTML - transform formData to PlanData format
      const planData = transformFormDataToPlanData(formData);
      const response = await fetch(`/api/contacts/${activeContactId}/planning/html`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planData }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al generar la vista previa: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      setPreviewHtml(data.html);
      toast.success('Vista previa generada');
    } catch (error) {
      toast.error('Error al generar la vista previa');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  }, [activeContactId, formData, currentStep]);

  const value: PlanningDialogContextValue = {
    open,
    currentStep,
    totalSteps,
    formData,
    isGenerating,
    previewHtml,
    activeContactId,
    activeContactName,
    openDialog,
    closeDialog,
    nextStep,
    prevStep,
    goToStep,
    updateFormData,
    setActiveContact,
    onSave,
    onPreview,
  };

  return (
    <PlanningDialogContext.Provider value={value}>
      {children}
    </PlanningDialogContext.Provider>
  );
}

export function usePlanningDialogContext() {
  const context = React.useContext(PlanningDialogContext);
  if (!context) {
    throw new Error('usePlanningDialogContext must be used within PlanningDialogProvider');
  }
  return context;
}
