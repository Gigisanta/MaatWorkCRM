// ============================================================
// MaatWork CRM — Contacts Page
// UI/UX REFINED BY JULES v2
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import {
  useContacts,
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation
} from "~/lib/hooks/use-crm";
import { Container } from "~/components/ui/Layout";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { Icon } from "~/components/ui/Icon";
import { Input } from "~/components/ui/Input";
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from "~/components/ui/Modal";
import { EmptyState } from "~/components/ui/EmptyState";
import { DataTable } from "~/components/ui/Table";
import { cn } from "~/lib/utils";
import { motion } from "framer-motion";
import { Sparkles, Phone, Mail, Building2, MoreVertical, Search, Check, Users } from "lucide-react";

export const Route = createFileRoute("/_app/contacts/")({
  component: ContactsPage,
});

const statusColors: Record<string, string> = {
  lead: "text-[#8B5CF6] bg-[#8B5CF6]/10 border-[#8B5CF6]/20",
  prospect: "text-[#C026D3] bg-[#C026D3]/10 border-[#C026D3]/20",
  active: "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20",
  inactive: "text-[#737373] bg-[#18181B]/50 border-white/5",
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

  const columns = [
    {
      accessorKey: "name",
      header: "Contacto",
      cell: (info: any) => {
        const contact = info.row.original;
        return (
          <div className="flex items-center gap-4">
             <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6]/30 to-transparent flex items-center justify-center text-white font-black text-lg border border-white/10">
                  {contact.name.charAt(0)}
                </div>
                {contact.status === 'active' && (
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
      accessorKey: "company",
      header: "Compañía",
      cell: (info: any) => {
        const val = info.getValue();
        return val ? (
           <span className="flex items-center gap-2 text-sm text-[#A3A3A3]">
              <Building2 size={14} className="text-[#8B5CF6]/70" />
              {val}
           </span>
        ) : <span className="text-[#737373]">-</span>;
      }
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
        ) : <span className="text-[#737373]">-</span>;
      }
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: (info: any) => {
        const status = info.getValue();
        return (
          <Badge className={cn("px-3 py-1 font-black text-[10px] uppercase tracking-wider", statusColors[status])}>
            {statusLabels[status]}
          </Badge>
        );
      }
    },
    {
      id: "actions",
      cell: () => (
         <div className="flex justify-end pr-4">
            <button className="p-2 text-[#737373] hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/10 rounded-lg transition-colors">
               <MoreVertical size={16} />
            </button>
         </div>
      )
    }
  ];

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
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-2">
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-[#F5F5F5] leading-tight tracking-tighter font-display">Directorio de Contactos</h1>
          <p className="text-[11px] font-black text-[#A3A3A3] uppercase tracking-[0.3em] flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] shadow-[0_0_12px_rgba(139,92,246,0.8)] animate-pulse" />
            {contacts?.length || 0} Registros <span className="opacity-20">•</span> {contacts?.filter((c: any) => c.status === "active").length || 0} Clientes Activos
          </p>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" className="h-14 px-6 border-white/5 bg-[#18181B] text-[#A3A3A3] hover:text-[#8B5CF6]">
              <Sparkles className="w-4 h-4 mr-2" />
              Encontrar Similares (AI)
           </Button>
           <Button
             variant="primary"
             size="md"
             onClick={() => setShowNewContactModal(true)}
             className="shadow-[0_0_20px_rgba(139,92,246,0.3)] rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[12px] group bg-[#8B5CF6] hover:bg-[#7C3AED]"
           >
             <Icon name="Plus" className="mr-3 group-hover:rotate-90 transition-transform duration-500" size={18} strokeWidth={3} />
             Nuevo Registro
           </Button>
        </div>
      </motion.div>

      {/* Filters & Actions bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap items-center justify-between gap-8 bg-[#0F0F0F] p-3 rounded-[2rem] border border-white/5 shadow-md">
        <div className="flex-1 min-w-[350px] relative group h-14">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#737373] group-focus-within:text-[#8B5CF6] transition-all duration-300" size={20} strokeWidth={2.5} />
          <input
            type="text"
            placeholder="Buscar por nombre, correo o empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-16 pr-6 h-full bg-[#18181B] border-2 border-transparent rounded-[1.25rem] focus:border-[#8B5CF6]/30 focus:bg-white/5 focus:outline-none text-sm font-bold placeholder:text-[#737373] transition-all shadow-inner text-[#F5F5F5]"
          />
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-[#18181B] backdrop-blur-md rounded-[1.25rem] border border-white/5 shadow-inner">
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
                  ? "bg-white/10 text-[#F5F5F5] shadow-xl"
                  : f.id === undefined ? "text-[#A3A3A3] hover:text-[#F5F5F5]" : "text-[#737373] hover:text-[#8B5CF6]"
              )}
            >
              {f.label}
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
          <DataTable columns={columns} data={contacts || []} />
        )}
      </motion.div>

      {/* Modal */}
      <Modal open={showNewContactModal} onOpenChange={setShowNewContactModal}>
        <ModalHeader className="px-8 pt-8 pb-6 border-b border-white/5 bg-[#18181B]">
          <ModalTitle className="text-3xl font-black tracking-tight text-[#F5F5F5]">Nuevo Contacto</ModalTitle>
          <p className="text-xs font-bold text-[#A3A3A3] uppercase tracking-widest mt-1">Crea un nuevo registro en tu base de datos</p>
        </ModalHeader>
        <ModalContent className="p-8 space-y-10 bg-[#0F0F0F]">
          <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
             <div className="w-32 h-32 rounded-[2rem] bg-[#18181B] border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-[#737373] hover:border-[#8B5CF6]/40 hover:text-[#8B5CF6] cursor-pointer transition-all duration-500 group/avatar overflow-hidden relative">
                <Icon name="User" size={48} strokeWidth={1} className="group-hover/avatar:scale-110 transition-transform duration-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] mt-3">Subir</span>
                <div className="absolute inset-0 bg-[#8B5CF6]/5 opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
             </div>
             <div className="flex-1 space-y-8 w-full">
                <Input
                  label="NOMBRE COMPLETO"
                  placeholder="Ej: María López"
                  value={newContactForm.name}
                  onChange={(e) => setNewContactForm(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-[#18181B] border-white/5 focus:border-[#8B5CF6]/50 transition-all rounded-[1.25rem] h-14"
                />
                <Input
                  label="EMAIL CORPORATIVO"
                  type="email"
                  placeholder="maria@empresa.com"
                  value={newContactForm.email}
                  onChange={(e) => setNewContactForm(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-[#18181B] border-white/5 focus:border-[#8B5CF6]/50 transition-all rounded-[1.25rem] h-14"
                  icon={<Mail size={18} className="text-[#A3A3A3]" />}
                />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-[0.25em] ml-1">TELÉFONO MÓVIL</label>
              <Input
                placeholder="+54 11 ..."
                value={newContactForm.phone}
                onChange={(e) => setNewContactForm(prev => ({ ...prev, phone: e.target.value }))}
                className="bg-[#18181B] border-white/5 focus:border-[#8B5CF6]/50 transition-all rounded-[1.25rem] h-14"
                icon={<Phone size={18} className="text-[#A3A3A3]" />}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-[0.25em] ml-1">NIVEL / ESTADO</label>
              <div className="relative group">
                <select
                  className="w-full h-14 px-6 rounded-[1.25rem] border border-white/5 bg-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 text-sm transition-all text-[#F5F5F5] appearance-none cursor-pointer hover:border-white/10"
                  value={newContactForm.status}
                  onChange={(e) => setNewContactForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="lead">Prospecto (Lead)</option>
                  <option value="prospect">Oportunidad</option>
                  <option value="active">Cliente Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#737373] group-hover:text-[#8B5CF6] transition-colors">
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
            className="bg-[#18181B] border-white/5 focus:border-[#8B5CF6]/50 transition-all rounded-[1.25rem] h-14"
            icon={<Building2 size={18} className="text-[#A3A3A3]" />}
          />
        </ModalContent>
        <ModalFooter className="p-8 border-t border-white/5 bg-[#18181B] gap-6">
          <Button variant="ghost" onClick={() => setShowNewContactModal(false)} className="rounded-[1rem] px-8 h-12 text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 transition-all duration-300 font-bold uppercase tracking-widest text-[10px]">
            Descartar
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleCreateContact}
            disabled={createContactMutation.isPending || !newContactForm.name || !newContactForm.email}
            className="px-12 h-14 font-black uppercase tracking-widest text-[12px] shadow-[0_0_20px_rgba(139,92,246,0.3)] bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-[1rem] transition-all duration-500"
          >
            {createContactMutation.isPending ? "Validando..." : "Guardar Registro"}
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
}
