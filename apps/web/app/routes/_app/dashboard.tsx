import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Calendar,
  CheckSquare,
  ChevronRight,
  Clock,
  DollarSign,
  LayoutDashboard,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { CalendarWidget } from "~/components/ui/CalendarWidget";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Container, Grid, Stack } from "~/components/ui/Layout";
import { SectionHeader, StatCard } from "~/components/ui/LayoutCards";
import { useDashboardMetrics, useGoogleCalendarEvents, usePipelineSummary, useTasks } from "~/lib/hooks/use-crm";
import { cn, formatCurrency } from "~/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

function QuickAction({
  label,
  icon: Icon,
  to,
  color = "primary",
}: { label: string; icon: React.ElementType; to: string; color?: string }) {
  return (
    <a
      href={to}
      className="flex items-center justify-between p-2.5 px-3 rounded-lg bg-[#18181B] border border-white/5 hover:border-[#8B5CF6]/30 transition-all group"
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "p-1.5 rounded-md transition-all",
            color === "primary"
              ? "bg-[#8B5CF6]/10 text-[#8B5CF6] group-hover:bg-[#8B5CF6] group-hover:text-white"
              : "bg-white/5 text-[#A3A3A3] group-hover:bg-[#8B5CF6]/20 group-hover:text-[#8B5CF6]",
          )}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="font-medium text-[#F5F5F5] text-sm">{label}</span>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-[#737373] group-hover:text-[#8B5CF6] group-hover:translate-x-0.5 transition-all" />
    </a>
  );
}

function TodayTasks({ tasks }: { tasks: any[] }) {
  const pendingTasks = tasks?.filter((t: any) => t.status === "pending" || t.status === "in_progress") || [];

  return (
    <Card variant="elevated" className="h-full border-white/5">
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-amber-500" />
            Tareas de Hoy
          </CardTitle>
          <Badge variant="secondary" className="text-[10px]">
            {pendingTasks.length} pendientes
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 space-y-2">
        {pendingTasks.length === 0 ? (
          <p className="text-xs text-[#737373] py-4 text-center">¡Todo al día! 🎉</p>
        ) : (
          pendingTasks.slice(0, 5).map((task: any) => (
            <div
              key={task.id}
              className="flex items-center gap-2 p-2 rounded-lg bg-[#18181B]/50 hover:bg-[#18181B] transition-colors"
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  task.priority === "urgent"
                    ? "bg-red-500"
                    : task.priority === "high"
                      ? "bg-orange-500"
                      : task.priority === "medium"
                        ? "bg-yellow-500"
                        : "bg-green-500",
                )}
              />
              <span className="flex-1 text-sm text-[#F5F5F5] truncate">{task.title}</span>
              <span className="text-[10px] text-[#737373]">
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
                  : ""}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function PipelineCard({ stage }: { stage: any }) {
  return (
    <div className="p-3 rounded-xl bg-[#18181B] border border-white/5 hover:border-[#8B5CF6]/30 transition-all cursor-pointer group">
      <div className="flex items-center justify-between mb-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.stageColor }} />
        <span className="text-xs font-semibold text-[#A3A3A3]">{stage.dealCount} deals</span>
      </div>
      <p className="text-xs font-bold text-[#F5F5F5] truncate mb-1">{stage.stageName}</p>
      <p className="text-lg font-black text-[#8B5CF6]">{formatCurrency(stage.totalValue)}</p>
    </div>
  );
}

function DashboardPage() {
  const { data: metrics, isLoading: loadingMetrics } = useDashboardMetrics();
  const { data: pipeline, isLoading: loadingPipeline } = usePipelineSummary();
  const { data: googleEvents, error: googleEventsError } = useGoogleCalendarEvents();
  const { data: tasks } = useTasks();

  if (loadingMetrics || loadingPipeline) {
    return (
      <Container className="py-12 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-[#18181B] rounded mx-auto" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-[#18181B] rounded-lg" />
            ))}
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="space-y-4" padding="lg">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#F5F5F5] tracking-tight">Dashboard</h1>
            <p className="text-xs text-[#737373] mt-0.5">
              {new Date().toLocaleDateString("es-AR", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <Button variant="primary" size="sm" className="rounded-lg h-9">
            <TrendingUp className="w-3.5 h-3.5 mr-2" />
            Ver Pipeline
          </Button>
        </div>
      </motion.div>

      <Grid cols={{ sm: 2, md: 4 }} gap={3}>
        <StatCard
          label="Contactos"
          value={metrics?.totalContacts ?? 0}
          change="+12% vs mes anterior"
          changeType="up"
          icon={Users}
          variant="brand"
        />
        <StatCard
          label="Valor Pipeline"
          value={formatCurrency(metrics?.pipelineValue ?? 0)}
          change="+5.2% vs mes anterior"
          changeType="up"
          icon={DollarSign}
          variant="emerald"
        />
        <StatCard
          label="Tareas"
          value={metrics?.pendingTasks ?? 0}
          change={metrics?.pendingTasks === 0 ? "¡Todo al día!" : "Pendientes"}
          changeType={metrics?.pendingTasks === 0 ? "up" : "down"}
          icon={CheckSquare}
          variant="amber"
        />
        <StatCard
          label="Conversión"
          value="68%"
          change="+3% vs mes anterior"
          changeType="up"
          icon={Target}
          variant="violet"
        />
      </Grid>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-3 space-y-3">
          <h3 className="text-xs font-bold text-[#737373] uppercase tracking-wider">Acciones Rápidas</h3>
          <Stack gap={1.5}>
            <QuickAction label="Nuevo Contacto" icon={Users} to="/contacts" />
            <QuickAction label="Crear Tarea" icon={CheckSquare} to="/tasks" color="secondary" />
            <QuickAction label="Ver Pipeline" icon={TrendingUp} to="/pipeline" />
            <QuickAction label="Equipos" icon={Users} to="/teams" color="secondary" />
          </Stack>

          <TodayTasks tasks={tasks} />
        </div>

        <div className="lg:col-span-6 space-y-3">
          <h3 className="text-xs font-bold text-[#737373] uppercase tracking-wider">Pipeline por Etapa</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {pipeline?.map((s) => (
              <PipelineCard key={s.stageName} stage={s} />
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-3">
          <CalendarWidget
            googleEvents={googleEventsError ? [] : googleEvents || []}
            title="Mi Calendario"
            showActions={false}
          />
        </div>
      </div>
    </Container>
  );
}
