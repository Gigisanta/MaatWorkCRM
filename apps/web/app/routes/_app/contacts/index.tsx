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
    <Container size="full" className="py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-2">
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-white leading-tight tracking-tighter font-display">Directorio de Contactos</h1>
          <p className="text-[11px] font-black text-text-muted/60 uppercase tracking-[0.3em] flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_12px_rgba(99,102,241,0.8)] animate-pulse" />
            {contacts?.length || 0} Registros <span className="opacity-20">•</span> {contacts?.filter((c: any) => c.status === "active").length || 0} Clientes Activos
          </p>
        </div>
        <Button 
          variant="primary" 
          size="md"
          onClick={() => setShowNewContactModal(true)}
          className="shadow-primary rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[12px] group"
        >
          <Icon name="Plus" className="mr-3 group-hover:rotate-90 transition-transform duration-500" size={18} strokeWidth={3} />
          Nuevo Registro
        </Button>
      </div>

      {/* Filters & Actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-8 enterprise-glass p-3 rounded-[2rem] border border-border/40 shadow-glass-strong">
        <div className="flex-1 min-w-[350px] relative group h-14">
          <Icon name="Search" className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted/40 group-focus-within:text-primary transition-all duration-300" size={20} strokeWidth={2.5} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, correo o empresa..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-16 pr-6 h-full bg-white/5 border-2 border-transparent rounded-[1.25rem] focus:border-primary/30 focus:bg-white/10 focus:outline-none text-sm font-bold placeholder:text-text-muted/20 transition-all shadow-inner text-white/90"
          />
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-white/5 backdrop-blur-md rounded-[1.25rem] border border-white/5 shadow-inner">
          {[
            { id: undefined, label: "Todos" },
            { id: "lead", label: "Leads" },
            { id: "prospect", label: "Prospectos" },
            { id: "active", label: "Activos" },
            { id: "inactive", label: "Inactivos" }
          ].map((f) => (
            <Button
              key={f.id || "all"}
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter(f.id)}
              className={cn(
                "rounded-xl px-6 h-10 font-black text-[11px] uppercase tracking-tighter transition-all duration-300",
                statusFilter === f.id 
                  ? "bg-white text-primary shadow-xl scale-[1.02]" 
                  : f.id === undefined ? "text-text-muted/60 hover:text-white" : "text-text-muted/60 hover:text-primary"
              )}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Contact List */}
      <div className="grid gap-4 px-1">
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
            icon={<Icon name="Users" className="text-primary/20" size={48} />}
          />
        ) : (
          contacts?.map((contact: any, index: number) => (
            <Card 
              key={contact.id} 
              variant="glass"
              className="hover:shadow-glass transition-all duration-500 group overflow-hidden border-white/5 relative hover-lift animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
               <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-1.5 opacity-60 transition-all duration-500 group-hover:w-2",
                  contact.status === 'lead' ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' :
                  contact.status === 'prospect' ? 'bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]' :
                  contact.status === 'active' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' :
                  'bg-text-muted/40'
                )} />

              <CardContent className="p-6 flex items-center gap-8">
                <div className="relative">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-primary/30 via-primary/5 to-transparent flex items-center justify-center text-white font-black text-2xl border-2 border-white/10 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 overflow-hidden">
                    {contact.name.charAt(0)}
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className={cn(
                    "absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full border-4 border-[#0F1117] shadow-xl flex items-center justify-center",
                    contact.status === 'active' ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-gray-600 shadow-black/40'
                  )}>
                    {contact.status === 'active' && <Icon name="Check" size={10} className="text-white" strokeWidth={4} />}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-4">
                    <h3 className="text-xl font-black text-white tracking-tight truncate group-hover:text-primary transition-colors duration-300">
                      {contact.name}
                    </h3>
                    <Badge variant="pill" className={cn("px-4 py-1.5 font-black text-[10px] uppercase tracking-[0.15em] transition-all", statusColors[contact.status])}>
                      {statusLabels[contact.status]}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-4">
                    {contact.company && (
                      <span className="text-[12px] font-black text-text-muted/80 flex items-center gap-2.5 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                        <Icon name="Briefcase" size={14} className="text-primary/70" strokeWidth={3} />
                        {contact.company}
                      </span>
                    )}
                    <span className="text-[12px] font-bold text-text-muted/60 flex items-center gap-2.5 uppercase tracking-widest group-hover:text-text-muted/90 transition-colors">
                      <Icon name="Mail" size={14} strokeWidth={2.5} className="text-primary/40" />
                      {contact.email}
                    </span>
                    {contact.phone && (
                      <span className="text-[12px] font-bold text-text-muted/60 flex items-center gap-2.5 uppercase tracking-widest">
                        <Icon name="Phone" size={14} strokeWidth={2.5} className="text-primary/40" />
                        {contact.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 translate-x-8 group-hover:translate-x-0 transition-all duration-500">
                  <Button variant="ghost" size="sm" className="h-14 w-14 p-0 rounded-2xl bg-white/5 hover:bg-primary/20 hover:text-primary border border-white/5 transition-all duration-300 group/btn">
                    <Icon name="Phone" size={24} className="group-hover/btn:scale-110 transition-transform" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-14 w-14 p-0 rounded-2xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/5 transition-all duration-300">
                    <Icon name="MoreVertical" size={24} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Modal open={showNewContactModal} onOpenChange={setShowNewContactModal}>
        <ModalHeader className="px-8 pt-8 pb-6 border-b border-white/5 bg-white/5">
          <ModalTitle className="text-3xl font-black tracking-tight text-white/95">Nuevo Contacto</ModalTitle>
          <p className="text-xs font-bold text-text-muted/60 uppercase tracking-widest mt-1">Crea un nuevo registro en tu base de datos</p>
        </ModalHeader>
        <ModalContent className="p-8 space-y-10">
          <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
             <div className="w-32 h-32 rounded-[2rem] bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-text-muted/30 hover:border-primary/40 hover:text-primary/60 cursor-pointer transition-all duration-500 group/avatar overflow-hidden relative">
                <Icon name="User" size={48} strokeWidth={1} className="group-hover/avatar:scale-110 transition-transform duration-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] mt-3">Subir</span>
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
             </div>
             <div className="flex-1 space-y-8 w-full">
                <Input 
                  label="NOMBRE COMPLETO"
                  placeholder="Ej: María López"
                  value={newContactForm.name}
                  onChange={(e) => setNewContactForm(prev => ({ ...prev, name: e.target.value }))}
                  className="enterprise-glass border-white/10 focus:border-primary/50 transition-all rounded-[1.25rem] h-14"
                />
                <Input 
                  label="EMAIL CORPORATIVO"
                  type="email"
                  placeholder="maria@empresa.com"
                  value={newContactForm.email}
                  onChange={(e) => setNewContactForm(prev => ({ ...prev, email: e.target.value }))}
                  className="enterprise-glass border-white/10 focus:border-primary/50 transition-all rounded-[1.25rem] h-14"
                  icon={<Icon name="Mail" size={18} className="text-primary/40" />}
                />
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-text-muted/60 uppercase tracking-[0.25em] ml-1">TELÉFONO MÓVIL</label>
              <Input 
                placeholder="+54 11 ..."
                value={newContactForm.phone}
                onChange={(e) => setNewContactForm(prev => ({ ...prev, phone: e.target.value }))}
                className="enterprise-glass border-white/10 focus:border-primary/50 transition-all rounded-[1.25rem] h-14"
                icon={<Icon name="Phone" size={18} className="text-primary/40" />}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-text-muted/60 uppercase tracking-[0.25em] ml-1">NIVEL / ESTADO</label>
              <div className="relative group">
                <select 
                  className="w-full h-14 px-6 rounded-[1.25rem] border border-white/10 bg-white/5 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all shadow-glass text-white/90 appearance-none cursor-pointer hover:border-white/20 group-hover:bg-white/10"
                  value={newContactForm.status}
                  onChange={(e) => setNewContactForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="lead" className="bg-surface-900">Prospecto (Lead)</option>
                  <option value="prospect" className="bg-surface-900">Oportunidad</option>
                  <option value="active" className="bg-surface-900">Cliente Activo</option>
                  <option value="inactive" className="bg-surface-900">Inactivo</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted/40 group-hover:text-primary transition-colors">
                  <Icon name="ChevronDown" size={18} />
                </div>
              </div>
            </div>
          </div>
          
          <Input 
            label="ORGANIZACIÓN / COMPAÑÍA"
            placeholder="Ej: Inversiones Globales S.A."
            value={newContactForm.company}
            onChange={(e) => setNewContactForm(prev => ({ ...prev, company: e.target.value }))}
            className="enterprise-glass border-white/10 focus:border-primary/50 transition-all rounded-[1.25rem] h-14"
            icon={<Icon name="Briefcase" size={18} className="text-primary/40" />}
          />
        </ModalContent>
        <ModalFooter className="p-8 border-t border-white/5 bg-white/5 gap-6">
          <Button variant="ghost" onClick={() => setShowNewContactModal(false)} className="rounded-[1rem] px-8 h-12 text-text-muted hover:text-white transition-all duration-300 font-bold uppercase tracking-widest text-[10px]">
            Descartar
          </Button>
          <Button 
            variant="primary" 
            size="lg"
            onClick={handleCreateContact}
            disabled={createContactMutation.isPending || !newContactForm.name || !newContactForm.email}
            className="px-12 h-14 font-black uppercase tracking-widest text-[12px] shadow-xl shadow-primary/20 rounded-[1rem] hover:scale-[1.02] active:scale-[0.98] transition-all duration-500"
          >
            {createContactMutation.isPending ? "Validando..." : "Guardar Registro"}
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
}
