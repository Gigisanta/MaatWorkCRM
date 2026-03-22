'use client';

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Edit, Trash2, Loader2, Tag as TagIcon, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { usePlanningDialog } from "./usePlanningDialog";
import { useAuth } from "@/lib/auth-context";

// Types
interface Tag {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
}

interface ContactTag {
  id: string;
  contactId: string;
  tagId: string;
  tag: Tag;
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface AssignedUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface ContactDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  emoji: string;
  source: string | null;
  pipelineStageId: string | null;
  pipelineStage: PipelineStage | null;
  assignedTo: string | null;
  assignedUser: AssignedUser | null;
  tags: ContactTag[];
  createdAt: string;
  updatedAt: string;
  deals: Array<{
    id: string;
    title: string;
    value: number;
    probability: number;
    stage: PipelineStage | null;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    assignedUser: AssignedUser | null;
  }>;
  stageHistory: Array<{
    id: string;
    changedAt: string;
    fromStage: PipelineStage | null;
    toStage: PipelineStage | null;
  }>;
}

// Form Schema
const contactFormSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
  emoji: z.string().default("👤"),
  source: z.string().optional().or(z.literal("")),
  pipelineStageId: z.string().optional().or(z.literal("")),
  assignedTo: z.string().optional().or(z.literal("")),
});

type ContactFormDataInput = z.input<typeof contactFormSchema>;
type ContactFormData = z.infer<typeof contactFormSchema>;

interface ContactDrawerProps {
  contactId: string | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  stages: PipelineStage[];
  organizationId: string | null;
}

