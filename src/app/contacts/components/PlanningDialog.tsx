'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { X, Save, Eye, ChevronLeft, ChevronRight, Loader2, User, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

import { usePlanningDialogContext } from './PlanningDialogContext';
import { PlanningStepper } from './PlanningStepper';
import { PlanningClientStep } from './PlanningClientStep';
import { PlanningHealthStep } from './PlanningHealthStep';
import { PlanningGoalsStep } from './PlanningGoalsStep';
import { PlanningPortfolioStep } from './PlanningPortfolioStep';
import { PlanningFinalStep } from './PlanningFinalStep';
import { PlanningPreview } from './PlanningPreview';

interface PlanningDialogProps {
  contactId?: string;
  contactName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PlanningDialog({ contactId, contactName, open: controlledOpen, onOpenChange }: PlanningDialogProps) {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const organizationId = user?.organizationId || null;

  const {
    open: internalOpen,
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
  } = usePlanningDialogContext();

  // Handle controlled vs uncontrolled
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      if (newOpen) {
        openDialog(contactId, contactName);
      } else {
        closeDialog();
      }
    }
  };

  const handleClose = () => {
    handleOpenChange(false);
  };

  const handleSave = async () => {
    await onSave();
  };

  const handlePreview = async () => {
    await onPreview();
  };

  // Fetch contacts for selector
  const { data: contactsData } = useQuery<{
    contacts: Array<{ id: string; name: string; email: string | null; company: string | null; emoji: string }>;
  }>({
    queryKey: ['contacts-selector', organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/contacts?organizationId=${organizationId}&limit=100`);
      if (!response.ok) throw new Error('Error al cargar contactos');
      return response.json();
    },
    enabled: !!organizationId,
  });

  const contacts = contactsData?.contacts || [];

  // Determine which step to render
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PlanningClientStep data={formData} onUpdate={updateFormData} />;
      case 2:
        return <PlanningHealthStep data={formData} onUpdate={updateFormData} />;
      case 3:
        return <PlanningGoalsStep data={formData} onUpdate={updateFormData} />;
      case 4:
        return <PlanningPortfolioStep data={formData} onUpdate={updateFormData} />;
      case 5:
        return <PlanningFinalStep data={formData} onUpdate={updateFormData} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          'glass border-white/10 bg-slate-900/95 backdrop-blur-xl text-white',
          'max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col',
          isMobile ? 'max-w-full h-full' : ''
        )}
      >
        {/* Header */}
        <DialogHeader className="border-b border-white/10 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-white">
              Plan Financiero - {activeContactName || contactName || 'Cliente'}
            </DialogTitle>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-white"
                onClick={handleClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        {/* Stepper */}
        <div className="px-6 py-2 border-b border-white/10 shrink-0">
          <PlanningStepper currentStep={currentStep} onStepClick={goToStep} />
        </div>

        {/* Contact Selector Bar */}
        <div className="px-6 py-3 border-b border-white/10 shrink-0 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-400">Cliente:</span>
            {activeContactId ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-white font-medium">
                  {activeContactName || 'Cliente seleccionado'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-slate-400 hover:text-white h-6 px-2"
                  onClick={() => {
                    // Open a contact picker - for now just show dropdown
                    const select = document.getElementById('contact-selector') as HTMLSelectElement;
                    if (select) select.focus();
                  }}
                >
                  Cambiar
                </Button>
                <select
                  id="contact-selector"
                  className="glass border-white/10 bg-white/5 text-white text-sm rounded px-2 py-1 h-7 w-48"
                  value=""
                  onChange={(e) => {
                    const contactId = e.target.value;
                    if (contactId) {
                      const contact = contacts.find(c => c.id === contactId);
                      if (contact) {
                        setActiveContact(contact.id, contact.name);
                      }
                    }
                    e.target.value = '';
                  }}
                >
                  <option value="">Cambiar cliente...</option>
                  {contacts.map(contact => (
                    <option key={contact.id} value={contact.id}>
                      {contact.emoji} {contact.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <select
                id="contact-selector"
                className="glass border-white/10 bg-white/5 text-white text-sm rounded px-2 py-1 h-7 w-64"
                value=""
                onChange={(e) => {
                  const contactId = e.target.value;
                  if (contactId) {
                    const contact = contacts.find(c => c.id === contactId);
                    if (contact) {
                      setActiveContact(contact.id, contact.name);
                    }
                  }
                }}
              >
                <option value="">Seleccionar un cliente...</option>
                {contacts.map(contact => (
                  <option key={contact.id} value={contact.id}>
                    {contact.emoji} {contact.name} {contact.company ? `(${contact.company})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Preview when there's HTML */}
          {previewHtml && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <PlanningPreview
                html={previewHtml}
                isGenerating={isGenerating}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="glass border-white/10"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
              <Button
                variant="outline"
                onClick={nextStep}
                disabled={currentStep === totalSteps}
                className="glass border-white/10"
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={isGenerating}
                className="glass border-white/10"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
                )}
                Vista Previa
              </Button>
              <Button
                onClick={handleSave}
                disabled={isGenerating}
                className="bg-indigo-500 hover:bg-indigo-600"
              >
                {isGenerating && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
