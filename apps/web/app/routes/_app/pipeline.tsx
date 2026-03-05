// ============================================================
// MaatWork CRM — Pipeline Kanban Board
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, GripVertical, DollarSign, User, MoreVertical } from "lucide-react";

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

function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const handleDragStart = (dealId: string) => {
    setDraggedDeal(dealId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (stageId: string) => {
    if (draggedDeal) {
      setDeals((prev) =>
        prev.map((d) => (d.id === draggedDeal ? { ...d, stageId } : d))
      );
    }
    setDraggedDeal(null);
    setDragOverStage(null);
  };

  const formatValue = (v: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(v);

  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Pipeline</h1>
          <p className="text-surface-400 mt-1">
            {deals.length} deals — Valor total: {formatValue(totalValue)}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Nuevo Deal
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stageId === stage.id);
          const stageValue = stageDeals.reduce((s, d) => s + d.value, 0);

          return (
            <div
              key={stage.id}
              className={`flex-shrink-0 w-72 kanban-column rounded-xl ${
                dragOverStage === stage.id ? "drag-over" : ""
              }`}
              onDragOver={(e) => handleDragOver(e, stage.id)}
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
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={() => handleDragStart(deal.id)}
                    className={`kanban-card glass-card p-4 cursor-grab active:cursor-grabbing ${
                      draggedDeal === deal.id ? "dragging" : ""
                    }`}
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
                          <div
                            className="h-full rounded-full bg-brand-500"
                            style={{ width: `${deal.probability}%` }}
                          />
                        </div>
                        <span className="text-xs text-surface-500">{deal.probability}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add deal button */}
              <button className="w-full mt-2 p-2 text-surface-500 hover:text-surface-300 hover:bg-surface-800/50 rounded-lg text-sm transition-colors flex items-center justify-center gap-1">
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
