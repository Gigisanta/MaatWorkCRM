"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Download,
  AlertCircle,
  Loader2,
  Package,
  PieChart,
} from "lucide-react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { useSidebar } from "@/lib/sidebar-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  startOfWeek,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  endOfWeek,
  endOfMonth,
  endOfYear,
  isWithinInterval,
  format,
  parseISO,
  startOfDay,
  endOfQuarter,
} from "date-fns";

// Lazy chart wrappers
import LazyLineChart from '@/components/charts/lazy-line-chart';
import LazyBarChart from '@/components/charts/lazy-bar-chart';
import LazyPieChart from '@/components/charts/lazy-pie-chart';

function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      className="rounded-lg animate-pulse"
      style={{
        height,
        background: 'linear-gradient(135deg, rgba(139,92,246,0.04) 0%, rgba(139,92,246,0.08) 50%, rgba(139,92,246,0.04) 100%)',
      }}
    />
  );
}

// Types
interface Tag {
  id: string;
  name: string;
  color: string;
  value: number;
  _count?: { contactTags: number };
}

interface ContactTag {
  id: string;
  contactId: string;
  tagId: string;
  value: number | null;
  tag: Tag;
}

interface Contact {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  segment: string | null;
  source: string | null;
  createdAt: string;
  pipelineStageId: string | null;
  assignedTo: string | null;
  pipelineStage?: {
    id: string;
    name: string;
    order: number;
  } | null;
  tags?: ContactTag[];
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
}

interface Team {
  id: string;
  name: string;
  goals: TeamGoal[];
  members: TeamMember[];
}

interface TeamGoal {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  status: string;
}

interface TeamMember {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
  };
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
}

type PeriodFilter = "week" | "month" | "quarter" | "year";

