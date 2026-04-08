"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Users,
  Target,
  TrendingUp,
  Settings,
  Crown,
  UserPlus,
  MoreHorizontal,
  X,
  Edit,
  Trash2,
  AlertCircle,
  Building2,
  Download,
} from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { useSidebar } from "@/lib/sidebar-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Check, ChevronsUpDown } from "lucide-react";
import { canCreateTeam } from "@/lib/roles";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Goal status helpers
function getGoalStatus(current: number, target: number): { label: string; variant: "emerald" | "sky" | "amber" | "rose" } {
  if (target <= 0) return { label: "Sin meta", variant: "sky" };
  const pct = (current / target) * 100;
  if (pct >= 100) return { label: "Completado", variant: "emerald" };
  if (pct >= 70) return { label: "En camino", variant: "sky" };
  if (pct >= 30) return { label: "En riesgo", variant: "amber" };
  return { label: "Retrasado", variant: "rose" };
}

const statusColors = {
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  sky: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
} as const;

// Types
interface TeamMember {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface TeamGoal {
  id: string;
  title: string;
  type: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  period: string;
  status: string;
  description?: string | null;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  leaderId: string | null;
  leader: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  members: TeamMember[];
  goals: TeamGoal[];
  _count?: {
    members: number;
    goals: number;
    calendarEvents: number;
  };
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface TeamsResponse {
  teams: Team[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Zod schemas
const createTeamSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
  leaderId: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
});

const createGoalSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(100, "Máximo 100 caracteres"),
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
  type: z.enum(["new_aum", "new_clients", "meetings", "revenue", "custom"], {
    required_error: "Selecciona un tipo",
  }),
  targetValue: z.number().min(1, "El valor objetivo debe ser mayor a 0"),
  currentValue: z.number().min(0, "El valor actual no puede ser negativo").default(0),
  unit: z.enum(["currency", "count", "percentage"]).default("count"),
});

const updateGoalProgressSchema = z.object({
  currentValue: z.number().min(0, "El valor actual no puede ser negativo"),
});

const addMemberSchema = z.object({
  userId: z.string().min(1, "Selecciona un usuario"),
  role: z.enum(["member", "leader"]).default("member"),
});

type CreateTeamFormInput = z.input<typeof createTeamSchema>;
type CreateGoalFormInput = z.input<typeof createGoalSchema>;
type CreateTeamForm = z.infer<typeof createTeamSchema>;
type CreateGoalForm = z.infer<typeof createGoalSchema>;
type UpdateGoalProgressForm = z.infer<typeof updateGoalProgressSchema>;
type AddMemberFormInput = z.input<typeof addMemberSchema>;
type AddMemberForm = z.infer<typeof addMemberSchema>;

// Circular Progress Component
function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  color = "#818cf8",
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-slate-700"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke={color}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-white">{Math.round(value)}%</span>
      </div>
    </div>
  );
}

