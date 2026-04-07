'use client';

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Target } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { useSidebar } from "@/lib/sidebar-context";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MobileFAB } from "@/components/ui/mobile-fab";

import { GoalStats, GoalStatsCards } from "./components/goal-stats";
import { GoalFilters, type GoalStatus, type GoalType, type GoalPeriod } from "./components/goal-filters";
import { GoalList } from "./components/goal-list";
import { GoalCreateModal } from "./components/goal-create-modal";
import type { Goal } from "./components/goal-card";

// Dynamic import for modal
const GoalCreateModalComponent = dynamic(
  () => import("./components/goal-create-modal").then((m) => m.GoalCreateModal),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <Skeleton className="w-[500px] h-[600px] rounded-xl" />
      </div>
    ),
  }
);

interface GoalsResponse {
  goals: Goal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Helper to get period string from period type
function getPeriodString(period: GoalPeriod): string | undefined {
  if (period === "all") return undefined;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  switch (period) {
    case "this_month":
      return `${year}-${String(month).padStart(2, "0")}`;
    case "this_quarter":
      const quarterMonth = Math.floor((month - 1) / 3) * 3 + 1;
      return `${year}-${String(quarterMonth).padStart(2, "0")}`;
    case "this_year":
      return String(year);
    default:
      return undefined;
  }
}

// Main Goals Page
export default function GoalsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { collapsed, setCollapsed } = useSidebar();

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#08090B] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/15 flex items-center justify-center mx-auto">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          </div>
          <p className="text-slate-500 text-sm">Cargando objetivos...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    router.push("/login");
    return (
      <div className="min-h-screen bg-[#08090B] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/15 flex items-center justify-center mx-auto">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          </div>
          <p className="text-slate-500 text-sm">Redirigiendo a login...</p>
        </div>
      </div>
    );
  }

  return <GoalsPageContent userId={user.id} organizationId={user.organizationId ?? null} collapsed={collapsed} setCollapsed={setCollapsed} />;
}

interface GoalsPageContentProps {
  userId: string;
  organizationId: string | null;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

function GoalsPageContent({ userId, organizationId, collapsed, setCollapsed }: GoalsPageContentProps) {
  const queryClient = useQueryClient();

  // State
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<GoalStatus>("all");
  const [type, setType] = React.useState<GoalType>("all");
  const [period, setPeriod] = React.useState<GoalPeriod>("this_month");
  const [showTeamGoals, setShowTeamGoals] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"mine" | "team" | "all">("mine");
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [editingGoal, setEditingGoal] = React.useState<Goal | null>(null);
  const [deletingGoal, setDeletingGoal] = React.useState<Goal | null>(null);

  // Debounced search
  const debouncedSearch = useDebounce(search, 300);

  // Fetch user goals
  const {
    data: goalsData,
    isLoading,
    error,
    refetch,
  } = useQuery<GoalsResponse>({
    queryKey: ["goals", userId, debouncedSearch, status, type, period, activeTab],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (status !== "all") params.set("status", status);
      if (type !== "all") params.set("type", type);
      const periodString = getPeriodString(period);
      if (periodString) params.set("period", periodString);

      const response = await fetch(`/api/goals/user?${params.toString()}`, { credentials: "include" });
      if (!response.ok) throw new Error("Error al cargar objetivos");
      return response.json();
    },
    enabled: !!userId,
  });

