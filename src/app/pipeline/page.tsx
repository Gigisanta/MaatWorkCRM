"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Plus,
  Search,
  GripVertical,
  Pencil,
  X,
  Loader2,
  LayoutGrid,
  List,
  ChevronRight,
} from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { useSidebar } from "@/lib/sidebar-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import {
  usePipelineData,
  useMoveContact,
  useUsers,
  type StageWithContacts,
  type ContactWithProducts,
  type Product,
} from "@/hooks/use-pipeline";
import { ContactCard } from "./components/contact-card";
import { MobileFAB } from "@/components/ui/mobile-fab";

// Stage Column Component
const StageColumn = React.memo(function StageColumn({
  stage,
  onEditContact,
  highlightedContactId,
  onAddContact,
  stages,
  onUpdateStage,
}: {
  stage: StageWithContacts;
  onEditContact: (contact: ContactWithProducts) => void;
  highlightedContactId?: string | null;
  onAddContact: (stageId: string) => void;
  stages: StageWithContacts[];
  onUpdateStage: (contactId: string, stageId: string) => void;
}) {
  const isOverWipLimit = stage.wipLimit !== null && stage.contacts.length > stage.wipLimit;

  const columnValue = stage.contacts.reduce((sum: number, c: ContactWithProducts) =>
    sum + (c.tags || []).reduce((ps: number, p: Product) => ps + ((p as { value?: number }).value || 0), 0)
  , 0);

  return (
    <div className="flex flex-col h-full min-w-[280px] max-w-[280px]">
      {/* Stage header with color accent */}
      <div
        className="flex items-center justify-between mb-2 px-1 py-2 rounded-lg bg-white/3 border border-white/6"
        style={{ borderTop: `2px solid ${stage.color}` }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: stage.color, boxShadow: `0 0 6px ${stage.color}60` }}
          />
          <div className="flex flex-col">
            <span className="font-semibold text-white text-sm">{stage.name}</span>
            {columnValue > 0 && (
              <p className="text-xs text-slate-500 font-medium mt-0.5">${columnValue.toLocaleString()}</p>
            )}
          </div>
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded-md font-medium",
            isOverWipLimit ? "bg-rose-500/20 text-rose-400" : "bg-white/8 text-slate-400"
          )}>
            {stage.contacts.length}
            {stage.wipLimit ? `/${stage.wipLimit}` : ""}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-slate-500 hover:text-white hover:bg-white/10 rounded-md"
          onClick={() => onAddContact(stage.id)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Contacts Container */}
      <div className="flex-1 space-y-2 overflow-y-auto px-1 pb-2 max-h-[calc(100vh-400px)]">
        <SortableContext items={stage.contacts.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence mode="popLayout">
            {stage.contacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onEdit={onEditContact}
                isHighlighted={highlightedContactId === contact.id}
                stages={stages}
                onUpdateStage={onUpdateStage}
              />
            ))}
          </AnimatePresence>
        </SortableContext>

        {stage.contacts.length === 0 && (
          <div className="h-24 rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center">
            <span className="text-sm text-slate-500">Sin contactos</span>
          </div>
        )}
      </div>
    </div>
  );
});

// Drag Overlay Card
function DragOverlayCard({ contact }: { contact: ContactWithProducts }) {
  return (
    <div className="p-3 rounded-lg glass border border-white/20 cursor-grabbing shadow-xl shadow-black/30 w-[256px]">
      <div className="flex items-start gap-2">
        <span className="text-2xl flex-shrink-0">{contact.emoji || "👤"}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {contact.name}
          </p>
        </div>
      </div>
    </div>
  );
}

