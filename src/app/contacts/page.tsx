'use client';

import * as React from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { useSidebar } from "@/contexts/sidebar-context";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { ContactStats } from "./components/contact-stats";
import { ContactFilters } from "./components/contact-filters";
import { ContactTable } from "./components/contact-table";
import { ContactsCards } from "./components/contacts-cards";
import { ContactPagination } from "./components/contact-pagination";
import { ContactDrawerSkeleton } from "./components/contact-drawer-skeleton";
import { PlanningDialogProvider } from "./components/PlanningDialogContext";
import { type Contact, type PipelineStage } from "./components/contact-table";
import { type Tag } from "./components/tag-manager-dialog";
import { MobileFAB } from "@/components/ui/mobile-fab";

// Dynamic imports for modal/dialog components (code splitting)
const ContactDrawer = dynamic(
  () => import("./components/contact-drawer").then((m) => m.ContactDrawer),
  { ssr: false, loading: () => <ContactDrawerSkeleton /> }
);
const CreateContactModal = dynamic(
  () => import("./components/create-contact-modal").then((m) => m.CreateContactModal),
  { ssr: false, loading: () => <div className="fixed inset-0 z-50 flex items-center justify-center"><Skeleton className="w-[500px] h-[400px] rounded-xl" /></div> }
);
const TagManagerDialog = dynamic(
  () => import("./components/tag-manager-dialog").then((m) => m.TagManagerDialog),
  { ssr: false, loading: () => <div className="fixed inset-0 z-50 flex items-center justify-center"><Skeleton className="w-[400px] h-[300px] rounded-xl" /></div> }
);
const PlanningDialog = dynamic(
  () => import("./components/PlanningDialog").then((m) => m.PlanningDialog),
  { ssr: false, loading: () => <div className="fixed inset-0 z-50 flex items-center justify-center"><Skeleton className="w-[600px] h-[500px] rounded-xl" /></div> }
);

interface ContactsResponse {
  contacts: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface TagsResponse {
  tags: Tag[];
}

interface PipelineStagesResponse {
  stages: PipelineStage[];
}

// Main Contacts Page
export default function ContactsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { collapsed, setCollapsed } = useSidebar();

