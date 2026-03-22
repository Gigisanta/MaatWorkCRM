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
  colorPrincipal: '#6366f1',
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