// Contact Modal (simplified - edit stage and assigned user only)
function ContactModal({
  open,
  onOpenChange,
  contact,
  stages,
  onSuccess,
  organizationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: ContactWithProducts | null;
  stages: StageWithContacts[];
  onSuccess: () => void;
  organizationId: string | null;
}) {
  const [stageId, setStageId] = React.useState("");
  const [assignedTo, setAssignedTo] = React.useState("unassigned");
  const [isLoading, setIsLoading] = React.useState(false);

  const { data: users = [] } = useUsers(organizationId || '');

  const isEditing = !!contact;

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      if (contact) {
        setStageId(contact.pipelineStageId || "");
        setAssignedTo(contact.assignedUser?.id || "unassigned");
      } else {
        setStageId("");
        setAssignedTo("unassigned");
      }
    }
  }, [open, contact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contact) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipelineStageId: stageId || null,
          assignedTo: assignedTo === "unassigned" ? null : assignedTo || null,
        }),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to update contact');

      toast.success('Contacto actualizado exitosamente');
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error('Error al actualizar el contacto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-white/10 bg-slate-900 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Contacto" : "Nuevo Contacto"}</DialogTitle>
          <DialogDescription className="sr-only">
            {isEditing ? "Editar etapa y asignación del contacto" : "Crear nuevo contacto en el pipeline"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <p className="text-sm text-white font-medium">{contact?.name}</p>
          </div>

          <div className="space-y-2">
            <Label>Etapa</Label>
            <Select value={stageId} onValueChange={setStageId}>
              <SelectTrigger className="glass border-white/10 bg-white/5 text-white">
                <SelectValue placeholder="Seleccionar etapa..." />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      {stage.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Asignado a</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger className="glass border-white/10 bg-white/5 text-white">
                <SelectValue placeholder="Sin asignar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Sin asignar</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-slate-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-violet-500 hover:bg-violet-600"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PipelineContent() {
  const { user } = useAuth();
  const organizationId = user?.organizationId || null;
  const searchParams = useSearchParams();
  const contactId = searchParams.get("contact");

  const { stages, isLoading, error, refetch } = usePipelineData(organizationId || '');
  const moveContact = useMoveContact();

  const [pipelineView, setPipelineView] = React.useState<"kanban" | "list">("kanban");
  const [activeContact, setActiveContact] = React.useState<ContactWithProducts | null>(null);
  const [search, setSearch] = React.useState("");
  const [filterAssignee, setFilterAssignee] = React.useState("all");
  const [highlightedContactId, setHighlightedContactId] = React.useState<string | null>(null);

  // Modal states
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [selectedContact, setSelectedContact] = React.useState<ContactWithProducts | null>(null);
  const { collapsed, setCollapsed } = useSidebar();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Optimistic state for drag operations
  const [optimisticStages, setOptimisticStages] = React.useState<StageWithContacts[]>([]);

  // Sync optimistic stages with real data
  React.useEffect(() => {
    setOptimisticStages(stages);
  }, [stages]);

  // Find contact by contactId and highlight it
  React.useEffect(() => {
    if (!contactId) return;

    const foundContact = stages.flatMap(s => s.contacts).find(c => c.id === contactId);
    if (!foundContact) return;

    setHighlightedContactId(foundContact.id);
    // Clear highlight after 3 seconds
    const timer = setTimeout(() => setHighlightedContactId(null), 3000);
    return () => clearTimeout(timer);
  }, [contactId, stages]);

  // Filter stages based on search and assignee
  const filteredStages = React.useMemo(() => {
    return optimisticStages.map(stage => ({
      ...stage,
      contacts: stage.contacts.filter(contact => {
        const matchesSearch = !search ||
          contact.name.toLowerCase().includes(search.toLowerCase()) ||
          (contact.tags || []).some(tag => tag.name.toLowerCase().includes(search.toLowerCase()));
        const matchesAssignee = filterAssignee === "all" ||
          (filterAssignee === "me" && contact.assignedUser?.id) ||
          contact.assignedUser?.id === filterAssignee;
        return matchesSearch && matchesAssignee;
      }),
    }));
  }, [optimisticStages, search, filterAssignee]);

  // Total contacts count (from filtered stages, shown in header)
  const totalContacts = filteredStages.reduce((sum, stage) => sum + stage.contacts.length, 0);

  // Stats bar: computed from raw (unfiltered) optimistic stages
  const totalContactsAll = React.useMemo(
    () => optimisticStages.reduce((sum, stage) => sum + stage.contacts.length, 0),
    [optimisticStages]
  );

  const pipelineTotalValue = React.useMemo(
    () =>
      optimisticStages.reduce(
        (sum, s) =>
          sum +
          (s.contacts || []).reduce(
            (cs, c) =>
              cs + (c.tags || []).reduce((ps, p) => ps + (p.value || 0), 0),
            0
          ),
        0
      ),
    [optimisticStages]
  );

  const activeStageNames = ["Caído", "Caida", "Cuenta vacia", "Cuenta Vacía"];
  const activeContactsCount = React.useMemo(
    () =>
      optimisticStages
        .filter((s) => !activeStageNames.includes(s.name))
        .reduce((sum, stage) => sum + stage.contacts.length, 0),
    [optimisticStages]
  );

  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    const contactId = event.active.id as string;
    const contact = optimisticStages.flatMap(s => s.contacts).find(c => c.id === contactId);
    if (contact) {
      setActiveContact(contact);
    }
  }, [optimisticStages]);

  const handleDragOver = React.useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find source and destination stages
    const sourceStage = optimisticStages.find(s => s.contacts.some(c => c.id === activeId));
    const destStage = optimisticStages.find(s => s.id === overId || s.contacts.some(c => c.id === overId));

    if (!sourceStage || !destStage || sourceStage.id === destStage.id) return;

    // Find the contact being dragged
    const contact = sourceStage.contacts.find(c => c.id === activeId);
    if (!contact) return;

    // Optimistic update
    setOptimisticStages(prev => prev.map(stage => {
      if (stage.id === sourceStage.id) {
        return { ...stage, contacts: stage.contacts.filter(c => c.id !== activeId) };
      }
      if (stage.id === destStage.id) {
        return { ...stage, contacts: [...stage.contacts, { ...contact, pipelineStageId: destStage.id }] };
      }
      return stage;
    }));
  }, [optimisticStages]);

  const handleDragEnd = React.useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveContact(null);

    if (!over) return;

    const contactId = active.id as string;
    const overId = over.id as string;

    // Find the original contact to get its source stage
    const originalContact = stages.flatMap(s => s.contacts).find(c => c.id === contactId);
    const destStage = stages.find(s => s.id === overId || s.contacts.some(c => c.id === overId));

    if (!originalContact || !destStage) {
      // Revert optimistic update
      setOptimisticStages(stages);
      return;
    }

    // If the contact moved to a new stage, call the API
    if (originalContact.pipelineStageId !== destStage.id) {
      moveContact.mutate({
        contactId,
        pipelineStageId: destStage.id,
      }, {
        onError: () => {
          // Revert on error
          setOptimisticStages(stages);
        },
      });
    }
  }, [stages, moveContact]);

  const handleEditContact = (contact: ContactWithProducts) => {
    setSelectedContact(contact);
    setEditModalOpen(true);
  };

  const handleAddContact = (stageId: string) => {
    // For now, just open the edit modal with empty contact in the specific stage
    // In a real implementation, you might navigate to a create contact page
    toast.info("Usa la tabla de contactos para crear nuevos contactos");
  };

  const handleUpdateStage = React.useCallback((contactId: string, stageId: string) => {
    moveContact.mutate({ contactId, pipelineStageId: stageId });
  }, [moveContact]);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen gradient-bg">
        <AppSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
        <div className={cn("transition-all duration-300", collapsed ? "lg:pl-[80px]" : "lg:pl-[220px]")}>
          <AppHeader />
          <main className="p-4 lg:p-6">
            <Card className="glass border-white/10 p-6">
              <div className="text-center">
                <p className="text-red-400">Error al cargar los datos</p>
                <Button onClick={() => refetch()} className="mt-4">
                  Reintentar
                </Button>
              </div>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <AppSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
      <div className={cn("transition-all duration-300", collapsed ? "lg:pl-[80px]" : "lg:pl-[220px]")}>
        <AppHeader />
        {/* Pipeline Stats Bar */}
        {optimisticStages.length > 0 && (
          <div className="flex items-center gap-6 px-4 lg:px-6 py-2.5 border-b border-white/6 glass">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Contactos</span>
              <span className="text-sm font-semibold text-white">{totalContactsAll}</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Valor total</span>
              <span className="text-sm font-semibold text-white">${pipelineTotalValue.toLocaleString()}</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Etapas</span>
              <span className="text-sm font-semibold text-white">{optimisticStages.length}</span>
            </div>
          </div>
        )}
        <main className="p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-1">Pipeline</p>
                <h1 className="text-2xl font-bold text-white tracking-tight">Kanban de Contactos</h1>
                <p className="text-slate-500 mt-1 text-sm">
                  {isLoading ? "Cargando..." : `${totalContacts} contactos`}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl bg-[#0E0F12]/60 border border-white/6">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Buscar contactos o productos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-white/4 border-white/10 text-white placeholder:text-slate-600 focus:border-violet-500/40 rounded-lg h-9"
                />
              </div>
              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger className="w-[180px] glass border-white/10 bg-white/5 text-white">
                  <SelectValue placeholder="Asignado a" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="me">Mis contactos</SelectItem>
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-white/4 p-1 rounded-lg border border-white/8">
                <button
                  onClick={() => setPipelineView("kanban")}
                  className={cn(
                    "p-1.5 rounded-md transition-all duration-200",
                    pipelineView === "kanban"
                      ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                      : "text-slate-500 hover:text-slate-300 hover:bg-white/6"
                  )}
                  title="Vista Kanban"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setPipelineView("list")}
                  className={cn(
                    "p-1.5 rounded-md transition-all duration-200",
                    pipelineView === "list"
                      ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                      : "text-slate-500 hover:text-slate-300 hover:bg-white/6"
                  )}
                  title="Vista Lista"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="flex gap-4 overflow-x-auto pb-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex-shrink-0 w-[280px] space-y-3">
                    {/* Column header skeleton */}
                    <div className="flex items-center justify-between px-1">
                      <Skeleton className="h-5 w-28 bg-white/5" />
                      <Skeleton className="h-5 w-8 bg-white/5 rounded-full" />
                    </div>
                    {/* Card skeletons */}
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="rounded-xl border border-white/8 bg-[#0E0F12]/80 p-3 space-y-2">
                        <Skeleton className="h-4 w-3/4 bg-white/5" />
                        <Skeleton className="h-3 w-1/2 bg-white/5" />
                        <div className="flex gap-2 pt-1">
                          <Skeleton className="h-6 w-6 rounded-full bg-white/5" />
                          <Skeleton className="h-6 w-16 bg-white/5" />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : pipelineView === "list" ? (
              /* List View */
              <div className="rounded-xl border border-white/8 bg-[#0E0F12]/80 backdrop-blur-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/8">
                      <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium uppercase tracking-wider">Contacto</th>
                      <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium uppercase tracking-wider">Etapa</th>
                      <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium uppercase tracking-wider">Valor</th>
                      <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium uppercase tracking-wider">Última actividad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStages.flatMap((s: StageWithContacts) =>
                      s.contacts.map((c: ContactWithProducts) => {
                        const contactValue = (c.tags || []).reduce(
                          (sum: number, p: Product) => sum + (p.value || 0),
                          0
                        );
                        return (
                          <tr
                            key={c.id}
                            className="border-b border-white/4 hover:bg-white/3 transition-colors cursor-pointer"
                            onClick={() => handleEditContact(c)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <span className="text-base leading-none">{c.emoji || "👤"}</span>
                                <div>
                                  <p className="text-sm font-medium text-white">{c.name}</p>
                                  {c.company && <p className="text-xs text-slate-500">{c.company}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className="text-xs px-2 py-1 rounded-full border"
                                style={{
                                  backgroundColor: `${s.color}15`,
                                  color: s.color,
                                  borderColor: `${s.color}30`,
                                }}
                              >
                                {s.name}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-300 font-mono">
                              {contactValue > 0
                                ? `$${contactValue.toLocaleString("es-MX")}`
                                : "—"}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500">
                              {c.updatedAt
                                ? new Date(c.updatedAt).toLocaleDateString("es-MX", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "—"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                {filteredStages.flatMap((s: StageWithContacts) => s.contacts).length === 0 && (
                  <p className="text-center py-12 text-slate-500 text-sm">No hay contactos en el pipeline</p>
                )}
              </div>
            ) : (
              /* Kanban Board */
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={filteredStages.map(s => s.id)} strategy={horizontalListSortingStrategy}>
                  <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
                    {filteredStages.map((stage) => (
                      <StageColumn
                        key={stage.id}
                        stage={stage}
                        onEditContact={handleEditContact}
                        highlightedContactId={highlightedContactId}
                        onAddContact={handleAddContact}
                        stages={stages}
                        onUpdateStage={handleUpdateStage}
                      />
                    ))}
                  </div>
                </SortableContext>

                <DragOverlay>
                  {activeContact && <DragOverlayCard contact={activeContact} />}
                </DragOverlay>
              </DndContext>
            )}

            {/* Stats per stage */}
            {!isLoading && filteredStages.length > 0 && (
              <div className="p-4 rounded-xl bg-[#0E0F12]/60 border border-white/6">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  Distribución por Etapa
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                  {filteredStages.map((stage) => (
                    <div
                      key={stage.id}
                      className="p-2.5 rounded-lg bg-white/4 border border-white/6 hover:border-white/10 transition-colors"
                      style={{ borderTop: `2px solid ${stage.color}40` }}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stage.color }} />
                        <span className="text-[10px] text-white truncate font-medium">{stage.name}</span>
                      </div>
                      <p className="text-sm font-bold text-white">{stage.contacts.length}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </main>
      </div>

      {/* Edit Contact Modal */}
      <ContactModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        contact={selectedContact}
        stages={stages}
        onSuccess={refetch}
        organizationId={organizationId}
      />

      {/* Mobile FAB - only shown on mobile */}
      <MobileFAB
        actions={[
          {
            label: "Nueva oportunidad",
            icon: Plus,
            onClick: () => toast.info("Usa la tabla de contactos para crear nuevos contactos"),
          },
        ]}
      />
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen gradient-bg">
      <AppSidebar collapsed={false} onCollapsedChange={() => {}} />
      <div className="lg:pl-[220px]">
        <AppHeader />
        <main className="p-4 lg:p-6">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-shrink-0 w-[280px] space-y-3">
                <div className="flex items-center justify-between px-1">
                  <Skeleton className="h-5 w-28 bg-white/5" />
                  <Skeleton className="h-5 w-8 bg-white/5 rounded-full" />
                </div>
                {[1, 2, 3].map((j) => (
                  <div key={j} className="rounded-xl border border-white/8 bg-[#0E0F12]/80 p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4 bg-white/5" />
                    <Skeleton className="h-3 w-1/2 bg-white/5" />
                    <div className="flex gap-2 pt-1">
                      <Skeleton className="h-6 w-6 rounded-full bg-white/5" />
                      <Skeleton className="h-6 w-16 bg-white/5" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PipelineContent />
    </Suspense>
  );
}