  // Auth loading state - show skeleton while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#08090B] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/15 flex items-center justify-center mx-auto">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          </div>
          <p className="text-slate-500 text-sm">Cargando contactos...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    router.push('/login');
    return (
      <div className="min-h-screen bg-[#08090B] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/15 flex items-center justify-center mx-auto">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          </div>
          <p className="text-slate-500 text-sm">Redirigiendo a login...</p>
        </div>
      </div>
    );
  }

  const organizationId = user?.organizationId || null;
  const queryClient = useQueryClient();

  // State - check URL param for action=create to auto-open modal
  const [search, setSearch] = React.useState("");
  const [selectedContacts, setSelectedContacts] = React.useState<string[]>([]);
  const [selectedContactId, setSelectedContactId] = React.useState<string | null>(null);
  const [editingContactTagsId, setEditingContactTagsId] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [filterStage, setFilterStage] = React.useState<string>("all");
  const [viewMode, setViewMode] = React.useState<"table" | "cards">("table");
  const [page, setPage] = React.useState(1);
  const [showTagManager, setShowTagManager] = React.useState(false);

  // Set createModalOpen based on URL param after mount
  const searchParams = useSearchParams();
  React.useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setCreateModalOpen(true);
    }
  }, [searchParams]);

  // Check if user can reassign contacts (should not see assigned to column in table)
  const canReassign = user?.role === 'owner' || user?.role === 'admin' || user?.role === 'developer';
  const isAdvisor = user?.role === 'advisor' || user?.role === 'asesor' || canReassign;

  // Debounced search
  const debouncedSearch = useDebounce(search, 300);

  // Fetch pipeline stages
  const { data: stagesData } = useQuery<PipelineStagesResponse>({
    queryKey: ["pipeline-stages", organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/pipeline-stages?organizationId=${organizationId}`, { credentials: 'include' });
      if (!response.ok) throw new Error("Error al cargar etapas");
      return response.json();
    },
    enabled: !!organizationId,
  });

  const stages = stagesData?.stages || [];

  // Fetch tags for organization
  const { data: tagsData } = useQuery<TagsResponse>({
    queryKey: ["tags", organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/tags?organizationId=${organizationId}`, { credentials: 'include' });
      if (!response.ok) throw new Error("Error al cargar etiquetas");
      return response.json();
    },
    enabled: !!organizationId,
  });

  const allTags = tagsData?.tags || [];

  // Fetch contacts
  const {
    data: contactsData,
    isLoading,
    error,
    refetch,
  } = useQuery<ContactsResponse>({
    queryKey: [
      "contacts",
      organizationId,
      debouncedSearch,
      filterStage,
      page,
    ],
    queryFn: async () => {
      if (!organizationId) {
        throw new Error('organizationId es requerido');
      }
      const params = new URLSearchParams();
      params.set("organizationId", organizationId);
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filterStage !== "all") params.set("stage", filterStage);
      params.set("page", page.toString());
      params.set("limit", "20");

      const response = await fetch(`/api/contacts?${params.toString()}`, { credentials: 'include' });
      if (!response.ok) throw new Error("Error al cargar contactos");
      return response.json();
    },
    enabled: !!organizationId,
  });

  // Show error toast
  React.useEffect(() => {
    if (error) {
      toast.error("Error al cargar contactos");
    }
  }, [error]);

  const contacts = contactsData?.contacts || [];
  const pagination = contactsData?.pagination;

  // Mutation to update contact stage
  const updateStageMutation = useMutation({
    mutationFn: async ({ contactId, stageId }: { contactId: string; stageId: string }) => {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipelineStageId: stageId }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error("Error al actualizar etapa");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Etapa actualizada");
    },
    onError: () => {
      toast.error("Error al actualizar etapa");
    },
  });

  // Mutation to remove tag from contact
  const removeTagMutation = useMutation({
    mutationFn: async ({ contactId, tagId }: { contactId: string; tagId: string }) => {
      const response = await fetch(`/api/contacts/${contactId}/tags/${tagId}`, {
        method: "DELETE",
        credentials: 'include',
      });

      if (!response.ok) {
        let errorMessage = "Error al eliminar tag";
        try {
          const errorData = await response.json();
          errorMessage = errorData?.error || errorData?.details || errorMessage;
        } catch {
          const text = await response.text();
          if (text) errorMessage = text;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Tag eliminado");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al eliminar tag");
    },
  });

  // Mutation to add tag to contact
  const addTagMutation = useMutation({
    mutationFn: async ({ contactId, tagId, tagName }: { contactId: string; tagId?: string | null; tagName?: string }) => {
      const response = await fetch(`/api/contacts/${contactId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId, tagName, organizationId }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al agregar tag");
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      if (data.alreadyAssociated) {
        toast.info("Esta etiqueta ya está en el contacto");
      } else {
        toast.success("Tag agregado");
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al agregar tag");
    },
  });

  const updateContactStage = (contactId: string, stageId: string) => {
    updateStageMutation.mutate({ contactId, stageId });
  };

  const removeTag = (contactId: string, tagId: string) => {
    removeTagMutation.mutate({ contactId, tagId });
  };

  const addTag = (contactId: string, tagId: string | null, tagName?: string) => {
    addTagMutation.mutate({ contactId, tagId, tagName });
  };

  // Organization tag mutations
  const createOrgTagMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string }) => {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color, organizationId }),
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || 'Error al crear etiqueta');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Etiqueta creada');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Error al crear etiqueta');
    },
  });

  const deleteOrgTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || 'Error al eliminar etiqueta');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Etiqueta eliminada');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar etiqueta');
    },
  });

  const createOrgTag = (name: string, color?: string) => {
    createOrgTagMutation.mutate({ name, color });
  };

  const deleteOrgTag = (tagId: string) => {
    deleteOrgTagMutation.mutate(tagId);
  };

  const toggleSelectAll = React.useCallback(() => {
    setSelectedContacts((prev) => {
      if (prev.length === contacts.length && contacts.length > 0) {
        return [];
      }
      return contacts.map((c) => c.id);
    });
  }, [contacts]);

  const toggleSelect = React.useCallback((id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }, []);

  const handleContactClick = (contact: Contact) => {
    setSelectedContactId(contact.id);
    setDrawerOpen(true);
  };

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterStage]);

  return (
    <PlanningDialogProvider>
    <div className="min-h-screen gradient-bg">
      <AppSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
      <div className={cn("transition-all duration-300", collapsed ? "lg:pl-[80px]" : "lg:pl-[220px]")}>
        <AppHeader />
        <main className="p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-5"
          >
            {/* Header Stats */}
            <ContactStats
              total={pagination?.total || 0}
              isLoading={isLoading}
              onCreateClick={() => setCreateModalOpen(true)}
            />

            {/* Filters */}
            <ContactFilters
              search={search}
              onSearchChange={setSearch}
              filterStage={filterStage}
              onFilterStageChange={setFilterStage}
              stages={stages}
              onTagManagerClick={() => setShowTagManager(true)}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {/* Table or Cards */}
            {viewMode === "table" ? (
              <ContactTable
                contacts={contacts}
                selectedContacts={selectedContacts}
                isAdvisor={isAdvisor}
                stages={stages}
                isLoading={isLoading}
                error={error}
                onRetry={refetch}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={toggleSelectAll}
                onContactClick={handleContactClick}
                onUpdateStage={updateContactStage}
                onRemoveTag={removeTag}
                onAddTag={addTag}
                allTags={allTags}
                editingContactTagsId={editingContactTagsId}
                onEditingContactTagsIdChange={setEditingContactTagsId}
              />
            ) : (
              <ContactsCards
                contacts={contacts}
                isLoading={isLoading}
                search={search}
                onContactClick={handleContactClick}
                onCreateClick={() => setCreateModalOpen(true)}
              />
            )}

            {/* Pagination */}
            {pagination && (
              <ContactPagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={pagination.limit}
                onPageChange={setPage}
              />
            )}
          </motion.div>
        </main>
      </div>

      {/* Contact Drawer */}
      <ContactDrawer
        contactId={selectedContactId}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedContactId(null);
        }}
        onEdit={() => {}}
        onDelete={() => {
          setDrawerOpen(false);
          setSelectedContactId(null);
        }}
        stages={stages}
        organizationId={organizationId}
      />

      {/* Create Contact Modal */}
      <CreateContactModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        stages={stages}
        organizationId={organizationId}
      />

      {/* Tag Manager Dialog */}
      <TagManagerDialog
        open={showTagManager}
        onClose={() => setShowTagManager(false)}
        tags={allTags}
        onCreateTag={createOrgTag}
        onDeleteTag={deleteOrgTag}
        isCreating={createOrgTagMutation.isPending}
        isDeleting={deleteOrgTagMutation.isPending}
      />

      {/* Planning Dialog */}
      <PlanningDialog />

      {/* Mobile FAB */}
      <MobileFAB
        actions={[
          {
            label: "Nuevo contacto",
            icon: Plus,
            onClick: () => setCreateModalOpen(true),
          },
        ]}
      />

      {/* Floating Bulk Toolbar */}
      <AnimatePresence>
        {selectedContacts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0E0F12] border border-white/15 shadow-2xl shadow-black/60 backdrop-blur-sm"
          >
            {/* Count */}
            <div className="flex items-center gap-2 pr-2 border-r border-white/8">
              <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center">
                <span className="text-[10px] font-bold text-violet-400">{selectedContacts.length}</span>
              </div>
              <span className="text-sm text-slate-300 font-medium">
                {selectedContacts.length === 1 ? "seleccionado" : "seleccionados"}
              </span>
            </div>

            {/* Actions */}
            <button
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/8 rounded-lg transition-all duration-200"
              onClick={() => {
                toast.info(`${selectedContacts.length} contactos listos para exportar`);
              }}
            >
              Exportar
            </button>

            <button
              className="px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all duration-200"
              onClick={() => {
                if (confirm(`¿Eliminar ${selectedContacts.length} contactos?`)) {
                  // TODO: implementar eliminación bulk
                  setSelectedContacts([]);
                }
              }}
            >
              Eliminar
            </button>

            {/* Dismiss */}
            <div className="border-l border-white/8 pl-2 ml-0">
              <button
                onClick={() => setSelectedContacts([])}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/8 transition-all duration-200"
                title="Deseleccionar todos"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </PlanningDialogProvider>
  );
}
