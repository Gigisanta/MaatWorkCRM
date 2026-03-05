import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import { 
  usePipelineBoard, 
  useMoveDealMutation,
  useCreateDealMutation,
  useCreateStageMutation,
  useContacts
} from "~/lib/hooks/use-crm";
import { Container, Stack } from "~/components/ui/Layout";
import { Card, CardContent } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { Input } from "~/components/ui/Input";
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from "~/components/ui/Modal";
import { EmptyState } from "~/components/ui/EmptyState";
import { SectionHeader, StatCard } from "~/components/ui/LayoutCards";
import { cn, formatCurrency } from "~/lib/utils";
import { Plus, Search, Filter, MoreHorizontal, MoveHorizontal, ArrowRight, Layers, LayoutGrid, List, SlidersHorizontal, Settings, AlertCircle, RotateCw, DollarSign, GripVertical, AlertTriangle, Calendar, User } from "lucide-react";

export const Route = createFileRoute("/_app/pipeline")({
  component: PipelinePage,
});

function PipelinePage() {
  const { data: board, isLoading, error, refetch } = usePipelineBoard();
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
  const [newStageForm, setNewStageForm] = useState({ name: "", color: "#6366f1" });
  
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
    const currentStage = board?.find(s => s.deals.some((d: any) => d.deal.id === dealId));
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
        order: (board?.length || 0) + 1,
      });
      setShowNewStageModal(false);
      setNewStageForm({ name: "", color: "#6366f1" });
    } catch (err) {
      console.error("Failed to create stage:", err);
    }
  };

  if (error) {
    return (
      <Container className="py-12 text-center">
        <EmptyState 
          title="Error al cargar el pipeline" 
          description={(error as Error).message}
          icon={<AlertTriangle className="w-12 h-12 text-error" />}
        />
      </Container>
    );
  }

  const totalValue = board?.reduce((acc, stage) => 
    acc + stage.deals.reduce((sAcc: number, d: any) => sAcc + (Number(d.deal.value) || 0), 0)
  , 0) || 0;

  const totalDeals = board?.reduce((acc, stage) => acc + stage.deals.length, 0) || 0;

  return (
    <Container size="full" className="py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <SectionHeader 
        title="Pipeline de Ventas" 
        description={`${totalDeals} negocios activos en el embudo actual.`}
        icon={Layers}
        actions={
          <Button variant="primary" size="md" onClick={() => {
            if (board && board.length > 0) {
              setSelectedStageId(board[0].id);
              setShowNewDealModal(true);
            } else {
              setShowNewStageModal(true);
            }
          }} className="rounded-xl shadow-primary">
            <Plus className="mr-2 w-4 h-4" />
            Nuevo Negocio
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-2">
         <StatCard 
            title="Valor Total" 
            value={formatCurrency(totalValue)} 
            trend={{ value: 12, isPositive: true }}
            variant="primary"
            icon={DollarSign}
         />
         <StatCard 
            title="Negocios" 
            value={totalDeals.toString()} 
            variant="info"
            icon={Layers}
         />
         <StatCard 
            title="Tasa de Cierre" 
            value="68%" 
            variant="success"
            icon={Calendar}
         />
         <StatCard 
            title="Meta Mensual" 
            value="$1.2M" 
            variant="warning"
            icon={Calendar}
         />
      </div>

      {/* Board Layout */}
      <div className="flex gap-6 overflow-x-auto pb-8 min-h-[calc(100vh-320px)] scrollbar-thin scrollbar-thumb-border/40 px-2">
        {board?.map((stage, stageIndex) => (
          <div 
            key={stage.id}
            className={cn(
              "flex-shrink-0 w-80 flex flex-col gap-4 transition-all duration-500 group/stage",
              "animate-fade-in-up"
            )}
            style={{ animationDelay: `${stageIndex * 100}ms` }}
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            {/* Stage Header */}
            <div className="flex items-center justify-between px-5 py-4 enterprise-glass rounded-[1.5rem] border border-border/40 shadow-glass group-hover/stage:border-primary/30 transition-all duration-500">
              <div className="flex items-center gap-4">
                <div 
                  className="w-2 h-8 rounded-full shadow-lg" 
                  style={{ 
                    backgroundColor: stage.color || "#6366f1",
                    boxShadow: `0 0 15px ${(stage.color || "#6366f1")}40`
                  }} 
                />
                <div>
                   <h3 className="text-[12px] font-black text-white/95 font-display uppercase tracking-[0.2em]">
                     {stage.name}
                   </h3>
                   <div className="flex items-center gap-2.5 mt-0.5">
                      <span className="text-[10px] font-black text-text-muted/60 tracking-wider">
                        {stage.deals.length} NEGOCIOS
                      </span>
                      <span className="text-[10px] text-primary/30 font-black">•</span>
                      <span className="text-[10px] font-black text-primary/90 bg-primary/10 px-2 py-0.5 rounded-full">
                        {formatCurrency(stage.deals.reduce((acc: number, d: any) => acc + (Number(d.deal.value) || 0), 0))}
                      </span>
                   </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-10 w-10 p-0 rounded-2xl hover:bg-primary/10 group-hover/stage:text-primary transition-all duration-300"
                onClick={() => {
                  setSelectedStageId(stage.id);
                  setShowNewDealModal(true);
                }}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            {/* Deals Column */}
            <div 
              className={cn(
                "flex-1 flex flex-col gap-4 rounded-[2rem] p-3 transition-all duration-500",
                dragOverStageId === stage.id ? "bg-primary/10 ring-2 ring-primary/40 ring-dashed scale-[1.02]" : "bg-surface/10 border border-white/5 shadow-inner"
              )}
            >
              {stage.deals.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-10 border-2 border-dashed border-white/5 rounded-[1.5rem] bg-white/5 backdrop-blur-sm">
                  <div className="w-14 h-14 rounded-2xl bg-surface/40 enterprise-glass shadow-glass flex items-center justify-center mb-4 group-hover/stage:scale-110 transition-transform duration-500">
                     <Layers className="w-7 h-7 text-text-muted/30" />
                  </div>
                  <p className="text-[10px] text-text-muted/40 font-black uppercase tracking-[0.25em]">
                    Vacio
                  </p>
                </div>
              ) : (
                stage.deals.map((dealWithContact: any) => {
                  const { deal, contact } = dealWithContact;
                  return (
                    <Card
                      key={deal.id}
                      variant="glass"
                      className={cn(
                        "group/card cursor-grab active:cursor-grabbing hover-lift select-none border-white/10 shadow-glass overflow-hidden",
                        draggingDealId === deal.id && "opacity-30 scale-95 blur-sm"
                      )}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                    >
                      <CardContent className="p-5 space-y-5">
                        <Stack direction="row" justify="between" align="start">
                           <div className="space-y-2 flex-1 min-w-0">
                             <p className="font-black text-sm text-white/90 line-clamp-2 leading-tight group-hover/card:text-primary transition-colors duration-300 tracking-tight">
                               {deal.title}
                             </p>
                             <div className="flex items-center gap-2 min-w-0">
                               <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                                  <User size={12} className="text-primary" />
                               </div>
                               <span className="text-[11px] text-text-muted font-bold truncate tracking-tight">
                                 {contact?.name || "Sin Contacto"}
                               </span>
                             </div>
                           </div>
                           <button className="p-1.5 hover:bg-white/10 rounded-xl text-text-muted/40 opacity-0 group-hover/card:opacity-100 transition-all duration-300">
                              <MoreHorizontal size={16} />
                           </button>
                        </Stack>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_12px_rgba(99,102,241,0.8)]" />
                            <span className="text-sm font-black text-white tracking-tight">
                              {formatCurrency(Number(deal.value) || 0)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                             {deal.probability && (
                               <Badge variant="pill" className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                 {deal.probability}%
                               </Badge>
                             )}
                             <Button variant="ghost" className="p-0 h-8 w-8 rounded-xl hover:bg-white/10 text-white/20 hover:text-white transition-colors duration-300">
                                <GripVertical className="w-4 h-4" />
                             </Button>
                          </div>
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
            variant="ghost" 
            className="w-full h-[150px] border-2 border-dashed border-white/10 rounded-3xl hover:border-primary/50 hover:bg-primary/5 transition-all duration-500 text-text-muted/60 hover:text-primary flex-col gap-4 group/add-stage"
            onClick={() => setShowNewStageModal(true)}
          >
            <div className="w-12 h-12 rounded-2xl bg-surface shadow-glass flex items-center justify-center group-hover/add-stage:scale-110 group-hover/add-stage:rotate-90 transition-all duration-500">
               <Plus size={24} className="text-primary" />
            </div>
            <span className="font-black text-[10px] uppercase tracking-[0.2em]">Nueva Etapa</span>
          </Button>
        </div>
      </div>

      {/* New Deal Modal */}
      <Modal open={showNewDealModal} onOpenChange={setShowNewDealModal}>
        <ModalHeader className="px-8 pt-8 pb-6 border-b border-white/5 bg-white/5">
          <ModalTitle className="text-2xl font-black tracking-tight text-white/95">Nuevo Negocio</ModalTitle>
          <p className="text-xs font-bold text-text-muted/60 uppercase tracking-widest mt-1">Ingresa los detalles de la oportunidad</p>
        </ModalHeader>
        <ModalContent className="p-8 space-y-8">
          <Input 
            label="TÍTULO DEL NEGOCIO"
            placeholder="Ej: Implementación CRM"
            value={newDealForm.title}
            onChange={(e) => setNewDealForm(prev => ({ ...prev, title: e.target.value }))}
            className="enterprise-glass border-white/10 focus:border-primary/50 transition-all rounded-[1.25rem] h-14"
          />
          <Input 
            label="VALOR ESTIMADO"
            type="number"
            placeholder="0.00"
            value={newDealForm.value}
            onChange={(e) => setNewDealForm(prev => ({ ...prev, value: e.target.value }))}
            className="enterprise-glass border-white/10 focus:border-primary/50 transition-all rounded-[1.25rem] h-14"
            icon={<DollarSign className="w-5 h-5 text-primary/60" />}
          />
          <div className="space-y-3">
            <label className="text-[10px] font-black text-text-muted/60 uppercase tracking-[0.25em] ml-1">Contacto Asociado</label>
            <div className="relative group">
              <select 
                className="w-full h-14 px-6 rounded-[1.25rem] border border-white/10 bg-white/5 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all shadow-glass text-white/90 appearance-none cursor-pointer hover:border-white/20 group-hover:bg-white/10"
                value={newDealForm.contactId}
                onChange={(e) => setNewDealForm(prev => ({ ...prev, contactId: e.target.value }))}
              >
                <option value="" className="bg-surface-900">Seleccionar contacto...</option>
                {contacts?.map((c: any) => (
                  <option key={c.id} value={c.id} className="bg-surface-900">{c.name}</option>
                ))}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted/40 group-hover:text-primary transition-colors">
                <GripVertical size={16} />
              </div>
            </div>
          </div>
        </ModalContent>
        <ModalFooter className="p-8 border-t border-white/5 bg-white/5 gap-4">
          <Button variant="ghost" onClick={() => setShowNewDealModal(false)} className="rounded-2xl px-8 h-12 text-text-muted hover:text-white transition-all duration-300">
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateDeal}
            disabled={createDealMutation.isPending || !newDealForm.title || !newDealForm.contactId}
            className="rounded-2xl px-10 h-14 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-black tracking-tight"
          >
            {createDealMutation.isPending ? "Procesando..." : "Crear Negocio"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* New Stage Modal */}
      <Modal open={showNewStageModal} onOpenChange={setShowNewStageModal}>
        <ModalHeader className="px-8 pt-8 pb-6 border-b border-white/5 bg-white/5">
          <ModalTitle className="text-2xl font-black tracking-tight text-white/95">Nueva Etapa</ModalTitle>
          <p className="text-xs font-bold text-text-muted/60 uppercase tracking-widest mt-1">Personaliza tu flujo de trabajo</p>
        </ModalHeader>
        <ModalContent className="p-8 space-y-8">
          <Input 
            label="NOMBRE DE LA ETAPA"
            placeholder="Ej: Análisis de Necesidades"
            value={newStageForm.name}
            onChange={(e) => setNewStageForm(prev => ({ ...prev, name: e.target.value }))}
            className="enterprise-glass border-white/10 focus:border-primary/50 transition-all rounded-[1.25rem] h-14"
          />
          <div className="space-y-4">
            <label className="text-[10px] font-black text-text-muted/60 uppercase tracking-[0.25em] ml-1">Color de Identidad</label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 p-6 bg-white/5 rounded-[1.5rem] border border-white/5 shadow-inner">
              {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#8b5cf6', '#f43f5e'].map(color => (
                <button
                  key={color}
                  onClick={() => setNewStageForm(prev => ({ ...prev, color }))}
                  className={cn(
                    "w-10 h-10 rounded-xl border-2 transition-all duration-500 shadow-xl",
                    newStageForm.color === color ? "border-white scale-125 ring-4 ring-primary/30 z-10" : "border-transparent opacity-40 hover:opacity-100 hover:scale-110"
                  )}
                  style={{ 
                    backgroundColor: color,
                    boxShadow: newStageForm.color === color ? `0 0 20px ${color}80` : 'none'
                  }}
                />
              ))}
            </div>
          </div>
        </ModalContent>
        <ModalFooter className="p-8 border-t border-white/5 bg-white/5 gap-4">
          <Button variant="ghost" onClick={() => setShowNewStageModal(false)} className="rounded-2xl px-8 h-12 text-text-muted hover:text-white transition-all duration-300">
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateStage}
            disabled={createStageMutation.isPending || !newStageForm.name || !newStageForm.color}
            className="rounded-2xl px-10 h-14 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-black tracking-tight"
          >
            {createStageMutation.isPending ? "Procesando..." : "Crear Etapa"}
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
}
