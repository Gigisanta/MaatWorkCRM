// ============================================================
// MaatWork CRM — Contacts Page
// UI/UX REFINED BY JULES v2
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  Check,
  ChevronDown,
  Mail,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import React, { useState } from "react";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { EmptyState } from "~/components/ui/EmptyState";
import { Input } from "~/components/ui/Input";
import { Container } from "~/components/ui/Layout";
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "~/components/ui/Modal";
import { DataTable } from "~/components/ui/Table";
import {
  useContacts,
  useCreateContactMutation,
  useDeleteContactMutation,
  useUpdateContactMutation,
} from "~/lib/hooks/use-crm";
import { cn } from "~/lib/utils";

export const Route = createFileRoute("/_app/contacts/")({
  component: ContactsPage,
});

const statusColors: Record<string, string> = {
  lead: "text-primary bg-primary/10 border-primary/20",
  prospect: "text-accent bg-accent/10 border-accent/20",
  active: "text-success bg-success/10 border-success/20",
  inactive: "text-text-muted bg-surface-hover border-border",
};

const statusLabels: Record<string, string> = {
  lead: "Lead",
  prospect: "Prospect",
  active: "Active",
  inactive: "Inactive",
};

function ContactsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const {
    data: contacts,
    isLoading,
    error,
  } = useContacts({
    search: search || undefined,
    status: statusFilter,
  });

  const createContactMutation = useCreateContactMutation();

  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [newContactForm, setNewContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "lead",
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
      header: "Contact",
      cell: (info: any) => {
        const contact = info.row.original;
        return (
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center text-text font-bold text-lg border border-border/50 shadow-inner">
                {contact.name.charAt(0)}
              </div>
              {contact.status === "active" && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-success border-2 border-background flex items-center justify-center shadow-sm">
                  <Check size={8} className="text-background" strokeWidth={4} />
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-text">{contact.name}</p>
              <p className="text-xs text-text-muted">{contact.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "company",
      header: "Company",
      cell: (info: any) => {
        const val = info.getValue();
        return val ? (
          <span className="flex items-center gap-2 text-sm text-text-secondary">
            <Building2 size={14} className="text-primary/70" />
            {val}
          </span>
        ) : (
          <span className="text-text-muted">-</span>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: (info: any) => {
        const val = info.getValue();
        return val ? (
          <span className="flex items-center gap-2 text-sm text-text-secondary">
            <Phone size={14} className="text-primary/70" />
            {val}
          </span>
        ) : (
          <span className="text-text-muted">-</span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (info: any) => {
        const status = info.getValue();
        return (
          <Badge
            className={cn(
              "px-2.5 py-0.5 font-bold text-[10px] uppercase tracking-wider rounded-md",
              statusColors[status],
            )}
          >
            {statusLabels[status]}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: () => (
        <div className="flex justify-end pr-4">
          <button className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
            <MoreVertical size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (isLoading && !contacts) {
    return (
      <Container className="py-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </Container>
    );
  }

  return (
    <Container size="full" className="py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2"
      >
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold text-text leading-tight tracking-tight font-display">Contacts Directory</h1>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(139,92,246,0.6)] animate-pulse" />
            {contacts?.length || 0} Records <span className="opacity-30">•</span>{" "}
            {contacts?.filter((c: any) => c.status === "active").length || 0} Active Clients
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-10 px-4 border-border bg-surface text-text-secondary hover:text-primary hover:bg-surface-hover hover:border-border-hover transition-all"
          >
            <Sparkles className="w-4 h-4 mr-2 text-accent" />
            Find Similar (AI)
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowNewContactModal(true)}
            className="shadow-[0_0_15px_rgba(139,92,246,0.2)] hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] rounded-xl h-10 px-5 font-semibold text-sm group bg-primary hover:bg-primary-hover transition-all"
          >
            <Plus
              className="mr-2 group-hover:rotate-90 transition-transform duration-300"
              size={16}
              strokeWidth={2.5}
            />
            New Contact
          </Button>
        </div>
      </motion.div>

      {/* Filters & Actions bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center justify-between gap-6 bg-surface p-2.5 rounded-2xl border border-border shadow-sm"
      >
        <div className="flex-1 min-w-[300px] relative group h-10">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors duration-300"
            size={18}
            strokeWidth={2}
          />
          <input
            type="text"
            placeholder="Search by name, email or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 h-full bg-surface-hover border border-transparent rounded-xl focus:border-primary/30 focus:bg-surface focus:outline-none text-sm font-medium placeholder:text-text-muted transition-all shadow-inner text-text"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-surface-hover rounded-xl border border-border/50 shadow-inner">
          {[
            { id: undefined, label: "All" },
            { id: "lead", label: "Leads" },
            { id: "prospect", label: "Prospects" },
            { id: "active", label: "Active" },
            { id: "inactive", label: "Inactive" },
          ].map((f) => (
            <Button
              key={f.id || "all"}
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter(f.id)}
              className={cn(
                "rounded-lg px-4 h-8 font-semibold text-xs transition-all duration-200",
                statusFilter === f.id
                  ? "bg-surface text-text shadow-sm border border-border/50"
                  : f.id === undefined
                    ? "text-text-secondary hover:text-text hover:bg-surface/50"
                    : "text-text-muted hover:text-primary hover:bg-surface/50",
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
            title="Operational Error"
            description="There was a problem retrieving the records."
            icon={<AlertTriangle className="text-error" size={40} />}
          />
        ) : contacts?.length === 0 ? (
          <EmptyState
            title="No results found"
            description="No active records found for this filter."
            icon={<Users className="text-primary/30" size={40} />}
          />
        ) : (
          <div className="glass-card overflow-hidden">
            <DataTable columns={columns} data={contacts || []} />
          </div>
        )}
      </motion.div>

      {/* Modal */}
      <Modal open={showNewContactModal} onOpenChange={setShowNewContactModal}>
        <ModalHeader className="px-6 pt-6 pb-4 border-b border-border bg-surface">
          <ModalTitle className="text-xl font-bold tracking-tight text-text">New Contact</ModalTitle>
          <p className="text-xs font-medium text-text-muted mt-1">Create a new record in your database</p>
        </ModalHeader>
        <ModalContent className="p-6 space-y-8 bg-background">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="w-24 h-24 rounded-2xl bg-surface-hover border-2 border-dashed border-border flex flex-col items-center justify-center text-text-muted hover:border-primary/40 hover:text-primary cursor-pointer transition-all duration-300 group/avatar overflow-hidden relative">
              <User
                size={32}
                strokeWidth={1.5}
                className="group-hover/avatar:scale-110 transition-transform duration-300"
              />
              <span className="text-[10px] font-bold uppercase tracking-wider mt-2">Upload</span>
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
            </div>
            <div className="flex-1 space-y-5 w-full">
              <Input
                label="FULL NAME"
                placeholder="e.g. Jane Doe"
                value={newContactForm.name}
                onChange={(e) => setNewContactForm((prev) => ({ ...prev, name: e.target.value }))}
                className="bg-surface-hover border-border focus:border-primary/50 transition-all rounded-xl h-12"
              />
              <div className="relative">
                <Input
                  label="CORPORATE EMAIL"
                  type="email"
                  placeholder="jane@company.com"
                  value={newContactForm.email}
                  onChange={(e) => setNewContactForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="bg-surface-hover border-border focus:border-primary/50 transition-all rounded-xl h-12 pl-10"
                />
                <Mail size={16} className="text-text-muted absolute left-3 top-[38px]" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider ml-1">
                MOBILE PHONE
              </label>
              <div className="relative">
                <Input
                  placeholder="+1 234 ..."
                  value={newContactForm.phone}
                  onChange={(e) => setNewContactForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="bg-surface-hover border-border focus:border-primary/50 transition-all rounded-xl h-12 pl-10"
                />
                <Phone size={16} className="text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider ml-1">
                LEVEL / STATUS
              </label>
              <div className="relative group">
                <select
                  className="w-full h-12 px-4 rounded-xl border border-border bg-surface-hover focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 text-sm transition-all text-text appearance-none cursor-pointer hover:border-border-hover"
                  value={newContactForm.status}
                  onChange={(e) => setNewContactForm((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="lead">Prospect (Lead)</option>
                  <option value="prospect">Opportunity</option>
                  <option value="active">Active Client</option>
                  <option value="inactive">Inactive</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-primary transition-colors">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <Input
              label="ORGANIZATION / COMPANY"
              placeholder="e.g. Global Investments Inc."
              value={newContactForm.company}
              onChange={(e) => setNewContactForm((prev) => ({ ...prev, company: e.target.value }))}
              className="bg-surface-hover border-border focus:border-primary/50 transition-all rounded-xl h-12 pl-10"
            />
            <Building2 size={16} className="text-text-muted absolute left-3 top-[38px]" />
          </div>
        </ModalContent>
        <ModalFooter className="p-6 border-t border-border bg-surface gap-4">
          <Button
            variant="ghost"
            onClick={() => setShowNewContactModal(false)}
            className="rounded-xl px-6 h-10 text-text-secondary hover:text-text hover:bg-surface-hover transition-all duration-200 font-semibold text-sm"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleCreateContact}
            disabled={createContactMutation.isPending || !newContactForm.name || !newContactForm.email}
            className="px-8 h-10 font-semibold text-sm shadow-[0_0_15px_rgba(139,92,246,0.2)] bg-primary hover:bg-primary-hover rounded-xl transition-all duration-300"
          >
            {createContactMutation.isPending ? "Validating..." : "Save Record"}
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
}
