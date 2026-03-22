'use client';

import * as React from 'react';
import { toast } from 'sonner';

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

interface UsePlanningDialogProps {
  contactId?: string;
  contactName?: string;
}

export function usePlanningDialog({ contactId, contactName }: UsePlanningDialogProps = {}) {
  const [open, setOpen] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(1);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [previewHtml, setPreviewHtml] = React.useState<string | null>(null);
  const [activeContactId, setActiveContactId] = React.useState<string | undefined>(contactId);
  const [activeContactName, setActiveContactName] = React.useState<string | undefined>(contactName);

  const [formData, setFormData] = React.useState<PlanningFormData>({
    metas: [],
    instrumentos: [],
    asignaciones: [],
    obligaciones: [],
    riesgos: [],
    perfilRiesgo: 'moderado',
    usarTerminoIA: false,
    usarConsejoIA: false,
    colorPrincipal: '#6366f1',
    colorAcento: '#10b981',
  });

  const totalSteps = 5;

  const openDialog = React.useCallback((cid?: string, cname?: string) => {
    if (cid) setActiveContactId(cid);
    if (cname) setActiveContactName(cname);
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
        body: JSON.stringify({
          ...formData,
          wizardStep: currentStep,
        }),
      });

      // Then generate HTML
      const response = await fetch(`/api/contacts/${activeContactId}/planning/html`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Error al generar la vista previa');
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

  return {
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
    onSave,
    onPreview,
  };
}
