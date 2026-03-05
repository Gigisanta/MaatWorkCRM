// ============================================================
// MaatWork CRM — Tasks Page
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Check, Clock, AlertTriangle, Filter, Calendar } from "lucide-react";

export const Route = createFileRoute("/_app/tasks")({
  component: TasksPage,
});

const DEMO_TASKS = [
  { id: "1", title: "Llamar a María López – seguimiento mensual", status: "pending", priority: "high", dueDate: "2026-03-04", assignee: "Ana García", contact: "María López", isRecurrent: true },
  { id: "2", title: "Preparar propuesta para Juan Martínez", status: "in_progress", priority: "medium", dueDate: "2026-03-11", assignee: "Ana García", contact: "Juan Martínez", isRecurrent: false },
  { id: "3", title: "Enviar material informativo a Lucía", status: "pending", priority: "low", dueDate: "2026-03-03", assignee: "Pedro Ruiz", contact: "Lucía Fernández", isRecurrent: false },
  { id: "4", title: "Reunión equipo semanal", status: "pending", priority: "medium", dueDate: "2026-03-11", assignee: "Carlos Admin", contact: "", isRecurrent: true },
  { id: "5", title: "Revisar documentación Roberto Sánchez", status: "completed", priority: "high", dueDate: "2026-03-01", assignee: "Pedro Ruiz", contact: "Roberto Sánchez", isRecurrent: false },
];

const priorityConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  urgent: { label: "Urgente", color: "text-red-400 bg-red-500/15 border-red-500/30", icon: AlertTriangle },
  high: { label: "Alta", color: "text-amber-400 bg-amber-500/15 border-amber-500/30", icon: AlertTriangle },
  medium: { label: "Media", color: "text-blue-400 bg-blue-500/15 border-blue-500/30", icon: Clock },
  low: { label: "Baja", color: "text-surface-400 bg-surface-500/15 border-surface-500/30", icon: Clock },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-amber-500" },
  in_progress: { label: "En Progreso", color: "bg-blue-500" },
  completed: { label: "Completada", color: "bg-emerald-500" },
  cancelled: { label: "Cancelada", color: "bg-surface-500" },
};

function TasksPage() {
  const [filter, setFilter] = useState<string>("");

  const filtered = DEMO_TASKS.filter((t) => !filter || t.status === filter);
  const isOverdue = (date: string) => new Date(date) < new Date() && date;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Tareas</h1>
          <p className="text-surface-400 mt-1">{DEMO_TASKS.length} tareas — {DEMO_TASKS.filter((t) => t.status === "pending").length} pendientes</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Nueva Tarea
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["", "pending", "in_progress", "completed"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === status
                ? "bg-brand-600 text-white"
                : "bg-surface-800 text-surface-400 hover:text-surface-200 border border-surface-700"
            }`}
          >
            {status ? statusConfig[status].label : "Todas"}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filtered.map((task) => {
          const priority = priorityConfig[task.priority];
          const status = statusConfig[task.status];
          const overdue = task.status !== "completed" && isOverdue(task.dueDate);

          return (
            <div key={task.id} className="glass-card p-4 flex items-center gap-4 animate-fade-in hover:border-brand-600/30 transition-all">
              {/* Checkbox */}
              <button className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                task.status === "completed"
                  ? "bg-emerald-500 border-emerald-500"
                  : "border-surface-600 hover:border-brand-500"
              }`}>
                {task.status === "completed" && <Check className="w-3 h-3 text-white" />}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${task.status === "completed" ? "text-surface-500 line-through" : "text-white"}`}>
                  {task.title}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  {task.contact && (
                    <span className="text-xs text-surface-400">👤 {task.contact}</span>
                  )}
                  <span className="text-xs text-surface-400">→ {task.assignee}</span>
                  {task.isRecurrent && (
                    <span className="text-xs text-brand-400">🔄 Recurrente</span>
                  )}
                </div>
              </div>

              {/* Priority */}
              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${priority.color}`}>
                {priority.label}
              </span>

              {/* Due date */}
              <div className={`flex items-center gap-1 text-xs shrink-0 ${overdue ? "text-red-400" : "text-surface-400"}`}>
                <Calendar className="w-3 h-3" />
                {new Date(task.dueDate).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                {overdue && <span className="text-red-400 font-medium ml-1">Vencida</span>}
              </div>

              {/* Status dot */}
              <div className={`w-2 h-2 rounded-full ${status.color} shrink-0`} title={status.label} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
