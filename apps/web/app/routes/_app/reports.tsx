// ============================================================
// MaatWork CRM — Reports & Analytics Page
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Download, PieChart, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const pipelineData = [
    { stage: "Prospecto", count: 1, value: 50000, color: "#6366f1" },
    { stage: "Contactado", count: 0, value: 0, color: "#8b5cf6" },
    { stage: "Reunión", count: 1, value: 80000, color: "#f59e0b" },
    { stage: "Propuesta", count: 1, value: 300000, color: "#3b82f6" },
    { stage: "Activo", count: 1, value: 150000, color: "#10b981" },
  ];

  const metrics = [
    { label: "Contactos Nuevos (Mar)", value: "3", change: "+50%", up: true },
    { label: "Deals Cerrados", value: "1", change: "+100%", up: true },
    { label: "Tasa de Conversión", value: "25%", change: "-5%", up: false },
    { label: "Tareas Completadas", value: "12", change: "+20%", up: true },
  ];

  const maxValue = Math.max(...pipelineData.map((d) => d.value));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-display tracking-tight">Reportes</h1>
          <p className="text-surface-400 mt-1">Métricas y análisis — Marzo 2026</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-surface-800 hover:bg-surface-700 text-surface-200 rounded-lg font-medium transition-colors border border-surface-700">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="glass-card p-5 animate-fade-in">
            <p className="text-sm text-surface-400">{m.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{m.value}</p>
            <p className={`text-sm mt-1 ${m.up ? "text-emerald-400" : "text-red-400"}`}>{m.change} vs feb</p>
          </div>
        ))}
      </div>

      {/* Pipeline Chart - Bar */}
      <div className="glass-card p-6 animate-fade-in">
        <h2 className="text-lg font-semibold text-white font-display tracking-tight mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-400" /> Pipeline por Etapa (Valor)
        </h2>
        <div className="space-y-4">
          {pipelineData.map((d) => (
            <div key={d.stage} className="flex items-center gap-4">
              <span className="w-24 text-sm text-surface-300 text-right shrink-0">{d.stage}</span>
              <div className="flex-1 h-8 rounded bg-surface-800 overflow-hidden relative">
                <div
                  className="h-full rounded transition-all duration-700 flex items-center px-3"
                  style={{
                    width: maxValue ? `${(d.value / maxValue) * 100}%` : "0%",
                    backgroundColor: d.color,
                    minWidth: d.value > 0 ? "60px" : "0",
                  }}
                >
                  {d.value > 0 && (
                    <span className="text-xs text-white font-medium whitespace-nowrap">
                      ${(d.value / 1000).toFixed(0)}k
                    </span>
                  )}
                </div>
              </div>
              <span className="w-8 text-sm text-surface-400 text-center">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="glass-card p-6 animate-fade-in">
        <h2 className="text-lg font-semibold text-white font-display tracking-tight mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" /> Tendencia Mensual
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {["Enero", "Febrero", "Marzo"].map((month, i) => (
            <div key={month} className="text-center p-4 rounded-lg bg-surface-800/50 border border-surface-700/30">
              <p className="text-sm text-surface-400">{month}</p>
              <p className="text-2xl font-bold text-white mt-1">{[3, 4, 5][i]}</p>
              <p className="text-xs text-surface-500">clientes nuevos</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
