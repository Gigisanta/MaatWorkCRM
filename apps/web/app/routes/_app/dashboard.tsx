// ============================================================
// MaatWork CRM — Dashboard Page
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import {
  Users, TrendingUp, CheckSquare, Target, ArrowUpRight,
  ArrowDownRight, Clock, DollarSign,
} from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

// ── Stat Card ────────────────────────────────────────────────
function StatCard({
  label, value, change, changeType, icon: Icon, color,
}: {
  label: string;
  value: string;
  change?: string;
  changeType?: "up" | "down";
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-surface-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {change && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${changeType === "up" ? "text-emerald-400" : "text-red-400"}`}>
              {changeType === "up" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

// ── Quick Action ─────────────────────────────────────────────
function QuickAction({ label, icon: Icon, to }: { label: string; icon: React.ElementType; to: string }) {
  return (
    <a
      href={to}
      className="flex items-center gap-3 p-3 rounded-lg bg-surface-800/50 hover:bg-surface-800 border border-surface-700/50 transition-all hover:border-brand-600/30"
    >
      <Icon className="w-5 h-5 text-brand-400" />
      <span className="text-sm text-surface-200">{label}</span>
    </a>
  );
}

// ── Activity Item ────────────────────────────────────────────
function ActivityItem({ action, entity, user, time }: { action: string; entity: string; user: string; time: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-surface-800/50 last:border-0">
      <div className="w-8 h-8 rounded-full bg-brand-600/20 flex items-center justify-center text-brand-400 text-xs font-bold mt-0.5">
        {user.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-surface-200">
          <span className="font-medium text-white">{user}</span> {action}{" "}
          <span className="font-medium text-brand-400">{entity}</span>
        </p>
        <p className="text-xs text-surface-500 mt-0.5">{time}</p>
      </div>
    </div>
  );
}

function DashboardPage() {
  // Demo data — in production, fetched via TanStack Query + server functions
  const metrics = {
    totalContacts: 5,
    activeContacts: 2,
    totalDeals: 4,
    pipelineValue: 580000,
    pendingTasks: 3,
    completedTasks: 12,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-surface-400 mt-1">Vista general de tu actividad — Marzo 2026</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Contactos"
          value={String(metrics.totalContacts)}
          change="+2 este mes"
          changeType="up"
          icon={Users}
          color="bg-brand-600"
        />
        <StatCard
          label="Valor Pipeline"
          value={`$${(metrics.pipelineValue / 1000).toFixed(0)}k`}
          change="+15% vs feb"
          changeType="up"
          icon={DollarSign}
          color="bg-emerald-600"
        />
        <StatCard
          label="Tareas Pendientes"
          value={String(metrics.pendingTasks)}
          change="1 vencida"
          changeType="down"
          icon={CheckSquare}
          color="bg-amber-600"
        />
        <StatCard
          label="Meta Equipo"
          value="60%"
          change="$30k / $50k"
          changeType="up"
          icon={Target}
          color="bg-violet-600"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="glass-card p-6 animate-fade-in">
          <h2 className="text-lg font-semibold text-white mb-4">Acciones Rápidas</h2>
          <div className="space-y-2">
            <QuickAction label="Nuevo Contacto" icon={Users} to="/contacts" />
            <QuickAction label="Crear Tarea" icon={CheckSquare} to="/tasks" />
            <QuickAction label="Ver Pipeline" icon={TrendingUp} to="/pipeline" />
            <QuickAction label="Agendar Reunión" icon={Clock} to="/calendar" />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-6 lg:col-span-2 animate-fade-in">
          <h2 className="text-lg font-semibold text-white mb-4">Actividad Reciente</h2>
          <div>
            <ActivityItem
              user="Ana García"
              action="movió deal a"
              entity="Propuesta"
              time="Hace 15 min"
            />
            <ActivityItem
              user="Pedro Ruiz"
              action="creó contacto"
              entity="Lucía Fernández"
              time="Hace 1 hora"
            />
            <ActivityItem
              user="Ana García"
              action="completó tarea"
              entity="Seguimiento mensual"
              time="Hace 2 horas"
            />
            <ActivityItem
              user="Carlos Admin"
              action="actualizó meta"
              entity="$50k nuevos clientes"
              time="Ayer"
            />
            <ActivityItem
              user="Pedro Ruiz"
              action="agendó reunión con"
              entity="Roberto Sánchez"
              time="Ayer"
            />
          </div>
        </div>
      </div>

      {/* Pipeline Summary */}
      <div className="glass-card p-6 animate-fade-in">
        <h2 className="text-lg font-semibold text-white mb-4">Pipeline por Etapa</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { stage: "Prospecto", count: 1, value: "$50k", color: "bg-indigo-500" },
            { stage: "Contactado", count: 0, value: "$0", color: "bg-violet-500" },
            { stage: "Reunión", count: 1, value: "$80k", color: "bg-amber-500" },
            { stage: "Propuesta", count: 1, value: "$300k", color: "bg-blue-500" },
            { stage: "Activo", count: 1, value: "$150k", color: "bg-emerald-500" },
          ].map((s) => (
            <div key={s.stage} className="text-center p-4 rounded-lg bg-surface-800/50 border border-surface-700/30">
              <div className={`w-3 h-3 rounded-full ${s.color} mx-auto mb-2`} />
              <p className="text-sm font-medium text-surface-200">{s.stage}</p>
              <p className="text-2xl font-bold text-white mt-1">{s.count}</p>
              <p className="text-xs text-surface-400">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
