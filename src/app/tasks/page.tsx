"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  MoreHorizontal,
  Trash2,
  Edit,
  Loader2,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { useSidebar } from "@/lib/sidebar-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { format, isToday, isTomorrow, isPast, parseISO, startOfDay, addDays } from "date-fns";
import { useAuth } from "@/lib/auth-context";

// Types
interface TaskUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface TaskContact {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  emoji?: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string | null;
  assignedTo: string | null;
  assignedUser: TaskUser | null;
  contactId: string | null;
  contact: TaskContact | null;
  isRecurrent: boolean;
  recurrenceRule: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface TasksResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Zod Schema
const taskSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(200, "El título es muy largo"),
  description: z.string().max(1000, "La descripción es muy larga").optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: z.string().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  isRecurrent: z.boolean().default(false),
  recurrenceRule: z.enum(["daily", "weekly", "monthly"]).optional().nullable(),
});

type TaskFormDataInput = z.input<typeof taskSchema>;
type TaskFormData = z.infer<typeof taskSchema>;

// Priority config
const priorityConfig = {
  low: { color: "bg-slate-500", label: "Baja", textColor: "text-slate-400" },
  medium: { color: "bg-blue-500", label: "Media", textColor: "text-blue-400" },
  high: { color: "bg-amber-500", label: "Alta", textColor: "text-amber-400" },
  urgent: { color: "bg-rose-500", label: "Urgente", textColor: "text-rose-400" },
};

// Fetch tasks
async function fetchTasks(params: {
  organizationId: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  overdue?: boolean;
}): Promise<TasksResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("organizationId", params.organizationId);
  
  if (params.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }
  if (params.priority && params.priority !== "all") {
    searchParams.set("priority", params.priority);
  }
  if (params.assignedTo && params.assignedTo !== "all") {
    searchParams.set("assignedTo", params.assignedTo);
  }
  if (params.overdue) {
    searchParams.set("overdue", "true");
  }

  const response = await fetch(`/api/tasks?${searchParams.toString()}`, { credentials: 'include' });
  if (!response.ok) {
    throw new Error("Error al cargar tareas");
  }
  return response.json();
}

// Create task
async function createTask(data: TaskFormData & { organizationId: string }): Promise<Task> {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      recurrenceRule: data.isRecurrent && data.recurrenceRule
        ? `FREQ=${data.recurrenceRule.toUpperCase()}`
        : null,
    }),
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al crear tarea");
  }
  return response.json();
}

// Update task
async function updateTask(id: string, data: Partial<TaskFormData>): Promise<Task> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      recurrenceRule: data.isRecurrent && data.recurrenceRule
        ? `FREQ=${data.recurrenceRule.toUpperCase()}`
        : null,
    }),
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al actualizar tarea");
  }
  return response.json();
}

