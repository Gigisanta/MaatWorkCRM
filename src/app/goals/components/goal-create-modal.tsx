'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

const goalFormSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(100, "Máximo 100 caracteres"),
  description: z.string().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
  type: z.enum(["revenue", "new_clients", "meetings", "new_aum", "custom"], {
    required_error: "Selecciona un tipo",
  }),
  targetValue: z.number().min(1, "El valor objetivo debe ser mayor a 0"),
  currentValue: z.number().min(0, "El valor actual no puede ser negativo").default(0),
  unit: z.enum(["currency", "count", "percentage"]).default("count"),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  privacy: z.enum(["private", "team", "company"]).default("private"),
  parentGoalId: z.string().optional().or(z.literal("")),
});

type GoalFormInput = z.input<typeof goalFormSchema>;
type GoalFormData = z.infer<typeof goalFormSchema>;

interface Goal {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  period: string;
  status: string;
}

interface TeamGoal {
  id: string;
  title: string;
  type: string;
}

interface GoalCreateModalProps {
  open: boolean;
  onClose: () => void;
  goalToEdit?: Goal | null;
  onSuccess?: () => void;
}

export function GoalCreateModal({
  open,
  onClose,
  goalToEdit,
  onSuccess,
}: GoalCreateModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEditing = !!goalToEdit;

  // Fetch parent goals (user's existing goals that can be parent)
  const { data: parentGoalsData } = useQuery<{ goals: Goal[] }>({
    queryKey: ["goals", "parent"],
    queryFn: async () => {
      const response = await fetch("/api/goals/user?status=active&limit=100", { credentials: 'include' });
      if (!response.ok) throw new Error("Error al cargar objetivos");
      return response.json();
    },
    enabled: open,
  });

  // Fetch team goals for alignment
  const { data: teamGoalsData } = useQuery<{ goals: TeamGoal[] }>({
    queryKey: ["team-goals", user?.organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/goals?organizationId=${user?.organizationId}`, { credentials: 'include' });
      if (!response.ok) throw new Error("Error al cargar objetivos de equipo");
      return response.json();
    },
    enabled: !!user?.organizationId && open,
  });

  const form = useForm<GoalFormInput>({
    resolver: zodResolver(goalFormSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      type: undefined,
      targetValue: 0,
      currentValue: 0,
      unit: "count",
      startDate: "",
      endDate: "",
      privacy: "private",
      parentGoalId: "",
    },
  });

  // Reset form when opening/closing or when goalToEdit changes
  React.useEffect(() => {
    if (open) {
      if (goalToEdit) {
        form.reset({
          title: goalToEdit.title,
          description: goalToEdit.description || "",
          type: goalToEdit.type as GoalFormInput["type"],
          targetValue: goalToEdit.targetValue,
          currentValue: goalToEdit.currentValue,
          unit: goalToEdit.unit as GoalFormInput["unit"],
          startDate: "",
          endDate: "",
          privacy: "private",
          parentGoalId: "",
        });
      } else {
        form.reset({
          title: "",
          description: "",
          type: undefined,
          targetValue: 0,
          currentValue: 0,
          unit: "count",
          startDate: "",
          endDate: "",
          privacy: "private",
          parentGoalId: "",
        });
      }
    }
  }, [open, goalToEdit, form]);

  const createGoalMutation = useMutation({
    mutationFn: async (data: GoalFormData) => {
      const response = await fetch("/api/goals/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: 'include',
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
      onClose();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: GoalFormData }) => {
      const response = await fetch(`/api/goals/user/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar objetivo");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Objetivo actualizado exitosamente");
      onClose();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    if (isEditing && goalToEdit) {
      updateGoalMutation.mutate({ id: goalToEdit.id, data: data as any });
    } else {
      createGoalMutation.mutate(data as any);
    }
  });

  const isPending = createGoalMutation.isPending || updateGoalMutation.isPending;
  const parentGoals = parentGoalsData?.goals || [];
  const teamGoals = teamGoalsData?.goals || [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#0E0F12]/95 backdrop-blur-xl border border-white/10 rounded-xl sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? "Editar Objetivo" : "Crear Nuevo Objetivo"}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {isEditing
              ? "Modifica los detalles del objetivo"
              : "Define un nuevo objetivo personal o alineado con un objetivo de equipo"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Título *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-[#0E0F12]/80 border-white/10 text-white placeholder:text-slate-600 focus:border-violet-500/50"
                      placeholder="Ej: $50k nuevos clientes"
                    />
                  </FormControl>
                  <FormMessage className="text-rose-400" />
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
                      className="bg-[#0E0F12]/80 border-white/10 text-white placeholder:text-slate-600 focus:border-violet-500/50 resize-none"
                      placeholder="Descripción del objetivo..."
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage className="text-rose-400" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[#0E0F12]/80 border-white/10 text-white focus:border-violet-500/50">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="revenue">Ingresos</SelectItem>
                        <SelectItem value="new_clients">Nuevos Clientes</SelectItem>
                        <SelectItem value="meetings">Reuniones</SelectItem>
                        <SelectItem value="new_aum">Nuevos Activos</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-rose-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Unidad</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[#0E0F12]/80 border-white/10 text-white focus:border-violet-500/50">
                          <SelectValue placeholder="Unidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="count">Cantidad</SelectItem>
                        <SelectItem value="currency">Moneda ($)</SelectItem>
                        <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-rose-400" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="targetValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Valor Objetivo *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        className="bg-[#0E0F12]/80 border-white/10 text-white placeholder:text-slate-600 focus:border-violet-500/50"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage className="text-rose-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Valor Actual</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        className="bg-[#0E0F12]/80 border-white/10 text-white placeholder:text-slate-600 focus:border-violet-500/50"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage className="text-rose-400" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Fecha de Inicio</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        className="bg-[#0E0F12]/80 border-white/10 text-white focus:border-violet-500/50 [color-scheme:dark]"
                      />
                    </FormControl>
                    <FormMessage className="text-rose-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Fecha Límite</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        className="bg-[#0E0F12]/80 border-white/10 text-white focus:border-violet-500/50 [color-scheme:dark]"
                      />
                    </FormControl>
                    <FormMessage className="text-rose-400" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="privacy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Privacidad</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[#0E0F12]/80 border-white/10 text-white focus:border-violet-500/50">
                          <SelectValue placeholder="Privacidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="private">Privado</SelectItem>
                        <SelectItem value="team">Equipo</SelectItem>
                        <SelectItem value="company">Empresa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-rose-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parentGoalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Objetivo Padre</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[#0E0F12]/80 border-white/10 text-white focus:border-violet-500/50">
                          <SelectValue placeholder="Sin padre" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Sin padre</SelectItem>
                        {parentGoals.map((goal) => (
                          <SelectItem key={goal.id} value={goal.id}>
                            {goal.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-slate-500 text-[10px]">
                      Alinea con un objetivo existente
                    </FormDescription>
                    <FormMessage className="text-rose-400" />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-white/10 text-slate-300 hover:bg-white/5"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-violet-600 hover:bg-violet-500 text-white"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isEditing ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
