import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import {
  useTeams,
  useTeamDetails,
  useTeamGoals,
  useUpdateGoalMutation,
  useCreateTeamMutation
} from "~/lib/hooks/use-crm";
import { Container, Stack, Grid } from "~/components/ui/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { Icon } from "~/components/ui/Icon";
import { EmptyState } from "~/components/ui/EmptyState";
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from "~/components/ui/Modal";
import { Input } from "~/components/ui/Input";
import { cn, formatCurrency } from "~/lib/utils";

export const Route = createFileRoute("/_app/teams/")({
  component: TeamsPage,
});

function TeamDetailView({ teamId }: { teamId: string }) {
  const { data: details, isLoading: loadingDetails } = useTeamDetails(teamId);
  const { data: goals, isLoading: loadingGoals } = useTeamGoals(teamId);
  const updateGoalMutation = useUpdateGoalMutation();

  if (loadingDetails || loadingGoals) {
    return <div className="animate-pulse space-y-4">
      <div className="h-40 bg-secondary/5 rounded-2xl" />
      <div className="h-60 bg-secondary/5 rounded-2xl" />
    </div>;
  }

  if (!details) return null;

  const { team, members } = details;

  return (
    <div className="space-y-6 animate-enter">
      {/* Team Header Card */}
      <Card variant="glass" className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/20 to-violet-500/20" />
        <CardContent className="px-6 pb-6 -mt-12">
          <Stack direction="row" align="end" justify="between" className="mb-6">
            <div className="w-20 h-20 rounded-3xl bg-background border-4 border-background shadow-xl flex items-center justify-center">
              <div className="w-full h-full rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
                <Icon name="Users" className="text-white" size={32} />
              </div>
            </div>
            <Button variant="outline" size="sm">
              Editar Equipo
            </Button>
          </Stack>

          <Stack direction="column" gap="xs">
            <h2 className="text-2xl font-bold text-text font-display">{team.name}</h2>
            <p className="text-text-secondary text-sm max-w-2xl">
              {team.description || "Sin descripción proporcionada."}
            </p>
          </Stack>
        </CardContent>
      </Card>

      <Grid cols={1} lgCols={3} gap="lg">
        {/* Members List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
              <Icon name="UserCheck" size={14} /> Miembros
            </h3>
            <Badge variant="secondary">{members.length}</Badge>
          </div>
          <div className="grid gap-2">
            {members.map((m: any) => (
              <Card key={m.member.id} variant="default" className="hover-lift border-secondary/5 border">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center font-bold text-primary">
                    {m.user?.name?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{m.user?.name}</p>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">{m.member.role}</p>
                  </div>
                  {team.leaderId === m.user?.id && (
                    <Icon name="Crown" className="text-amber-400" size={14} />
                  )}
                </CardContent>
              </Card>
            ))}
            <Button variant="dashed" className="w-full justify-start h-12 text-text-muted hover:text-primary">
              <Icon name="Plus" size={16} className="mr-2" /> Invitar Miembro
            </Button>
          </div>
        </div>

        {/* Goals Progress */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
              <Icon name="Target" size={14} /> Objetivos del Equipo
            </h3>
            <Button variant="ghost" size="sm" className="h-8 text-xs">
              Configurar KPIs
            </Button>
          </div>
          <div className="grid gap-4">
            {goals?.length === 0 ? (
              <EmptyState
                title="Sin objetivos"
                description="Este equipo no tiene objetivos asignados para el periodo actual."
                icon={<Icon name="Target" className="text-text-muted" />}
              />
            ) : (
              goals?.map((goal: any) => {
                const progress = Math.min(Math.round(((Number(goal.currentValue) || 0) / (Number(goal.targetValue) || 1)) * 100), 100);
                return (
                  <Card key={goal.id} variant="glass">
                    <CardContent className="p-5 space-y-4">
                      <Stack direction="row" align="center" justify="between">
                        <Stack direction="column" gap="xs">
                          <h4 className="font-bold text-text">{goal.title}</h4>
                          <p className="text-xs text-text-muted">Finaliza el {new Date(goal.endDate).toLocaleDateString()}</p>
                        </Stack>
                        <span className={cn(
                          "text-xl font-black font-mono",
                          progress >= 90 ? "text-emerald-500" : progress >= 50 ? "text-primary" : "text-amber-500"
                        )}>
                          {progress}%
                        </span>
                      </Stack>

                      <div className="relative h-3 rounded-full bg-secondary/10 overflow-hidden shadow-inner border border-secondary/5">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-1000 ease-out shadow-lg",
                            progress >= 90 ? "bg-emerald-500" : "bg-gradient-to-r from-primary to-violet-500"
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <Stack direction="row" justify="between" className="pt-2">
                        <div className="text-xs font-medium text-text-secondary">
                          Actual: <span className="text-text font-mono">{goal.unit === "currency" ? formatCurrency(goal.currentValue) : goal.currentValue}</span>
                        </div>
                        <div className="text-xs font-medium text-text-secondary text-right">
                          Meta: <span className="text-text font-mono">{goal.unit === "currency" ? formatCurrency(goal.targetValue) : goal.targetValue}</span>
                        </div>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </Grid>
    </div>
  );
}

function TeamsPage() {
  const { data: teams, isLoading, error } = useTeams();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [newTeamForm, setNewTeamForm] = useState({ name: "", description: "" });

  const createTeamMutation = useCreateTeamMutation();

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

  if (isLoading) {
    return (
      <Container className="py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-12">
        <EmptyState
          title="Error al cargar equipos"
          description={(error as Error).message}
          icon={<Icon name="AlertTriangle" className="text-error" />}
        />
      </Container>
    );
  }

  const activeTeamId = selectedTeamId || teams?.[0]?.id;

  return (
    <Container className="py-6 space-y-8">
      {/* Header */}
      <Stack direction="row" align="center" justify="between">
        <Stack direction="column" gap="xs">
          <h1 className="text-4xl font-black text-text font-display tracking-tight">Equipos de Trabajo</h1>
          <p className="text-text-secondary">Gestión de alto rendimiento y colaboración estratégica.</p>
        </Stack>
        <Button variant="primary" onClick={() => setShowNewTeamModal(true)}>
          <Icon name="Plus" className="mr-2" size={16} /> Nuevo Equipo
        </Button>
      </Stack>

      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {teams?.map((t: any) => (
          <Button
            key={t.id}
            variant={activeTeamId === t.id ? "secondary" : "ghost"}
            onClick={() => setSelectedTeamId(t.id)}
            className={cn(
              "px-6 rounded-full whitespace-nowrap transition-all",
              activeTeamId === t.id && "bg-primary text-white hover:bg-primary/90 shadow-lg scale-105"
            )}
          >
            {t.name}
          </Button>
        ))}
      </div>

      {activeTeamId ? (
        <TeamDetailView teamId={activeTeamId} />
      ) : (
        <EmptyState
          title="Sin equipos"
          description="Aún no has creado ningún equipo para tu organización."
          icon={<Icon name="Users" className="text-text-muted" />}
          action={<Button onClick={() => setShowNewTeamModal(true)}>Crear primer equipo</Button>}
        />
      )}

      {/* New Team Modal */}
      <Modal open={showNewTeamModal} onClose={() => setShowNewTeamModal(false)}>
        <ModalHeader>
          <ModalTitle>Nuevo Equipo</ModalTitle>
        </ModalHeader>
        <ModalContent className="space-y-4">
          <Input
            label="Nombre del Equipo"
            placeholder="Ej: Equipo de Ventas LATAM"
            value={newTeamForm.name}
            onChange={(e) => setNewTeamForm(prev => ({ ...prev, name: e.target.value }))}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">Descripción</label>
            <textarea
              className="w-full min-h-[100px] px-3 py-2 rounded-lg border border-border bg-secondary/5 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all"
              placeholder="¿Cuál es el propósito de este equipo?"
              value={newTeamForm.description}
              onChange={(e) => setNewTeamForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowNewTeamModal(false)}>Cancelar</Button>
          <Button
            variant="primary"
            onClick={handleCreateTeam}
            disabled={createTeamMutation.isPending || !newTeamForm.name}
          >
            {createTeamMutation.isPending ? "Creando..." : "Crear Equipo"}
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
}