// Complete task
async function completeTask(id: string): Promise<{ completedTask: Task; newRecurrentTask: Task | null }> {
  const response = await fetch(`/api/tasks/${id}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ createNextRecurrence: true }),
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al completar tarea");
  }
  return response.json();
}

// Delete task
async function deleteTask(id: string): Promise<void> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "DELETE",
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al eliminar tarea");
  }
}

// Task Card Component
function TaskCard({ 
  task, 
  onToggle, 
  onEdit, 
  onDelete,
  isToggling,
}: { 
  task: Task; 
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  isToggling: boolean;
}) {
  const dueDate = task.dueDate ? parseISO(task.dueDate) : null;
  const isOverdue = dueDate && isPast(dueDate) && task.status !== "completed";
  const isDueToday = dueDate && isToday(dueDate);
  const isDueTomorrow = dueDate && isTomorrow(dueDate);

  const formatDueDate = (date: Date) => {
    if (isToday(date)) return "Hoy";
    if (isTomorrow(date)) return "Mañana";
    return format(date, "d MMM");
  };

  const getRecurrenceLabel = (rule: string | null) => {
    if (!rule) return "Recurrente";
    if (rule.includes("DAILY")) return "Diario";
    if (rule.includes("WEEKLY")) return "Semanal";
    if (rule.includes("MONTHLY")) return "Mensual";
    return "Recurrente";
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "group p-4 rounded-lg glass border border-white/10 relative overflow-hidden",
        "hover:border-white/20 transition-all duration-200",
        task.status === "completed" && "opacity-60"
      )}
    >
      {/* Priority bar */}
      <div className={cn(
        "absolute left-0 top-3 bottom-3 w-[3px] rounded-full",
        task.priority === "urgent" ? "bg-rose-500" :
        task.priority === "high" ? "bg-amber-500" :
        task.priority === "medium" ? "bg-sky-500" : "bg-slate-600"
      )} />
      <div className="flex items-start gap-3 pl-4">
        <Checkbox
          id={`task-${task.id}`}
          checked={task.status === "completed"}
          onCheckedChange={() => onToggle(task.id)}
          disabled={isToggling}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className={cn(
                "font-medium",
                task.status === "completed" ? "text-slate-500 line-through" : "text-white"
              )}>
                {task.title}
              </p>
              {task.description && (
                <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-rose-500"
                  onClick={() => onDelete(task.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {/* Priority */}
            <span className={cn(
              "text-[10px] font-medium px-2 py-0.5 rounded-full border",
              task.priority === "urgent" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
              task.priority === "high" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
              task.priority === "medium" ? "bg-sky-500/10 text-sky-400 border-sky-500/20" :
              "bg-slate-500/10 text-slate-400 border-slate-500/20"
            )}>
              {task.priority === "urgent" ? "Urgente" :
               task.priority === "high" ? "Alta" :
               task.priority === "medium" ? "Media" : "Baja"}
            </span>

            {/* Due Date */}
            {dueDate && (
              <div className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue ? "text-rose-400" : "text-slate-400"
              )}>
                <Calendar className="h-3 w-3" />
                {formatDueDate(dueDate)}
                {isOverdue && <span className="text-rose-400">(Vencida)</span>}
              </div>
            )}

            {/* Recurrence */}
            {task.isRecurrent && (
              <Badge variant="outline" className="text-xs text-violet-400 border-violet-500/30">
                {getRecurrenceLabel(task.recurrenceRule)}
              </Badge>
            )}

            {/* Contact chip */}
            {task.contact && (
              <Link
                href={`/contacts?contactId=${task.contact.id}`}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 hover:bg-violet-500/20 transition-colors"
                onClick={e => e.stopPropagation()}
              >
                <span className="leading-none">{task.contact.emoji || "👤"}</span>
                {task.contact.name}
              </Link>
            )}
          </div>

          {/* Assigned To */}
          {task.assignedUser && (
            <div className="flex items-center gap-2 mt-3">
              <Avatar className="h-5 w-5">
                <AvatarImage src={task.assignedUser.image || undefined} />
                <AvatarFallback className="bg-violet-500/20 text-violet-400 text-[10px]">
                  {task.assignedUser.name?.split(" ").map(n => n[0]).join("") || "NA"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-slate-400">{task.assignedUser.name}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Task Skeleton
function TaskSkeleton() {
  return (
    <div className="p-4 rounded-lg glass border border-white/10">
      <div className="flex items-start gap-3">
        <Skeleton className="h-4 w-4 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-5 w-16 rounded" />
            <Skeleton className="h-5 w-20 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Task Group Component
function TaskGroup({
  label,
  tasks,
  badgeColor,
  defaultOpen = true,
  onToggle,
  onEdit,
  onDelete,
  togglingTasks,
}: {
  label: string;
  tasks: Task[];
  badgeColor: string;
  defaultOpen?: boolean;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  togglingTasks: Set<string>;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  if (tasks.length === 0) return null;
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-1 py-1 mb-2 text-left group"
      >
        <ChevronRight className={cn(
          "h-3.5 w-3.5 text-slate-500 transition-transform duration-200",
          open && "rotate-90"
        )} />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</span>
        <span className={cn("h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center", badgeColor)}>
          {tasks.length}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="group-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-2">
              {tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={() => onToggle(task)}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isToggling={togglingTasks.has(task.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Task Dialog Component
function TaskDialog({
  open,
  onOpenChange,
  task,
  onSuccess,
  users,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  onSuccess: () => void;
  users: { id: string; name: string | null }[];
}) {
  const queryClient = useQueryClient();
  const isEditing = !!task;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<TaskFormDataInput>({
    resolver: zodResolver(taskSchema) as any,
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      priority: task?.priority || "medium",
      dueDate: task?.dueDate ? format(parseISO(task.dueDate), "yyyy-MM-dd") : "",
      assignedTo: task?.assignedTo || "",
      contactId: task?.contactId || "",
      isRecurrent: task?.isRecurrent || false,
      recurrenceRule: task?.recurrenceRule?.includes("DAILY") ? "daily"
        : task?.recurrenceRule?.includes("WEEKLY") ? "weekly"
        : task?.recurrenceRule?.includes("MONTHLY") ? "monthly"
        : null,
    },
  });

  const isRecurrent = watch("isRecurrent");

  // Reset form when task changes
  React.useEffect(() => {
    if (open) {
      reset({
        title: task?.title || "",
        description: task?.description || "",
        priority: task?.priority || "medium",
        dueDate: task?.dueDate ? format(parseISO(task.dueDate), "yyyy-MM-dd") : "",
        assignedTo: task?.assignedTo || "",
        contactId: task?.contactId || "",
        isRecurrent: task?.isRecurrent || false,
        recurrenceRule: task?.recurrenceRule?.includes("DAILY") ? "daily" 
          : task?.recurrenceRule?.includes("WEEKLY") ? "weekly" 
          : task?.recurrenceRule?.includes("MONTHLY") ? "monthly" 
          : null,
      });
    }
  }, [open, task, reset]);

  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      if (isEditing && task) {
        return updateTask(task.id, data);
      }
      return createTask({ ...data, organizationId: user?.organizationId ?? "" });
    },
    onSuccess: () => {
      toast.success(isEditing ? "Tarea actualizada" : "Tarea creada");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: TaskFormDataInput) => {
    mutation.mutate(data as TaskFormData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-slate-900/95 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? "Editar Tarea" : "Crear Nueva Tarea"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Modifica los detalles de la tarea" 
              : "Completa los detalles para crear una nueva tarea"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">Título *</Label>
            <Input 
              id="title"
              {...register("title")}
              placeholder="Título de la tarea"
              className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
            />
            {errors.title && (
              <p className="text-xs text-rose-400">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">Descripción</Label>
            <Textarea 
              id="description"
              {...register("description")}
              placeholder="Descripción (opcional)"
              className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white resize-none"
              rows={3}
            />
            {errors.description && (
              <p className="text-xs text-rose-400">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Prioridad</Label>
              <Select 
                defaultValue={task?.priority || "medium"}
                onValueChange={(value) => setValue("priority", value as TaskFormData["priority"])}
              >
                <SelectTrigger className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-white">Fecha límite</Label>
              <Input 
                id="dueDate"
                type="date"
                {...register("dueDate")}
                className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Asignado a</Label>
            <Select 
              defaultValue={task?.assignedTo ?? "unassigned"}
              onValueChange={(value) => setValue("assignedTo", value === "unassigned" ? null : value)}
            >
              <SelectTrigger className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white">
                <SelectValue placeholder="Sin asignar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Sin asignar</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Checkbox
              id="isRecurrent"
              checked={isRecurrent}
              onCheckedChange={(checked) => setValue("isRecurrent", checked as boolean)}
            />
            <Label htmlFor="isRecurrent" className="text-white cursor-pointer">
              Tarea recurrente
            </Label>
          </div>

          {isRecurrent && (
            <div className="space-y-2">
              <Label className="text-white">Frecuencia</Label>
              <Select 
                defaultValue={task?.recurrenceRule?.includes("DAILY") ? "daily" 
                  : task?.recurrenceRule?.includes("WEEKLY") ? "weekly" 
                  : task?.recurrenceRule?.includes("MONTHLY") ? "monthly" 
                  : "weekly"}
                onValueChange={(value) => setValue("recurrenceRule", value as "daily" | "weekly" | "monthly")}
              >
                <SelectTrigger className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white">
                  <SelectValue placeholder="Frecuencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diario</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button 
              type="button"
              variant="outline" 
              className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              className="bg-violet-500 hover:bg-violet-600"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Main Page
function TasksPageContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  // State - check URL param for action=create to auto-open dialog
  const [taskSearch, setTaskSearch] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [filterPriority, setFilterPriority] = React.useState<string>("all");
  const [filterAssignedTo, setFilterAssignedTo] = React.useState<string>("all");

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = React.useState(searchParams.get('action') === 'create');
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [taskToDelete, setTaskToDelete] = React.useState<string | null>(null);

  // Toggling state for individual tasks
  const [togglingTasks, setTogglingTasks] = React.useState<Set<string>>(new Set());

  // Sidebar state
  const { collapsed, setCollapsed } = useSidebar();

  // Fetch users for assignment dropdown
  const { data: usersData } = useQuery({
    queryKey: ["users", user?.organizationId],
    queryFn: async (): Promise<{ users: { id: string; name: string | null }[] }> => {
      if (!user?.organizationId) return { users: [] };
      const res = await fetch(`/api/users?organizationId=${user.organizationId}`, { credentials: 'include' });
      if (!res.ok) return { users: [] };
      return res.json();
    },
    enabled: !!user?.organizationId,
    staleTime: 5 * 60 * 1000,
  });
  const users = usersData?.users || [];

  // Fetch tasks
  const { data, isLoading, error } = useQuery({
    queryKey: ["tasks", filterStatus, filterPriority, filterAssignedTo, user?.organizationId],
    queryFn: () => fetchTasks({
      organizationId: user?.organizationId ?? "",
      status: filterStatus,
      priority: filterPriority,
      assignedTo: filterAssignedTo,
    }),
    enabled: !!user?.organizationId,
  });

  // Complete task mutation
  const completeMutation = useMutation({
    mutationFn: completeTask,
    onMutate: (id) => {
      setTogglingTasks(prev => new Set(prev).add(id));
    },
    onSuccess: () => {
      toast.success("Tarea completada");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSettled: (_, __, id) => {
      setTogglingTasks(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
  });

  // Update task status mutation (for uncompleting)
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateTask(id, { status: status as TaskFormData["status"] }),
    onMutate: ({ id }) => {
      setTogglingTasks(prev => new Set(prev).add(id));
    },
    onSuccess: () => {
      toast.success("Estado actualizado");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSettled: (_, __, { id }) => {
      setTogglingTasks(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      toast.success("Tarea eliminada");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Handlers
  const handleToggleTask = (task: Task) => {
    if (task.status === "completed") {
      // Uncomplete - change to pending
      updateStatusMutation.mutate({ id: task.id, status: "pending" });
    } else {
      // Complete
      completeMutation.mutate(task.id);
    }
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setTaskToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (taskToDelete) {
      deleteMutation.mutate(taskToDelete);
    }
  };

  // Filter tasks by search
  const filteredTasks = React.useMemo(() => {
    const tasks = data?.tasks;
    if (!tasks) return [];
    return tasks.filter(task =>
      task.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
      task.description?.toLowerCase().includes(taskSearch.toLowerCase())
    );
  }, [data, taskSearch]);

  // Group tasks by status (for stats)
  const pendingTasks = filteredTasks.filter(t => t.status === "pending");
  const inProgressTasks = filteredTasks.filter(t => t.status === "in_progress");
  const completedTasks = filteredTasks.filter(t => t.status === "completed");

  // Count overdue
  const overdueCount = React.useMemo(() => {
    return filteredTasks.filter(t => {
      if (!t.dueDate || t.status === "completed") return false;
      return isPast(parseISO(t.dueDate));
    }).length;
  }, [filteredTasks]);

  // Group tasks by temporal proximity
  const groupedTasks = React.useMemo(() => {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    const endOfWeek = addDays(today, 7);

    return {
      overdue: filteredTasks.filter(t => t.dueDate && new Date(t.dueDate) < today && t.status !== "completed"),
      today: filteredTasks.filter(t => t.dueDate && isToday(new Date(t.dueDate)) && t.status !== "completed"),
      tomorrow: filteredTasks.filter(t => t.dueDate && isTomorrow(new Date(t.dueDate)) && t.status !== "completed"),
      thisWeek: filteredTasks.filter(t => t.dueDate && new Date(t.dueDate) > tomorrow && new Date(t.dueDate) <= endOfWeek && t.status !== "completed"),
      later: filteredTasks.filter(t => (!t.dueDate || new Date(t.dueDate) > endOfWeek) && t.status !== "completed"),
      completed: filteredTasks.filter(t => t.status === "completed"),
    };
  }, [filteredTasks]);

  // Handle error
  if (error) {
    return (
      <div className="min-h-screen gradient-bg">
        <AppSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
        <div className={cn("transition-all duration-300", collapsed ? "lg:pl-[80px]" : "lg:pl-[220px]")}>
          <AppHeader />
          <main className="p-4 lg:p-6">
            <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-3" />
                <p className="text-white mb-2">Error al cargar tareas</p>
                <p className="text-slate-400 text-sm mb-4">{(error as Error).message}</p>
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["tasks"] })}>
                  Reintentar
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
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
                  <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-1">TAREAS</p>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Tareas</h1>
                  <p className="text-slate-500 mt-1 text-sm">
                    {pendingTasks.length + inProgressTasks.length} pendientes
                    {overdueCount > 0 && (
                      <span className="text-rose-400 ml-2">
                        • {overdueCount} vencida{overdueCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <Button
                className="bg-violet-500 hover:bg-violet-600"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Tarea
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Circle className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-2xl font-bold text-white">{pendingTasks.length}</p>
                      <p className="text-xs text-slate-400">Pendientes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold text-white">{inProgressTasks.length}</p>
                      <p className="text-xs text-slate-400">En Progreso</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-2xl font-bold text-white">{completedTasks.length}</p>
                      <p className="text-xs text-slate-400">Completadas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-rose-500" />
                    <div>
                      <p className="text-2xl font-bold text-white">{overdueCount}</p>
                      <p className="text-xs text-slate-400">Vencidas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                    <input
                      value={taskSearch}
                      onChange={(e) => setTaskSearch(e.target.value)}
                      placeholder="Buscar tareas..."
                      className="w-full pl-9 pr-4 py-2 text-sm bg-white/4 border border-white/8 rounded-lg text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40 focus:bg-white/6 transition-all duration-200"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[160px] bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendientes</SelectItem>
                      <SelectItem value="in_progress">En Progreso</SelectItem>
                      <SelectItem value="completed">Completadas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-[160px] bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white">
                      <SelectValue placeholder="Prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="low">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterAssignedTo} onValueChange={setFilterAssignedTo}>
                    <SelectTrigger className="w-[160px] bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white">
                      <SelectValue placeholder="Asignado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name || 'Sin nombre'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tasks List */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <TaskSkeleton key={i} />
                ))}
              </div>
            ) : (
              <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                <CardContent className="p-4 lg:p-6">
                  <TaskGroup
                    label="Vencidas"
                    tasks={groupedTasks.overdue}
                    badgeColor="bg-rose-500/20 text-rose-400"
                    onToggle={handleToggleTask}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteClick}
                    togglingTasks={togglingTasks}
                  />
                  <TaskGroup
                    label="Hoy"
                    tasks={groupedTasks.today}
                    badgeColor="bg-amber-500/20 text-amber-400"
                    onToggle={handleToggleTask}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteClick}
                    togglingTasks={togglingTasks}
                  />
                  <TaskGroup
                    label="Mañana"
                    tasks={groupedTasks.tomorrow}
                    badgeColor="bg-sky-500/20 text-sky-400"
                    onToggle={handleToggleTask}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteClick}
                    togglingTasks={togglingTasks}
                  />
                  <TaskGroup
                    label="Esta semana"
                    tasks={groupedTasks.thisWeek}
                    badgeColor="bg-violet-500/20 text-violet-400"
                    onToggle={handleToggleTask}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteClick}
                    togglingTasks={togglingTasks}
                  />
                  <TaskGroup
                    label="Más adelante"
                    tasks={groupedTasks.later}
                    badgeColor="bg-slate-500/20 text-slate-400"
                    onToggle={handleToggleTask}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteClick}
                    togglingTasks={togglingTasks}
                  />
                  <TaskGroup
                    label="Completadas"
                    tasks={groupedTasks.completed}
                    badgeColor="bg-emerald-500/20 text-emerald-400"
                    defaultOpen={false}
                    onToggle={handleToggleTask}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteClick}
                    togglingTasks={togglingTasks}
                  />
                  {filteredTasks.length === 0 && (
                    <div className="py-16 text-center">
                      <CheckCircle2 className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-500">No hay tareas que coincidan</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </main>
      </div>

      {/* Create Task Dialog */}
      <TaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {}}
        users={users}
      />

      {/* Edit Task Dialog */}
      <TaskDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        task={selectedTask}
        onSuccess={() => setSelectedTask(null)}
        users={users}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-slate-900/95">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Eliminar tarea?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La tarea será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-500 hover:bg-rose-600"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TasksLoading() {
  return (
    <div className="min-h-screen bg-[#08090B] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<TasksLoading />}>
      <TasksPageContent />
    </Suspense>
  );
}
