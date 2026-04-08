"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  ShieldCheck,
  Activity,
  ScrollText,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  UserX,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
import { useAuth } from "@/lib/auth-context";
import { getRoleDisplayName } from "@/lib/auth-helpers-client";
import { UserManagementTable } from "@/components/admin/user-management-table";
import { UserDetailDrawer } from "@/components/admin/user-detail-drawer";
import type { UserWithTeams } from "@/types/auth";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface RoleChangeRequest {
  id: string;
  userId: string;
  requestedRole: string;
  reason: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: string;
  };
}

interface RoleRequestsResponse {
  roleChangeRequests: RoleChangeRequest[];
}

interface TeamMember {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: string;
    careerLevel: string | null;
  };
}

interface Team {
  id: string;
  name: string;
  leader: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  members: TeamMember[];
  memberCount: number;
}

interface TeamsResponse {
  teams: Team[];
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface AuditLogsResponse {
  auditLogs: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

// ============================================
// Helpers
// ============================================

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

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) return formatDate(date);
  if (days > 0) return `hace ${days}d`;
  if (hours > 0) return `hace ${hours}h`;
  if (minutes > 0) return `hace ${minutes}m`;
  return "ahora";
}

function formatActionDescription(action: string, entityType: string): string {
  const actionLabels: Record<string, string> = {
    "user:create": "Usuario creado",
    "user:update": "Usuario actualizado",
    "user:delete": "Usuario eliminado",
    "user:activate": "Usuario activado",
    "user:deactivate": "Usuario desactivado",
    "role:change": "Rol cambiado",
    "team:create": "Equipo creado",
    "team:update": "Equipo actualizado",
    "team:delete": "Equipo eliminado",
    "teamMember:add": "Miembro añadido",
    "teamMember:remove": "Miembro eliminado",
  };
  return actionLabels[`${entityType.toLowerCase()}:${action.toLowerCase()}`] || `${action} ${entityType}`;
}

// ============================================
// Tab 2: Role Requests
// ============================================

function RoleRequestsTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<RoleRequestsResponse>({
    queryKey: ["roleRequests", user?.organizationId],
    queryFn: async () => {
      const res = await fetch(
        `/api/role-requests?organizationId=${user?.organizationId}&status=pending`
      );
      if (!res.ok) throw new Error("Error al cargar solicitudes");
      return res.json();
    },
    enabled: !!user?.organizationId,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approved" | "rejected" }) => {
      const res = await fetch(`/api/role-requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al procesar solicitud");
      }
      return res.json();
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["roleRequests"] });
      toast.success(
        action === "approved"
          ? "Solicitud aprobada correctamente"
          : "Solicitud rechazada correctamente"
      );
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const requests = data?.roleChangeRequests ?? [];

  return (
    <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-violet-400" />
          Solicitudes de Cambio de Rol
        </CardTitle>
        <CardDescription className="text-slate-400">
          Revisa y aprueba las solicitudes de cambio de rol pendientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          </div>
        ) : requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="p-4 rounded-lg glass border border-white/8"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.user.image || undefined} />
                      <AvatarFallback className="bg-violet-500/20 text-violet-400">
                        {getInitials(request.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-white">
                        {request.user.name || "Sin nombre"}
                      </p>
                      <p className="text-sm text-slate-400">{request.user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className="border-violet-500/30 text-violet-400"
                        >
                          {getRoleDisplayName(request.requestedRole)}
                        </Badge>
                        {request.reason && (
                          <p className="text-xs text-slate-500 italic">
                            &ldquo;{request.reason}&rdquo;
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(request.createdAt).toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="success"
                      className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
                      onClick={() =>
                        reviewMutation.mutate({ id: request.id, action: "approved" })
                      }
                      disabled={reviewMutation.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                      onClick={() =>
                        reviewMutation.mutate({ id: request.id, action: "rejected" })
                      }
                      disabled={reviewMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ShieldCheck className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No hay solicitudes pendientes</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Tab 3: Teams
// ============================================

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
      // First find user by email
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

function TeamsTab() {
  const queryClient = useQueryClient();
  const [expandedTeams, setExpandedTeams] = React.useState<Set<string>>(new Set());
  const [addMemberTeam, setAddMemberTeam] = React.useState<{ id: string; name: string } | null>(
    null
  );

  const { data, isLoading } = useQuery<TeamsResponse>({
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

  const teams = data?.teams ?? [];

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
                        Lider: {team.leader?.name || team.leader?.email || "Sin líder"}
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
                        {team.members.map((member) => (
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

// ============================================
// Tab 4: Activity Logs
// ============================================

function ActivityLogsTab() {
  const { data, isLoading } = useQuery<AuditLogsResponse>({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/audit-logs");
      if (!res.ok) throw new Error("Error al cargar registros");
      return res.json();
    },
  });

  const logs = data?.auditLogs ?? [];

  return (
    <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-violet-400" />
          Registro de Actividad
        </CardTitle>
        <CardDescription className="text-slate-400">
          Historial de acciones realizadas en la organización
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No hay actividad registrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/8"
              >
                <Avatar className="h-8 w-8 mt-0.5">
                  <AvatarImage src={log.user.image || undefined} />
                  <AvatarFallback className="bg-violet-500/20 text-violet-400 text-xs">
                    {getInitials(log.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">
                      {log.user.name || "Sin nombre"}
                    </span>
                    <Badge variant="outline" size="sm" className="border-white/10 text-slate-400">
                      {formatActionDescription(log.action, log.entityType)}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {log.entityType} &middot; {formatRelativeTime(log.createdAt)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Main Admin Panel
// ============================================

export function AdminPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Tab 1: Users - drawer state
  const [selectedUser, setSelectedUser] = React.useState<UserWithTeams | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const handleUserSelect = (user: UserWithTeams) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const handleUserUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-[#1C1D21]/80 border border-white/10 rounded-lg p-1 gap-1">
          <TabsTrigger
            value="users"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400 text-sm"
          >
            <Users className="h-4 w-4 mr-1.5" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger
            value="roleRequests"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400 text-sm"
          >
            <ShieldCheck className="h-4 w-4 mr-1.5" />
            Solicitudes de Rol
          </TabsTrigger>
          <TabsTrigger
            value="teams"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400 text-sm"
          >
            <Users className="h-4 w-4 mr-1.5" />
            Equipos
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400 text-sm"
          >
            <ScrollText className="h-4 w-4 mr-1.5" />
            Registro de Actividad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <UserManagementTable onUserSelect={handleUserSelect} />
          <UserDetailDrawer
            user={selectedUser}
            open={drawerOpen}
            onClose={handleDrawerClose}
            onUserUpdated={handleUserUpdated}
          />
        </TabsContent>

        <TabsContent value="roleRequests" className="mt-6">
          <RoleRequestsTab />
        </TabsContent>

        <TabsContent value="teams" className="mt-6">
          <TeamsTab />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <ActivityLogsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
