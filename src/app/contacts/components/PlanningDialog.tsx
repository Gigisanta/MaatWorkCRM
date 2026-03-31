'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { X, Save, Eye, ChevronLeft, ChevronRight, Loader2, User, FileDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
      const response = await fetch(`/api/contacts?organizationId=${organizationId}&limit=100`, { credentials: 'include' });
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
          'glass border-white/8 bg-[#0E0F12]/95 backdrop-blur-xl text-white',
          'w-[95vw] h-[90vh] max-w-[1400px] overflow-hidden flex flex-col',
          isMobile ? 'max-w-full h-full' : ''
        )}
      >
        {/* Header - Minimalist with integrated client selector */}
        <div className="border-b border-white/8 px-6 py-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Client Selector in Header */}
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-violet-400" />
                {activeContactId ? (
                  <Select
                    value={activeContactId}
                    onValueChange={(value) => {
                      const contact = contacts.find(c => c.id === value);
                      if (contact) {
                        setActiveContact(contact.id, contact.name);
                        // Reload data when changing contact
                        openDialog(contact.id, contact.name);
                      }
                    }}
                  >
                    <SelectTrigger className="w-[240px] h-9 bg-white/5 border-white/8 text-white text-sm">
                      <div className="flex items-center gap-2">
                        <span>{contacts.find(c => c.id === activeContactId)?.emoji || '👤'}</span>
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="glass border-white/8 bg-[#0E0F12]">
                      {contacts.map(contact => (
                        <SelectItem key={contact.id} value={contact.id}>
                          <div className="flex items-center gap-2">
                            <span>{contact.emoji}</span>
                            <span>{contact.name}</span>
                            {contact.company && (
                              <span className="text-slate-400 text-xs">({contact.company})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (value) {
                        const contact = contacts.find(c => c.id === value);
                        if (contact) {
                          setActiveContact(contact.id, contact.name);
                          openDialog(contact.id, contact.name);
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="w-[240px] h-9 bg-white/5 border-white/8 text-white text-sm">
                      <SelectValue placeholder="Seleccionar cliente..." />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/8 bg-[#0E0F12] max-h-[300px]">
                      {contacts.map(contact => (
                        <SelectItem key={contact.id} value={contact.id}>
                          <div className="flex items-center gap-2">
                            <span>{contact.emoji}</span>
                            <div className="flex flex-col">
                              <span>{contact.name}</span>
                              {contact.company && (
                                <span className="text-slate-400 text-xs">{contact.company}</span>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="text-violet-400">Paso</span>
                <span className="text-white font-medium">{currentStep}</span>
                <span>de {totalSteps}</span>
              </div>
            </div>

            {/* Close button */}
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

          {/* Stepper */}
          <div className="mt-3">
            <PlanningStepper currentStep={currentStep} onStepClick={goToStep} />
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
              className="h-full"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Preview when there's HTML - shown below form */}
          {previewHtml && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-6 pt-6 border-t border-white/8"
            >
              <PlanningPreview
                html={previewHtml}
                isGenerating={isGenerating}
              />
            </motion.div>
          )}
        </div>

        {/* Footer - Minimalistic with primary actions */}
        <div className="border-t border-white/8 px-6 py-3 shrink-0 bg-[#0E0F12]/50">
          <div className="flex items-center justify-between gap-4">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 1 || isGenerating}
                className="text-slate-400 hover:text-white hover:bg-white/5"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
              <Button
                variant="ghost"
                onClick={nextStep}
                disabled={currentStep === totalSteps || isGenerating}
                className="text-slate-400 hover:text-white hover:bg-white/5"
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Primary Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={isGenerating || !activeContactId}
                className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                <span className="ml-2">Vista Previa</span>
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isGenerating || !activeContactId}
                className="bg-violet-500 hover:bg-violet-600"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span className="ml-2">Guardar</span>
              </Button>
            </div>
          </div>

          {/* Helper text */}
          {!activeContactId && (
            <p className="text-xs text-amber-400 mt-2 text-center">
              Selecciona un cliente para poder guardar o previsualizar el plan
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