export function ContactDrawer({
  contactId,
  open,
  onClose,
  onEdit,
  onDelete,
  stages,
  organizationId,
}: ContactDrawerProps) {
  const [activeTab, setActiveTab] = React.useState("details");
  const [isEditing, setIsEditing] = React.useState(false);
  const [newTag, setNewTag] = React.useState("");
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { openDialog } = usePlanningDialog();

  // Check if user is admin (can reassign contacts)
  const isAdmin = user?.role === 'admin' || user?.role === 'owner' || user?.role === 'dueno';

  // Fetch organization users for assignment dropdown (only for admins)
  const { data: usersData } = useQuery<{ users: { id: string; name: string | null; email: string }[] }>({
    queryKey: ["organization-users", organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/users?organizationId=${organizationId}`);
      if (!response.ok) throw new Error("Error al cargar usuarios");
      return response.json();
    },
    enabled: !!organizationId && isAdmin,
  });

  // Fetch contact details
  const { data: contact, isLoading } = useQuery<ContactDetail>({
    queryKey: ["contact", contactId],
    queryFn: async () => {
      const response = await fetch(`/api/contacts/${contactId}`);
      if (!response.ok) throw new Error("Error al cargar contacto");
      return response.json();
    },
    enabled: !!contactId && open,
  });

  // Fetch financial plan to check if contact has one
  const { data: financialPlan } = useQuery({
    queryKey: ["contact-financial-plan", contactId],
    queryFn: async () => {
      const response = await fetch(`/api/contacts/${contactId}/planning`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!contactId && open,
  });

  // Edit form
  const form = useForm<ContactFormDataInput>({
    resolver: zodResolver(contactFormSchema) as any,
    values: contact
      ? {
          name: contact.name,
          email: contact.email || "",
          phone: contact.phone || "",
          company: contact.company || "",
          emoji: contact.emoji,
          source: contact.source || "",
          pipelineStageId: contact.pipelineStageId || "",
          assignedTo: contact.assignedTo || "",
        }
      : undefined,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error al actualizar contacto");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contact", contactId] });
      toast.success("Contacto actualizado");
      setIsEditing(false);
      onEdit();
    },
    onError: () => {
      toast.error("Error al actualizar contacto");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Error al eliminar contacto");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contacto eliminado");
      setShowDeleteDialog(false);
      onClose();
      onDelete();
    },
    onError: () => {
      toast.error("Error al eliminar contacto");
    },
  });

  // Add tag mutation
  const addTagMutation = useMutation({
    mutationFn: async (tagName: string) => {
      const response = await fetch(`/api/contacts/${contactId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagName,
          organizationId,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al agregar etiqueta");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact", contactId] });
      toast.success("Etiqueta agregada");
      setNewTag("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Remove tag mutation
  const removeTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      console.log(`[DEBUG DRAWER] Removing tag: contactId=${contactId}, tagId=${tagId}`);
      const response = await fetch(`/api/contacts/${contactId}/tags/${tagId}`, {
        method: "DELETE",
      });
      console.log(`[DEBUG DRAWER] Response status: ${response.status}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[DEBUG DRAWER] Error response:`, errorData);
        throw new Error(errorData?.error || "Error al eliminar etiqueta");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact", contactId] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Etiqueta eliminada");
    },
    onError: (error) => {
      console.error(`[DEBUG DRAWER] Mutation error:`, error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar etiqueta");
    },
  });

  const onSubmit = (data: ContactFormDataInput) => {
    updateMutation.mutate(data as ContactFormData);
  };

  if (!contactId) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="glass border-white/10 bg-slate-900/95 backdrop-blur-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b border-white/10 px-6 py-4 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isLoading ? (
                  <Skeleton className="h-10 w-10 rounded-full" />
                ) : (
                  <div className="text-4xl">{contact?.emoji || "👤"}</div>
                )}
                <div>
                  <DialogTitle className="text-xl font-semibold text-white">
                    {isLoading ? (
                      <Skeleton className="h-6 w-32" />
                    ) : (
                      contact?.name
                    )}
                  </DialogTitle>
                  {!isLoading && contact && (
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        style={{
                          backgroundColor: (contact.pipelineStage?.color || "#6366f1") + "20",
                          color: contact.pipelineStage?.color || "#6366f1",
                        }}
                        className="text-xs"
                      >
                        {contact.pipelineStage?.name || "Sin etapa"}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : contact ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b border-white/10 px-6">
                  <TabsList className="bg-transparent h-12 gap-4">
                    <TabsTrigger
                      value="details"
                      className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400"
                    >
                      Detalles
                    </TabsTrigger>
                    <TabsTrigger
                      value="pipeline"
                      className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400"
                    >
                      Pipeline
                    </TabsTrigger>
                    <TabsTrigger
                      value="tasks"
                      className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400"
                    >
                      Tareas
                    </TabsTrigger>
                    <TabsTrigger
                      value="activity"
                      className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400"
                    >
                      Actividad
                    </TabsTrigger>
                    {financialPlan && (
                      <TabsTrigger
                        value="planning"
                        className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400"
                      >
                        Plan Financiero
                      </TabsTrigger>
                    )}
                  </TabsList>
                </div>

                <div className="p-6">
                  <TabsContent value="details" className="mt-0 space-y-6">
                    {/* Quick Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 glass border-white/10"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {isEditing ? "Cancelar" : "Editar"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="glass border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "glass border-white/10",
                          financialPlan
                            ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                            : "border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
                        )}
                        onClick={() => openDialog(contactId!, contact?.name)}
                      >
                        {financialPlan ? (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            Editar Plan
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generar Plan
                          </>
                        )}
                      </Button>
                    </div>

                    {isEditing ? (
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            name="name"
                            control={form.control}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-400">Nombre *</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="glass border-white/10 bg-white/5 text-white"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              name="email"
                              control={form.control}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-400">Email</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="email"
                                      className="glass border-white/10 bg-white/5 text-white"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              name="phone"
                              control={form.control}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-400">Teléfono</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      className="glass border-white/10 bg-white/5 text-white"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            name="company"
                            control={form.control}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-400">Empresa</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="glass border-white/10 bg-white/5 text-white"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            name="pipelineStageId"
                            control={form.control}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-400">Etapa</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="glass border-white/10 bg-white/5 text-white">
                                      <SelectValue placeholder="Seleccionar etapa" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {stages.map((stage) => (
                                      <SelectItem key={stage.id} value={stage.id}>
                                        <div className="flex items-center gap-2">
                                          <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: stage.color }}
                                          />
                                          {stage.name}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {isAdmin && usersData?.users && (
                            <FormField
                              name="assignedTo"
                              control={form.control}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-400">Asignado a</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="glass border-white/10 bg-white/5 text-white">
                                        <SelectValue placeholder="Seleccionar usuario" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {usersData.users.map((u) => (
                                        <SelectItem key={u.id} value={u.id}>
                                          {u.name || u.email}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsEditing(false)}
                              className="glass border-white/10"
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="submit"
                              disabled={updateMutation.isPending}
                              className="bg-indigo-500 hover:bg-indigo-600"
                            >
                              {updateMutation.isPending && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              )}
                              Guardar
                            </Button>
                          </div>
                        </form>
                      </Form>
                    ) : (
                      <>
                        {/* Contact Info */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-xs text-slate-500">Email</p>
                              <p className="text-sm text-white">{contact.email || "Sin email"}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-slate-500">Teléfono</p>
                              <p className="text-sm text-white">{contact.phone || "Sin teléfono"}</p>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs text-slate-500">Empresa</p>
                            <p className="text-sm text-white">{contact.company || "Sin empresa"}</p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs text-slate-500">Asignado a</p>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-indigo-500/20 text-indigo-400 text-xs">
                                  {contact.assignedUser?.name
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("") || "NA"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-white">
                                {contact.assignedUser?.name || "Sin asignar"}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs text-slate-500">Etiquetas</p>
                            <div className="flex flex-wrap gap-2">
                              {contact.tags.length > 0 ? (
                                contact.tags.map((tag) => (
                                  <Badge
                                    key={tag.id}
                                    variant="secondary"
                                    className="text-xs gap-1"
                                    style={{
                                      backgroundColor: tag.tag.color + "20",
                                      color: tag.tag.color,
                                    }}
                                  >
                                    {tag.tag.name}
                                    <button
                                      onClick={() => removeTagMutation.mutate(tag.tagId)}
                                      className="ml-1 hover:text-red-400"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm text-slate-500">Sin etiquetas</span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Nueva etiqueta..."
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                className="glass border-white/10 bg-white/5 text-white placeholder:text-slate-500 h-8 text-sm"
                              />
                              <Button
                                size="sm"
                                onClick={() => newTag && addTagMutation.mutate(newTag)}
                                disabled={!newTag || addTagMutation.isPending}
                                className="bg-indigo-500 hover:bg-indigo-600 h-8"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="pipeline" className="mt-0 space-y-4">
                    <div className="p-4 rounded-lg glass border-white/10">
                      <p className="text-sm font-medium text-white mb-2">Etapa actual</p>
                      <Badge
                        style={{
                          backgroundColor: (contact.pipelineStage?.color || "#6366f1") + "20",
                          color: contact.pipelineStage?.color || "#6366f1",
                        }}
                      >
                        {contact.pipelineStage?.name || "Sin etapa"}
                      </Badge>
                    </div>

                    {contact.deals.length > 0 && (
                      <div className="p-4 rounded-lg glass border-white/10">
                        <p className="text-sm font-medium text-white mb-2">Deals ({contact.deals.length})</p>
                        <div className="space-y-2">
                          {contact.deals.map((deal) => (
                            <div key={deal.id} className="flex items-center justify-between">
                              <span className="text-slate-400">{deal.title}</span>
                              <span className="text-white font-medium">
                                ${deal.value.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {contact.stageHistory.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500">Historial de etapas</p>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {contact.stageHistory.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                              <div className="w-2 h-2 rounded-full bg-indigo-500" />
                              <div className="flex-1">
                                <p className="text-sm text-white">
                                  {item.fromStage?.name || "Inicio"} → {item.toStage?.name || "Sin etapa"}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {formatDistanceToNow(new Date(item.changedAt), {
                                    addSuffix: true,
                                  })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="tasks" className="mt-0 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white">
                        Tareas ({contact.tasks.length})
                      </p>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {contact.tasks.length > 0 ? (
                        contact.tasks.map((task) => (
                          <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg glass border-white/10">
                            <Checkbox checked={task.status === "completed"} />
                            <div className="flex-1">
                              <p
                                className={cn(
                                  "text-sm",
                                  task.status === "completed"
                                    ? "text-slate-500 line-through"
                                    : "text-white"
                                )}
                              >
                                {task.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs",
                                    task.priority === "high" && "border-rose-500/30 text-rose-500",
                                    task.priority === "medium" && "border-amber-500/30 text-amber-500",
                                    task.priority === "low" && "border-slate-500/30 text-slate-500"
                                  )}
                                >
                                  {task.priority}
                                </Badge>
                                {task.dueDate && (
                                  <span className="text-xs text-slate-500">
                                    {formatDistanceToNow(new Date(task.dueDate), {
                                      addSuffix: true,
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500 text-center py-4">
                          No hay tareas para este contacto
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="activity" className="mt-0 space-y-4">
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {contact.stageHistory && contact.stageHistory.length > 0 ? (
                        contact.stageHistory.map((history) => (
                          <div key={history.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5">
                            <div className="p-1.5 rounded-lg bg-violet-500/10">
                              <TagIcon className="h-4 w-4 text-violet-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-white">
                                Cambio de etapa: <span className="text-slate-400">{history.fromStage?.name || 'Sin etapa'}</span> → <span className="text-emerald-400">{history.toStage?.name}</span>
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {formatDistanceToNow(new Date(history.changedAt), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500 text-center py-4">
                          No hay historial de cambios
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="planning" className="mt-0 space-y-4">
                    {financialPlan ? (
                      <div className="space-y-4">
                        {/* Client Info Summary */}
                        {financialPlan.edad && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-lg glass border-white/10">
                              <p className="text-xs text-slate-500">Edad</p>
                              <p className="text-white font-medium">{financialPlan.edad}</p>
                            </div>
                            <div className="p-3 rounded-lg glass border-white/10">
                              <p className="text-xs text-slate-500">Perfil de Riesgo</p>
                              <p className="text-white font-medium capitalize">{financialPlan.perfilRiesgo || 'No definido'}</p>
                            </div>
                          </div>
                        )}

                        {financialPlan.profesion && (
                          <div className="p-3 rounded-lg glass border-white/10">
                            <p className="text-xs text-slate-500">Profesion</p>
                            <p className="text-white">{financialPlan.profesion}</p>
                          </div>
                        )}

                        {financialPlan.objetivo && (
                          <div className="p-3 rounded-lg glass border-white/10">
                            <p className="text-xs text-slate-500">Objetivo Financiero</p>
                            <p className="text-white">{financialPlan.objetivo}</p>
                          </div>
                        )}

                        {/* Financial Summary */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-3 rounded-lg glass border-white/10 text-center">
                            <p className="text-xs text-slate-500">Aporte Inicial</p>
                            <p className="text-emerald-400 font-bold">
                              {financialPlan.aporteInicial ? `$${financialPlan.aporteInicial.toLocaleString()}` : '-'}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg glass border-white/10 text-center">
                            <p className="text-xs text-slate-500">Aporte Mensual</p>
                            <p className="text-emerald-400 font-bold">
                              {financialPlan.aporteMensual ? `$${financialPlan.aporteMensual.toLocaleString()}` : '-'}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg glass border-white/10 text-center">
                            <p className="text-xs text-slate-500">Horizonte</p>
                            <p className="text-white font-bold">
                              {financialPlan.horizonteMeses ? `${financialPlan.horizonteMeses} meses` : '-'}
                            </p>
                          </div>
                        </div>

                        {/* Health Info */}
                        {(financialPlan.ingresosMensuales || financialPlan.gastosMensuales) && (
                          <div className="p-3 rounded-lg glass border-white/10">
                            <p className="text-xs text-slate-500 mb-2">Salud Financiera</p>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-slate-400">Ingresos Mensuales</p>
                                <p className="text-emerald-400">
                                  {financialPlan.ingresosMensuales ? `$${financialPlan.ingresosMensuales.toLocaleString()}` : '-'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-400">Gastos Mensuales</p>
                                <p className="text-rose-400">
                                  {financialPlan.gastosMensuales ? `$${financialPlan.gastosMensuales.toLocaleString()}` : '-'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Goals Count */}
                        {financialPlan.metas && financialPlan.metas.length > 0 && (
                          <div className="p-3 rounded-lg glass border-white/10">
                            <p className="text-xs text-slate-500">Metas ({financialPlan.metas.length})</p>
                            <div className="mt-2 space-y-1">
                              {financialPlan.metas.slice(0, 3).map((meta: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                  <span className="text-sm text-white">{meta.nombre}</span>
                                </div>
                              ))}
                              {financialPlan.metas.length > 3 && (
                                <p className="text-xs text-slate-400">+{financialPlan.metas.length - 3} mas...</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 glass border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
                            onClick={() => openDialog(contactId!, contact?.name)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Editar Plan
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 mb-4">Este contacto no tiene un plan financiero</p>
                        <Button
                          className="bg-indigo-500 hover:bg-indigo-600"
                          onClick={() => openDialog(contactId!, contact?.name)}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generar Plan
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="glass border-white/10 bg-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Eliminar contacto?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Esta acción no se puede deshacer. Se eliminará permanentemente el contacto y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass border-white/10">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-rose-500 hover:bg-rose-600"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
