// ============================================================
// MaatWork CRM — Teams Page
// UI/UX REFINED BY JULES v2
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AlertTriangle, Crown, Plus, Settings, Sparkles, Target, UserCheck, Users } from "lucide-react";
import React, { useState } from "react";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { EditTeamModal } from "~/components/ui/EditTeamModal";
import { EmptyState } from "~/components/ui/EmptyState";
import { Icon } from "~/components/ui/Icon";
import { Input } from "~/components/ui/Input";
import { Container, Grid, Stack } from "~/components/ui/Layout";
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "~/components/ui/Modal";
import {
  useCreateTeamMutation,
  useTeamDetails,
  useTeamGoals,
  useTeams,
  useUpdateGoalMutation,
  useUpdateTeamMutation,
} from "~/lib/hooks/use-crm";
import { cn, formatCurrency } from "~/lib/utils";

export const Route = createFileRoute("/_app/teams/")({
  component: TeamsPage,
});

function TeamDetailView({
  teamId,
  onEdit,
}: { teamId: string; onEdit?: (team: { id: string; name: string; description?: string }) => void }) {
  const { data: details, isLoading: loadingDetails } = useTeamDetails(teamId);
  const { data: goals, isLoading: loadingGoals } = useTeamGoals(teamId);
  const updateGoalMutation = useUpdateGoalMutation();

  if (loadingDetails || loadingGoals) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-48 bg-surface-hover rounded-3xl border border-border" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-surface-hover rounded-3xl border border-border" />
          <div className="lg:col-span-2 h-64 bg-surface-hover rounded-3xl border border-border" />
        </div>
      </div>
    );
  }

  if (!details) return null;

  const { team, members } = details;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Team Header Card */}
      <Card variant="cyber" className="overflow-hidden border-border bg-surface">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-accent/10 to-surface relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
        </div>
        <CardContent className="px-8 pb-8 -mt-12 relative z-10">
          <Stack direction="row" align="end" justify="between" className="mb-6">
            <div className="w-24 h-24 rounded-3xl bg-background border-4 border-background shadow-xl flex items-center justify-center relative group">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:bg-primary/40 transition-all duration-500" />
              <div className="w-full h-full rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center relative z-10 border border-white/10">
                <Users className="text-white w-10 h-10" />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-border hover:bg-surface-hover text-text-secondary hover:text-text"
              onClick={() => onEdit?.({ id: team.id, name: team.name, description: team.description || undefined })}
            >
              <Settings className="w-4 h-4 mr-2" />
              Editar Equipo
            </Button>
          </Stack>

          <Stack direction="col" gap="xs">
            <h2 className="text-3xl font-bold text-text font-display tracking-tight">{team.name}</h2>
            <p className="text-text-muted text-sm max-w-2xl font-medium">
              {team.description || "Sin descripción."}
            </p>
          </Stack>
        </CardContent>
      </Card>

      <Grid cols={{ sm: 1, lg: 3 }} gap={6}>
        {/* Members List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
              <UserCheck size={14} className="text-primary" /> Miembros
            </h3>
            <Badge variant="outline" className="bg-surface-hover border-border text-text-secondary font-bold">
              {members.length}
            </Badge>
          </div>
          <div className="grid gap-3">
            {members.map((m: any, idx: number) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={m.member.id}
              >
                <Card className="hover:shadow-[0_4px_15px_rgba(0,0,0,0.1)] border-border bg-surface-hover/50 backdrop-blur-sm transition-all duration-300 group">
                  <CardContent className="p-3.5 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center font-bold text-primary group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">
                      {m.user?.name?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-text truncate group-hover:text-primary-light transition-colors">
                        {m.user?.name}
                      </p>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold mt-0.5">
                        {m.member.role}
                      </p>
                    </div>
                    {team.leaderId === m.user?.id && (
                      <div className="w-6 h-6 rounded-full bg-warning/10 flex items-center justify-center border border-warning/20">
                        <Crown className="text-warning w-3.5 h-3.5" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            <Button
              variant="ghost"
              className="w-full justify-start h-12 text-text-muted hover:text-primary hover:bg-primary/5 border border-dashed border-border hover:border-primary/30 rounded-xl transition-all"
            >
              <Plus size={16} className="mr-2" /> Invitar Miembro
            </Button>
          </div>
        </div>

        {/* Goals Progress */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
              <Target size={14} className="text-accent" /> Metas del Equipo
            </h3>
            <Button variant="ghost" size="sm" className="h-8 text-xs text-primary hover:bg-primary/10 font-semibold">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Análisis IA
            </Button>
          </div>
          <div className="grid gap-4">
            {goals?.length === 0 ? (
              <EmptyState
                title="Sin metas activas"
                description="Este equipo no tiene metas asignadas para el período actual."
                icon={<Target className="text-text-muted/50 w-12 h-12" />}
              />
            ) : (
              goals?.map((goal: any, idx: number) => {
                const progress = Math.min(
                  Math.round(((Number(goal.currentValue) || 0) / (Number(goal.targetValue) || 1)) * 100),
                  100,
                );
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={goal.id}
                  >
                    <Card
                      variant="glass"
                      className="border-border bg-surface hover:border-primary/30 transition-colors group"
                    >
                      <CardContent className="p-6 space-y-5">
                        <Stack direction="row" align="center" justify="between">
                          <Stack direction="col" gap="xs">
                            <h4 className="font-bold text-text text-lg tracking-tight group-hover:text-primary-light transition-colors">
                              {goal.title}
                            </h4>
                            <p className="text-xs text-text-muted font-medium flex items-center gap-1.5">
                              <Icon name="calendar" className="w-3.5 h-3.5" />
                              Termina {new Date(goal.endDate).toLocaleDateString()}
                            </p>
                          </Stack>
                          <div className="flex flex-col items-end">
                            <span
                              className={cn(
                                "text-3xl font-black font-display tracking-tighter",
                                progress >= 90 ? "text-success" : progress >= 50 ? "text-primary" : "text-warning",
                              )}
                            >
                              {progress}%
                            </span>
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                              Completado
                            </span>
                          </div>
                        </Stack>

                        <div className="relative h-3 rounded-full bg-background overflow-hidden shadow-inner border border-border/50">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={cn(
                              "h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]",
                              progress >= 90 ? "bg-success" : "bg-gradient-to-r from-primary to-accent",
                            )}
                          />
                        </div>

                        <Stack direction="row" justify="between" className="pt-2 border-t border-border/50">
                          <div className="text-xs font-semibold text-text-secondary">
                            Actual:{" "}
                            <span className="text-text font-bold ml-1">
                              {goal.unit === "currency" ? formatCurrency(goal.currentValue) : goal.currentValue}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-text-secondary text-right">
                            Meta:{" "}
                            <span className="text-text font-bold ml-1">
                              {goal.unit === "currency" ? formatCurrency(goal.targetValue) : goal.targetValue}
                            </span>
                          </div>
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </Grid>
    </motion.div>
  );
}

function TeamsPage() {
  const { data: teams, isLoading, error } = useTeams();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<{ id: string; name: string; description?: string } | null>(null);
  const [newTeamForm, setNewTeamForm] = useState({ name: "", description: "" });

  const createTeamMutation = useCreateTeamMutation();
  const updateTeamMutation = useUpdateTeamMutation();

  const handleCreateTeam = async () => {
    if (!newTeamForm.name) return;
    try {
      const res = await createTeamMutation.mutateAsync(newTeamForm);
      setShowNewTeamModal(false);
      setNewTeamForm({ name: "", description: "" });
      if (res.id) setSelectedTeamId(res.id);
    } catch (err) {
      console.error("Failed to create team:", err);
    }
  };

  const handleEditTeam = (team: { id: string; name: string; description?: string }) => {
    setEditingTeam(team);
    setShowEditModal(true);
  };

  const handleUpdateTeam = async (name: string, description: string) => {
    if (!editingTeam || !name.trim()) return;
    try {
      await updateTeamMutation.mutateAsync({
        teamId: editingTeam.id,
        name,
        description,
      });
      setShowEditModal(false);
      setEditingTeam(null);
    } catch (err) {
      console.error("Failed to update team:", err);
    }
  };

  if (isLoading) {
    return (
      <Container className="py-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-12">
        <EmptyState
          title="Error loading teams"
          description={(error as Error).message}
          icon={<AlertTriangle className="text-error w-12 h-12" />}
        />
      </Container>
    );
  }

  const activeTeamId = selectedTeamId || teams?.[0]?.id;

  return (
    <Container className="py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2"
      >
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold text-text font-display tracking-tight">Equipos y Metas</h1>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Gestión de alto rendimiento y colaboración estratégica.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowNewTeamModal(true)}
          className="shadow-[0_0_15px_rgba(139,92,246,0.2)] hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] rounded-xl h-10 px-5 font-semibold text-sm bg-primary hover:bg-primary-hover transition-all"
        >
          <Plus className="mr-2 w-4 h-4" strokeWidth={2.5} /> Nuevo Equipo
        </Button>
      </motion.div>

      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-2">
        {teams?.map((t: any) => (
          <Button
            key={t.id}
            variant={activeTeamId === t.id ? "primary" : "ghost"}
            onClick={() => setSelectedTeamId(t.id)}
            className={cn(
              "px-6 h-10 rounded-xl whitespace-nowrap transition-all duration-300 font-semibold text-sm",
              activeTeamId === t.id
                ? "bg-surface-hover text-primary border border-primary/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                : "bg-surface border border-border text-text-secondary hover:text-text hover:bg-surface-hover",
            )}
          >
            {t.name}
          </Button>
        ))}
      </div>

      {activeTeamId ? (
        <TeamDetailView teamId={activeTeamId} onEdit={handleEditTeam} />
      ) : (
        <EmptyState
          title="No se encontraron equipos"
          description="Aún no has creado equipos para tu organización."
          icon={<Users className="text-text-muted/50 w-12 h-12" />}
          action={
            <Button variant="primary" onClick={() => setShowNewTeamModal(true)} className="mt-4">
              Crear primer equipo
            </Button>
          }
        />
      )}

      {/* New Team Modal */}
      <Modal open={showNewTeamModal} onOpenChange={setShowNewTeamModal}>
        <ModalHeader className="px-6 pt-6 pb-4 border-b border-border bg-surface">
          <ModalTitle className="text-xl font-bold tracking-tight text-text">Nuevo Equipo</ModalTitle>
          <p className="text-xs font-medium text-text-muted mt-1">Crear un nuevo espacio de trabajo para colaboración</p>
        </ModalHeader>
        <ModalContent className="p-6 space-y-6 bg-background">
          <Input
            label="NOMBRE DEL EQUIPO"
            placeholder="ej. Equipo de Ventas LATAM"
            value={newTeamForm.name}
            onChange={(e) => setNewTeamForm((prev) => ({ ...prev, name: e.target.value }))}
            className="bg-surface-hover border-border focus:border-primary/50 transition-all rounded-xl h-12"
          />
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider ml-1">Descripción</label>
            <textarea
              className="w-full min-h-[120px] px-4 py-3 rounded-xl border border-border bg-surface-hover focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 text-sm font-medium transition-all text-text placeholder:text-text-muted resize-none"
              placeholder="¿Cuál es el propósito de este equipo?"
              value={newTeamForm.description}
              onChange={(e) => setNewTeamForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </ModalContent>
        <ModalFooter className="p-6 border-t border-border bg-surface gap-4">
          <Button
            variant="ghost"
            onClick={() => setShowNewTeamModal(false)}
            className="rounded-xl px-6 h-10 text-text-secondary hover:text-text hover:bg-surface-hover transition-all duration-200 font-semibold text-sm"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateTeam}
            disabled={createTeamMutation.isPending || !newTeamForm.name}
            className="rounded-xl px-8 h-10 shadow-[0_0_15px_rgba(139,92,246,0.2)] bg-primary hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-semibold text-sm"
          >
            {createTeamMutation.isPending ? "Creando..." : "Crear Equipo"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Team Modal */}
      <EditTeamModal
        teamId={editingTeam?.id || ""}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTeam(null);
        }}
        onSave={handleUpdateTeam}
        initialName={editingTeam?.name || ""}
        initialDescription={editingTeam?.description || ""}
      />
    </Container>
  );
}
