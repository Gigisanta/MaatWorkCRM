// ============================================================
// MaatWork CRM — Dashboard Page
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import {
  Users, TrendingUp, CheckSquare, Target, ArrowUpRight,
  ArrowDownRight, Clock, DollarSign, Plus
} from "lucide-react";
import { useDashboardMetrics, useRecentActivity, usePipelineSummary, useUserTasks } from "~/lib/hooks/use-crm";
import { StatCard } from "~/components/ui/LayoutCards"; // I will create this as a combined helper or just use Card
import { Card } from "~/components/ui/Card";
import { Container, Grid, Stack } from "~/components/ui/Layout";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { formatCurrency } from "~/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

// ── Stat Card Component (Integrated with Card primitive) ──────
function DashboardStatCard({
  label, value, change, changeType, icon: Icon, variant = "brand",
}: {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "up" | "down";
  icon: React.ElementType;
  variant?: "brand" | "emerald" | "amber" | "violet";
}) {
  const colors = {
    brand: "bg-brand-600/20 text-brand-400",
    emerald: "bg-emerald-600/20 text-emerald-400",
    amber: "bg-amber-600/20 text-amber-400",
    violet: "bg-violet-600/20 text-violet-400",
  };

  return (
    <Card variant="glass" className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-surface-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
          {change && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${changeType === "up" ? "text-emerald-400" : "text-red-400"}`}>
              {changeType === "up" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colors[variant]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
}

// ── Quick Action ─────────────────────────────────────────────
function QuickAction({ label, icon: Icon, to }: { label: string; icon: React.ElementType; to: string }) {
  return (
    <a
      href={to}
      className="flex items-center gap-3 p-3 rounded-lg bg-surface-800/50 hover:bg-surface-800 border border-surface-700/50 transition-all hover:border-brand-600/30 group"
    >
      <Icon className="w-5 h-5 text-surface-400 group-hover:text-brand-400 transition-colors" />
      <span className="text-sm text-surface-200 group-hover:text-white transition-colors">{label}</span>
    </a>
  );
}

// ── Activity Item ────────────────────────────────────────────
function ActivityItem({ action, entity, user, time }: { action: string; entity: string; user: string; time: string }) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-surface-800/50 last:border-0 hover:bg-white/5 transition-colors px-2 -mx-2 rounded-lg">
      <div className="w-10 h-10 rounded-full bg-brand-600/10 flex items-center justify-center text-brand-400 text-sm font-bold mt-0.5 border border-brand-500/20">
        {user.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-surface-200 leading-relaxed">
          <span className="font-semibold text-white">{user}</span> {action}{" "}
          <span className="font-semibold text-brand-400">{entity}</span>
        </p>
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-surface-500">
          <Clock className="w-3 h-3" />
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { data: metrics, isLoading: loadingMetrics } = useDashboardMetrics();
  const { data: activities, isLoading: loadingActivity } = useRecentActivity(5);
  const { data: pipeline, isLoading: loadingPipeline } = usePipelineSummary();
  const { data: tasks, isLoading: loadingTasks } = useUserTasks("pending");

  if (loadingMetrics || loadingActivity || loadingPipeline || loadingTasks) {
    return (
      <Container className="py-12 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-surface-800 rounded mx-auto" />
          <div className="h-4 w-64 bg-surface-800 rounded mx-auto" />
        </div>
      </Container>
    );
  }

  return (
    <Container className="space-y-8" padding="md">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white font-display tracking-tight">Dashboard</h1>
          <p className="text-surface-400 mt-1">Vista general de tu actividad — {new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" icon={Clock}>Historial</Button>
          <Button variant="primary" size="sm" icon={Plus}>Acción Rápida</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <Grid cols={{ sm: 1, md: 2, lg: 4 }} gap={4}>
        <DashboardStatCard
          label="Total Contactos"
          value={metrics?.totalContacts ?? 0}
          change="+12% vs mes pasado"
          changeType="up"
          icon={Users}
          variant="brand"
        />
        <DashboardStatCard
          label="Valor Pipeline"
          value={formatCurrency(metrics?.pipelineValue ?? 0)}
          change="+5.2% vs ene"
          changeType="up"
          icon={DollarSign}
          variant="emerald"
        />
        <DashboardStatCard
          label="Tareas Pendientes"
          value={metrics?.pendingTasks ?? 0}
          change={(metrics?.pendingTasks ?? 0) === 0 ? "¡Todo al día!" : `${metrics?.pendingTasks ?? 0} por completar`}
          changeType={(metrics?.pendingTasks ?? 0) === 0 ? "up" : "down"}
          icon={CheckSquare}
          variant="amber"
        />
        <DashboardStatCard
          label="Deals Totales"
          value={metrics?.totalDeals ?? 0}
          change="Sincronizado"
          changeType="up"
          icon={Target}
          variant="violet"
        />
      </Grid>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card variant="glass" className="p-6 h-fit">
          <h2 className="text-lg font-bold text-white font-display tracking-tight mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-400" />
            Acciones Rápidas
          </h2>
          <Stack gap={2}>
            <QuickAction label="Nuevo Contacto" icon={Users} to="/contacts" />
            <QuickAction label="Crear Tarea" icon={CheckSquare} to="/tasks" />
            <QuickAction label="Ver Pipeline" icon={TrendingUp} to="/pipeline" />
            <QuickAction label="Agendar Reunión" icon={Clock} to="/calendar" />
          </Stack>
        </Card>

        {/* Recent Activity */}
        <Card variant="glass" className="p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-white font-display tracking-tight mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-400" />
            Actividad Reciente
          </h2>
          <Stack gap={0}>
            {activities && activities.length > 0 ? (
              activities.map((act) => (
                <ActivityItem
                  key={act.id}
                  user={act.userId || "Sistema"}
                  action={act.action}
                  entity={act.entityType}
                  time={new Date(act.createdAt).toLocaleTimeString()}
                />
              ))
            ) : (
              <p className="text-surface-500 py-8 text-center italic">No hay actividad reciente.</p>
            )}
          </Stack>
        </Card>
      </div>

      {/* Pipeline Summary */}
      <Card variant="glass" className="p-6">
        <h2 className="text-lg font-bold text-white font-display tracking-tight mb-6 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-brand-400" />
          Pipeline por Etapa
        </h2>
        <Grid cols={{ sm: 2, md: 5 }} gap={4}>
          {pipeline?.map((s) => (
            <div key={s.stageName} className="text-center p-5 rounded-2xl bg-surface-800/30 border border-surface-700/30 hover:border-brand-500/30 transition-all hover:bg-surface-800/50 group">
              <div className="w-4 h-4 rounded-full mx-auto mb-3 shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ backgroundColor: s.stageColor }} />
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider group-hover:text-surface-200 transition-colors">{s.stageName}</p>
              <p className="text-2xl font-black text-white mt-1 group-hover:scale-110 transition-transform">{s.dealCount}</p>
              <Badge variant="subtle" size="sm" className="mt-2">{formatCurrency(s.totalValue)}</Badge>
            </div>
          ))}
        </Grid>
      </Card>
    </Container>
  );
}