  // Fetch team goals if showing team goals
  const {
    data: teamGoalsData,
    isLoading: teamGoalsLoading,
  } = useQuery<GoalsResponse>({
    queryKey: ["team-goals", organizationId, status, type, period],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (type !== "all") params.set("type", type);
      const periodString = getPeriodString(period);
      if (periodString) params.set("period", periodString);

      const response = await fetch(`/api/goals?${params.toString()}`, { credentials: "include" });
      if (!response.ok) throw new Error("Error al cargar objetivos de equipo");
      return response.json();
    },
    enabled: !!organizationId && (showTeamGoals || activeTab === "team"),
  });

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await fetch("/api/goals/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear objetivo");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Objetivo creado exitosamente");
      setCreateModalOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const response = await fetch(`/api/goals/user/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar objetivo");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Objetivo actualizado");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const response = await fetch(`/api/goals/user/${goalId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar objetivo");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Objetivo eliminado");
      setDeletingGoal(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Archive goal mutation
  const archiveGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const response = await fetch(`/api/goals/user/${goalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al archivar objetivo");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Objetivo archivado");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ goalId, currentValue }: { goalId: string; currentValue: number }) => {
      const response = await fetch(`/api/goals/user/${goalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentValue }),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar progreso");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Progreso actualizado");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const goals = goalsData?.goals || [];
  const teamGoals = teamGoalsData?.goals || [];

  // Stats calculations
  const totalGoals = goals.length;
  const inProgressGoals = goals.filter((g) => g.status === "active").length;
  const completedGoals = goals.filter((g) => g.status === "completed").length;
  const averageProgress =
    totalGoals > 0
      ? goals.reduce((sum, g) => {
          const progress = g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0;
          return sum + progress;
        }, 0) / totalGoals
      : 0;

  // Handlers
  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setCreateModalOpen(true);
  };

  const handleDelete = (goal: Goal) => {
    if (confirm(`¿Eliminar el objetivo "${goal.title}"?`)) {
      deleteGoalMutation.mutate(goal.id);
    }
  };

  const handleArchive = (goal: Goal) => {
    archiveGoalMutation.mutate(goal.id);
  };

  const handleUpdateProgress = (goal: Goal) => {
    const newValue = prompt(
      `Actualizar progreso para "${goal.title}"\nValor actual: ${goal.currentValue}\nMeta: ${goal.targetValue}`,
      String(goal.currentValue)
    );
    if (newValue !== null) {
      const value = parseFloat(newValue);
      if (!isNaN(value) && value >= 0) {
        updateProgressMutation.mutate({ goalId: goal.id, currentValue: value });
      } else {
        toast.error("Valor inválido");
      }
    }
  };

  const handleModalClose = () => {
    setCreateModalOpen(false);
    setEditingGoal(null);
  };

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
            className="space-y-5"
          >
            {/* Header Stats */}
            <GoalStats
              total={totalGoals}
              inProgress={inProgressGoals}
              completed={completedGoals}
              averageProgress={averageProgress}
              isLoading={isLoading}
              onCreateClick={() => setCreateModalOpen(true)}
            />

            {/* Quick stats cards */}
            <GoalStatsCards
              total={totalGoals}
              inProgress={inProgressGoals}
              completed={completedGoals}
              averageProgress={averageProgress}
              isLoading={isLoading}
            />

            {/* Filters */}
            <GoalFilters
              search={search}
              onSearchChange={setSearch}
              status={status}
              onStatusChange={setStatus}
              type={type}
              onTypeChange={setType}
              period={period}
              onPeriodChange={setPeriod}
              showTeamGoals={showTeamGoals}
              onShowTeamGoalsChange={setShowTeamGoals}
            />

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="bg-[#0E0F12]/60 border border-white/8">
                <TabsTrigger value="mine">Mis Objetivos</TabsTrigger>
                <TabsTrigger value="team">Objetivos de Equipo</TabsTrigger>
                <TabsTrigger value="all">Todos</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Goal Lists */}
            {(activeTab === "mine" || activeTab === "all") && (
              <GoalList
                goals={goals}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onArchive={handleArchive}
                onUpdateProgress={handleUpdateProgress}
                onCreateClick={() => setCreateModalOpen(true)}
                emptyMessage="Crea tu primer objetivo para comenzar a seguir tu progreso"
              />
            )}

            {activeTab === "team" && (
              <GoalList
                goals={teamGoals}
                isLoading={teamGoalsLoading}
                onEdit={() => {}}
                onDelete={() => {}}
                onArchive={() => {}}
                onUpdateProgress={() => {}}
                onCreateClick={() => setCreateModalOpen(true)}
                emptyMessage="No hay objetivos de equipo disponibles"
              />
            )}

            {activeTab === "all" && showTeamGoals && teamGoals.length > 0 && (
              <>
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                  Objetivos de Equipo
                </h3>
                <GoalList
                  goals={teamGoals}
                  isLoading={teamGoalsLoading}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onArchive={() => {}}
                  onUpdateProgress={() => {}}
                  onCreateClick={() => setCreateModalOpen(true)}
                />
              </>
            )}
          </motion.div>
        </main>
      </div>

      {/* Create/Edit Goal Modal */}
      <GoalCreateModalComponent
        open={createModalOpen}
        onClose={handleModalClose}
        goalToEdit={editingGoal}
      />

      {/* Mobile FAB */}
      <MobileFAB
        actions={[
          {
            label: "Nuevo objetivo",
            icon: Target,
            onClick: () => setCreateModalOpen(true),
          },
        ]}
      />
    </div>
  );
}
