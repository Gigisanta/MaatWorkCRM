import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import { 
  useContacts, 
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation
} from "~/lib/hooks/use-crm";
import { Container, Stack, Grid } from "~/components/ui/Layout";
import { Card, CardContent } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { Icon } from "~/components/ui/Icon";
import { Input } from "~/components/ui/Input";
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from "~/components/ui/Modal";
import { EmptyState } from "~/components/ui/EmptyState";
import { cn } from "~/lib/utils";

export const Route = createFileRoute("/_app/contacts/")({
  component: ContactsPage,
});

const statusColors: Record<string, string> = {
  lead: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
  prospect: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  active: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  inactive: "text-text-muted bg-secondary/10 border-border/20",
};

const statusLabels: Record<string, string> = {
  lead: "Lead",
  prospect: "Prospecto",
  active: "Activo",
  inactive: "Inactivo",
};

function ContactsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  
  const { data: contacts, isLoading, error } = useContacts({ 
    search: search || undefined, 
    status: statusFilter 
  });

  const createContactMutation = useCreateContactMutation();
  
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [newContactForm, setNewContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "lead"
  });

  const handleCreateContact = async () => {
    if (!newContactForm.name || !newContactForm.email) return;
    try {
      await createContactMutation.mutateAsync(newContactForm);
      setShowNewContactModal(false);
      setNewContactForm({ name: "", email: "", phone: "", company: "", status: "lead" });
    } catch (err) {
      console.error("Failed to create contact:", err);
    }
  };

  if (isLoading && !contacts) {
    return (
      <Container className="py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </Container>
    );
  }

  return (
    <Container className="py-6 space-y-6">
      {/* Header */}
      <Stack direction="row" align="center" justify="between">
        <Stack direction="column" gap="xs">
          <h1 className="text-3xl font-bold text-text font-display">Contactos</h1>
          <p className="text-text-secondary">
            {contacts?.length || 0} contactos en total
          </p>
        </Stack>
        <Button variant="primary" onClick={() => setShowNewContactModal(true)}>
          <Icon name="Plus" className="mr-2" size={16} />
          Nuevo Contacto
        </Button>
      </Stack>

      {/* Filters & Search */}
      <Grid cols={1} mdCols={2} gap="md">
        <div className="relative">
          <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 h-11 bg-secondary/5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all"
          />
        </div>
        <Stack direction="row" gap="sm" className="bg-secondary/5 p-1 rounded-xl w-fit overflow-x-auto">
          {[
            { id: undefined, label: "Todos" },
            { id: "lead", label: "Leads" },
            { id: "prospect", label: "Prospectos" },
            { id: "active", label: "Activos" },
            { id: "inactive", label: "Inactivos" }
          ].map((f) => (
            <Button
              key={f.id || "all"}
              variant={statusFilter === f.id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter(f.id)}
              className={cn(
                "rounded-lg px-4 whitespace-nowrap",
                statusFilter === f.id && "bg-background shadow-sm text-primary"
              )}
            >
              {f.label}
            </Button>
          ))}
        </Stack>
      </Grid>

      {/* Contact List */}
      <div className="grid gap-3">
        {error ? (
          <EmptyState 
            title="Error al cargar contactos" 
            description={(error as Error).message}
            icon={<Icon name="AlertTriangle" className="text-error" />}
          />
        ) : contacts?.length === 0 ? (
          <EmptyState 
            title="Sin contactos" 
            description="No se encontraron contactos con los filtros actuales."
            icon={<Icon name="Users" className="text-text-muted" />}
          />
        ) : (
          contacts?.map((contact: any, index: number) => (
            <Card 
              key={contact.id} 
              variant="glass" 
              className="hover-lift animate-enter group"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary font-bold text-lg border border-primary/10">
                  {contact.name.charAt(0)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-text font-display truncate">
                      {contact.name}
                    </h3>
                    <Badge className={cn("px-2 py-0.5 border text-[10px]", statusColors[contact.status])}>
                      {statusLabels[contact.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    {contact.company && (
                      <span className="text-sm text-text-secondary flex items-center gap-1.5">
                        <Icon name="Briefcase" size={12} className="text-text-muted" />
                        {contact.company}
                      </span>
                    )}
                    <span className="text-sm text-text-muted flex items-center gap-1.5 truncate">
                      <Icon name="Mail" size={12} />
                      {contact.email}
                    </span>
                  </div>
                </div>

                <Stack direction="row" gap="xs" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg">
                    <Icon name="Phone" size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg">
                    <Icon name="MoreVertical" size={16} />
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* New Contact Modal */}
      <Modal open={showNewContactModal} onClose={() => setShowNewContactModal(false)}>
        <ModalHeader>
          <ModalTitle>Nuevo Contacto</ModalTitle>
        </ModalHeader>
        <ModalContent className="space-y-4">
          <Input 
            label="Nombre Completo"
            placeholder="Ej: María López"
            value={newContactForm.name}
            onChange={(e) => setNewContactForm(prev => ({ ...prev, name: e.target.value }))}
          />
          <Input 
            label="Email"
            type="email"
            placeholder="maria@ejemplo.com"
            value={newContactForm.email}
            onChange={(e) => setNewContactForm(prev => ({ ...prev, email: e.target.value }))}
          />
          <Grid cols={2} gap="md">
            <Input 
              label="Teléfono"
              placeholder="+54 11 ..."
              value={newContactForm.phone}
              onChange={(e) => setNewContactForm(prev => ({ ...prev, phone: e.target.value }))}
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">Estado</label>
              <select 
                className="w-full h-10 px-3 rounded-lg border border-border bg-secondary/5 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                value={newContactForm.status}
                onChange={(e) => setNewContactForm(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="lead">Lead</option>
                <option value="prospect">Prospecto</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          </Grid>
          <Input 
            label="Empresa"
            placeholder="Nombre de la compañía"
            value={newContactForm.company}
            onChange={(e) => setNewContactForm(prev => ({ ...prev, company: e.target.value }))}
          />
        </ModalContent>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowNewContactModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateContact}
            disabled={createContactMutation.isPending || !newContactForm.name || !newContactForm.email}
          >
            {createContactMutation.isPending ? "Guardando..." : "Guardar Contacto"}
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
}
