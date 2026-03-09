// ============================================================
// MaatWork CRM — Pipeline Kanban Page (Contacts)
// UI/UX: Pastel Aesthetic + High Density
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Calendar,
  Filter,
  Layers,
  Plus,
  User,
} from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { EmptyState } from "~/components/ui/EmptyState";
import { Input } from "~/components/ui/Input";
import { Container } from "~/components/ui/Layout";
import { SectionHeader, StatCard } from "~/components/ui/LayoutCards";
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "~/components/ui/Modal";
import { KanbanBoard } from "~/components/ui/KanbanBoard";
import {
  useContactsByPipelineStage,
  useCreateContactMutation,
  useCreateStageMutation,
  useMoveContactMutation,
} from "~/lib/hooks/use-crm";

export const Route = createFileRoute("/_app/pipeline")({
  component: PipelinePage,
});

function PipelinePage() {
  const { data: board, isLoading, error } = useContactsByPipelineStage();
  const moveContactMutation = useMoveContactMutation();
  const createContactMutation = useCreateContactMutation();
  const createStageMutation = useCreateStageMutation();

  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [newContactForm, setNewContactForm] = useState({ name: "", email: "", phone: "" });

  const [showNewStageModal, setShowNewStageModal] = useState(false);
  const [newStageForm, setNewStageForm] = useState({ name: "", color: "#8B5CF6" });

  // Contact move handler
  const handleContactMove = async (contactId: string, newStageId: string) => {
    try {
      await moveContactMutation.mutateAsync({ contactId, pipelineStageId: newStageId });
    } catch (err) {
      console.error("Failed to move contact:", err);
    }
  };

  // Create contact handler
  const handleCreateContact = async () => {
    if (!newContactForm.name || !selectedStageId) return;
    try {
      await createContactMutation.mutateAsync({
        name: newContactForm.name,
        email: newContactForm.email || null,
        phone: newContactForm.phone || null,
        pipelineStageId: selectedStageId,
      });
      setShowNewContactModal(false);
      setNewContactForm({ name: "", email: "", phone: "" });
    } catch (err) {
      console.error("Failed to create contact:", err);
    }
  };

  // Create stage handler
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

  // Open new contact modal
  const openNewContactModal = (stageId?: string) => {
    if (stageId) {
      setSelectedStageId(stageId);
    } else if (board && board.length > 0) {
      setSelectedStageId(board[0].id);
    }
    setShowNewContactModal(true);
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

  // Extract stages and all contacts from board
  const stages = board || [];
  const allContacts = stages.flatMap(stage => stage.contacts || []);
  const totalContacts = allContacts.length;

  return (
    <Container size="full" className="py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <SectionHeader
          title="Pipeline de Contactos"
          description={`${totalContacts} contactos organizados por etapa.`}
          icon={Layers}
          actions={
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="border-border/30 text-text-muted hover:text-primary hover:border-primary/30">
                <Filter className="w-4 h-4 mr-2" />
                Filtrar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => openNewContactModal()}
                className="rounded-lg"
              >
                <Plus className="mr-2 w-4 h-4" />
                Nuevo Contacto
              </Button>
            </div>
          }
        />
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <StatCard
          label="Contactos"
          value={totalContacts.toString()}
          variant="brand"
          icon={User}
        />
        <StatCard 
          label="Etapas" 
          value={stages.length.toString()} 
          variant="violet" 
          icon={Layers} 
        />
        <StatCard 
          label="Conversión" 
          value="68%" 
          variant="emerald" 
          icon={Calendar} 
        />
        <StatCard 
          label="Meta Mensual" 
          value="$1.2M" 
          variant="amber" 
          icon={Calendar} 
        />
      </motion.div>

      {/* Kanban Board */}
      <KanbanBoard
        stages={stages}
        contacts={allContacts}
        onContactMove={handleContactMove}
        onAddContact={openNewContactModal}
        isLoading={isLoading}
      />

      {/* Add New Stage Button */}
      <div className="flex justify-center py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowNewStageModal(true)}
          className="text-text-muted hover:text-primary border border-dashed border-border/30 rounded-lg px-4"
        >
          <Plus className="w-4 h-4 mr-2" />
          Añadir Etapa
        </Button>
      </div>

      {/* New Contact Modal */}
      <Modal open={showNewContactModal} onOpenChange={setShowNewContactModal}>
        <ModalHeader className="px-6 pt-6 pb-4 border-b border-border/20">
          <ModalTitle className="text-xl font-bold text-text">Nuevo Contacto</ModalTitle>
          <p className="text-xs text-text-muted mt-1">
            Agrega un nuevo contacto al pipeline
          </p>
        </ModalHeader>
        <ModalContent className="p-6 space-y-4">
          <Input
            label="NOMBRE"
            placeholder="Nombre completo"
            value={newContactForm.name}
            onChange={(e) => setNewContactForm((prev) => ({ ...prev, name: e.target.value }))}
            className="h-11"
          />
          <Input
            label="EMAIL"
            type="email"
            placeholder="correo@ejemplo.com"
            value={newContactForm.email}
            onChange={(e) => setNewContactForm((prev) => ({ ...prev, email: e.target.value }))}
            className="h-11"
          />
          <Input
            label="TELÉFONO"
            type="tel"
            placeholder="+54 9 11 1234 5678"
            value={newContactForm.phone}
            onChange={(e) => setNewContactForm((prev) => ({ ...prev, phone: e.target.value }))}
            className="h-11"
          />
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Etapa
            </label>
            <select
              className="w-full h-11 px-4 rounded-lg border border-border/30 bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              value={selectedStageId || ""}
              onChange={(e) => setSelectedStageId(e.target.value)}
            >
              <option value="">Seleccionar etapa...</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </div>
        </ModalContent>
        <ModalFooter className="p-4 border-t border-border/20 gap-3">
          <Button
            variant="ghost"
            onClick={() => setShowNewContactModal(false)}
            className="rounded-lg"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateContact}
            disabled={createContactMutation.isPending || !newContactForm.name || !selectedStageId}
            className="rounded-lg"
          >
            {createContactMutation.isPending ? "Creando..." : "Crear Contacto"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* New Stage Modal */}
      <Modal open={showNewStageModal} onOpenChange={setShowNewStageModal}>
        <ModalHeader className="px-6 pt-6 pb-4 border-b border-border/20">
          <ModalTitle className="text-xl font-bold text-text">Nueva Etapa</ModalTitle>
          <p className="text-xs text-text-muted mt-1">
            Personaliza tu flujo de trabajo
          </p>
        </ModalHeader>
        <ModalContent className="p-6 space-y-4">
          <Input
            label="NOMBRE DE LA ETAPA"
            placeholder="Ej: Nuevo Lead"
            value={newStageForm.name}
            onChange={(e) => setNewStageForm((prev) => ({ ...prev, name: e.target.value }))}
            className="h-11"
          />
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {["#8B5CF6", "#C026D3", "#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#EC4899", "#06B6D4"].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewStageForm((prev) => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    newStageForm.color === color
                      ? "border-white scale-110 ring-2 ring-primary/30"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </ModalContent>
        <ModalFooter className="p-4 border-t border-border/20 gap-3">
          <Button
            variant="ghost"
            onClick={() => setShowNewStageModal(false)}
            className="rounded-lg"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateStage}
            disabled={createStageMutation.isPending || !newStageForm.name}
            className="rounded-lg"
          >
            {createStageMutation.isPending ? "Creando..." : "Crear Etapa"}
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
}
