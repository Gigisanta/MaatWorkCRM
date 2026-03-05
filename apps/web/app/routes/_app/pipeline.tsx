import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useCallback } from "react";
import { 
  usePipelineBoard, 
  useMoveDealMutation,
  useCreateDealMutation,
  useCreateStageMutation,
  useContacts
} from "~/lib/hooks/use-crm";
import { Container, Stack, Grid } from "~/components/ui/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { Icon } from "~/components/ui/Icon";
import { Input } from "~/components/ui/Input";
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from "~/components/ui/Modal";
import { EmptyState } from "~/components/ui/EmptyState";
import { ConfirmDialog } from "~/components/ui/ConfirmDialog";
import { cn, formatCurrency } from "~/lib/utils";

export const Route = createFileRoute("/_app/pipeline")({
  component: PipelinePage,
});

function PipelinePage() {
  const { data: stages, isLoading, error } = usePipelineBoard();
  const { data: contacts } = useContacts();
  const moveDealMutation = useMoveDealMutation();
  const createDealMutation = useCreateDealMutation();
  const createStageMutation = useCreateStageMutation();
  
  const [draggingDealId, setDraggingDealId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  
  const [showNewDealModal, setShowNewDealModal] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [newDealForm, setNewDealForm] = useState({ title: "", value: "", contactId: "" });

  const [showNewStageModal, setShowNewStageModal] = useState(false);
  const [newStageForm, setNewStageForm] = useState({ name: "", color: "#3b82f6" });
  
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData("text/plain", dealId);
    setDraggingDealId(dealId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStageId(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStageId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("text/plain");
    setDraggingDealId(null);
    setDragOverStageId(null);

    if (!dealId || !targetStageId) return;

    // Find current stage for the deal to prevent redundant moves
    const currentStage = stages?.find(s => s.deals.some((d: any) => d.deal.id === dealId));
    if (currentStage?.id === targetStageId) return;

    try {
      await moveDealMutation.mutateAsync({ dealId, stageId: targetStageId });
    } catch (err) {
      console.error("Failed to move deal:", err);
    }
  };

  const handleCreateDeal = async () => {
    if (!newDealForm.title || !newDealForm.contactId || !selectedStageId) return;
    try {
      await createDealMutation.mutateAsync({
        ...newDealForm,
        value: Number(newDealForm.value),
        stageId: selectedStageId,
      });
      setShowNewDealModal(false);
      setNewDealForm({ title: "", value: "", contactId: "" });
    } catch (err) {
      console.error("Failed to create deal:", err);
    }
  };

  const handleCreateStage = async () => {
    if (!newStageForm.name || !newStageForm.color) return;
    try {
      await createStageMutation.mutateAsync({
        name: newStageForm.name,
        color: newStageForm.color,
        order: (stages?.length || 0) + 1,
      });
      setShowNewStageModal(false);
      setNewStageForm({ name: "", color: "#3b82f6" });
    } catch (err) {
      console.error("Failed to create stage:", err);
    }
  };

  if (isLoading) {
    return (
      <Container className="py-12 flex justify-center">
        <Stack direction="column" align="center" gap="md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="text-text-secondary">Cargando pipeline...</p>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-12 text-center">
        <EmptyState 
          title="Error al cargar el pipeline" 
          description={(error as Error).message}
          icon={<Icon name="AlertTriangle" className="text-error" />}
        />
      </Container>
    );
  }

  const totalValue = stages?.reduce((acc, stage) => 
    acc + stage.deals.reduce((sAcc: number, d: any) => sAcc + (Number(d.deal.value) || 0), 0)
  , 0) || 0;

  const totalDeals = stages?.reduce((acc, stage) => acc + stage.deals.length, 0) || 0;

  return (
    <Container size="full" className="py-6 space-y-6">
      {/* Header */}
      <Stack direction="row" align="center" justify="between" className="px-2">
        <Stack direction="column" gap="xs">
          <h1 className="text-3xl font-bold text-text font-display transition-all animate-enter">
            Pipeline de Ventas
          </h1>
          <p className="text-text-secondary">
            {totalDeals} negocios en curso • Total {formatCurrency(totalValue)}
          </p>
        </Stack>
        <Button variant="primary" size="md" onClick={() => {
          if (stages && stages.length > 0) {
            setSelectedStageId(stages[0].id);
            setShowNewDealModal(true);
          } else {
            alert("Crea una etapa antes de añadir negocios.");
          }
        }}>
          <Icon name="Plus" className="mr-2" size={16} />
          Nuevo Negocio
        </Button>
      </Stack>

      {/* Board Layout */}
      <div className="flex gap-6 overflow-x-auto pb-6 px-2 min-h-[calc(100vh-250px)]">
        {stages?.map((stage, stageIndex) => (
          <div 
            key={stage.id}
            className={cn(
              "flex-shrink-0 w-80 flex flex-col gap-4 transition-all duration-500",
              "animate-enter"
            )}
            style={{ animationDelay: `${stageIndex * 100}ms` }}
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            {/* Stage Header */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: stage.color }} 
                />
                <h3 className="font-semibold text-text font-display">
                  {stage.name}
                </h3>
                <Badge variant="secondary" className="ml-2 font-mono">
                  {stage.deals.length}
                </Badge>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => {
                  setSelectedStageId(stage.id);
                  setShowNewDealModal(true);
                }}
              >
                <Icon name="Plus" size={14} />
              </Button>
            </div>

            {/* Deals Column */}
            <div 
              className={cn(
                "flex-1 flex flex-col gap-3 rounded-xl p-2 transition-colors",
                dragOverStageId === stage.id ? "bg-primary/5 ring-2 ring-primary/20 ring-dashed" : "bg-secondary/5"
              )}
            >
              {stage.deals.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8 border-2 border-dashed border-border/50 rounded-xl">
                  <p className="text-xs text-text-muted text-center italic">
                    Sin negocios
                  </p>
                </div>
              ) : (
                stage.deals.map((dealWithContact: any) => {
                  const { deal, contact } = dealWithContact;
                  return (
                    <Card
                      key={deal.id}
                      variant="interactive"
                      className={cn(
                        "cursor-grab active:cursor-grabbing hover-lift",
                        draggingDealId === deal.id && "opacity-40 grayscale-[50%]"
                      )}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                    >
                      <CardContent className="p-3 space-y-3">
                        <Stack direction="column" gap="xs">
                          <p className="font-medium text-sm text-text line-clamp-2">
                            {deal.title}
                          </p>
                          <Stack direction="row" gap="xs" align="center">
                            <Icon name="User" size={12} className="text-text-muted" />
                            <span className="text-xs text-text-secondary truncate">
                              {contact?.name || "Sin Contacto"}
                            </span>
                          </Stack>
                        </Stack>

                        <div className="flex items-center justify-between pt-auto">
                          <div className="flex items-center gap-1 text-primary">
                            <Icon name="DollarSign" size={12} />
                            <span className="text-xs font-bold font-mono">
                              {formatCurrency(Number(deal.value) || 0)}
                            </span>
                          </div>
                          
                          {deal.probability && (
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[10px] text-text-muted font-medium">
                                {deal.probability}%
                              </span>
                              <div className="w-12 h-1 rounded-full bg-border overflow-hidden">
                                <div 
                                  className="h-full bg-primary transition-all duration-500" 
                                  style={{ width: `${deal.probability}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        ))}
        
        {/* Placeholder Column to add new stage */}
        <div className="flex-shrink-0 w-80">
          <Button 
            variant="dashed" 
            className="w-full h-12 text-text-muted hover:text-primary transition-all"
            onClick={() => setShowNewStageModal(true)}
          >
            <Icon name="Plus" size={16} className="mr-2" />
            Añadir Etapa
          </Button>
        </div>
      </div>

      {/* New Deal Modal */}
      <Modal open={showNewDealModal} onClose={() => setShowNewDealModal(false)}>
        <ModalHeader>
          <ModalTitle>Nuevo Negocio</ModalTitle>
        </ModalHeader>
        <ModalContent className="space-y-4">
          <Input 
            label="Título del Negocio"
            placeholder="Ej: Implementación CRM"
            value={newDealForm.title}
            onChange={(e) => setNewDealForm(prev => ({ ...prev, title: e.target.value }))}
          />
          <Input 
            label="Valor"
            type="number"
            placeholder="0.00"
            value={newDealForm.value}
            onChange={(e) => setNewDealForm(prev => ({ ...prev, value: e.target.value }))}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">Contacto</label>
            <select 
              className="w-full h-10 px-3 rounded-lg border border-border bg-secondary/5 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              value={newDealForm.contactId}
              onChange={(e) => setNewDealForm(prev => ({ ...prev, contactId: e.target.value }))}
            >
              <option value="">Seleccionar contacto...</option>
              {contacts?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowNewDealModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateDeal}
            disabled={createDealMutation.isPending || !newDealForm.title || !newDealForm.contactId}
          >
            {createDealMutation.isPending ? "Creando..." : "Crear Negocio"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* New Stage Modal */}
      <Modal open={showNewStageModal} onClose={() => setShowNewStageModal(false)}>
        <ModalHeader>
          <ModalTitle>Nueva Etapa</ModalTitle>
        </ModalHeader>
        <ModalContent className="space-y-4">
          <Input 
            label="Nombre de la etapa"
            placeholder="Ej: Análisis de Necesidades"
            value={newStageForm.name}
            onChange={(e) => setNewStageForm(prev => ({ ...prev, name: e.target.value }))}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">Pulsar para elegir color (Hex o Preset)</label>
            <div className="flex gap-2">
              {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map(color => (
                <button
                  key={color}
                  onClick={() => setNewStageForm(prev => ({ ...prev, color }))}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all",
                    newStageForm.color === color ? "border-white scale-110" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <Input 
              placeholder="#AABBCC"
              value={newStageForm.color}
              onChange={(e) => setNewStageForm(prev => ({ ...prev, color: e.target.value }))}
            />
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowNewStageModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateStage}
            disabled={createStageMutation.isPending || !newStageForm.name || !newStageForm.color}
          >
            {createStageMutation.isPending ? "Creando..." : "Crear Etapa"}
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
}
