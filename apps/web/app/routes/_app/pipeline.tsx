// ============================================================
// MaatWork CRM — Pipeline Kanban Board
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, DollarSign, User, MoreVertical, X } from "lucide-react";

export const Route = createFileRoute("/_app/pipeline")({
  component: PipelinePage,
});

type Deal = {
  id: string;
  title: string;
  contactName: string;
  value: number;
  probability: number;
  stageId: string;
};

type Stage = {
  id: string;
  name: string;
  color: string;
  order: number;
};

const STAGES: Stage[] = [
  { id: "stage_01", name: "Prospecto", color: "#6366f1", order: 0 },
  { id: "stage_02", name: "Contactado", color: "#8b5cf6", order: 1 },
  { id: "stage_03", name: "Reunión", color: "#f59e0b", order: 2 },
  { id: "stage_04", name: "Propuesta", color: "#3b82f6", order: 3 },
  { id: "stage_05", name: "Activo", color: "#10b981", order: 4 },
];

const INITIAL_DEALS: Deal[] = [
  { id: "d1", title: "Plan integral María López", contactName: "María López", value: 150000, probability: 100, stageId: "stage_05" },
  { id: "d2", title: "Asesoría Juan Martínez", contactName: "Juan Martínez", value: 80000, probability: 60, stageId: "stage_03" },
  { id: "d3", title: "Consulta inicial Lucía", contactName: "Lucía Fernández", value: 50000, probability: 20, stageId: "stage_01" },
  { id: "d4", title: "Plan corporativo Sánchez", contactName: "Roberto Sánchez", value: 300000, probability: 75, stageId: "stage_04" },
];

// ── New Deal Modal ────────────────────────────────────────────
function NewDealModal({
  open,
  initialStage,
  onClose,
  onSave,
}: {
  open: boolean;
  initialStage: string;
  onClose: () => void;
  onSave: (deal: Deal) => void;
}) {
  const [form, setForm] = useState({
    title: "",
    contactName: "",
    value: "",
    probability: "50",
    stageId: initialStage,
  });
  const [error, setError] = useState("");

  // sync stage when opening from a column button
  const handleOpen = () => {
    setForm(f => ({ ...f, stageId: initialStage }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("El título es obligatorio"); return; }
    if (!form.contactName.trim()) { setError("El contacto es obligatorio"); return; }
    onSave({
      id: `d${Date.now()}`,
      title: form.title.trim(),
      contactName: form.contactName.trim(),
      value: Number(form.value) || 0,
      probability: Math.min(100, Math.max(0, Number(form.probability) || 0)),
      stageId: form.stageId,
    });
    setForm({ title: "", contactName: "", value: "", probability: "50", stageId: initialStage });
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
          <h2 className="text-xl font-bold text-white">Nuevo Deal</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-700 rounded-lg text-surface-400 hover:text-white transition-colors" type="button">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Título del deal *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ej: Plan financiero completo"
              className="w-full px-3 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-surface-200 placeholder:text-surface-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Contacto *</label>
            <input
              type="text"
              value={form.contactName}
              onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
              placeholder="Nombre del cliente"
              className="w-full px-3 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-surface-200 placeholder:text-surface-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Valor ($)</label>
              <input
                type="number"
                min="0"
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                placeholder="0"
                className="w-full px-3 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-surface-200 placeholder:text-surface-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Probabilidad (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.probability}
                onChange={e => setForm(f => ({ ...f, probability: e.target.value }))}
                className="w-full px-3 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-surface-200 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Etapa</label>
            <select
              value={form.stageId}
              onChange={e => setForm(f => ({ ...f, stageId: e.target.value }))}
              className="w-full px-3 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-surface-200 focus:outline-none focus:border-brand-500 transition-colors"
            >
              {STAGES.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-surface-800 hover:bg-surface-700 text-surface-300 rounded-lg font-medium transition-colors border border-surface-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors"
            >
              Crear Deal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalStage, setModalStage] = useState("stage_01");

  const openModal = (stageId = "stage_01") => {
    setModalStage(stageId);
    setShowModal(true);
  };

  const handleDragStart = (dealId: string) => setDraggedDeal(dealId);

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => setDragOverStage(null);

  const handleDrop = (stageId: string) => {
    if (draggedDeal) {
      setDeals(prev => prev.map(d => (d.id === draggedDeal ? { ...d, stageId } : d)));
    }
    setDraggedDeal(null);
    setDragOverStage(null);
  };

  const formatValue = (v: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(v);

  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-6">
      <NewDealModal
        open={showModal}
        initialStage={modalStage}
        onClose={() => setShowModal(false)}
        onSave={deal => setDeals(prev => [...prev, deal])}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Pipeline</h1>
          <p className="text-surface-400 mt-1">
            {deals.length} deals — Valor total: {formatValue(totalValue)}
          </p>
        </div>
        <button
          onClick={() => openModal("stage_01")}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Deal
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter(d => d.stageId === stage.id);
          const stageValue = stageDeals.reduce((s, d) => s + d.value, 0);

          return (
            <div
              key={stage.id}
              className={`flex-shrink-0 w-72 kanban-column rounded-xl ${dragOverStage === stage.id ? "drag-over" : ""}`}
              onDragOver={e => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(stage.id)}
            >
              {/* Stage header */}
              <div className="flex items-center gap-2 p-3 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                <h3 className="font-semibold text-white text-sm">{stage.name}</h3>
                <span className="ml-auto text-xs text-surface-400 bg-surface-800 px-2 py-0.5 rounded-full">
                  {stageDeals.length}
                </span>
              </div>

              {/* Stage value */}
              <div className="px-3 mb-3">
                <p className="text-xs text-surface-500">{formatValue(stageValue)}</p>
              </div>

              {/* Deal cards */}
              <div className="space-y-2 px-2 min-h-[100px]">
                {stageDeals.map(deal => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={() => handleDragStart(deal.id)}
                    className={`kanban-card glass-card p-4 cursor-grab active:cursor-grabbing ${draggedDeal === deal.id ? "dragging" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">{deal.title}</p>
                        <div className="flex items-center gap-1 mt-1.5 text-surface-400">
                          <User className="w-3 h-3" />
                          <span className="text-xs">{deal.contactName}</span>
                        </div>
                      </div>
                      <button className="p-1 hover:bg-surface-700 rounded text-surface-500">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-700/50">
                      <div className="flex items-center gap-1 text-emerald-400">
                        <DollarSign className="w-3 h-3" />
                        <span className="text-xs font-medium">{formatValue(deal.value)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-12 h-1.5 rounded-full bg-surface-700 overflow-hidden">
                          <div className="h-full rounded-full bg-brand-500" style={{ width: `${deal.probability}%` }} />
                        </div>
                        <span className="text-xs text-surface-500">{deal.probability}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add deal button */}
              <button
                onClick={() => openModal(stage.id)}
                className="w-full mt-2 p-2 text-surface-500 hover:text-surface-300 hover:bg-surface-800/50 rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
