'use client';

import * as React from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

import { ContactStats } from "./components/contact-stats";
import { ContactFilters } from "./components/contact-filters";
import { ContactTable } from "./components/contact-table";
import { ContactPagination } from "./components/contact-pagination";
import { ContactDrawer } from "./components/contact-drawer";
import { CreateContactModal } from "./components/create-contact-modal";
import { TagManagerDialog, type Tag } from "./components/tag-manager-dialog";
import { type Contact, type PipelineStage } from "./components/contact-table";

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

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Main Contacts Page
export default function ContactsPage() {
  const { user } = useAuth();
  const organizationId = user?.organizationId || null;
  const queryClient = useQueryClient();

  // State
  const [search, setSearch] = React.useState("");
  const [selectedContacts, setSelectedContacts] = React.useState<string[]>([]);
  const [selectedContactId, setSelectedContactId] = React.useState<string | null>(null);
  const [editingContactTagsId, setEditingContactTagsId] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [filterStage, setFilterStage] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const [showTagManager, setShowTagManager] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  // Check if user is advisor (should not see assigned to column)
  const isAdvisor = user?.role === 'advisor' || user?.role === 'asesor';

  // Debounced search
  const debouncedSearch = useDebounce(search, 300);

  // Fetch pipeline stages
  const { data: stagesData } = useQuery<PipelineStagesResponse>({
    queryKey: ["pipeline-stages", organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/pipeline-stages?organizationId=${organizationId}`);
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
      const response = await fetch(`/api/tags?organizationId=${organizationId}`);
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
  } = useQuery<ContactsResponse>({
    queryKey: [
      "contacts",
      organizationId,
      debouncedSearch,
      filterStage,
      page,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("organizationId", organizationId!);
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filterStage !== "all") params.set("stage", filterStage);
      params.set("page", page.toString());
      params.set("limit", "20");

      const response = await fetch(`/api/contacts?${params.toString()}`);
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
      });

      if (!response.ok) {
        let errorMessage = "Error al agregar tag";
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
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag agregado");
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
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map((c) => c.id));
    }
  }, [contacts, selectedContacts.length]);

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
    <div className="min-h-screen gradient-bg">
      <AppSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      <div className={cn("transition-all duration-300", sidebarCollapsed ? "lg:pl-[80px]" : "lg:pl-[280px]")}>
        <AppHeader />
        <main className="p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
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
            />

            {/* Table */}
            <ContactTable
              contacts={contacts}
              selectedContacts={selectedContacts}
              isAdvisor={isAdvisor}
              stages={stages}
              isLoading={isLoading}
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
    </div>
  );
}