// Goal Card Component
function GoalCard({
  goal,
  onEdit,
  onDelete,
}: {
  goal: TeamGoal;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const progress = goal.targetValue > 0 ? Math.min(100, (goal.currentValue / goal.targetValue) * 100) : 0;
  
  const formatValue = (value: number, unit: string) => {
    if (unit === "currency") return `$${value.toLocaleString()}`;
    if (unit === "percentage") return `${value}%`;
    return value.toLocaleString();
  };

  const getProgressColor = (p: number) => {
    if (p >= 100) return "#22c55e";
    if (p >= 80) return "#10b981";
    if (p >= 50) return "#f59e0b";
    return "#8B5CF6";
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      new_aum: "Nuevos Activos",
      new_clients: "Nuevos Clientes",
      meetings: "Reuniones",
      revenue: "Ingresos",
      custom: "Personalizado",
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-violet-500/20 text-violet-400",
      completed: "bg-emerald-500/20 text-emerald-400",
      missed: "bg-rose-500/20 text-rose-400",
      cancelled: "bg-slate-500/20 text-slate-400",
    };
    return styles[status] || styles.active;
  };

  return (
    <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl hover:border-white/20 transition-all">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-violet-400" />
              <span className="text-sm text-slate-400">
                {getTypeLabel(goal.type)}
              </span>
              <Badge className={cn("text-xs", getStatusBadge(goal.status))}>
                {goal.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {goal.title}
              </h3>
              {(() => {
                const { label, variant } = getGoalStatus(goal.currentValue, goal.targetValue);
                return (
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ml-2",
                    statusColors[variant]
                  )}>
                    {label}
                  </span>
                );
              })()}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Progreso</span>
                <span className="text-white font-medium">
                  {formatValue(goal.currentValue, goal.unit)} / {formatValue(goal.targetValue, goal.unit)}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                <span>{goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()} {goal.unit}</span>
                <span>{goal.targetValue > 0 ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)) : 0}%</span>
              </div>
              <p className="text-xs text-slate-500">
                Período: {goal.period}
              </p>
            </div>
          </div>
          <div className="ml-6 flex flex-col items-center gap-2">
            <CircularProgress
              value={progress}
              size={80}
              strokeWidth={6}
              color={getProgressColor(progress)}
            />
            <div className="flex gap-1">
              {onEdit && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white" onClick={onEdit}>
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-400 hover:text-rose-300" onClick={onDelete}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Team Detail Drawer
function TeamDetailDrawer({
  team,
  open,
  onClose,
  users,
  onAddMember,
  onRemoveMember,
  onCreateGoal,
  onUpdateGoalProgress,
  onDeleteGoal,
  onUpdateLeader,
}: {
  team: Team | null;
  open: boolean;
  onClose: () => void;
  users: User[];
  onAddMember: (data: AddMemberForm) => void;
  onRemoveMember: (memberId: string) => void;
  onCreateGoal: (data: CreateGoalForm) => void;
  onUpdateGoalProgress: (goalId: string, currentValue: number) => void;
  onDeleteGoal: (goalId: string) => void;
  onUpdateLeader: (leaderId: string) => void;
}) {
  const [showAddMember, setShowAddMember] = React.useState(false);
  const [showCreateGoal, setShowCreateGoal] = React.useState(false);
  const [showChangeLeader, setShowChangeLeader] = React.useState(false);
  const [editingGoal, setEditingGoal] = React.useState<TeamGoal | null>(null);
  const [deletingGoal, setDeletingGoal] = React.useState<TeamGoal | null>(null);
  const [removingMember, setRemovingMember] = React.useState<TeamMember | null>(null);
  const [selectedLeaderId, setSelectedLeaderId] = React.useState(team?.leader?.id || "");

  const addMemberForm = useForm<AddMemberFormInput>({
    resolver: zodResolver(addMemberSchema) as any,
    defaultValues: { userId: "", role: "member" },
  });

  const createGoalForm = useForm<CreateGoalFormInput>({
    resolver: zodResolver(createGoalSchema) as any,
    defaultValues: {
      title: "",
      type: undefined,
      targetValue: 0,
      currentValue: 0,
      unit: "count",
    },
  });

  const updateProgressForm = useForm<UpdateGoalProgressForm>({
    resolver: zodResolver(updateGoalProgressSchema),
  });

  React.useEffect(() => {
    if (editingGoal) {
      updateProgressForm.setValue("currentValue", editingGoal.currentValue);
    }
  }, [editingGoal, updateProgressForm]);

  if (!team) return null;

  const averageProgress = team.goals.length > 0
    ? team.goals.reduce((sum, g) => sum + (g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0), 0) / team.goals.length
    : 0;

  const availableUsers = users.filter(
    (u) => !team.members.some((m) => m.userId === u.id)
  );

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()} direction="right">
      <DrawerContent className="w-full sm:max-w-2xl glass border-l border-white/10 bg-slate-900/95 backdrop-blur-xl">
        <DrawerHeader className="border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <Users className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <DrawerTitle className="text-xl font-semibold text-white">
                  {team.name}
                </DrawerTitle>
                <p className="text-sm text-slate-400">{team.description || "Sin descripción"}</p>
              </div>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Team Leader */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                Líder del Equipo
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-violet-400 hover:text-violet-300 h-7 px-2"
                onClick={() => {
                  setSelectedLeaderId(team.leader?.id || "");
                  setShowChangeLeader(true);
                }}
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                Cambiar
              </Button>
            </div>
            {team.leader ? (
              <div className="flex items-center gap-3 p-3 rounded-lg glass border border-white/10">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-violet-500/20 text-violet-400">
                    {team.leader.name?.split(" ").map((n) => n[0]).join("") || "NA"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-white">{team.leader.name || "Sin nombre"}</p>
                  <p className="text-xs text-slate-400">{team.leader.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500">Sin líder asignado</p>
            )}
          </div>

          {/* Team Members */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Users className="h-4 w-4 text-violet-400" />
                Miembros ({team.members.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl text-slate-300"
                onClick={() => setShowAddMember(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invitar
              </Button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {team.members.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No hay miembros en el equipo</p>
              ) : (
                team.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg glass border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-violet-500/20 text-violet-400 text-xs">
                          {member.user.name?.split(" ").map((n) => n[0]).join("") || "NA"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-white">{member.user.name || "Sin nombre"}</p>
                        <p className="text-xs text-slate-400">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          member.role === "leader"
                            ? "border-amber-500/30 text-amber-400"
                            : "border-slate-500/30 text-slate-400"
                        )}
                      >
                        {member.role === "leader" ? "Líder" : "Miembro"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-rose-400 hover:text-rose-300"
                        onClick={() => setRemovingMember(member)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Overall Progress */}
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Progreso General
            </h3>
            <div className="flex items-center justify-center p-6 rounded-lg glass border border-white/10">
              <CircularProgress value={averageProgress} size={120} strokeWidth={8} />
            </div>
          </div>

          {/* Team Goals */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Target className="h-4 w-4 text-violet-400" />
                Objetivos ({team.goals.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl text-slate-300"
                onClick={() => setShowCreateGoal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo
              </Button>
            </div>
            <div className="space-y-3">
              {team.goals.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No hay objetivos para este equipo</p>
              ) : (
                team.goals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={() => setEditingGoal(goal)}
                    onDelete={() => setDeletingGoal(goal)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Activity Stats */}
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Estadísticas de Actividad
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg glass border border-white/10">
                <p className="text-sm text-slate-400">Miembros</p>
                <p className="text-2xl font-bold text-white">{team._count?.members || team.members.length}</p>
              </div>
              <div className="p-4 rounded-lg glass border border-white/10">
                <p className="text-sm text-slate-400">Objetivos</p>
                <p className="text-2xl font-bold text-white">{team._count?.goals || team.goals.length}</p>
              </div>
              <div className="p-4 rounded-lg glass border border-white/10">
                <p className="text-sm text-slate-400">Eventos</p>
                <p className="text-2xl font-bold text-white">{team._count?.calendarEvents || 0}</p>
              </div>
              <div className="p-4 rounded-lg glass border border-white/10">
                <p className="text-sm text-slate-400">Completados</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {team.goals.filter((g) => g.status === "completed").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Member Dialog - Now sends invitation */}
        <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
          <DialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-slate-900">
            <DialogHeader>
              <DialogTitle className="text-white">Invitar al Equipo</DialogTitle>
              <DialogDescription className="text-slate-400">
                Se enviará una solicitud de unión al usuario. Deberá aceptarla desde su perfil.
              </DialogDescription>
            </DialogHeader>
            <Form {...addMemberForm}>
              <form
                onSubmit={addMemberForm.handleSubmit((data) => {
                  onAddMember(data as AddMemberForm);
                  setShowAddMember(false);
                  addMemberForm.reset();
                })}
                className="space-y-4"
              >
                <FormField
                  control={addMemberForm.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Usuario</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white">
                            <SelectValue placeholder="Selecciona un usuario" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name || user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addMemberForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Rol</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white">
                            <SelectValue placeholder="Selecciona un rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="member">Miembro</SelectItem>
                          <SelectItem value="leader">Líder</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowAddMember(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-violet-500 hover:bg-violet-600">
                    Enviar Invitación
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Change Leader Dialog */}
        <Dialog open={showChangeLeader} onOpenChange={setShowChangeLeader}>
          <DialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-slate-900">
            <DialogHeader>
              <DialogTitle className="text-white">Cambiar Líder del Equipo</DialogTitle>
              <DialogDescription className="text-slate-400">
                Selecciona un nuevo líder para este equipo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Nuevo Líder</label>
                <Select value={selectedLeaderId} onValueChange={setSelectedLeaderId}>
                  <SelectTrigger className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white">
                    <SelectValue placeholder="Selecciona un líder" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowChangeLeader(false)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="bg-violet-500 hover:bg-violet-600"
                  onClick={() => {
                    if (selectedLeaderId && selectedLeaderId !== team.leader?.id) {
                      onUpdateLeader(selectedLeaderId);
                    }
                    setShowChangeLeader(false);
                  }}
                >
                  Guardar
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Goal Dialog */}
        <Dialog open={showCreateGoal} onOpenChange={setShowCreateGoal}>
          <DialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-slate-900">
            <DialogHeader>
              <DialogTitle className="text-white">Crear Objetivo</DialogTitle>
              <DialogDescription className="text-slate-400">
                Define un nuevo objetivo para el equipo
              </DialogDescription>
            </DialogHeader>
            <Form {...createGoalForm}>
              <form
                onSubmit={createGoalForm.handleSubmit((data) => {
                  onCreateGoal(data as CreateGoalForm);
                  setShowCreateGoal(false);
                  createGoalForm.reset();
                })}
                className="space-y-4"
              >
                <FormField
                  control={createGoalForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Título</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
                          placeholder="Ej: $50k nuevos clientes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createGoalForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Descripción (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white resize-none"
                          placeholder="Descripción del objetivo..."
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createGoalForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Tipo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white">
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new_aum">Nuevos Activos</SelectItem>
                            <SelectItem value="new_clients">Nuevos Clientes</SelectItem>
                            <SelectItem value="meetings">Reuniones</SelectItem>
                            <SelectItem value="revenue">Ingresos</SelectItem>
                            <SelectItem value="custom">Personalizado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createGoalForm.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Unidad</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white">
                              <SelectValue placeholder="Unidad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="count">Cantidad</SelectItem>
                            <SelectItem value="currency">Moneda</SelectItem>
                            <SelectItem value="percentage">Porcentaje</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createGoalForm.control}
                    name="targetValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Valor Objetivo</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createGoalForm.control}
                    name="currentValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Valor Actual</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowCreateGoal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-violet-500 hover:bg-violet-600">
                    Crear
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Update Goal Progress Dialog */}
        <Dialog open={!!editingGoal} onOpenChange={() => setEditingGoal(null)}>
          <DialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-slate-900">
            <DialogHeader>
              <DialogTitle className="text-white">Actualizar Progreso</DialogTitle>
              <DialogDescription className="text-slate-400">
                {editingGoal?.title}
              </DialogDescription>
            </DialogHeader>
            <Form {...updateProgressForm}>
              <form
                onSubmit={updateProgressForm.handleSubmit((data) => {
                  if (editingGoal) {
                    onUpdateGoalProgress(editingGoal.id, data.currentValue);
                    setEditingGoal(null);
                  }
                })}
                className="space-y-4"
              >
                <FormField
                  control={updateProgressForm.control}
                  name="currentValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Valor Actual</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription className="text-slate-400">
                        Objetivo: {editingGoal?.targetValue} ({editingGoal?.unit})
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditingGoal(null)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-violet-500 hover:bg-violet-600">
                    Actualizar
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Goal Confirmation */}
        <Dialog open={!!deletingGoal} onOpenChange={() => setDeletingGoal(null)}>
          <DialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-slate-900">
            <DialogHeader>
              <DialogTitle className="text-white">Eliminar Objetivo</DialogTitle>
              <DialogDescription className="text-slate-400">
                ¿Estás seguro de que deseas eliminar el objetivo "{deletingGoal?.title}"? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletingGoal(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deletingGoal) {
                    onDeleteGoal(deletingGoal.id);
                    setDeletingGoal(null);
                  }
                }}
              >
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Member Confirmation */}
        <Dialog open={!!removingMember} onOpenChange={() => setRemovingMember(null)}>
          <DialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-slate-900">
            <DialogHeader>
              <DialogTitle className="text-white">Remover Miembro</DialogTitle>
              <DialogDescription className="text-slate-400">
                ¿Estás seguro de que deseas remover a "{removingMember?.user.name}" del equipo?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRemovingMember(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (removingMember) {
                    onRemoveMember(removingMember.id);
                    setRemovingMember(null);
                  }
                }}
              >
                Remover
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DrawerContent>
    </Drawer>
  );
}

// Create Team Dialog
function CreateTeamDialog({
  open,
  onClose,
  users,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  users: User[];
  onCreate: (data: CreateTeamForm) => void;
}) {
  const form = useForm<CreateTeamForm>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      description: "",
      leaderId: "",
      memberIds: [],
    },
  });

  const [selectedMembers, setSelectedMembers] = React.useState<string[]>([]);

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  React.useEffect(() => {
    form.setValue("memberIds", selectedMembers);
  }, [selectedMembers, form]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-slate-900 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Crear Nuevo Equipo</DialogTitle>
          <DialogDescription className="text-slate-400">
            Configura tu nuevo equipo y asigna miembros
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onCreate)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Nombre del Equipo *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
                      placeholder="Ej: Equipo Alfa"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white resize-none"
                      placeholder="Descripción del equipo..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="leaderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Líder del Equipo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white">
                        <SelectValue placeholder="Selecciona un líder" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <FormLabel className="text-slate-300">Miembros Iniciales</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white mt-2"
                  >
                    {selectedMembers.length > 0
                      ? `${selectedMembers.length} seleccionados`
                      : "Seleccionar miembros..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-slate-900">
                  <Command>
                    <CommandInput placeholder="Buscar usuarios..." />
                    <CommandList>
                      <CommandEmpty>No se encontraron usuarios.</CommandEmpty>
                      <CommandGroup>
                        {users.map((user) => (
                          <CommandItem
                            key={user.id}
                            onSelect={() => toggleMember(user.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedMembers.includes(user.id) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {user.name || user.email}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-violet-500 hover:bg-violet-600">
                Crear Equipo
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Main Teams Page
export default function TeamsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = React.useState<Team | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [createTeamOpen, setCreateTeamOpen] = React.useState(false);
  const { collapsed, setCollapsed } = useSidebar();

  // Fetch teams
  const { data: teamsData, isLoading, error } = useQuery({
    queryKey: ["teams", user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return null;
      const response = await fetch(`/api/teams?organizationId=${user.organizationId}`, { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to fetch teams");
      return response.json() as Promise<TeamsResponse>;
    },
    enabled: !!user?.organizationId,
  });

  // Fetch users for team creation
  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/auth/managers", { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      return data.managers as User[];
    },
  });

  // Fetch single team details
  const { data: teamDetails, refetch: refetchTeamDetails } = useQuery({
    queryKey: ["team", selectedTeam?.id],
    queryFn: async () => {
      if (!selectedTeam?.id) return null;
      const response = await fetch(`/api/teams/${selectedTeam.id}`, { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to fetch team");
      return response.json() as Promise<Team>;
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
        credentials: 'include',
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
        credentials: 'include',
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
        credentials: 'include',
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
        credentials: 'include',
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
        credentials: 'include',
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
        credentials: 'include',
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
        credentials: 'include',
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
                  <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-1">EQUIPOS</p>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Equipos</h1>
                  <p className="text-slate-500 mt-1 text-sm">Gestiona tus equipos y objetivos</p>
                </div>
              </div>
              {userCanCreateTeam && (
                <Button
                  className="bg-violet-500 hover:bg-violet-600"
                  onClick={() => setCreateTeamOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Equipo
                </Button>
              )}
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="rounded-xl border border-white/8 bg-[#0E0F12]/80 p-5 space-y-4">
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
                        <Skeleton key={j} className="h-7 w-7 rounded-full bg-white/5 ring-2 ring-[#08090B]" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && (
              <Card className="glass border-rose-500/30">
                <CardContent className="p-6 text-center">
                  <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-2" />
                  <p className="text-rose-400">Error al cargar los equipos</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["teams"] })}
                  >
                    Reintentar
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!isLoading && !error && teams.length === 0 && (
              <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No hay equipos</h3>
                  <p className="text-slate-400 mb-4">
                    Crea tu primer equipo para comenzar a gestionar objetivos y miembros
                  </p>
                  {userCanCreateTeam && (
                    <Button
                      className="bg-violet-500 hover:bg-violet-600"
                      onClick={() => setCreateTeamOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Equipo
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Teams Grid */}
            {!isLoading && !error && teams.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {teams.map((team) => {
                  const teamProgress = team.goals.length > 0
                    ? team.goals.reduce(
                        (sum, g) => sum + (g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0),
                        0
                      ) / team.goals.length
                    : 0;

                  return (
                    <Card
                      key={team.id}
                      className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl hover:border-white/20 transition-all cursor-pointer"
                      onClick={() => handleTeamClick(team)}
                    >
                      <CardHeader className="border-b border-white/10">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="p-2.5 rounded-xl bg-violet-500/10 flex-shrink-0">
                              <Building2 className="h-5 w-5 text-violet-400" strokeWidth={1.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base font-semibold text-white truncate">
                                {team.name}
                              </CardTitle>
                              {team.description && (
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{team.description}</p>
                              )}
                              {!team.description && (
                                <p className="text-xs text-slate-600 mt-0.5">Sin descripción</p>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="text-slate-400">
                                <MoreHorizontal className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleTeamClick(team);
                              }}>
                                <Settings className="h-4 w-4 mr-2" />
                                Ver Detalles
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Team Leader */}
                          <div>
                            <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">
                              Líder del Equipo
                            </p>
                            {team.leader ? (
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-violet-500/20 text-violet-400">
                                      {team.leader.name?.split(" ").map((n) => n[0]).join("") || "NA"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <Crown className="absolute -top-1 -right-1 h-4 w-4 text-amber-500" />
                                </div>
                                <div>
                                  <p className="font-medium text-white text-sm">{team.leader.name || "Sin nombre"}</p>
                                  <p className="text-xs text-slate-400">{team.leader.email}</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-slate-500 text-sm">Sin líder asignado</p>
                            )}
                          </div>

                          {/* Team Members */}
                          <div>
                            <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">
                              Miembros ({team.members.length})
                            </p>
                            <div className="flex -space-x-2">
                              {team.members.slice(0, 5).map((member) => (
                                <TooltipProvider key={member.id} delayDuration={0}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Avatar className="h-7 w-7 border-2 border-[#08090B] -ml-2 first:ml-0 ring-0 hover:z-10 hover:ring-1 hover:ring-violet-500/40 transition-all cursor-pointer">
                                        <AvatarImage src={member.user.image ?? undefined} />
                                        <AvatarFallback className="bg-violet-500/10 text-violet-300 text-[9px]">
                                          {member.user.name?.slice(0, 2).toUpperCase() ?? "??"}
                                        </AvatarFallback>
                                      </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                      {member.user.name ?? member.user.email ?? "Miembro"}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ))}
                              {team.members.length > 5 && (
                                <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-300 border-2 border-slate-900">
                                  +{team.members.length - 5}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Progress */}
                          <div>
                            <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">
                              Progreso General
                            </p>
                            <div className="flex items-center gap-3">
                              <CircularProgress value={teamProgress} size={60} strokeWidth={5} />
                              <div>
                                <p className="text-lg font-bold text-white">{Math.round(teamProgress)}%</p>
                                <p className="text-xs text-slate-400">{team.goals.length} objetivos</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
              {/* Herramientas */}
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
          </motion.div>
        </main>
      </div>

      {/* Create Team Dialog */}
      <CreateTeamDialog
        open={createTeamOpen}
        onClose={() => setCreateTeamOpen(false)}
        users={users}
        onCreate={(data) => createTeamMutation.mutate(data)}
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