const CHART_COLORS = [
  "#8B5CF6", "#4ADE80", "#FBBF24", "#38BDF8",
  "#F87171", "#A78BFA", "#10b981", "#f97316",
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass border border-white/10 rounded-lg p-3 bg-slate-900/90">
        <p className="text-sm font-medium text-white mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' && (entry.name.toLowerCase().includes('value') || entry.name.toLowerCase().includes('valor'))
              ? `$${entry.value.toLocaleString()}`
              : entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [period, setPeriod] = React.useState<PeriodFilter>("month");
  const { collapsed, setCollapsed } = useSidebar();

  const getDateRange = React.useCallback(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (period) {
      case "week":
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case "month":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "quarter":
        start = startOfQuarter(now);
        end = endOfQuarter(now);
        break;
      case "year":
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
    }

    return { start, end };
  }, [period]);

  // Fetch tags with contact counts
  const { data: tagsData, isLoading: tagsLoading, error: tagsError } = useQuery({
    queryKey: ["reports-tags", user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return { tags: [] };
      const response = await fetch(
        `/api/tags?organizationId=${user.organizationId}`
      );
      if (!response.ok) throw new Error("Failed to fetch tags");
      return response.json();
    },
    enabled: !!user?.organizationId && isAuthenticated,
  });

  // Fetch contacts with their tags
  const { data: contactsData, isLoading: contactsLoading, error: contactsError } = useQuery({
    queryKey: ["reports-contacts", user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return { contacts: [] };
      const response = await fetch(
        `/api/contacts?organizationId=${user.organizationId}&limit=1000`
      );
      if (!response.ok) throw new Error("Failed to fetch contacts");
      return response.json();
    },
    enabled: !!user?.organizationId && isAuthenticated,
  });

  // Fetch tasks
  const { data: tasksData, isLoading: tasksLoading, error: tasksError } = useQuery({
    queryKey: ["reports-tasks", user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return { tasks: [] };
      const response = await fetch(
        `/api/tasks?organizationId=${user.organizationId}&limit=1000`
      );
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    },
    enabled: !!user?.organizationId && isAuthenticated,
  });

  // Fetch teams with goals
  const { data: teamsData, isLoading: teamsLoading, error: teamsError } = useQuery({
    queryKey: ["reports-teams", user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return { teams: [] };
      const response = await fetch(
        `/api/teams?organizationId=${user.organizationId}&limit=100`
      );
      if (!response.ok) throw new Error("Failed to fetch teams");
      return response.json();
    },
    enabled: !!user?.organizationId && isAuthenticated,
  });

  // Fetch pipeline stages
  const { data: stagesData } = useQuery({
    queryKey: ["reports-stages", user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return { stages: [] };
      const response = await fetch(
        `/api/pipeline-stages?organizationId=${user.organizationId}`
      );
      if (!response.ok) throw new Error("Failed to fetch stages");
      return response.json();
    },
    enabled: !!user?.organizationId && isAuthenticated,
  });

  const tags: Tag[] = tagsData?.tags || [];
  const contacts: Contact[] = contactsData?.contacts || [];
  const tasks: Task[] = tasksData?.tasks || [];
  const teams: Team[] = teamsData?.teams || [];
  const stages: PipelineStage[] = stagesData?.stages || [];

  const { start: periodStart, end: periodEnd } = getDateRange();

  const filterByPeriod = React.useCallback(<T extends { createdAt: string }>(items: T[]): T[] => {
    return items.filter((item) => {
      try {
        const itemDate = parseISO(item.createdAt);
        return isWithinInterval(itemDate, { start: periodStart, end: periodEnd });
      } catch {
        return false;
      }
    });
  }, [periodStart, periodEnd]);

  const periodContacts = React.useMemo(() => filterByPeriod(contacts), [filterByPeriod, contacts]);
  const periodTasks = React.useMemo(() => filterByPeriod(tasks), [filterByPeriod, tasks]);

  // Total Pipeline Value = sum of all tag values from all contacts' tags
  const totalPipelineValue = React.useMemo(() => {
    return contacts.reduce((sum, contact) => {
      const contactTags = contact.tags || [];
      return sum + contactTags.reduce((tagSum, ct) => {
        // Use ContactTag.value if available, otherwise fall back to Tag.value
        return tagSum + (ct.value ?? ct.tag?.value ?? 0);
      }, 0);
    }, 0);
  }, [contacts]);

  // Active Contacts (not in "Caido" or "Cuenta vacia" stages)
  const inactiveStages = ["Caído", "Caida", "Cuenta vacia", "Cuenta Vacía"];
  const activeContacts = React.useMemo(() =>
    contacts.filter(
      (contact) => !contact.pipelineStage || !inactiveStages.includes(contact.pipelineStage.name)
    ).length, [contacts]
  );

  // Contacts by segment
  const contactsBySegment = React.useMemo(() => {
    const segmentMap = new Map<string, { name: string; count: number; value: number }>();
    const segmentColors: Record<string, string> = {
      "Premium": "#f59e0b",
      "Estándar": "#3b82f6",
      "Corporativo": "#8b5cf6",
    };

    contacts.forEach((contact) => {
      const segment = contact.segment || "Sin segmento";
      const existing = segmentMap.get(segment) || { name: segment, count: 0, value: 0 };
      existing.count += 1;
      const contactValue = (contact.tags || []).reduce((sum, ct) => sum + (ct.value ?? ct.tag?.value ?? 0), 0);
      existing.value += contactValue;
      segmentMap.set(segment, existing);
    });

    return Array.from(segmentMap.values())
      .map((s, i) => ({ ...s, color: segmentColors[s.name] || CHART_COLORS[i % CHART_COLORS.length] }))
      .sort((a, b) => b.count - a.count);
  }, [contacts]);

  // Contacts by source
  const contactsBySource = React.useMemo(() => {
    const sourceMap = new Map<string, { name: string; count: number }>();

    contacts.forEach((contact) => {
      const source = contact.source || "Sin fuente";
      const existing = sourceMap.get(source) || { name: source, count: 0 };
      existing.count += 1;
      sourceMap.set(source, existing);
    });

    return Array.from(sourceMap.values())
      .sort((a, b) => b.count - a.count);
  }, [contacts]);

  // Tag/Product distribution (most common tags)
  const tagDistribution = React.useMemo(() => {
    const tagMap = new Map<string, { name: string; count: number; value: number; color: string }>();

    contacts.forEach((contact) => {
      (contact.tags || []).forEach((ct) => {
        const tagName = ct.tag?.name || "Sin tag";
        const existing = tagMap.get(ct.tagId) || {
          name: tagName,
          count: 0,
          value: 0,
          color: ct.tag?.color || "#6366f1",
        };
        existing.count += 1;
        existing.value += ct.value ?? ct.tag?.value ?? 0;
        tagMap.set(ct.tagId, existing);
      });
    });

    return Array.from(tagMap.values())
      .sort((a, b) => b.count - a.count);
  }, [contacts]);

  // Pipeline by stage (based on contacts in each stage, summing their tag values)
  const pipelineByStage = React.useMemo(() => {
    const stageMap = new Map<string, { name: string; value: number; count: number; color: string; order: number }>();

    stages.forEach((stage) => {
      stageMap.set(stage.id, {
        name: stage.name,
        value: 0,
        count: 0,
        color: stage.color || CHART_COLORS[0],
        order: stage.order,
      });
    });

    contacts.forEach((contact) => {
      if (contact.pipelineStageId) {
        const stage = stageMap.get(contact.pipelineStageId);
        if (stage) {
          const contactValue = (contact.tags || []).reduce((sum, ct) => sum + (ct.value ?? ct.tag?.value ?? 0), 0);
          stage.value += contactValue;
          stage.count += 1;
        }
      }
    });

    return Array.from(stageMap.values())
      .sort((a, b) => a.order - b.order)
      .filter((stage) => stage.value > 0 || stage.count > 0);
  }, [stages, contacts]);

  // Contact trend
  const getContactTrend = React.useCallback(() => {
    const groupedByDate = new Map<string, { nuevos: number; activos: number; label: string }>();

    periodContacts.forEach((contact) => {
      try {
        const date = parseISO(contact.createdAt);
        let key: string;
        let label: string;

        if (period === "week") {
          key = format(date, "yyyy-MM-dd");
          label = format(date, "EEE d");
        } else if (period === "month") {
          const weekStart = startOfWeek(date, { weekStartsOn: 1 });
          key = format(weekStart, "yyyy-ww");
          label = `Sem ${format(weekStart, "w")}`;
        } else {
          key = format(date, "yyyy-MM");
          label = format(date, "MMM");
        }

        const existing = groupedByDate.get(key) || { nuevos: 0, activos: 0, label };
        existing.nuevos += 1;
        groupedByDate.set(key, existing);
      } catch {
        // Skip invalid dates
      }
    });

    return Array.from(groupedByDate.entries())
      .map(([_, data]) => data)
      .slice(-12);
  }, [periodContacts, period]);

  const contactTrend = React.useMemo(() => getContactTrend(), [getContactTrend]);

  // Overdue Tasks
  const now = new Date();
  const overdueTasks = React.useMemo(() =>
    tasks.filter((task) => {
      if (task.status === "completed" || task.status === "cancelled") return false;
      if (!task.dueDate) return false;
      try {
        const dueDate = parseISO(task.dueDate);
        return dueDate < startOfDay(now);
      } catch {
        return false;
      }
    }).length, [tasks]
  );

  // Average Goal Progress
  const allGoals: TeamGoal[] = React.useMemo(() =>
    teams.flatMap((team) => team.goals || []), [teams]
  );
  const averageGoalProgress = React.useMemo(() =>
    allGoals.length > 0
      ? allGoals.reduce((sum, goal) => {
          const progress = goal.targetValue > 0
            ? (goal.currentValue / goal.targetValue) * 100
            : 0;
          return sum + Math.min(progress, 100);
        }, 0) / allGoals.length
      : 0, [allGoals]
  );

  // Advisor Performance (by contacts and tag values)
  const getAdvisorPerformance = React.useCallback(() => {
    const advisorMap = new Map<string, { name: string; contacts: number; value: number; completedGoals: number; totalGoals: number }>();

    teams.forEach((team) => {
      const teamGoals = team.goals || [];
      team.members?.forEach((member) => {
        const userId = member.userId;
        const userName = member.user?.name || "Sin nombre";

        if (!advisorMap.has(userId)) {
          advisorMap.set(userId, {
            name: userName,
            contacts: 0,
            value: 0,
            completedGoals: 0,
            totalGoals: 0,
          });
        }

        const advisor = advisorMap.get(userId)!;
        advisor.totalGoals += teamGoals.length;
        advisor.completedGoals += teamGoals.filter((g) => g.status === "completed").length;
      });
    });

    // Add contact stats for period
    filterByPeriod(contacts).forEach((contact) => {
      if (contact.assignedTo) {
        // We don't have assignedUser on contact in this query, so we'll use contacts assigned to user
      }
    });

    // Also compute from all contacts by assigned user (need to fetch assigned users)
    // For now, show contacts per stage/segment totals instead
    return Array.from(advisorMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [teams, filterByPeriod, contacts]);

  const advisorPerformance = React.useMemo(() => getAdvisorPerformance(), [getAdvisorPerformance]);

  // Period comparison
  const getPreviousPeriodChange = React.useCallback((current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }, []);

  const getPreviousPeriodRange = React.useCallback(() => {
    const { start, end } = getDateRange();
    const duration = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - duration);
    return { start: prevStart, end: prevEnd };
  }, [getDateRange]);

  const prevRange = React.useMemo(() => getPreviousPeriodRange(), [getPreviousPeriodRange]);

  const previousPeriodContacts = React.useMemo(() => contacts.filter((contact) => {
    try {
      const date = parseISO(contact.createdAt);
      return isWithinInterval(date, prevRange);
    } catch {
      return false;
    }
  }), [contacts, prevRange]);

  // Previous period pipeline value
  const previousPipelineValue = React.useMemo(() =>
    previousPeriodContacts.reduce((sum, contact) => {
      return sum + (contact.tags || []).reduce((tagSum, ct) => tagSum + (ct.value ?? ct.tag?.value ?? 0), 0);
    }, 0), [previousPeriodContacts]
  );

  const pipelineChange = React.useMemo(() =>
    getPreviousPeriodChange(totalPipelineValue, previousPipelineValue), [getPreviousPeriodChange, totalPipelineValue, previousPipelineValue]
  );

  const contactsChange = React.useMemo(() =>
    getPreviousPeriodChange(periodContacts.length, previousPeriodContacts.length), [getPreviousPeriodChange, periodContacts.length, previousPeriodContacts.length]
  );

  // Goals change
  const goalsChange = React.useMemo(() =>
    allGoals.length > 0
      ? allGoals.filter((g) => g.status === "completed").length / allGoals.length * 100
      : 0, [allGoals]
  );

  // Export to CSV
  const exportToCSV = React.useCallback(() => {
    if (!contacts || contacts.length === 0) {
      toast.info("No hay datos para exportar");
      return;
    }

    const escapeCell = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const row = (cells: string[]) => cells.map(escapeCell).join(",");

    const csvRows: string[] = [];

    csvRows.push(row(["Reporte de MaatWork CRM", format(new Date(), "dd/MM/yyyy HH:mm")]));
    csvRows.push("");

    // KPIs
    csvRows.push(row(["KPIs", ""]));
    csvRows.push(row(["Valor Pipeline Total", totalPipelineValue.toLocaleString()]));
    csvRows.push(row(["Contactos Activos", activeContacts.toString()]));
    csvRows.push(row(["Tareas Vencidas", overdueTasks.toString()]));
    csvRows.push(row(["Progreso Promedio Objetivos", `${averageGoalProgress.toFixed(1)}%`]));
    csvRows.push("");

    // Contacts detail
    csvRows.push(row(["Nombre", "Email", "Empresa", "Segmento", "Fuente", "Etapa", "Fecha creacion"]));
    contacts.forEach((c) => {
      csvRows.push(row([
        c.name ?? "",
        c.email ?? "",
        c.company ?? "",
        c.segment ?? "",
        c.source ?? "",
        c.pipelineStage?.name ?? "",
        c.createdAt ? new Date(c.createdAt).toLocaleDateString("es-MX") : "",
      ]));
    });
    csvRows.push("");

    // Pipeline by Stage
    csvRows.push(row(["Pipeline por Etapa", "", ""]));
    csvRows.push(row(["Etapa", "Valor", "Cantidad"]));
    pipelineByStage.forEach((stage) => {
      csvRows.push(row([stage.name, stage.value.toString(), stage.count.toString()]));
    });
    csvRows.push("");

    // Contacts by Segment
    csvRows.push(row(["Contactos por Segmento", "", ""]));
    csvRows.push(row(["Segmento", "Cantidad", "Valor"]));
    contactsBySegment.forEach((seg) => {
      csvRows.push(row([seg.name, seg.count.toString(), seg.value.toString()]));
    });
    csvRows.push("");

    // Contacts by Source
    csvRows.push(row(["Contactos por Fuente", ""]));
    csvRows.push(row(["Fuente", "Cantidad"]));
    contactsBySource.forEach((src) => {
      csvRows.push(row([src.name, src.count.toString()]));
    });
    csvRows.push("");

    // Tag Distribution
    csvRows.push(row(["Distribucion de Productos/Tags", "", ""]));
    csvRows.push(row(["Tag", "Cantidad", "Valor"]));
    tagDistribution.forEach((tag) => {
      csvRows.push(row([tag.name, tag.count.toString(), tag.value.toString()]));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-maatwork-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Reporte exportado");
  }, [contacts, totalPipelineValue, activeContacts, overdueTasks, averageGoalProgress, pipelineByStage, contactsBySegment, contactsBySource, tagDistribution]);

  const isLoading = tagsLoading || contactsLoading || tasksLoading || teamsLoading;

  if (authLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl p-8">
          <CardContent className="text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Acceso Requerido</h2>
            <p className="text-slate-400">Inicia sesion para ver los reportes</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <AppSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
      <div className={cn("transition-all duration-300", collapsed ? "lg:pl-[80px]" : "lg:pl-[220px]")}>
        <AppHeader />
        <main className="p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div>
                  <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-1">REPORTES</p>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Reportes</h1>
                  <p className="text-slate-500 mt-1 text-sm">Analisis y metricas de tu negocio</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
                  <SelectTrigger className="w-[160px] bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Esta semana</SelectItem>
                    <SelectItem value="month">Este mes</SelectItem>
                    <SelectItem value="quarter">Este trimestre</SelectItem>
                    <SelectItem value="year">Este ano</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl text-slate-300"
                  onClick={exportToCSV}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              </div>
            ) : (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      title: "Valor Pipeline",
                      value: `$${totalPipelineValue.toLocaleString()}`,
                      change: pipelineChange,
                      icon: DollarSign,
                      color: "text-violet-400",
                      bgColor: "bg-violet-500/10"
                    },
                    {
                      title: "Nuevos Contactos",
                      value: periodContacts.length.toString(),
                      change: contactsChange,
                      icon: Users,
                      color: "text-emerald-400",
                      bgColor: "bg-emerald-500/10"
                    },
                    {
                      title: "Tareas Vencidas",
                      value: overdueTasks.toString(),
                      change: 0,
                      icon: Target,
                      color: overdueTasks > 0 ? "text-rose-400" : "text-amber-400",
                      bgColor: overdueTasks > 0 ? "bg-rose-500/10" : "bg-amber-500/10"
                    },
                    {
                      title: "Progreso Objetivos",
                      value: `${averageGoalProgress.toFixed(0)}%`,
                      change: goalsChange,
                      icon: BarChart3,
                      color: "text-violet-400",
                      bgColor: "bg-violet-500/10"
                    },
                  ].map((kpi, i) => (
                    <Card key={i} className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className={cn("p-2 rounded-lg", kpi.bgColor)}>
                            <kpi.icon className={cn("h-5 w-5", kpi.color)} />
                          </div>
                          {kpi.change !== 0 && (
                            <div className={cn(
                              "flex items-center gap-1 text-sm font-medium",
                              kpi.change >= 0 ? "text-emerald-500" : "text-rose-500"
                            )}>
                              {kpi.change >= 0 ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                              {Math.abs(kpi.change).toFixed(1)}%
                            </div>
                          )}
                        </div>
                        <div className="mt-4">
                          <p className="text-sm text-slate-400">{kpi.title}</p>
                          <p className="text-2xl font-bold text-white mt-1">{kpi.value}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Additional KPIs Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                    <CardContent className="p-4">
                      <p className="text-sm text-slate-400">Contactos Totales</p>
                      <p className="text-xl font-bold text-violet-400">{contacts.length}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                    <CardContent className="p-4">
                      <p className="text-sm text-slate-400">Contactos Activos</p>
                      <p className="text-xl font-bold text-blue-400">{activeContacts}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                    <CardContent className="p-4">
                      <p className="text-sm text-slate-400">Productos/Servicios</p>
                      <p className="text-xl font-bold text-amber-400">{tags.length}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pipeline by Stage */}
                  <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">
                        Pipeline por Etapa
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {pipelineByStage.length > 0 ? (
                          <LazyBarChart data={pipelineByStage} layout="vertical" dataKey="value" nameKey="name" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400">
                            No hay datos disponibles
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Product/Tag Distribution */}
                  <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">
                        Distribucion de Productos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {tagDistribution.length > 0 ? (
                          <LazyPieChart
                            data={tagDistribution.map(t => ({ name: t.name, value: t.count, color: t.color }))}
                            innerRadius={60}
                            outerRadius={100}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400">
                            No hay datos disponibles
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Contact Trend */}
                  <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">
                        Tendencia de Contactos Nuevos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {contactTrend.length > 0 ? (
                          <LazyLineChart data={contactTrend} dataKey="nuevos" name="label" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400">
                            No hay datos disponibles para el periodo seleccionado
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contacts by Segment */}
                  <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">
                        Contactos por Segmento
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {contactsBySegment.length > 0 ? (
                          <LazyBarChart data={contactsBySegment} nameKey="name" dataKey="count" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400">
                            No hay datos disponibles
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Row 3 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Contacts by Source */}
                  <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">
                        Contactos por Fuente
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {contactsBySource.length > 0 ? (
                          <LazyPieChart
                            data={contactsBySource.map((s, i) => ({ name: s.name, value: s.count, color: CHART_COLORS[i % CHART_COLORS.length] }))}
                            innerRadius={60}
                            outerRadius={100}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400">
                            No hay datos disponibles
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contacts by Stage Count */}
                  <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">
                        Contactos por Etapa
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {pipelineByStage.length > 0 ? (
                          <LazyBarChart data={pipelineByStage} nameKey="name" dataKey="count" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400">
                            No hay datos disponibles
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Team Goals Progress */}
                <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">
                      Progreso de Objetivos por Equipo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {allGoals.length > 0 ? (
                      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                        {teams.map((team) => {
                          const teamGoals = team.goals || [];
                          if (teamGoals.length === 0) return null;
                          return (
                            <div key={team.id} className="p-4 rounded-lg glass border border-white/10">
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-medium text-white">{team.name}</span>
                                <span className="text-sm text-slate-400">
                                  {teamGoals.filter(g => g.status === "completed").length}/{teamGoals.length} objetivos
                                </span>
                              </div>
                              <div className="space-y-2">
                                {teamGoals.map((goal, i) => {
                                  const progress = goal.targetValue > 0
                                    ? Math.min((goal.currentValue / goal.targetValue) * 100, 100)
                                    : 0;
                                  return (
                                    <div key={goal.id} className="flex items-center gap-3">
                                      <span className="text-sm text-slate-300 w-32 truncate">{goal.title}</span>
                                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: `${progress}%` }}
                                          transition={{ duration: 0.8, delay: i * 0.1 }}
                                          className={cn(
                                            "h-full rounded-full",
                                            goal.status === "completed" ? "bg-emerald-500" : "bg-gradient-to-r from-violet-500 to-violet-400"
                                          )}
                                        />
                                      </div>
                                      <span className="text-xs text-slate-400 w-20 text-right">
                                        ${goal.currentValue.toLocaleString()} / ${goal.targetValue.toLocaleString()}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        No hay datos de objetivos disponibles
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Task Analytics */}
                <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">
                      Analisis de Tareas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        {
                          label: "Total Tareas",
                          value: tasks.length,
                          color: "text-white"
                        },
                        {
                          label: "Pendientes",
                          value: tasks.filter(t => t.status === "pending").length,
                          color: "text-amber-400"
                        },
                        {
                          label: "En Progreso",
                          value: tasks.filter(t => t.status === "in_progress").length,
                          color: "text-blue-400"
                        },
                        {
                          label: "Completadas",
                          value: tasks.filter(t => t.status === "completed").length,
                          color: "text-emerald-400"
                        },
                      ].map((stat, i) => (
                        <div key={i} className="text-center p-4 rounded-lg bg-slate-800/50">
                          <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                          <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                    {overdueTasks > 0 && (
                      <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                        <p className="text-sm text-rose-400">
                          Tienes {overdueTasks} tarea{overdueTasks > 1 ? "s" : ""} vencida{overdueTasks > 1 ? "s" : ""}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
