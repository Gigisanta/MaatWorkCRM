// ============================================================
// MaatWork CRM — Contacts Page
// UI/UX REFINED BY JULES v2
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, Mail, MoreVertical, Phone, Search, Sparkles, Tag, TrendingUp, Users, X, BarChart3 } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { useCallback, useMemo, useState } from "react";
import { Badge } from "~/components/ui/Badge";
import { AvatarPicker } from "~/components/ui/AvatarPicker";
import { Button } from "~/components/ui/Button";
import { Drawer } from "~/components/ui/Drawer";
import { EmptyState } from "~/components/ui/EmptyState";
import { Icon } from "~/components/ui/Icon";
import { Input } from "~/components/ui/Input";
import { Container } from "~/components/ui/Layout";
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "~/components/ui/Modal";
import { DataTable } from "~/components/ui/Table";
import {
  useAddTagToContactMutation,
  useContactTags,
  useContacts,
  useCreateContactMutation,
  usePipelineStages,
  useRemoveTagFromContactMutation,
  useTags,
  useUpdateContactMutation,
} from "~/lib/hooks/use-crm";
import { cn } from "~/lib/utils";

export const Route = createFileRoute("/_app/contacts/")({
  component: ContactsPage,
});

function ContactsPage() {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string | undefined>(undefined);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showTagPicker, setShowTagPicker] = useState(false);

  const {
    data: contacts,
    isLoading,
    error,
  } = useContacts({
    search: search || undefined,
    pipelineStageId: stageFilter,
  });

  const { data: pipelineStages } = usePipelineStages();
  const { data: allTags } = useTags("contact");
  const { data: contactTagData, refetch: refetchContactTags } = useContactTags(selectedContact?.id || "");
  const updateContactMutation = useUpdateContactMutation();
  const addTagMutation = useAddTagToContactMutation();
  const removeTagMutation = useRemoveTagFromContactMutation();
  const [editingEmojiId, setEditingEmojiId] = useState<string | null>(null);

  const handleEmojiChange = useCallback(async (contactId: string, emoji: string) => {
    try {
      await updateContactMutation.mutateAsync({ id: contactId, data: { emoji } });
      setEditingEmojiId(null);
    } catch (err) {
      console.error("Failed to update emoji:", err);
    }
  }, [updateContactMutation]);

  const stageColors: Record<string, string> = {
    lead: "bg-blue-50 text-blue-700 border-blue-200",
    prospect: "bg-pink-50 text-pink-700 border-pink-200",
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    inactive: "bg-slate-50 text-slate-600 border-slate-200",
  };

  const sortedStages = useMemo(() => {
    return [...(pipelineStages || [])].sort((a, b) => a.order - b.order);
  }, [pipelineStages]);

  const getNextStage = useCallback((currentStageId: string | null | undefined) => {
    if (!currentStageId) return sortedStages[0] || null;
    const currentIndex = sortedStages.findIndex(s => s.id === currentStageId);
    if (currentIndex === -1 || currentIndex >= sortedStages.length - 1) return null;
    return sortedStages[currentIndex + 1];
  }, [sortedStages]);

  const handleStageChange = useCallback(async (contactId: string, newStageId: string) => {
    try {
      await updateContactMutation.mutateAsync({ id: contactId, data: { pipelineStageId: newStageId } });
      setOpenDropdownId(null);
    } catch (err) {
      console.error("Failed to update stage:", err);
    }
  }, [updateContactMutation]);

  const handleNextStage = useCallback(async (contactId: string, currentStageId: string | null | undefined) => {
    const nextStage = getNextStage(currentStageId);
    if (nextStage) {
      await handleStageChange(contactId, nextStage.id);
    }
  }, [getNextStage, handleStageChange]);

  const getStageInfo = useCallback((stageId: string | null | undefined) => {
    if (!stageId) return { label: "Sin etapa", color: "bg-slate-50 text-slate-600 border-slate-200" };
    const stage = pipelineStages?.find(s => s.id === stageId);
    if (stage) {
      return { 
        label: stage.name, 
        color: stageColors[stage.name.toLowerCase()] || "bg-slate-50 text-slate-600 border-slate-200" 
      };
    }
    return { label: stageId, color: "bg-slate-50 text-slate-600 border-slate-200" };
  }, [pipelineStages]);

  const createContactMutation = useCreateContactMutation();

  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [newContactForm, setNewContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    pipelineStageId: "",
  });

  const handleCreateContact = async () => {
    if (!newContactForm.name || !newContactForm.email) return;
    try {
      await createContactMutation.mutateAsync(newContactForm);
      setShowNewContactModal(false);
      setNewContactForm({ name: "", email: "", phone: "", pipelineStageId: "" });
    } catch (err) {
      console.error("Failed to create contact:", err);
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Contacto",
        cell: (info: any) => {
          const contact = info.row.original;
          const isEditingEmoji = editingEmojiId === contact.id;
          return (
            <div className="flex items-center gap-4">
              <div className="relative">
                {isEditingEmoji ? (
                  <AvatarPicker
                    value={contact.emoji || "👤"}
                    onChange={(emoji) => handleEmojiChange(contact.id, emoji)}
                    size="md"
                  />
                ) : (
                  <button
                    onClick={() => setEditingEmojiId(contact.id)}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6]/30 to-transparent flex items-center justify-center text-white font-black text-lg border border-white/10 hover:from-[#8B5CF6]/50 transition-all cursor-pointer"
                  >
                    {contact.emoji || contact.name.charAt(0)}
                  </button>
                )}
                {contact.pipelineStageId && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#22C55E] border-2 border-[#0F0F0F] flex items-center justify-center">
                    <Check size={8} className="text-white" strokeWidth={4} />
                  </div>
                )}
              </div>
              <div>
                <p className="font-bold text-[#F5F5F5]">{contact.name}</p>
                <p className="text-xs text-[#A3A3A3]">{contact.email}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "phone",
        header: "Teléfono",
        cell: (info: any) => {
          const val = info.getValue();
          return val ? (
            <span className="flex items-center gap-2 text-sm text-[#A3A3A3]">
              <Phone size={14} className="text-[#8B5CF6]/70" />
              {val}
            </span>
          ) : (
            <span className="text-[#737373]">-</span>
          );
        },
      },
      {
        accessorKey: "pipelineStageId",
        header: "Pipeline",
        cell: (info: any) => {
          const contact = info.row.original;
          const stageId = contact.pipelineStageId;
          const { label, color } = getStageInfo(stageId);
          const nextStage = getNextStage(stageId);
          const isOpen = openDropdownId === contact.id;
          
          return (
            <div className="relative flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdownId(isOpen ? null : contact.id);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all",
                  color,
                  "hover:opacity-80"
                )}
              >
                {label}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {nextStage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextStage(contact.id, stageId);
                  }}
                  className="p-1.5 rounded-md bg-[#8B5CF6]/10 text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white transition-colors"
                  title={`Avanzar a ${nextStage.name}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              {isOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 w-48 bg-[#18181B] border border-white/10 rounded-lg shadow-xl py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStageChange(contact.id, "");
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs font-medium hover:bg-white/5 transition-colors",
                      !stageId ? "text-[#8B5CF6]" : "text-[#A3A3A3]"
                    )}
                  >
                    Sin etapa
                  </button>
                  {sortedStages.map((stage) => (
                    <button
                      key={stage.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStageChange(contact.id, stage.id);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-xs font-medium hover:bg-white/5 transition-colors flex items-center gap-2",
                        stageId === stage.id ? "text-[#8B5CF6]" : "text-[#A3A3A3]"
                      )}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      {stage.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "tags",
        header: "Etiquetas",
        cell: (info: any) => {
          const contact = info.row.original;
          return (
            <div className="flex flex-wrap gap-1.5">
              {contact.tags?.slice(0, 3).map((tag: any) => (
                <span
                  key={tag.id}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold border"
                  style={{
                    backgroundColor: `${tag.color}15`,
                    borderColor: `${tag.color}30`,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </span>
              ))}
              {(contact.tags?.length || 0) > 3 && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/5 text-[#737373] border border-white/10">
                  +{contact.tags.length - 3}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        cell: () => (
          <div className="flex justify-end pr-4">
            <button className="p-2 text-[#737373] hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/10 rounded-lg transition-colors">
              <MoreVertical size={16} />
            </button>
          </div>
        ),
      },
    ],
    [openDropdownId, sortedStages, pipelineStages, handleStageChange, handleNextStage],
  );

  if (isLoading && !contacts) {
    return (
      <Container className="py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6]" />
      </Container>
    );
  }

  return (
    <Container size="full" className="py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-2"
      >
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-[#F5F5F5] leading-tight tracking-tighter font-display">
            Directorio de Contactos
          </h1>
          <p className="text-[11px] font-black text-[#A3A3A3] uppercase tracking-[0.3em] flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] shadow-md animate-pulse" />
            {contacts?.length || 0} Registros <span className="opacity-20">•</span>{" "}
            {contacts?.filter((c: any) => c.pipelineStageId).length || 0} En Pipeline
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="h-14 px-6 border-white/5 bg-[#18181B] text-[#A3A3A3] hover:text-[#8B5CF6]"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Encontrar Similares (AI)
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowNewContactModal(true)}
            className="shadow-lg rounded-lg h-14 px-8 font-black uppercase tracking-widest text-[12px] group bg-[#8B5CF6] hover:bg-[#7C3AED]"
          >
            <Icon
              name="Plus"
              className="mr-3 group-hover:rotate-90 transition-transform duration-500"
              size={18}
            />
            Nuevo Registro
          </Button>
        </div>
      </motion.div>

      {/* Filters & Actions bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center justify-between gap-8 bg-[#0F0F0F] p-3 rounded-[2rem] border border-white/5 shadow-md"
      >
        <div className="flex-1 min-w-[350px] relative group h-14">
          <Search
            className="absolute left-6 top-1/2 -translate-y-1/2 text-[#737373] group-focus-within:text-[#8B5CF6] transition-all duration-300"
            size={20}
          />
          <input
            type="text"
            placeholder="Buscar por nombre, correo o empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-16 pr-6 h-full bg-[#18181B] border-2 border-transparent rounded-[1.25rem] focus:border-[#8B5CF6]/30 focus:bg-white/5 focus:outline-none text-sm font-bold placeholder:text-[#737373] transition-all shadow-inner text-[#F5F5F5]"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-12 px-5 border-white/5 bg-[#18181B] text-[#A3A3A3] hover:text-[#8B5CF6] hover:border-[#8B5CF6]/30 rounded-xl"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Métricas
          </Button>

          <Popover.Root open={showTagPicker} onOpenChange={setShowTagPicker}>
            <Popover.Trigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-12 px-5 border-white/5 bg-[#18181B] text-[#A3A3A3] hover:text-[#8B5CF6] hover:border-[#8B5CF6]/30 rounded-xl"
              >
                <Tag className="w-4 h-4 mr-2" />
                Etiquetas
              </Button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content 
                className="w-72 bg-[#18181B] border border-white/10 rounded-xl p-4 shadow-xl z-50"
                sideOffset={8}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-black text-[#F5F5F5] uppercase tracking-wider">Etiquetas de Producto</p>
                  <Popover.Close className="text-[#737373] hover:text-[#F5F5F5]">
                    <X className="w-4 h-4" />
                  </Popover.Close>
                </div>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {allTags?.map((tag) => (
                    <button
                      key={tag.id}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm hover:bg-white/5 transition-colors"
                    >
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-[#F5F5F5] font-medium">{tag.name}</span>
                    </button>
                  ))}
                  {(!allTags || allTags.length === 0) && (
                    <p className="text-xs text-[#737373] text-center py-4">No hay etiquetas disponibles</p>
                  )}
                </div>
                <Popover.Arrow className="fill-white/10" />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
          
          <Button
            variant="outline"
            size="sm"
            className="h-12 px-5 border-white/5 bg-[#18181B] text-[#A3A3A3] hover:text-[#8B5CF6] hover:border-[#8B5CF6]/30 rounded-xl"
            onClick={() => window.location.href = "/pipeline"}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Pipeline
          </Button>
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-[#18181B] rounded-lg border border-white/5 shadow-inner">
          <Button
            key="all"
            variant="ghost"
            size="sm"
            onClick={() => setStageFilter(undefined)}
            className={cn(
              "rounded-lg px-6 h-10 font-black text-[11px] uppercase tracking-tighter transition-all duration-150",
              stageFilter === undefined
                ? "bg-white/10 text-[#F5F5F5] shadow-md"
                : "text-[#A3A3A3] hover:text-[#F5F5F5]",
            )}
          >
            Todos
          </Button>
          {pipelineStages?.map((stage) => (
            <Button
              key={stage.id}
              variant="ghost"
              size="sm"
              onClick={() => setStageFilter(stage.id)}
              className={cn(
                "rounded-lg px-6 h-10 font-black text-[11px] uppercase tracking-tighter transition-all duration-150",
                stageFilter === stage.id
                  ? "bg-white/10 text-[#F5F5F5] shadow-md"
                  : "text-[#737373] hover:text-[#8B5CF6]",
              )}
            >
              {stage.name}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Contact List */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        {error ? (
          <EmptyState
            title="Error operativo"
            description="Hubo un problema al recuperar los registros."
            icon={<Icon name="AlertTriangle" className="text-error" size={48} />}
          />
        ) : contacts?.length === 0 ? (
          <EmptyState
            title="Sin resultados"
            description="No se encontraron registros activos para este filtro."
            icon={<Users className="text-[#8B5CF6]/20" size={48} />}
          />
        ) : (
          <DataTable columns={columns} data={contacts || []} onRowClick={setSelectedContact} />
        )}
      </motion.div>

      {/* Modal */}
      <Modal open={showNewContactModal} onOpenChange={setShowNewContactModal}>
        <ModalHeader className="px-8 pt-8 pb-6 border-b border-white/5 bg-[#18181B]">
          <ModalTitle className="text-3xl font-black tracking-tight text-[#F5F5F5]">Nuevo Contacto</ModalTitle>
          <p className="text-xs font-bold text-[#A3A3A3] uppercase tracking-widest mt-1">
            Crea un nuevo registro en tu base de datos
          </p>
        </ModalHeader>
        <ModalContent className="p-8 space-y-10 bg-[#0F0F0F]">
          <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
            <div className="w-32 h-32 rounded-[2rem] bg-[#18181B] border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-[#737373] hover:border-[#8B5CF6]/40 hover:text-[#8B5CF6] cursor-pointer transition-all duration-500 group/avatar overflow-hidden relative">
              <Icon
                name="User"
                size={48}
                className="group-hover/avatar:scale-110 transition-transform duration-500"
              />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] mt-3">Subir</span>
              <div className="absolute inset-0 bg-[#8B5CF6]/5 opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
            </div>
            <div className="flex-1 space-y-8 w-full">
              <Input
                label="NOMBRE COMPLETO"
                placeholder="Ej: María López"
                value={newContactForm.name}
                onChange={(e) => setNewContactForm((prev) => ({ ...prev, name: e.target.value }))}
                className="bg-[#18181B] border-white/5 focus:border-[#8B5CF6]/50 transition-all rounded-[1.25rem] h-14"
              />
              <Input
                label="EMAIL CORPORATIVO"
                type="email"
                placeholder="maria@empresa.com"
                value={newContactForm.email}
                onChange={(e) => setNewContactForm((prev) => ({ ...prev, email: e.target.value }))}
                className="bg-[#18181B] border-white/5 focus:border-[#8B5CF6]/50 transition-all rounded-[1.25rem] h-14"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-[0.25em] ml-1">
                TELÉFONO MÓVIL
              </label>
              <Input
                placeholder="+54 11 ..."
                value={newContactForm.phone}
                onChange={(e) => setNewContactForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="bg-[#18181B] border-white/5 focus:border-[#8B5CF6]/50 transition-all rounded-[1.25rem] h-14"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-[0.25em] ml-1">
                ETAPA DEL PIPELINE
              </label>
              <div className="relative group">
                <select
                  className="w-full h-14 px-6 rounded-[1.25rem] border border-white/5 bg-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 text-sm transition-all text-[#F5F5F5] appearance-none cursor-pointer hover:border-white/10"
                  value={newContactForm.pipelineStageId}
                  onChange={(e) => setNewContactForm((prev) => ({ ...prev, pipelineStageId: e.target.value }))}
                >
                  <option value="">Seleccionar etapa...</option>
                  {pipelineStages?.map((stage) => (
                    <option key={stage.id} value={stage.id}>{stage.name}</option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#737373] group-hover:text-[#8B5CF6] transition-colors">
                  <Icon name="ChevronDown" size={18} />
                </div>
              </div>
            </div>
          </div>

        </ModalContent>
        <ModalFooter className="p-8 border-t border-white/5 bg-[#18181B] gap-6">
          <Button
            variant="ghost"
            onClick={() => setShowNewContactModal(false)}
            className="rounded-[1rem] px-8 h-12 text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 transition-all duration-300 font-bold uppercase tracking-widest text-[10px]"
          >
            Descartar
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleCreateContact}
            disabled={createContactMutation.isPending || !newContactForm.name || !newContactForm.email}
            className="px-12 h-14 font-black uppercase tracking-widest text-[12px] shadow-lg bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-lg transition-all duration-150"
          >
            {createContactMutation.isPending ? "Validando..." : "Guardar Registro"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Contact Detail Drawer */}
      <Drawer open={!!selectedContact} onOpenChange={(open) => !open && setSelectedContact(null)}>
        {selectedContact && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-black text-[#F5F5F5]">Detalles del Contacto</h2>
              <button
                onClick={() => setSelectedContact(null)}
                className="p-2 text-[#737373] hover:text-[#F5F5F5] hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 p-6 space-y-6 overflow-auto">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8B5CF6]/30 to-transparent flex items-center justify-center text-white font-black text-2xl border border-white/10">
                  {selectedContact.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#F5F5F5]">{selectedContact.name}</h3>
                  <Badge className={cn("mt-2 px-3 py-1 font-black text-[10px] uppercase tracking-wider", getStageInfo(selectedContact.pipelineStageId).color)}>
                    {getStageInfo(selectedContact.pipelineStageId).label}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-[#18181B] rounded-xl border border-white/5">
                  <Mail size={18} className="text-[#8B5CF6]" />
                  <div>
                    <p className="text-[10px] font-black text-[#737373] uppercase tracking-wider">Email</p>
                    <p className="text-sm text-[#F5F5F5]">{selectedContact.email || "No disponible"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-[#18181B] rounded-xl border border-white/5">
                  <Phone size={18} className="text-[#8B5CF6]" />
                  <div>
                    <p className="text-[10px] font-black text-[#737373] uppercase tracking-wider">Teléfono</p>
                    <p className="text-sm text-[#F5F5F5]">{selectedContact.phone || "No disponible"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-[#737373] uppercase tracking-wider">Etiquetas</p>
                  <button
                    onClick={() => setShowTagPicker(!showTagPicker)}
                    className="text-[10px] font-bold text-[#8B5CF6] hover:text-[#A78BFA] uppercase tracking-wider"
                  >
                    + Añadir
                  </button>
                </div>
                
                {showTagPicker && allTags && (
                  <div className="p-3 bg-[#18181B] rounded-xl border border-white/5 space-y-2">
                    {allTags.map((tag: any) => {
                      const isAssigned = contactTagData?.some((ct: any) => ct.tagId === tag.id);
                      return (
                        <button
                          key={tag.id}
                          onClick={async () => {
                            if (isAssigned) {
                              await removeTagMutation.mutateAsync({ contactId: selectedContact.id, tagId: tag.id });
                            } else {
                              await addTagMutation.mutateAsync({ contactId: selectedContact.id, tagId: tag.id });
                            }
                            refetchContactTags();
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                            isAssigned ? "bg-[#8B5CF6]/20 text-[#8B5CF6]" : "text-[#A3A3A3] hover:bg-white/5"
                          )}
                        >
                          <span className="flex items-center gap-2">
                            {tag.icon && <span>{tag.icon}</span>}
                            <span>{tag.name}</span>
                          </span>
                          {isAssigned && <Check size={14} />}
                        </button>
                      );
                    })}
                    {allTags.length === 0 && (
                      <p className="text-xs text-[#737373]">No hay etiquetas disponibles</p>
                    )}
                  </div>
                )}

                {contactTagData && contactTagData.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {contactTagData.map((ct: any) => {
                      const tag = allTags?.find((t: any) => t.id === ct.tagId);
                      return tag ? (
                        <span
                          key={ct.id}
                          className="px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1"
                          style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                        >
                          {tag.icon && <span>{tag.icon}</span>}
                          {tag.name}
                          <button
                            onClick={async () => {
                              await removeTagMutation.mutateAsync({ contactId: selectedContact.id, tagId: tag.id });
                              refetchContactTags();
                            }}
                            className="ml-1 hover:opacity-70"
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}

                {(!contactTagData || contactTagData.length === 0) && !showTagPicker && (
                  <p className="text-xs text-[#737373]">Sin etiquetas asignadas</p>
                )}
              </div>

              {selectedContact.notes && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-[#737373] uppercase tracking-wider">Notas</p>
                  <p className="text-sm text-[#A3A3A3]">{selectedContact.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </Container>
  );
}
