// ============================================================
// MaatWork CRM — Audit Logs Page (Admin only)
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { Filter, Search, Shield } from "lucide-react";

export const Route = createFileRoute("/_app/settings/audit")({
  component: AuditLogsPage,
});

const DEMO_LOGS = [
  {
    id: "1",
    user: "Carlos Admin",
    action: "create",
    entity: "organization",
    description: "Organización creada: MaatWork Demo",
    time: "2026-03-01 09:00",
  },
  {
    id: "2",
    user: "Ana García",
    action: "create",
    entity: "contact",
    description: "Contacto creado: María López",
    time: "2026-03-01 10:30",
  },
  {
    id: "3",
    user: "Pedro Ruiz",
    action: "create",
    entity: "contact",
    description: "Contacto creado: Lucía Fernández",
    time: "2026-03-02 11:15",
  },
  {
    id: "4",
    user: "Ana García",
    action: "update",
    entity: "deal",
    description: "Deal movido a etapa: Reunión",
    time: "2026-03-03 14:00",
  },
  {
    id: "5",
    user: "Carlos Admin",
    action: "update",
    entity: "team_goal",
    description: "Meta actualizada: $50k nuevos clientes (60%)",
    time: "2026-03-03 16:30",
  },
  {
    id: "6",
    user: "Pedro Ruiz",
    action: "create",
    entity: "task",
    description: "Tarea creada: Enviar material a Lucía",
    time: "2026-03-04 09:00",
  },
  {
    id: "7",
    user: "Ana García",
    action: "update",
    entity: "contact",
    description: "Contacto actualizado: María López (status → active)",
    time: "2026-03-04 10:45",
  },
  {
    id: "8",
    user: "Carlos Admin",
    action: "export",
    entity: "report",
    description: "Reporte exportado: Pipeline Marzo 2026",
    time: "2026-03-04 15:00",
  },
];

const actionColors: Record<string, string> = {
  create: "bg-emerald-500/15 text-emerald-400",
  update: "bg-blue-500/15 text-blue-400",
  delete: "bg-red-500/15 text-red-400",
  export: "bg-amber-500/15 text-amber-400",
  login: "bg-violet-500/15 text-violet-400",
};

function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-brand-400" /> Auditoría
          </h1>
          <p className="text-surface-400 mt-1">Registro completo de acciones del sistema</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          type="text"
          placeholder="Buscar en logs..."
          className="w-full pl-10 pr-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-surface-200 placeholder:text-surface-500 focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* Logs Table */}
      <div className="glass-card overflow-hidden animate-fade-in">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-700">
              <th className="text-left text-xs text-surface-400 font-semibold p-4 uppercase tracking-wider">Fecha</th>
              <th className="text-left text-xs text-surface-400 font-semibold p-4 uppercase tracking-wider">Usuario</th>
              <th className="text-left text-xs text-surface-400 font-semibold p-4 uppercase tracking-wider">Acción</th>
              <th className="text-left text-xs text-surface-400 font-semibold p-4 uppercase tracking-wider">Entidad</th>
              <th className="text-left text-xs text-surface-400 font-semibold p-4 uppercase tracking-wider">
                Descripción
              </th>
            </tr>
          </thead>
          <tbody>
            {DEMO_LOGS.map((log) => (
              <tr key={log.id} className="border-b border-surface-800/50 hover:bg-surface-800/30 transition-colors">
                <td className="p-4 text-xs text-surface-400 whitespace-nowrap">{log.time}</td>
                <td className="p-4">
                  <span className="text-sm text-white font-medium">{log.user}</span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${actionColors[log.action] ?? ""}`}>
                    {log.action}
                  </span>
                </td>
                <td className="p-4 text-sm text-surface-300">{log.entity}</td>
                <td className="p-4 text-sm text-surface-400">{log.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
