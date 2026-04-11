"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Users,
  AlertCircle,
  Download,
} from "lucide-react";
import { useSidebar } from "@/contexts/sidebar-context";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/utils";
import { canCreateTeam } from "@/lib/roles";
import {
  Team,
  User,
  TeamsResponse,
  CreateTeamForm,
  CreateGoalForm,
  AddMemberForm,
} from "../types";
import { TeamsList } from "./teams-list";
import { TeamDetailDrawer } from "./team-detail-drawer";
import { TeamFormDialog } from "./team-form-dialog";

export default function TeamsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = React.useState<Team | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [createTeamOpen, setCreateTeamOpen] = React.useState(false);
  const { collapsed, setCollapsed } = useSidebar();

  // Fetch teams
  const { data: teamsData, isLoading, error } = useQuery<TeamsResponse>({
    queryKey: ["teams", user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) {
        throw new Error("No organization ID");
      }
      const response = await fetch(
        `/api/teams?organizationId=${user.organizationId}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch teams");
      return response.json();
    },
    enabled: !!user?.organizationId,
  });

  // Fetch users for team creation
  const { data: usersData } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/auth/managers", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      return data.managers as User[];
    },
  });

  // Fetch single team details
  const { data: teamDetails, refetch: refetchTeamDetails } = useQuery<Team>({
    queryKey: ["team", selectedTeam?.id],
    queryFn: async () => {
      if (!selectedTeam?.id) return null as unknown as Team;
      const response = await fetch(`/api/teams/${selectedTeam.id}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch team");
      return response.json();
    },
    enabled: !!selectedTeam?.id && drawerOpen,
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (data: CreateTeamForm) => {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          organizationId: user?.organizationId,
        }),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create team");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setCreateTeamOpen(false);
      toast.success("Equipo creado exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Add member mutation - sends invitation via team-join-requests
  const addMemberMutation = useMutation({
    mutationFn: async ({ teamId, data }: { teamId: string; data: AddMemberForm }) => {
      const response = await fetch("/api/team-join-requests", {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, targetUserId: data.userId, role: data.role }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send invitation");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      refetchTeamDetails();
      toast.success("Invitación enviada. El usuario deberá aceptarla.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update team leader mutation
  const updateLeaderMutation = useMutation({
    mutationFn: async ({ teamId, leaderId }: { teamId: string; leaderId: string }) => {
      const response = await fetch(`/api/teams/${teamId}`, {
        credentials: "include",
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaderId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update leader");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      refetchTeamDetails();
      toast.success("Líder del equipo actualizado");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async ({ teamId, memberId }: { teamId: string; memberId: string }) => {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        credentials: "include",
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove member");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      refetchTeamDetails();
      toast.success("Miembro removido exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async ({ teamId, data }: { teamId: string; data: CreateGoalForm }) => {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, teamId }),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create goal");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      refetchTeamDetails();
      toast.success("Objetivo creado exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update goal progress mutation
  const updateGoalMutation = useMutation({
    mutationFn: async ({ goalId, currentValue }: { goalId: string; currentValue: number }) => {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentValue }),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update goal");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      refetchTeamDetails();
      toast.success("Progreso actualizado");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete goal");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      refetchTeamDetails();
      toast.success("Objetivo eliminado");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleTeamClick = (team: Team) => {
    setSelectedTeam(team);
    setDrawerOpen(true);
  };

  const teams = teamsData?.teams || [];
  const users = usersData || [];

  // Determinar si el usuario puede crear equipos
  const userCanCreateTeam = user ? canCreateTeam(user.role) : false;

  return (
    <div className="min-h-screen gradient-bg">
      <AppSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
      <div
        className={cn(
          "transition-all duration-300",
          collapsed ? "lg:pl-[80px]" : "lg:pl-[220px]"
        )}
      >
        <AppHeader />
        <main className="p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            {/* Header */}
            <PageHeader
              userCanCreateTeam={userCanCreateTeam}
              onCreateTeam={() => setCreateTeamOpen(true)}
            />

            {/* Loading State */}
            {isLoading && <TeamsListSkeleton />}

            {/* Error State */}
            {error && (
              <ErrorState
                onRetry={() =>
                  queryClient.invalidateQueries({ queryKey: ["teams"] })
                }
              />
            )}

            {/* Empty State */}
            {!isLoading && !error && teams.length === 0 && (
              <EmptyState
                userCanCreateTeam={userCanCreateTeam}
                onCreateTeam={() => setCreateTeamOpen(true)}
              />
            )}

            {/* Teams Grid */}
            {!isLoading && !error && teams.length > 0 && (
              <>
                <TeamsList teams={teams} onTeamClick={handleTeamClick} />
                <ToolsSection />
              </>
            )}
          </motion.div>
        </main>
      </div>

      {/* Create Team Dialog */}
      <TeamFormDialog
        open={createTeamOpen}
        onOpenChange={setCreateTeamOpen}
        users={users}
        onSubmit={(data) => createTeamMutation.mutate(data)}
      />

      {/* Team Detail Drawer */}
      <TeamDetailDrawer
        team={teamDetails || selectedTeam}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTeam(null);
        }}
        users={users}
        onAddMember={(data) => {
          if (selectedTeam) {
            addMemberMutation.mutate({ teamId: selectedTeam.id, data });
          }
        }}
        onRemoveMember={(memberId) => {
          if (selectedTeam) {
            removeMemberMutation.mutate({ teamId: selectedTeam.id, memberId });
          }
        }}
        onCreateGoal={(data) => {
          if (selectedTeam) {
            createGoalMutation.mutate({ teamId: selectedTeam.id, data });
          }
        }}
        onUpdateGoalProgress={(goalId, currentValue) => {
          updateGoalMutation.mutate({ goalId, currentValue });
        }}
        onDeleteGoal={(goalId) => {
          deleteGoalMutation.mutate(goalId);
        }}
        onUpdateLeader={(leaderId) => {
          if (selectedTeam) {
            updateLeaderMutation.mutate({ teamId: selectedTeam.id, leaderId });
          }
        }}
      />
    </div>
  );
}

// ============ SUB-COMPONENTS ============

function PageHeader({
  userCanCreateTeam,
  onCreateTeam,
}: {
  userCanCreateTeam: boolean;
  onCreateTeam: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div>
          <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-1">
            EQUIPOS
          </p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Equipos</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Gestiona tus equipos y objetivos
          </p>
        </div>
      </div>
      {userCanCreateTeam && (
        <Button className="bg-violet-500 hover:bg-violet-600" onClick={onCreateTeam}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Equipo
        </Button>
      )}
    </div>
  );
}

function TeamsListSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-white/8 bg-[#0E0F12]/80 p-5 space-y-4"
        >
          {/* Team header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-36 bg-white/5" />
              <Skeleton className="h-3 w-24 bg-white/5" />
            </div>
            <Skeleton className="h-8 w-8 rounded-lg bg-white/5" />
          </div>
          {/* Stats row */}
          <div className="flex gap-4">
            <Skeleton className="h-10 w-20 bg-white/5" />
            <Skeleton className="h-10 w-20 bg-white/5" />
          </div>
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16 bg-white/5" />
              <Skeleton className="h-3 w-8 bg-white/5" />
            </div>
            <Skeleton className="h-2 w-full bg-white/5 rounded-full" />
          </div>
          {/* Avatar row */}
          <div className="flex -space-x-2">
            {[1, 2, 3].map((j) => (
              <Skeleton
                key={j}
                className="h-7 w-7 rounded-full bg-white/5 ring-2 ring-[#08090B]"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="glass border-rose-500/30">
      <CardContent className="p-6 text-center">
        <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-2" />
        <p className="text-rose-400">Error al cargar los equipos</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          Reintentar
        </Button>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  userCanCreateTeam,
  onCreateTeam,
}: {
  userCanCreateTeam: boolean;
  onCreateTeam: () => void;
}) {
  return (
    <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
      <CardContent className="p-12 text-center">
        <Users className="h-12 w-12 text-slate-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No hay equipos</h3>
        <p className="text-slate-400 mb-4">
          Crea tu primer equipo para comenzar a gestionar objetivos y miembros
        </p>
        {userCanCreateTeam && (
          <Button className="bg-violet-500 hover:bg-violet-600" onClick={onCreateTeam}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Equipo
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ToolsSection() {
  return (
    <div className="mt-6 p-4 glass rounded-xl border border-white/10">
      <h3 className="text-lg font-semibold text-white mb-3">Herramientas</h3>
      <div className="flex gap-3">
        <a
          href="/api/teams/template/startup-100"
          download
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 rounded-lg text-violet-300 text-sm transition-colors"
        >
          <Download className="h-4 w-4" />
          Descargar Plantilla Startup 100
        </a>
      </div>
      <p className="text-xs text-slate-500 mt-2">
        Descargue la plantilla para importar contactos de nuevos asesores al CRM.
      </p>
    </div>
  );
}
