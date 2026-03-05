// ============================================================
// MaatWork CRM — Pipeline Kanban Page
// UI/UX REFINED BY JULES v2
// ============================================================

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
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Filter, MoreHorizontal, MoveHorizontal, ArrowRight, Layers, LayoutGrid, List, SlidersHorizontal, Settings, AlertCircle, RotateCw, DollarSign, GripVertical, AlertTriangle, Calendar, User, Sparkles } from "lucide-react";

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
  const [newStageForm, setNewStageForm] = useState({ name: "", color: "#8B5CF6" });
  
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
      setNewStageForm({ name: "", color: "#8B5CF6" });
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
          icon={<AlertTriangle className="w-12 h-12 text-[#EF4444]" />}
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
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <SectionHeader
          title="Pipeline de Ventas"
          description={`${totalDeals} negocios activos en el embudo actual.`}
          icon={Layers}
          actions={
            <div className="flex gap-4">
              <Button variant="outline" className="border-white/5 bg-[#18181B] text-[#A3A3A3] hover:text-[#8B5CF6]">
                 <Filter className="w-4 h-4 mr-2" />
                 Filtrar
              </Button>
              <Button variant="primary" size="md" onClick={() => {
                if (board && board.length > 0) {
                  setSelectedStageId(board[0].id);
                  setShowNewDealModal(true);
                } else {
                  setShowNewStageModal(true);
                }
              }} className="rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)] bg-[#8B5CF6] hover:bg-[#7C3AED]">
                <Plus className="mr-2 w-4 h-4" />
                Nuevo Negocio
              </Button>
            </div>
          }
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-2">
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
      </motion.div>

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-8 pt-4 px-2 snap-x snap-mandatory min-h-[500px]">
        {isLoading ? (
          <div className="w-full flex justify-center py-20">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6]" />
          </div>
        ) : board?.map((stage, idx) => (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + (idx * 0.1) }}
            key={stage.id}
            className={cn(
              "flex-shrink-0 w-80 flex flex-col gap-4 rounded-3xl bg-[#0F0F0F] border border-white/5 p-4 snap-center transition-all duration-300 backdrop-blur-3xl",
              dragOverStageId === stage.id ? "bg-[#18181B] ring-2 ring-[#8B5CF6]/50 shadow-[0_0_30px_rgba(139,92,246,0.15)]" : ""
            )}
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]"
                  style={{ backgroundColor: stage.color, color: stage.color }}
                />
                <h3 className="font-black text-sm text-[#F5F5F5] uppercase tracking-wider">{stage.name}</h3>
                <span className="text-xs font-bold text-[#737373] bg-[#18181B] px-2 py-0.5 rounded-lg border border-white/5">
                  {stage.deals.length}
                </span>
              </div>
              <button className="text-[#737373] hover:text-[#8B5CF6] transition-colors p-1 rounded-lg hover:bg-white/5">
                <MoreHorizontal size={16} />
              </button>
            </div>

            <div className="text-[11px] font-black text-[#A3A3A3] tracking-widest uppercase mb-2">
               {formatCurrency(stage.deals.reduce((acc: number, d: any) => acc + (Number(d.deal.value) || 0), 0))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 min-h-[150px] pr-1 pb-4">
              <AnimatePresence>
                {stage.deals.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="h-24 rounded-2xl border-2 border-dashed border-white/5 flex items-center justify-center text-[#737373] text-xs font-bold uppercase tracking-wider"
                  >
                    Arrastra un deal
                  </motion.div>
                ) : (
                  stage.deals.map(({ deal, contact }: any) => {
                    const isDragging = draggingDealId === deal.id;
                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={deal.id}
                        draggable
                        onDragStart={(e: any) => handleDragStart(e, deal.id)}
                        onDragEnd={() => setDraggingDealId(null)}
                      >
                        <Card
                          variant="cyber"
                          className={cn(
                            "cursor-grab active:cursor-grabbing border-white/5 hover:border-[#8B5CF6]/30 group/card",
                            isDragging ? "opacity-50 scale-95 shadow-none" : "hover:shadow-[0_8px_25px_rgba(139,92,246,0.15)] hover:-translate-y-1"
                          )}
                        >
                          <div className="absolute top-0 left-0 w-full h-[3px] opacity-50 transition-opacity group-hover/card:opacity-100" style={{ backgroundColor: stage.color }} />
                          <CardContent className="p-5 space-y-4">
                            <Stack direction="row" justify="between" align="start">
                               <div className="space-y-2 flex-1 min-w-0">
                                 <p className="font-black text-sm text-[#F5F5F5] line-clamp-2 leading-tight group-hover/card:text-[#8B5CF6] transition-colors duration-300 tracking-tight">
                                   {deal.title}
                                 </p>
                                 <div className="flex items-center gap-2 min-w-0">
                                   <div className="w-6 h-6 rounded-lg bg-[#18181B] flex items-center justify-center shrink-0 border border-white/5 group-hover/card:border-[#8B5CF6]/30">
                                      <User size={12} className="text-[#8B5CF6]" />
                                   </div>
                                   <span className="text-[11px] text-[#A3A3A3] font-bold truncate tracking-tight">
                                     {contact?.name || "Sin Contacto"}
                                   </span>
                                 </div>
                               </div>
                            </Stack>

                            {/* AI Suggestion Button */}
                            <button className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#8B5CF6]/5 border border-[#8B5CF6]/10 text-[#8B5CF6] text-[10px] font-black uppercase tracking-widest hover:bg-[#8B5CF6]/20 transition-colors opacity-0 group-hover/card:opacity-100">
                               <Sparkles size={12} />
                               Sugerir Acción
                            </button>

                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-[#F5F5F5] tracking-tight">
                                  {formatCurrency(Number(deal.value) || 0)}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                 {deal.probability && (
                                   <Badge variant="pill" className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20">
                                     {deal.probability}%
                                   </Badge>
                                 )}
                                 <Button variant="ghost" className="p-0 h-8 w-8 rounded-xl hover:bg-white/10 text-[#737373] hover:text-[#F5F5F5] transition-colors duration-300 cursor-grab active:cursor-grabbing">
                                    <GripVertical className="w-4 h-4" />
                                 </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
        
        {/* Placeholder Column to add new stage */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="flex-shrink-0 w-80"
        >
          <Button 
            variant="ghost" 
            className="w-full h-[150px] border-2 border-dashed border-white/10 bg-[#0F0F0F] rounded-3xl hover:border-[#8B5CF6]/50 hover:bg-[#8B5CF6]/5 transition-all duration-500 text-[#737373] hover:text-[#8B5CF6] flex-col gap-4 group/add-stage backdrop-blur-3xl"
            onClick={() => setShowNewStageModal(true)}
          >
            <div className="w-12 h-12 rounded-2xl bg-[#18181B] border border-white/5 shadow-md flex items-center justify-center group-hover/add-stage:scale-110 group-hover/add-stage:rotate-90 transition-all duration-500">
               <Plus size={24} className="text-[#8B5CF6]" />
            </div>
            <span className="font-black text-[10px] uppercase tracking-[0.2em]">Nueva Etapa</span>
          </Button>
        </motion.div>
      </div>

      {/* New Deal Modal */}
      <Modal open={showNewDealModal} onOpenChange={setShowNewDealModal}>
        <ModalHeader className="px-8 pt-8 pb-6 border-b border-white/5 bg-[#18181B]">
          <ModalTitle className="text-2xl font-black tracking-tight text-[#F5F5F5]">Nuevo Negocio</ModalTitle>
          <p className="text-xs font-bold text-[#A3A3A3] uppercase tracking-widest mt-1">Ingresa los detalles de la oportunidad</p>
        </ModalHeader>
        <ModalContent className="p-8 space-y-8 bg-[#0F0F0F]">
          <Input 
            label="TÍTULO DEL NEGOCIO"
            placeholder="Ej: Implementación CRM"
            value={newDealForm.title}
            onChange={(e) => setNewDealForm(prev => ({ ...prev, title: e.target.value }))}
            className="bg-[#18181B] border-white/5 focus:border-[#8B5CF6]/50 transition-all rounded-[1.25rem] h-14"
          />
          <Input 
            label="VALOR ESTIMADO"
            type="number"
            placeholder="0.00"
            value={newDealForm.value}
            onChange={(e) => setNewDealForm(prev => ({ ...prev, value: e.target.value }))}
            className="bg-[#18181B] border-white/5 focus:border-[#8B5CF6]/50 transition-all rounded-[1.25rem] h-14"
            icon={<DollarSign className="w-5 h-5 text-[#8B5CF6]/60" />}
          />
          <div className="space-y-3">
            <label className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-[0.25em] ml-1">Contacto Asociado</label>
            <div className="relative group">
              <select 
                className="w-full h-14 px-6 rounded-[1.25rem] border border-white/5 bg-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 text-sm transition-all text-[#F5F5F5] appearance-none cursor-pointer hover:border-white/10"
                value={newDealForm.contactId}
                onChange={(e) => setNewDealForm(prev => ({ ...prev, contactId: e.target.value }))}
              >
                <option value="">Seleccionar contacto...</option>
                {contacts?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#737373] group-hover:text-[#8B5CF6] transition-colors">
                <GripVertical size={16} />
              </div>
            </div>
          </div>
        </ModalContent>
        <ModalFooter className="p-8 border-t border-white/5 bg-[#18181B] gap-4">
          <Button variant="ghost" onClick={() => setShowNewDealModal(false)} className="rounded-2xl px-8 h-12 text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 transition-all duration-300">
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateDeal}
            disabled={createDealMutation.isPending || !newDealForm.title || !newDealForm.contactId}
            className="rounded-2xl px-10 h-14 shadow-[0_0_20px_rgba(139,92,246,0.3)] bg-[#8B5CF6] hover:bg-[#7C3AED] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-black tracking-tight"
          >
            {createDealMutation.isPending ? "Procesando..." : "Crear Negocio"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* New Stage Modal */}
      <Modal open={showNewStageModal} onOpenChange={setShowNewStageModal}>
        <ModalHeader className="px-8 pt-8 pb-6 border-b border-white/5 bg-[#18181B]">
          <ModalTitle className="text-2xl font-black tracking-tight text-[#F5F5F5]">Nueva Etapa</ModalTitle>
          <p className="text-xs font-bold text-[#A3A3A3] uppercase tracking-widest mt-1">Personaliza tu flujo de trabajo</p>
        </ModalHeader>
        <ModalContent className="p-8 space-y-8 bg-[#0F0F0F]">
          <Input 
            label="NOMBRE DE LA ETAPA"
            placeholder="Ej: Análisis de Necesidades"
            value={newStageForm.name}
            onChange={(e) => setNewStageForm(prev => ({ ...prev, name: e.target.value }))}
            className="bg-[#18181B] border-white/5 focus:border-[#8B5CF6]/50 transition-all rounded-[1.25rem] h-14"
          />
          <div className="space-y-4">
            <label className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-[0.25em] ml-1">Color de Identidad</label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 p-6 bg-[#18181B] rounded-[1.5rem] border border-white/5 shadow-inner">
              {['#8B5CF6', '#C026D3', '#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4'].map(color => (
                <button
                  key={color}
                  onClick={() => setNewStageForm(prev => ({ ...prev, color }))}
                  className={cn(
                    "w-10 h-10 rounded-xl border-2 transition-all duration-500 shadow-md",
                    newStageForm.color === color ? "border-white scale-125 ring-4 ring-[#8B5CF6]/30 z-10" : "border-transparent opacity-40 hover:opacity-100 hover:scale-110"
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
        <ModalFooter className="p-8 border-t border-white/5 bg-[#18181B] gap-4">
          <Button variant="ghost" onClick={() => setShowNewStageModal(false)} className="rounded-2xl px-8 h-12 text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 transition-all duration-300">
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateStage}
            disabled={createStageMutation.isPending || !newStageForm.name || !newStageForm.color}
            className="rounded-2xl px-10 h-14 shadow-[0_0_20px_rgba(139,92,246,0.3)] bg-[#8B5CF6] hover:bg-[#7C3AED] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-black tracking-tight"
          >
            {createStageMutation.isPending ? "Procesando..." : "Crear Etapa"}
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
}
