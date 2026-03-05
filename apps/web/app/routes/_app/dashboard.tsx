// ============================================================
// MaatWork CRM — Dashboard Page
// UI/UX REFINED BY JULES v2
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import {
  Users, TrendingUp, CheckSquare, Target, Clock, DollarSign, Plus, ChevronRight, Activity as ActivityIcon, LayoutDashboard, Sparkles
} from "lucide-react";
import { useDashboardMetrics, useRecentActivity, usePipelineSummary } from "~/lib/hooks/use-crm";
import { StatCard, SectionHeader } from "~/components/ui/LayoutCards";
import { Card } from "~/components/ui/Card";
import { Container, Grid, Stack } from "~/components/ui/Layout";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { formatCurrency, cn } from "~/lib/utils";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

// ── Quick Action Component ───────────────────────────────────
function QuickAction({ label, icon: Icon, to, color = "primary" }: { label: string; icon: React.ElementType; to: string, color?: string }) {
  return (
    <motion.a
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      href={to}
      className="flex items-center justify-between p-5 rounded-2xl bg-[#0F0F0F] border border-white/5 transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.1)] hover:border-[#8B5CF6]/30 group backdrop-blur-3xl"
    >
      <div className="flex items-center gap-5">
        <div className={cn("p-3 rounded-xl transition-all duration-500 group-hover:rotate-6", 
          color === "primary" ? "bg-[#8B5CF6]/10 text-[#8B5CF6] group-hover:bg-[#8B5CF6] group-hover:text-white" :
          "bg-[#18181B] text-[#A3A3A3] group-hover:bg-[#8B5CF6]/20 group-hover:text-[#8B5CF6]"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-bold text-[#F5F5F5] group-hover:text-[#8B5CF6] transition-colors tracking-tight text-base">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-[#A3A3A3] group-hover:text-[#8B5CF6] group-hover:translate-x-1.5 transition-all" />
    </motion.a>
  );
}

// ── Activity Item Component ──────────────────────────────────
function ActivityItem({ action, entity, user, time, idx }: { action: string; entity: string; user: string; time: string; idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1 }}
      className="flex items-start gap-5 py-6 border-b border-white/5 last:border-0 hover:bg-white/5 transition-all px-5 -mx-5 rounded-2xl group"
    >
      <div className="w-12 h-12 rounded-2xl bg-[#18181B] flex items-center justify-center text-[#8B5CF6] text-sm font-black mt-0.5 border border-white/5 group-hover:bg-[#8B5CF6] group-hover:text-white group-hover:border-[#8B5CF6] group-hover:rotate-3 transition-all duration-500 shadow-sm">
        {user.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[15px] font-medium text-[#F5F5F5] group-hover:text-[#8B5CF6] transition-colors truncate leading-tight">
            <span className="font-black">{user}</span> {action} <span className="font-black text-[#8B5CF6]/80">{entity}</span>
          </p>
          <span className="flex items-center gap-1.5 shrink-0 text-[10px] font-black text-[#737373] uppercase tracking-[0.1em]">
            <Clock className="w-3 h-3" />
            {time}
          </span>
        </div>
        <p className="text-[11px] text-[#A3A3A3] mt-1.5 font-bold uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#C026D3]" />
          Analizado por MaatWork AI
        </p>
      </div>
    </motion.div>
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
          <div className="h-12 w-56 bg-[#18181B] rounded-2xl mx-auto" />
          <div className="h-4 w-full bg-[#0F0F0F] rounded-xl border border-white/5" />
          <div className="grid grid-cols-2 gap-6 mt-12">
             <div className="h-40 bg-[#18181B] rounded-[2rem] border border-white/5" />
             <div className="h-40 bg-[#18181B] rounded-[2rem] border border-white/5" />
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="space-y-12" padding="lg">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <SectionHeader
          title="Dashboard"
          description={`Bienvenido de nuevo. Aquí tienes un resumen de tu actividad para ${new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}.`}
          icon={LayoutDashboard}
          actions={
            <div className="flex items-center gap-4">
              <Button variant="outline" size="md" className="border-white/10 text-[#F5F5F5] font-black uppercase tracking-widest text-[10px] h-10">Historial</Button>
              <Button variant="primary" size="md" icon={Plus} className="shadow-[0_0_20px_rgba(139,92,246,0.3)] h-10 px-6 bg-[#8B5CF6] hover:bg-[#7C3AED]">Crear Deal</Button>
            </div>
          }
        />
      </motion.div>

      {/* KPI Cards */}
      <Grid cols={{ sm: 1, md: 2, lg: 4 }} gap={6}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <StatCard
            label="Total Contactos"
            value={metrics?.totalContacts ?? 0}
            change="12% este mes"
            changeType="up"
            icon={Users}
            variant="brand"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <StatCard
            label="Valor Pipeline"
            value={formatCurrency(metrics?.pipelineValue ?? 0)}
            change="5.2% vs ene"
            changeType="up"
            icon={DollarSign}
            variant="emerald"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          <StatCard
            label="Tareas Pendientes"
            value={metrics?.pendingTasks ?? 0}
            change={metrics?.pendingTasks === 0 ? "¡Todo al día!" : "Atención requerida"}
            changeType={metrics?.pendingTasks === 0 ? "up" : "down"}
            icon={CheckSquare}
            variant="amber"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
          <StatCard
            label="Deals Totales"
            value={metrics?.totalDeals ?? 0}
            change="Sincronizado"
            changeType="up"
            icon={Target}
            variant="violet"
          />
        </motion.div>
      </Grid>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-4 space-y-8"
        >
           <div className="flex items-center justify-between mb-2 px-1">
             <div className="flex items-center gap-4">
                <div className="w-1.5 h-6 bg-[#8B5CF6] rounded-full shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                <h2 className="text-2xl font-black text-[#F5F5F5] font-display tracking-tight">Acciones Rápidas</h2>
             </div>
             <Button variant="ghost" size="sm" className="text-[#8B5CF6] hover:bg-[#8B5CF6]/10 px-2 h-8 rounded-lg">
                <Sparkles className="w-4 h-4 mr-2" />
                <span className="text-[10px] font-black uppercase tracking-wider">AI Copilot</span>
             </Button>
           </div>
           <Stack gap={4}>
            <QuickAction label="Nuevo Contacto" icon={Users} to="/contacts" />
            <QuickAction label="Crear Tarea" icon={CheckSquare} to="/tasks" color="secondary" />
            <QuickAction label="Ver Pipeline" icon={TrendingUp} to="/pipeline" />
            <QuickAction label="Agenda" icon={Clock} to="/calendar" color="secondary" />
          </Stack>
          
          <Card variant="cyber" className="p-8 bg-[#18181B] text-white border-white/5 shadow-[0_0_30px_rgba(192,38,211,0.15)] overflow-hidden relative active:scale-[0.99] transition-all">
             <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/20 to-[#C026D3]/20 opacity-50"></div>
             <div className="relative z-10">
                <h3 className="text-xl font-black mb-2 font-display flex items-center gap-2">
                  Tu Meta Mensual
                  <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                </h3>
                <p className="text-[#A3A3A3] text-sm mb-6 font-medium">Estás al 75% de alcanzar tu objetivo de ventas este mes. ¡Sigue así!</p>
                <div className="h-3 w-full bg-[#0F0F0F] rounded-full overflow-hidden shadow-inner border border-white/5">
                   <motion.div
                     initial={{ width: 0 }}
                     animate={{ width: "75%" }}
                     transition={{ duration: 1.5, ease: "easeOut" }}
                     className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#C026D3] rounded-full shadow-[0_0_15px_rgba(192,38,211,0.5)]"
                   />
                </div>
             </div>
             <ActivityIcon className="absolute -right-10 -bottom-10 w-44 h-44 text-white/5 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700 blur-[2px]" />
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-8"
        >
          <Card variant="glass" className="p-10 border-white/5 backdrop-blur-3xl h-full">
             <div className="flex items-center justify-between mb-10">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#18181B] border border-white/5 text-[#8B5CF6] rounded-2xl shadow-sm">
                     <Clock className="w-5 h-5" strokeWidth={3} />
                  </div>
                  <h2 className="text-2xl font-black text-[#F5F5F5] font-display tracking-tight">Actividad Reciente</h2>
               </div>
               <Button variant="ghost" size="sm" className="text-[#8B5CF6] hover:bg-[#8B5CF6]/10 font-black uppercase tracking-widest text-[10px]">Ver Historial Completo</Button>
             </div>
            <Stack gap={0}>
              {activities && activities.length > 0 ? (
                activities.map((act, idx) => (
                  <ActivityItem
                    key={act.id}
                    idx={idx}
                    user={act.userId || "Sistema"}
                    action={act.action}
                    entity={act.entityType}
                    time={new Date(act.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  />
                ))
              ) : (
                <div className="py-24 text-center">
                   <div className="w-20 h-20 bg-[#18181B] rounded-3xl flex items-center justify-center mx-auto mb-6 text-[#737373] border border-white/5">
                      <Clock className="w-10 h-10" />
                   </div>
                   <p className="text-[#A3A3A3] font-bold italic text-lg tracking-tight">Esperando nuevas interacciones...</p>
                   <p className="text-[#737373] text-sm mt-1">Tu actividad en tiempo real aparecerá aquí.</p>
                </div>
              )}
            </Stack>
          </Card>
        </motion.div>
      </div>

      {/* Pipeline Summary View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="space-y-10 pt-6"
      >
        <div className="flex items-center justify-between px-1">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#22C55E]/10 rounded-2xl text-[#22C55E] border border-[#22C55E]/20 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                 <DollarSign className="w-5 h-5" strokeWidth={3} />
              </div>
              <h2 className="text-2xl font-black text-[#F5F5F5] font-display tracking-tight">Salud del Pipeline</h2>
           </div>
           <Button variant="ghost" size="sm" className="text-[#737373] hover:text-[#8B5CF6] font-black text-[10px] uppercase tracking-[0.2em]">Personalizar Pipeline</Button>
        </div>
        <Grid cols={{ sm: 2, md: 3, lg: 3, xl: 6 }} gap={6}>
          {pipeline?.map((s, i) => (
            <motion.div
              key={s.stageName}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + (i * 0.1) }}
            >
              <Card variant="cyber" className="p-8 text-center transition-all group overflow-hidden relative border-white/5 hover:border-[#8B5CF6]/30">
                <div className="absolute top-0 left-0 w-full h-[4px] opacity-80 shadow-[0_0_10px_currentColor]" style={{ backgroundColor: s.stageColor, color: s.stageColor }} />
                <p className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-[0.3em] mb-6 group-hover:text-white transition-colors truncate">
                  {s.stageName}
                </p>
                <div className="space-y-1">
                  <p className="text-4xl font-black text-[#F5F5F5] group-hover:scale-110 transition-all duration-500 tracking-tighter">
                    {s.dealCount}
                  </p>
                  <div className="text-[10px] font-black text-[#737373] uppercase tracking-[0.1em]">Oportunidades</div>
                </div>
                <div className="mt-8 flex justify-center">
                  <Badge variant="success" className="font-black text-[11px] rounded-xl tracking-tight h-9 px-4 shadow-sm bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20">
                    {formatCurrency(s.totalValue)}
                  </Badge>
                </div>
              </Card>
            </motion.div>
          ))}
        </Grid>
      </motion.div>
    </Container>
  );
}
