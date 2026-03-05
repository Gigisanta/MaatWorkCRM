// ============================================================
// MaatWork CRM — Contacts List Page
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Plus, Phone, Mail, MoreVertical, X } from "lucide-react";

export const Route = createFileRoute("/_app/contacts/")({
  component: ContactsPage,
});

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "lead" | "prospect" | "active" | "inactive";
  tags: string[];
  segment: string;
};

const INITIAL_CONTACTS: Contact[] = [
  { id: "1", name: "María López", email: "maria.lopez@email.com", phone: "+54 11 5555-0001", company: "López & Asociados", status: "active", tags: ["VIP", "referido"], segment: "Premium" },
  { id: "2", name: "Juan Martínez", email: "juan.martinez@email.com", phone: "+54 11 5555-0002", company: "Inversiones JM", status: "prospect", tags: ["nuevo"], segment: "Estándar" },
  { id: "3", name: "Lucía Fernández", email: "lucia.f@email.com", phone: "+54 11 5555-0003", company: "", status: "lead", tags: ["evento-2026"], segment: "" },
  { id: "4", name: "Roberto Sánchez", email: "roberto.s@email.com", phone: "+54 11 5555-0004", company: "Sánchez Corp", status: "active", tags: ["empresarial"], segment: "Corporativo" },
  { id: "5", name: "Elena Torres", email: "elena.t@email.com", phone: "+54 11 5555-0005", company: "", status: "inactive", tags: [], segment: "" },
];

const statusColors: Record<string, string> = {
  lead: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  prospect: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  inactive: "bg-surface-500/20 text-surface-400 border-surface-500/30",
};

const statusLabels: Record<string, string> = {
  lead: "Lead",
  prospect: "Prospecto",
  active: "Activo",
  inactive: "Inactivo",
};

function NewContactModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (contact: Contact) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "lead" as Contact["status"],
    tags: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("El nombre es obligatorio"); return; }
    if (!form.email.trim()) { setError("El email es obligatorio"); return; }

    const newContact: Contact = {
      id: `c${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      company: form.company.trim(),
      status: form.status,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      segment: "",
    };
    onSave(newContact);
    setForm({ name: "", email: "", phone: "", company: "", status: "lead", tags: "" });
    setError("");
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div className="glass-card w-full max-w-md mx-4 p-6 animate-fade-in" style={{ borderRadius: "1rem" }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Nuevo Contacto</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-700 rounded-lg text-surface-400 hover:text-white transition-colors" type="button">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Nombre *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: María López" className="w-full px-3 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-surface-200 placeholder:text-surface-500 focus:outline-none focus:border-brand-500 transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="maria@email.com" className="w-full px-3 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-surface-200 placeholder:text-surface-500 focus:outline-none focus:border-brand-500 transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Teléfono</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+54 11 ..." className="w-full px-3 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-surface-200 placeholder:text-surface-500 focus:outline-none focus:border-brand-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Estado</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Contact["status"] }))} className="w-full px-3 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-surface-200 focus:outline-none focus:border-brand-500 transition-colors">
                <option value="lead">Lead</option>
                <option value="prospect">Prospecto</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Empresa</label>
            <input type="text" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Nombre de la empresa" className="w-full px-3 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-surface-200 placeholder:text-surface-500 focus:outline-none focus:border-brand-500 transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Etiquetas (separadas por coma)</label>
            <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="VIP, referido, ..." className="w-full px-3 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-surface-200 placeholder:text-surface-500 focus:outline-none focus:border-brand-500 transition-colors" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-surface-800 hover:bg-surface-700 text-surface-300 rounded-lg font-medium transition-colors border border-surface-700">Cancelar</button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors">Guardar Contacto</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showModal, setShowModal] = useState(false);

  const filtered = contacts.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !filterStatus || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const addContact = (contact: Contact) => {
    setContacts(prev => [contact, ...prev]);
  };

  return (
    <div className="space-y-6">
      <NewContactModal open={showModal} onClose={() => setShowModal(false)} onSave={addContact} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Contactos</h1>
          <p className="text-surface-400 mt-1">{contacts.length} contactos en total</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Nuevo Contacto
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input type="text" placeholder="Buscar por nombre o email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-surface-200 placeholder:text-surface-500 focus:outline-none focus:border-brand-500 transition-colors" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["", "lead", "prospect", "active", "inactive"].map((status) => (
            <button key={status} onClick={() => setFilterStatus(status)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === status ? "bg-brand-600 text-white" : "bg-surface-800 text-surface-400 hover:text-surface-200 border border-surface-700"}`}>
              {status ? statusLabels[status] : "Todos"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-surface-400">No se encontraron contactos</p>
            <button onClick={() => setShowModal(true)} className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors">
              Agregar primer contacto
            </button>
          </div>
        ) : (
          filtered.map((contact) => (
            <div key={contact.id} className="glass-card p-4 flex items-center gap-4 hover:border-brand-600/30 transition-all cursor-pointer animate-fade-in">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {contact.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white truncate">{contact.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[contact.status]}`}>{statusLabels[contact.status]}</span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  {contact.company && <span className="text-sm text-surface-400">{contact.company}</span>}
                  <span className="flex items-center gap-1 text-sm text-surface-500"><Mail className="w-3 h-3" /> {contact.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {contact.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded bg-surface-800 text-xs text-surface-300 border border-surface-700">{tag}</span>
                ))}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button className="p-2 hover:bg-surface-800 rounded-lg transition-colors text-surface-400 hover:text-surface-200"><Phone className="w-4 h-4" /></button>
                <button className="p-2 hover:bg-surface-800 rounded-lg transition-colors text-surface-400 hover:text-surface-200"><Mail className="w-4 h-4" /></button>
                <button className="p-2 hover:bg-surface-800 rounded-lg transition-colors text-surface-400 hover:text-surface-200"><MoreVertical className="w-4 h-4" /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
