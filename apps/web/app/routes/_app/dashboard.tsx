import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Calendar,
  CheckSquare,
  ChevronRight,
  Clock,
  Plus,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { CalendarWidget } from "~/components/ui/CalendarWidget";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Container, Grid, Stack } from "~/components/ui/Layout";
import { StatCard } from "~/components/ui/LayoutCards";
import {
  useBottleneckAnalysis,
  useConversionFunnel,
  useDashboardMetrics,
  useGoogleCalendarEvents,
  usePipelineSummary,
  useTasks,
  useUserProductivityMetrics,
} from "~/lib/hooks/use-crm";
import { cn, formatCurrency } from "~/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 18) return "Buenas tardes";
  return "Buenas noches";
}

function QuickAction({
  label,
  icon: Icon,
  to,
  color = "primary",
}: { label: string; icon: React.ElementType; to: string; color?: "primary" | "secondary" | "accent" }) {
  const colorClasses = {
    primary: "from-[#8B5CF6] to-[#7C3AED] text-white",
    secondary: "from-[#27272A] to-[#18181B] text-[#A3A3A3] border-white/10",
    accent: "from-[#10B981] to-[#059669] text-white",
  };

  return (
    <motion.a
      href={to}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex items-center justify-between p-3.5 px-4 rounded-xl bg-gradient-to-r border border-white/5 transition-all group relative overflow-hidden",
        colorClasses[color],
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center gap-3 relative z-10">
        <div
          className={cn(
            "p-2.5 rounded-lg transition-all",
            color === "primary"
              ? "bg-white/20 text-white"
              : color === "accent"
                ? "bg-white/20 text-white"
                : "bg-[#8B5CF6]/20 text-[#8B5CF6] group-hover:bg-[#8B5CF6]/30",
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
        <span className="font-semibold text-sm text-[#F5F5F5]">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all relative z-10" />
    </motion.a>
  );
}

function TodayTasks({ tasks }: { tasks?: any[] }) {
  const pendingTasks = tasks?.filter((t: any) => t.status === "pending" || t.status === "in_progress") || [];
  const completedTasks = tasks?.filter((t: any) => t.status === "completed") || [];

  return (
    <Card variant="elevated" className="h-full border border-amber-500/20 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />

      <CardHeader className="pb-3 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <CheckSquare className="w-4 h-4 text-amber-500" />
            </div>
            Tareas de Hoy
          </CardTitle>
          <div className="flex items-center gap-2">
            {completedTasks.length > 0 && (
              <Badge variant="success" className="text-[10px]">
                {completedTasks.length} completadas
              </Badge>
            )}
            {pendingTasks.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {pendingTasks.length} pendientes
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 space-y-2">
        {pendingTasks.length === 0 && completedTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
              <span className="text-3xl">🎉</span>
            </div>
            <p className="text-sm text-[#F5F5F5] font-medium">¡Todo al día!</p>
            <p className="text-xs text-[#737373] mt-1">No tienes tareas pendientes</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {pendingTasks.slice(0, 5).map((task: any, idx: number) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#18181B]/60 hover:bg-[#18181B] border border-white/5 hover:border-amber-500/20 transition-all group"
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
                    task.priority === "urgent"
                      ? "border-red-500 bg-red-500/10"
                      : task.priority === "high"
                        ? "border-orange-500 bg-orange-500/10"
                        : task.priority === "medium"
                          ? "border-yellow-500 bg-yellow-500/10"
                          : "border-emerald-500 bg-emerald-500/10",
                  )}
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
                            : "bg-emerald-500",
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      "text-sm text-[#F5F5F5] truncate block",
                      task.status === "completed" && "line-through text-[#737373]",
                    )}
                  >
                    {task.title}
                  </span>
                  {task.dueDate && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-[#737373]" />
                      <span className="text-[10px] text-[#737373]">
                        {new Date(task.dueDate).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  )}
                </div>
                {task.priority === "urgent" && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 font-medium">URG</span>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

function PipelineCard({ stage, index }: { stage: any; index: number }) {
  const getBottleneckColor = (level: string) => {
    switch (level) {
      case "critical":
        return "text-red-400";
      case "warning":
        return "text-orange-400";
      case "moderate":
        return "text-yellow-400";
      default:
        return "text-emerald-400";
    }
  };

  const getBgGradient = (level: string) => {
    switch (level) {
      case "critical":
        return "from-red-500/10 to-red-600/5";
      case "warning":
        return "from-orange-500/10 to-orange-600/5";
      case "moderate":
        return "from-yellow-500/10 to-yellow-600/5";
      default:
        return "from-[#18181B] to-[#27272A]";
    }
  };

  const getBorderColor = (level: string) => {
    switch (level) {
      case "critical":
        return "border-red-500/30";
      case "warning":
        return "border-orange-500/30";
      case "moderate":
        return "border-yellow-500/30";
      default:
        return "border-white/10";
    }
  };

  const getGlowColor = (level: string) => {
    switch (level) {
      case "critical":
        return "shadow-red-500/20";
      case "warning":
        return "shadow-orange-500/20";
      case "moderate":
        return "shadow-yellow-500/20";
      default:
        return "shadow-purple-500/10";
    }
  };

  const bottleneckLevel = stage.bottleneckLevel || "healthy";
  const isOverLimit = stage.isOverWipLimit;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn(
        "p-4 rounded-2xl bg-gradient-to-br border transition-all cursor-pointer group hover:shadow-lg",
        getBgGradient(bottleneckLevel),
        getBorderColor(bottleneckLevel),
        getGlowColor(bottleneckLevel),
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: stage.stageColor, boxShadow: `0 0 8px ${stage.stageColor}40` }}
          />
          <span className="text-[10px] font-medium text-[#737373] uppercase tracking-wider">Etapa</span>
        </div>
        {isOverLimit && (
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-semibold">WIP</span>
        )}
      </div>
      <p className="text-sm font-bold text-[#F5F5F5] truncate mb-2">{stage.stageName}</p>
      <div className="flex items-end justify-between">
        <div>
          <span className={cn("text-2xl font-black", getBottleneckColor(bottleneckLevel))}>
            {stage.contactCount || stage.dealCount || 0}
          </span>
          <span className="text-[10px] text-[#737373] ml-1">contactos</span>
        </div>
        <div className={cn("text-right", getBottleneckColor(bottleneckLevel))}>
          <span className="text-lg font-bold">{stage.percentage ? `${Math.round(stage.percentage)}%` : ""}</span>
        </div>
      </div>
      <div className="mt-3 h-1 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${stage.percentage || 0}%` }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          className={cn(
            "h-full rounded-full",
            bottleneckLevel === "critical"
              ? "bg-red-500"
              : bottleneckLevel === "warning"
                ? "bg-orange-500"
                : bottleneckLevel === "moderate"
                  ? "bg-yellow-500"
                  : "bg-emerald-500",
          )}
        />
      </div>
    </motion.div>
  );
}

function DashboardPage() {
  const { data: metrics, isLoading: loadingMetrics } = useDashboardMetrics();
  const { data: pipeline, isLoading: loadingPipeline } = usePipelineSummary();
  const { data: bottleneckData } = useBottleneckAnalysis();
  const { data: funnelData } = useConversionFunnel();
  const { data: productivityData } = useUserProductivityMetrics(7);
  const { data: googleEvents, error: googleEventsError } = useGoogleCalendarEvents();
  const { data: tasks } = useTasks();

  // Merge bottleneck data with pipeline stages for bottleneck colors
  const pipelineWithBottlenecks = pipeline?.map((stage) => {
    const bottleneck = bottleneckData?.stages?.find((b) => b.stageName === stage.stageName);
    return {
      ...stage,
      bottleneckLevel: bottleneck?.bottleneckLevel || "healthy",
      isOverWipLimit: bottleneck?.isOverWipLimit || false,
    };
  });

  // Real conversion rate from funnel
  const conversionRate = funnelData?.overallConversionRate ? Math.round(funnelData.overallConversionRate) : 0;

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
    <Container className="space-y-6" padding="lg">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative">
        <div className="absolute top-0 left-0 w-1 h-16 bg-gradient-to-b from-[#8B5CF6] to-transparent rounded-full" />
        <div className="flex items-center justify-between pl-4">
          <div>
            <h1 className="text-3xl font-black text-[#F5F5F5] tracking-tight">{getGreeting()}</h1>
            <p className="text-sm text-[#737373] mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString("es-AR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="primary"
              size="sm"
              className="rounded-xl h-10 px-5 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] shadow-lg shadow-[#8B5CF6]/25"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Ver Pipeline
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Grid cols={{ sm: 2, lg: 4 }} gap={3}>
          <StatCard
            label="Contactos"
            value={metrics?.totalContacts ?? 0}
            change="Total en CRM"
            changeType="up"
            icon={Users}
            variant="brand"
            className="hover:shadow-lg hover:shadow-[#8B5CF6]/10 transition-all py-4"
          />
          <StatCard
            label="Contactos Activos"
            value={metrics?.activeContacts ?? 0}
            change="En Pipeline"
            changeType="up"
            icon={Activity}
            variant="emerald"
            className="hover:shadow-lg hover:shadow-emerald-500/10 transition-all py-4"
          />
          <StatCard
            label="Tareas"
            value={metrics?.pendingTasks ?? 0}
            change={metrics?.pendingTasks === 0 ? "¡Todo al día!" : "Pendientes"}
            changeType={metrics?.pendingTasks === 0 ? "up" : "down"}
            icon={CheckSquare}
            variant="amber"
            className="hover:shadow-lg hover:shadow-amber-500/10 transition-all py-4"
          />
          <StatCard
            label="Conversión"
            value={`${conversionRate}%`}
            change="A Cliente"
            changeType={conversionRate > 10 ? "up" : "down"}
            icon={Target}
            variant="violet"
            className="hover:shadow-lg hover:shadow-violet-500/10 transition-all py-4"
          />
        </Grid>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <motion.div
          className="lg:col-span-3 space-y-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-[#8B5CF6]" />
            <h3 className="text-sm font-bold text-[#F5F5F5]">Acciones Rápidas</h3>
          </div>
          <Stack gap={2}>
            <QuickAction label="Nuevo Contacto" icon={Plus} to="/contacts" color="primary" />
            <QuickAction label="Crear Tarea" icon={CheckSquare} to="/tasks" color="secondary" />
            <QuickAction label="Ver Pipeline" icon={TrendingUp} to="/pipeline" color="primary" />
            <QuickAction label="Equipos" icon={Users} to="/teams" color="secondary" />
          </Stack>

          <div className="mt-6">
            <TodayTasks tasks={tasks} />
          </div>

          <div className="mt-6">
            <Card variant="elevated" className="border-white/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Mi Actividad (7 días)
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-4 gap-3">
                <div className="text-center p-2 rounded-lg bg-[#18181B]">
                  <p className="text-xl font-black text-[#8B5CF6]">{productivityData?.totals?.contactsTouched ?? 0}</p>
                  <p className="text-[10px] text-[#737373]">Contactos</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-[#18181B]">
                  <p className="text-xl font-black text-blue-400">{productivityData?.totals?.callsCompleted ?? 0}</p>
                  <p className="text-[10px] text-[#737373]">Llamadas</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-[#18181B]">
                  <p className="text-xl font-black text-emerald-400">{productivityData?.totals?.emailsSent ?? 0}</p>
                  <p className="text-[10px] text-[#737373]">Emails</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-[#18181B]">
                  <p className="text-xl font-black text-amber-400">{productivityData?.totals?.tasksCompleted ?? 0}</p>
                  <p className="text-[10px] text-[#737373]">Tareas</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <motion.div
          className="lg:col-span-6 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <CalendarWidget
            googleEvents={googleEventsError ? [] : googleEvents || []}
            title="Mi Calendario"
            showActions={false}
          />
        </motion.div>

        <motion.div
          className="lg:col-span-3 space-y-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-[#8B5CF6]" />
            <h3 className="text-sm font-bold text-[#F5F5F5]">Pipeline</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {pipelineWithBottlenecks?.map((s, idx) => (
              <PipelineCard key={s.stageName} stage={s} index={idx} />
            ))}
          </div>
        </motion.div>
      </div>
    </Container>
  );
}
