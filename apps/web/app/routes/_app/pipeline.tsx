// ============================================================
// MaatWork CRM — Pipeline Kanban Page
// UI/UX REFINED BY JULES v2
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  DollarSign,
  Filter,
  GripVertical,
  Layers,
  MoreHorizontal,
  Plus,
  Sparkles,
  User,
} from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Card, CardContent } from "~/components/ui/Card";
import { EmptyState } from "~/components/ui/EmptyState";
import { Input } from "~/components/ui/Input";
import { Container, Stack } from "~/components/ui/Layout";
import { SectionHeader, StatCard } from "~/components/ui/LayoutCards";
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "~/components/ui/Modal";
import {
  useContacts,
  useCreateDealMutation,
  useCreateStageMutation,
  useMoveDealMutation,
  usePipelineBoard,
} from "~/lib/hooks/use-crm";
import { cn, formatCurrency } from "~/lib/utils";

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
    const currentStage = board?.find((s) => s.deals.some((d: any) => d.deal.id === dealId));
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
          title="Pipeline Error"
          description={(error as Error).message}
          icon={<AlertTriangle className="w-12 h-12 text-error" />}
        />
      </Container>
    );
  }

  // ⚡ Bolt Optimization: Memoize totalValue to avoid recalculating on every render
  const totalValue = useMemo(() => {
    return (
      board?.reduce(
        (acc, stage) => acc + stage.deals.reduce((sAcc: number, d: any) => sAcc + (Number(d.deal.value) || 0), 0),
        0,
      ) || 0
    );
  }, [board]);

  // ⚡ Bolt Optimization: Memoize totalDeals to avoid recalculating on every render
  const totalDeals = useMemo(() => {
    return board?.reduce((acc, stage) => acc + stage.deals.length, 0) || 0;
  }, [board]);

  // ⚡ Bolt Optimization: Memoize individual stage total values
  const stageTotalValues = useMemo(() => {
    if (!board) return {};
    return board.reduce(
      (acc, stage) => {
        acc[stage.id] = stage.deals.reduce((sum: number, d: any) => sum + (Number(d.deal.value) || 0), 0);
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [board]);

  return (
    <Container size="full" className="py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <SectionHeader
          title="Pipeline de Ventas"
          description={`${totalDeals} deals activos en el funnel actual.`}
          icon={Layers}
          actions={
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-border bg-surface text-text-secondary hover:text-primary hover:bg-surface-hover h-10 px-4"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtrar
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  if (board && board.length > 0) {
                    setSelectedStageId(board[0].id);
                    setShowNewDealModal(true);
                  } else {
                    setShowNewStageModal(true);
                  }
                }}
                className="rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.2)] hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] bg-primary hover:bg-primary-hover h-10 px-5 font-semibold"
              >
                <Plus className="mr-2 w-4 h-4" />
                Nuevo Deal
              </Button>
            </div>
          }
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2"
      >
        <StatCard
          label="Valor Total"
          value={formatCurrency(totalValue)}
          change="12% este mes"
          changeType="up"
          variant="brand"
          icon={DollarSign}
        />
        <StatCard
          label="Deals Activos"
          value={totalDeals.toString()}
          change="Sincronizado"
          changeType="up"
          variant="violet"
          icon={Layers}
        />
        <StatCard label="Tasa de Éxito" value="68%" change="5% vs Ene" changeType="up" variant="emerald" icon={Calendar} />
        <StatCard
          label="Meta Mensual"
          value="$1.2M"
          change="En camino"
          changeType="up"
          variant="amber"
          icon={Calendar}
        />
      </motion.div>

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-8 pt-4 px-2 snap-x snap-mandatory min-h-[500px]">
        {isLoading ? (
          <div className="w-full flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : (
          board?.map((stage, idx) => (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              key={stage.id}
              className={cn(
                "flex-shrink-0 w-80 flex flex-col gap-4 rounded-2xl bg-surface border border-border p-4 snap-center transition-all duration-300 backdrop-blur-3xl",
                dragOverStageId === stage.id
                  ? "bg-surface-hover ring-2 ring-primary/50 shadow-[0_0_25px_rgba(139,92,246,0.15)]"
                  : "",
              )}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]"
                    style={{ backgroundColor: stage.color, color: stage.color }}
                  />
                  <h3 className="font-bold text-sm text-text uppercase tracking-wider">{stage.name}</h3>
                  <span className="text-xs font-semibold text-text-muted bg-surface-hover px-2 py-0.5 rounded-md border border-border/50">
                    {stage.deals.length}
                  </span>
                </div>
                <button className="text-text-muted hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-surface-hover">
                  <MoreHorizontal size={16} />
                </button>
              </div>

              <div className="text-[10px] font-bold text-text-secondary tracking-widest uppercase mb-2">
                {formatCurrency(stageTotalValues[stage.id] || 0)}
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 min-h-[150px] pr-1 pb-4">
                <AnimatePresence>
                  {stage.deals.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-text-muted text-xs font-semibold uppercase tracking-wider"
                    >
                      Arrastra un deal aquí
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
                              "cursor-grab active:cursor-grabbing border-border hover:border-primary/30 group/card bg-surface-hover",
                              isDragging
                                ? "opacity-50 scale-95 shadow-none"
                                : "hover:shadow-[0_8px_20px_rgba(139,92,246,0.1)] hover:-translate-y-1",
                            )}
                          >
                            <div
                              className="absolute top-0 left-0 w-full h-[2px] opacity-50 transition-opacity group-hover/card:opacity-100"
                              style={{ backgroundColor: stage.color }}
                            />
                            <CardContent className="p-4 space-y-4">
                              <Stack direction="row" justify="between" align="start">
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <p className="font-bold text-sm text-text line-clamp-2 leading-tight group-hover/card:text-primary-light transition-colors duration-300 tracking-tight">
                                    {deal.title}
                                  </p>
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-5 h-5 rounded-md bg-surface flex items-center justify-center shrink-0 border border-border group-hover/card:border-primary/30">
                                      <User size={10} className="text-primary" />
                                    </div>
                                    <span className="text-[10px] text-text-secondary font-semibold truncate tracking-tight">
                                      {contact?.name || "Sin Contacto"}
                                    </span>
                                  </div>
                                </div>
                              </Stack>

                              {/* AI Suggestion Button */}
                              <button className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary/5 border border-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider hover:bg-primary/15 transition-colors opacity-0 group-hover/card:opacity-100">
                                <Sparkles size={10} />
                                Sugerir Siguiente Paso
                              </button>

                              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-text tracking-tight">
                                    {formatCurrency(Number(deal.value) || 0)}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {deal.probability && (
                                    <Badge
                                      variant="success"
                                      className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-success/10 text-success border-success/20"
                                    >
                                      {deal.probability}%
                                    </Badge>
                                  )}
                                  <Button
                                    variant="ghost"
                                    className="p-0 h-6 w-6 rounded-md hover:bg-surface text-text-muted hover:text-text transition-colors duration-300 cursor-grab active:cursor-grabbing"
                                  >
                                    <GripVertical className="w-3.5 h-3.5" />
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
          ))
        )}

        {/* Placeholder Column to add new stage */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="flex-shrink-0 w-80"
        >
          <Button
            variant="ghost"
            className="w-full h-[120px] border-2 border-dashed border-border bg-surface rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 text-text-muted hover:text-primary flex-col gap-3 group/add-stage backdrop-blur-3xl"
            onClick={() => setShowNewStageModal(true)}
          >
            <div className="w-10 h-10 rounded-xl bg-surface-hover border border-border shadow-sm flex items-center justify-center group-hover/add-stage:scale-110 group-hover/add-stage:rotate-90 transition-all duration-300">
              <Plus size={20} className="text-primary" />
            </div>
            <span className="font-bold text-[10px] uppercase tracking-wider">Nueva Etapa</span>
          </Button>
        </motion.div>
      </div>

      {/* New Deal Modal */}
      <Modal open={showNewDealModal} onOpenChange={setShowNewDealModal}>
        <ModalHeader className="px-6 pt-6 pb-4 border-b border-border bg-surface">
          <ModalTitle className="text-xl font-bold tracking-tight text-text">Nuevo Deal</ModalTitle>
          <p className="text-xs font-medium text-text-muted mt-1">Ingresa los detalles de la oportunidad</p>
        </ModalHeader>
        <ModalContent className="p-6 space-y-6 bg-background">
          <Input
            label="TÍTULO DEL DEAL"
            placeholder="ej. Implementación de CRM"
            value={newDealForm.title}
            onChange={(e) => setNewDealForm((prev) => ({ ...prev, title: e.target.value }))}
            className="bg-surface-hover border-border focus:border-primary/50 transition-all rounded-xl h-12"
          />
          <div className="relative">
            <Input
              label="VALOR ESTIMADO"
              type="number"
              placeholder="0.00"
              value={newDealForm.value}
              onChange={(e) => setNewDealForm((prev) => ({ ...prev, value: e.target.value }))}
              className="bg-surface-hover border-border focus:border-primary/50 transition-all rounded-xl h-12 pl-10"
            />
            <DollarSign className="w-4 h-4 text-text-muted absolute left-3 top-[38px]" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider ml-1">
              Contacto Asociado
            </label>
            <div className="relative group">
              <select
                className="w-full h-12 px-4 rounded-xl border border-border bg-surface-hover focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 text-sm transition-all text-text appearance-none cursor-pointer hover:border-border-hover"
                value={newDealForm.contactId}
                onChange={(e) => setNewDealForm((prev) => ({ ...prev, contactId: e.target.value }))}
              >
                <option value="">Seleccionar contacto...</option>
                {contacts?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-primary transition-colors">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
        </ModalContent>
        <ModalFooter className="p-6 border-t border-border bg-surface gap-4">
          <Button
            variant="ghost"
            onClick={() => setShowNewDealModal(false)}
            className="rounded-xl px-6 h-10 text-text-secondary hover:text-text hover:bg-surface-hover transition-all duration-200 font-semibold text-sm"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateDeal}
            disabled={createDealMutation.isPending || !newDealForm.title || !newDealForm.contactId}
            className="rounded-xl px-8 h-10 shadow-[0_0_15px_rgba(139,92,246,0.2)] bg-primary hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-semibold text-sm"
          >
            {createDealMutation.isPending ? "Procesando..." : "Crear Deal"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* New Stage Modal */}
      <Modal open={showNewStageModal} onOpenChange={setShowNewStageModal}>
        <ModalHeader className="px-6 pt-6 pb-4 border-b border-border bg-surface">
          <ModalTitle className="text-xl font-bold tracking-tight text-text">Nueva Etapa</ModalTitle>
          <p className="text-xs font-medium text-text-muted mt-1">Personaliza tu flujo de trabajo</p>
        </ModalHeader>
        <ModalContent className="p-6 space-y-6 bg-background">
          <Input
            label="NOMBRE DE LA ETAPA"
            placeholder="ej. Análisis de Necesidades"
            value={newStageForm.name}
            onChange={(e) => setNewStageForm((prev) => ({ ...prev, name: e.target.value }))}
            className="bg-surface-hover border-border focus:border-primary/50 transition-all rounded-xl h-12"
          />
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider ml-1">
              Color de Identidad
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 p-4 bg-surface-hover rounded-2xl border border-border shadow-inner">
              {["#8B5CF6", "#C026D3", "#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#EC4899", "#06B6D4"].map((color) => (
                <button
                  key={color}
                  onClick={() => setNewStageForm((prev) => ({ ...prev, color }))}
                  className={cn(
                    "w-8 h-8 rounded-lg border-2 transition-all duration-300 shadow-sm",
                    newStageForm.color === color
                      ? "border-white scale-110 ring-2 ring-primary/30 z-10"
                      : "border-transparent opacity-50 hover:opacity-100 hover:scale-105",
                  )}
                  style={{
                    backgroundColor: color,
                    boxShadow: newStageForm.color === color ? `0 0 15px ${color}80` : "none",
                  }}
                />
              ))}
            </div>
          </div>
        </ModalContent>
        <ModalFooter className="p-6 border-t border-border bg-surface gap-4">
          <Button
            variant="ghost"
            onClick={() => setShowNewStageModal(false)}
            className="rounded-xl px-6 h-10 text-text-secondary hover:text-text hover:bg-surface-hover transition-all duration-200 font-semibold text-sm"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateStage}
            disabled={createStageMutation.isPending || !newStageForm.name || !newStageForm.color}
            className="rounded-xl px-8 h-10 shadow-[0_0_15px_rgba(139,92,246,0.2)] bg-primary hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-semibold text-sm"
          >
            {createStageMutation.isPending ? "Procesando..." : "Crear Etapa"}
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
}
