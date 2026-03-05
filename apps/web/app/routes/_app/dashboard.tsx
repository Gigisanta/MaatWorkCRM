// ============================================================
// MaatWork CRM — Dashboard Page
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import {
  Users, TrendingUp, CheckSquare, Target, Clock, DollarSign, Plus, ChevronRight, Activity as ActivityIcon, LayoutDashboard
} from "lucide-react";
import { useDashboardMetrics, useRecentActivity, usePipelineSummary } from "~/lib/hooks/use-crm";
import { StatCard, SectionHeader } from "~/components/ui/LayoutCards";
import { Card } from "~/components/ui/Card";
import { Container, Grid, Stack } from "~/components/ui/Layout";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { formatCurrency, cn } from "~/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

// ── Quick Action Component ───────────────────────────────────
function QuickAction({ label, icon: Icon, to, color = "primary" }: { label: string; icon: React.ElementType; to: string, color?: string }) {
  return (
    <a
      href={to}
      className="flex items-center justify-between p-5 rounded-2xl bg-surface/40 hover:bg-surface-hover border border-border/40 transition-all hover:shadow-lg hover:border-primary/30 group active:scale-[0.98] backdrop-blur-sm"
    >
      <div className="flex items-center gap-5">
        <div className={cn("p-3 rounded-xl transition-all duration-500 group-hover:rotate-6", 
          color === "primary" ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white" : 
          "bg-surface-200 text-surface-600 group-hover:bg-primary/20 group-hover:text-primary"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-bold text-text group-hover:text-primary transition-colors tracking-tight text-base">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-1.5 transition-all" />
    </a>
  );
}

// ── Activity Item Component ──────────────────────────────────
function ActivityItem({ action, entity, user, time }: { action: string; entity: string; user: string; time: string }) {
  return (
    <div className="flex items-start gap-5 py-6 border-b border-border/30 last:border-0 hover:bg-surface-50/50 transition-all px-5 -mx-5 rounded-2xl group">
      <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center text-primary text-sm font-black mt-0.5 border border-border/50 group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:rotate-3 transition-all duration-500 shadow-sm">
        {user.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[15px] font-medium text-text group-hover:text-primary transition-colors truncate leading-tight">
            <span className="font-black">{user}</span> {action} <span className="font-black text-primary/80">{entity}</span>
          </p>
          <span className="flex items-center gap-1.5 shrink-0 text-[10px] font-black text-text-muted/60 uppercase tracking-[0.1em]">
            <Clock className="w-3 h-3" />
            {time}
          </span>
        </div>
        <p className="text-[11px] text-text-muted/80 mt-1.5 font-bold uppercase tracking-wider">Actualizado por MaatWork Intelligence</p>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { data: metrics, isLoading: loadingMetrics } = useDashboardMetrics();
  const { data: activities, isLoading: loadingActivity } = useRecentActivity(6);
  const { data: pipeline, isLoading: loadingPipeline } = usePipelineSummary();

  if (loadingMetrics || loadingActivity || loadingPipeline) {
    return (
      <Container className="py-24 text-center">
        <div className="animate-pulse space-y-8 max-w-md mx-auto">
          <div className="h-12 w-56 bg-surface-200 rounded-2xl mx-auto" />
          <div className="h-4 w-full bg-surface-100 rounded-xl" />
          <div className="grid grid-cols-2 gap-6 mt-12">
             <div className="h-40 bg-surface-100 rounded-[2rem]" />
             <div className="h-40 bg-surface-100 rounded-[2rem]" />
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="space-y-12" padding="lg">
      <SectionHeader 
        title="Dashboard" 
        description={`Bienvenido de nuevo. Aquí tienes un resumen de tu actividad para ${new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}.`}
        icon={LayoutDashboard}
        actions={
          <div className="flex items-center gap-4">
            <Button variant="outline" size="md" className="border-border text-text font-black uppercase tracking-widest text-[10px] h-10">Historial</Button>
            <Button variant="primary" size="md" icon={Plus} className="shadow-primary-lg h-10 px-6">Crear Deal</Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <Grid cols={{ sm: 1, md: 2, lg: 4 }} gap={6}>
        <StatCard
          label="Total Contactos"
          value={metrics?.totalContacts ?? 0}
          change="12% este mes"
          changeType="up"
          icon={Users}
          variant="brand"
        />
        <StatCard
          label="Valor Pipeline"
          value={formatCurrency(metrics?.pipelineValue ?? 0)}
          change="5.2% vs ene"
          changeType="up"
          icon={DollarSign}
          variant="emerald"
        />
        <StatCard
          label="Tareas Pendientes"
          value={metrics?.pendingTasks ?? 0}
          change={metrics?.pendingTasks === 0 ? "¡Todo al día!" : "Atención requerida"}
          changeType={metrics?.pendingTasks === 0 ? "up" : "down"}
          icon={CheckSquare}
          variant="amber"
        />
        <StatCard
          label="Deals Totales"
          value={metrics?.totalDeals ?? 0}
          change="Sincronizado"
          changeType="up"
          icon={Target}
          variant="violet"
        />
      </Grid>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Quick Actions */}
        <div className="lg:col-span-4 space-y-8">
           <div className="flex items-center gap-4 mb-2 px-1">
              <div className="w-1.5 h-6 bg-primary rounded-full" />
              <h2 className="text-2xl font-black text-text font-display tracking-tight">Acciones Rápidas</h2>
           </div>
           <Stack gap={4}>
            <QuickAction label="Nuevo Contacto" icon={Users} to="/contacts" />
            <QuickAction label="Crear Tarea" icon={CheckSquare} to="/tasks" color="secondary" />
            <QuickAction label="Ver Pipeline" icon={TrendingUp} to="/pipeline" />
            <QuickAction label="Agenda" icon={Clock} to="/calendar" color="secondary" />
          </Stack>
          
          <Card variant="cyber" className="p-8 bg-primary text-white border-none shadow-primary-lg overflow-hidden relative active:scale-[0.99] transition-all">
             <div className="relative z-10">
                <h3 className="text-xl font-black mb-2 font-display">Tu Meta Mensual</h3>
                <p className="text-white/80 text-sm mb-6 font-medium">Estás al 75% de alcanzar tu objetivo de ventas este mes. ¡Sigue así!</p>
                <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden shadow-inner">
                   <div className="h-full bg-white w-3/4 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                </div>
             </div>
             <ActivityIcon className="absolute -right-10 -bottom-10 w-44 h-44 text-white/10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700 blur-[2px]" />
          </Card>
        </div>

        {/* Recent Activity */}
        <Card variant="glass" className="p-10 lg:col-span-8 border-border/40 backdrop-blur-xl">
           <div className="flex items-center justify-between mb-10">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-primary text-white rounded-2xl shadow-primary">
                   <Clock className="w-5 h-5" strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-black text-text font-display tracking-tight">Actividad Reciente</h2>
             </div>
             <Button variant="ghost" size="sm" className="text-primary font-black uppercase tracking-widest text-[10px]">Ver Historial Completo</Button>
           </div>
          <Stack gap={0}>
            {activities && activities.length > 0 ? (
              activities.map((act) => (
                <ActivityItem
                  key={act.id}
                  user={act.userId || "Sistema"}
                  action={act.action}
                  entity={act.entityType}
                  time={new Date(act.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                />
              ))
            ) : (
              <div className="py-24 text-center">
                 <div className="w-20 h-20 bg-surface-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-text-muted/30 border border-border/50">
                    <Clock className="w-10 h-10" />
                 </div>
                 <p className="text-text-muted font-bold italic text-lg tracking-tight">Esperando nuevas interacciones...</p>
                 <p className="text-text-muted/60 text-sm mt-1">Tu actividad en tiempo real aparecerá aquí.</p>
              </div>
            )}
          </Stack>
        </Card>
      </div>

      {/* Pipeline Summary View */}
      <div className="space-y-10 pt-6">
        <div className="flex items-center justify-between px-1">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl text-emerald-600 border border-emerald-500/20 flex items-center justify-center">
                 <DollarSign className="w-5 h-5" strokeWidth={3} />
              </div>
              <h2 className="text-2xl font-black text-text font-display tracking-tight">Estatus del Pipeline</h2>
           </div>
           <Button variant="ghost" size="sm" className="text-text-muted hover:text-primary font-black text-[10px] uppercase tracking-[0.2em]">Personalizar Pipeline</Button>
        </div>
        <Grid cols={{ sm: 2, md: 3, lg: 3, xl: 6 }} gap={6}>
          {pipeline?.map((s) => (
            <Card key={s.stageName} variant="cyber" className="p-8 text-center transition-all group overflow-hidden relative border-border/30">
              <div className="absolute top-0 left-0 w-full h-[4px] opacity-80" style={{ backgroundColor: s.stageColor }} />
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-6 group-hover:text-primary transition-colors truncate">
                {s.stageName}
              </p>
              <div className="space-y-1">
                <p className="text-4xl font-black text-text group-hover:scale-110 transition-all duration-500 tracking-tighter">
                  {s.dealCount}
                </p>
                <div className="text-[10px] font-black text-text-muted/40 uppercase tracking-[0.1em]">Oportunidades</div>
              </div>
              <div className="mt-8">
                <Badge variant="success" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black text-[11px] rounded-xl tracking-tight h-9 px-4 shadow-sm">
                  {formatCurrency(s.totalValue)}
                </Badge>
              </div>
            </Card>
          ))}
        </Grid>
      </div>
    </Container>
  );
}
