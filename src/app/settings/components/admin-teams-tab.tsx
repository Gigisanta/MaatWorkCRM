"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Team, TeamMember } from "./types";

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface AddMemberDialogProps {
  teamId: string;
  teamName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMemberAdded: () => void;
}

function AddMemberDialog({
  teamId,
  teamName,
  open,
  onOpenChange,
  onMemberAdded,
}: AddMemberDialogProps) {
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("member");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    try {
      const searchRes = await fetch(`/api/admin/users?search=${encodeURIComponent(email)}`);
      if (!searchRes.ok) throw new Error("Error al buscar usuario");
      const searchData = await searchRes.json();
      const foundUser = searchData.users?.[0];
      if (!foundUser) throw new Error("Usuario no encontrado");

      const res = await fetch(`/api/admin/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: foundUser.id, role }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al añadir miembro");
      }
      toast.success("Miembro añadido correctamente");
      setEmail("");
      setRole("member");
      onOpenChange(false);
      onMemberAdded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1C1D21] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Añadir miembro a {teamName}</DialogTitle>
          <DialogDescription className="text-slate-400">
            Busca un usuario por su email para añadirlo al equipo
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-slate-400">Email del usuario</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              className="bg-[#0E0F12] border-white/10"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-slate-400">Rol en el equipo</label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="bg-[#0E0F12] border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1C1D21] border-white/10">
                <SelectItem value="member">Miembro</SelectItem>
                <SelectItem value="lead">Líder</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-slate-400"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !email}
              className="bg-[#8B5CF6] text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Añadiendo...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Añadir
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AdminTeamsTab() {
  const queryClient = useQueryClient();
  const [expandedTeams, setExpandedTeams] = React.useState<Set<string>>(new Set());
  const [addMemberTeam, setAddMemberTeam] = React.useState<{ id: string; name: string } | null>(
    null
  );

  const { data, isLoading } = useQuery<{ teams: Team[] }>({
    queryKey: ["admin-teams"],
    queryFn: async () => {
      const res = await fetch("/api/admin/teams");
      if (!res.ok) throw new Error("Error al cargar equipos");
      return res.json();
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      const res = await fetch(`/api/admin/teams/${teamId}/members?userId=${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar miembro");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-teams"] });
      toast.success("Miembro eliminado correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const toggleTeam = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  const teams: Team[] = data?.teams ?? [];

  return (
    <>
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          </div>
        ) : teams.length === 0 ? (
          <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl p-8">
            <div className="text-center">
              <Users className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No hay equipos en esta organización</p>
            </div>
          </Card>
        ) : (
          teams.map((team) => (
            <Card
              key={team.id}
              className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl overflow-hidden"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-violet-500/10 p-2.5 rounded-xl">
                      <Users className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-base">{team.name}</CardTitle>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Líder: {team.leader?.name || team.leader?.email || "Sin líder"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-white/5 text-slate-300 border-white/10">
                      {team.memberCount} miembros
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTeam(team.id)}
                      className="text-slate-400 hover:text-white"
                    >
                      {expandedTeams.has(team.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <AnimatePresence>
                {expandedTeams.has(team.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <CardContent className="pt-0 border-t border-white/5">
                      <div className="space-y-2 py-3">
                        {team.members.map((member: TeamMember) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/8"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.user.image || undefined} />
                                <AvatarFallback className="bg-violet-500/20 text-violet-400 text-xs">
                                  {getInitials(member.user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {member.user.name || "Sin nombre"}
                                </p>
                                <p className="text-xs text-slate-500">{member.user.email}</p>
                              </div>
                              <Badge
                                variant={
                                  member.role === "lead" ? "warning" : "secondary"
                                }
                                size="sm"
                                className="ml-2"
                              >
                                {member.role === "lead" ? "Líder" : "Miembro"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">
                                {formatDate(member.joinedAt)}
                              </span>
                              {team.leader?.id !== member.userId && (
                                <Button
                                  variant="ghost"
                                  size="iconSm"
                                  className="text-slate-400 hover:text-rose-400"
                                  onClick={() =>
                                    removeMemberMutation.mutate({
                                      teamId: team.id,
                                      userId: member.userId,
                                    })
                                  }
                                  disabled={removeMemberMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
                          onClick={() =>
                            setAddMemberTeam({ id: team.id, name: team.name })
                          }
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Añadir miembro
                        </Button>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))
        )}
      </div>

      {addMemberTeam && (
        <AddMemberDialog
          teamId={addMemberTeam.id}
          teamName={addMemberTeam.name}
          open={!!addMemberTeam}
          onOpenChange={(open) => !open && setAddMemberTeam(null)}
          onMemberAdded={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-teams"] });
          }}
        />
      )}
    </>
  );
}
