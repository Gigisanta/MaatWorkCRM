"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  RotateCcw,
  TrendingUp,
  DollarSign,
  Award,
  ChevronRight,
  X,
  Save,
} from "lucide-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { useSidebar } from "@/lib/sidebar-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { careerPlanCategories, careerPlanLevelSchema } from "@/lib/schemas/career-plan";

// ============================================
// Types
// ============================================

interface CareerPlanLevel {
  id: string;
  levelNumber: number;
  category: string;
  name: string;
  annualGoalUsd: number;
  percentage: number;
}

const levelFormSchema = careerPlanLevelSchema;
type LevelFormData = z.infer<typeof levelFormSchema>;

// ============================================
// Constants
// ============================================

const CATEGORY_COLORS: Record<string, string> = {
  'AGENTE F. JUNIOR': 'border-blue-500/30 text-blue-400 bg-blue-500/10',
  'AGENTE F. SEMI-SENIOR': 'border-amber-500/30 text-amber-400 bg-amber-500/10',
  'AGENTE F. SENIOR': 'border-violet-500/30 text-violet-400 bg-violet-500/10',
};

const CATEGORY_BG: Record<string, string> = {
  'AGENTE F. JUNIOR': 'bg-blue-500/10 border-blue-500/20',
  'AGENTE F. SEMI-SENIOR': 'bg-amber-500/10 border-amber-500/20',
  'AGENTE F. SENIOR': 'bg-violet-500/10 border-violet-500/20',
};

// ============================================
// Page Component
// ============================================

export default function CareerPlanPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { collapsed, setCollapsed } = useSidebar();

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingLevel, setEditingLevel] = React.useState<CareerPlanLevel | null>(null);
  const [deleteLevelId, setDeleteLevelId] = React.useState<string | null>(null);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = React.useState(false);

  const isAdmin = user ? ['admin', 'owner', 'developer'].includes(user.role) : false;

  // ============================================
  // Data Fetching
  // ============================================

  const { data: levels = [], isLoading } = useQuery({
    queryKey: ['career-plan-levels'],
    queryFn: async (): Promise<CareerPlanLevel[]> => {
      const res = await fetch('/api/career-plan/levels', { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar niveles');
      return res.json();
    },
  });

  // ============================================
  // Mutations
  // ============================================

  const createMutation = useMutation({
    mutationFn: async (data: LevelFormData) => {
      const res = await fetch('/api/career-plan/levels', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al crear nivel');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Nivel creado correctamente');
      queryClient.invalidateQueries({ queryKey: ['career-plan-levels'] });
      setFormOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LevelFormData> }) => {
      const res = await fetch(`/api/career-plan/levels/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al actualizar nivel');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Nivel actualizado correctamente');
      queryClient.invalidateQueries({ queryKey: ['career-plan-levels'] });
      setFormOpen(false);
      setEditingLevel(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/career-plan/levels/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al eliminar nivel');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Nivel eliminado');
      queryClient.invalidateQueries({ queryKey: ['career-plan-levels'] });
      setDeleteLevelId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/career-plan/levels', {
        method: 'PUT',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al restaurar niveles');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Niveles restaurados correctamente');
      queryClient.invalidateQueries({ queryKey: ['career-plan-levels'] });
      setRestoreConfirmOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // ============================================
  // Forms
  // ============================================

  const levelForm = useForm<LevelFormData>({
    resolver: zodResolver(levelFormSchema),
    defaultValues: {
      levelNumber: 1,
      category: 'AGENTE F. JUNIOR',
      name: '',
      annualGoalUsd: 0,
      percentage: 0,
    },
  });

  const openCreateForm = () => {
    levelForm.reset({
      levelNumber: levels.length > 0 ? levels[levels.length - 1].levelNumber + 1 : 1,
      category: 'AGENTE F. JUNIOR',
      name: '',
      annualGoalUsd: 0,
      percentage: 0,
    });
    setEditingLevel(null);
    setFormOpen(true);
  };

  const openEditForm = (level: CareerPlanLevel) => {
    levelForm.reset({
      levelNumber: level.levelNumber,
      category: level.category as typeof careerPlanCategories[number],
      name: level.name,
      annualGoalUsd: level.annualGoalUsd,
      percentage: level.percentage,
    });
    setEditingLevel(level);
    setFormOpen(true);
  };

  const onSubmit = (data: LevelFormData) => {
    if (editingLevel) {
      updateMutation.mutate({ id: editingLevel.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // ============================================
  // Render Helpers
  // ============================================

  const groupedLevels = React.useMemo(() => {
    const groups: Record<string, CareerPlanLevel[]> = {};
    for (const level of levels) {
      if (!groups[level.category]) groups[level.category] = [];
      groups[level.category].push(level);
    }
    // Sort levels within each group
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => a.levelNumber - b.levelNumber);
    }
    return groups;
  }, [levels]);

  if (!isAdmin) {
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
            >
              <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                <CardContent className="py-12 text-center">
                  <p className="text-slate-400">No tienes permisos para acceder a esta sección.</p>
                </CardContent>
              </Card>
            </motion.div>
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-1.5">Organización</p>
                <h1 className="text-2xl font-bold text-white tracking-tight">Plan de Carrera</h1>
                <p className="text-slate-500 mt-1.5 text-sm">
                  Define los niveles y objetivos anuales para el crecimiento de tu equipo
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setRestoreConfirmOpen(true)}
                  className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl text-slate-300"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restaurar niveles
                </Button>
                <Button
                  onClick={openCreateForm}
                  className="bg-violet-500 hover:bg-violet-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo nivel
                </Button>
              </div>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              </div>
            )}

            {/* Levels by category */}
            {!isLoading && Object.keys(groupedLevels).length === 0 && (
              <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                <CardContent className="py-12 text-center">
                  <Award className="h-12 w-12 mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-400 mb-2">No hay niveles configurados</p>
                  <p className="text-slate-500 text-sm mb-4">
                    Crea niveles para definir el plan de carrera de tu equipo
                  </p>
                  <Button onClick={openCreateForm} className="bg-violet-500 hover:bg-violet-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear primer nivel
                  </Button>
                </CardContent>
              </Card>
            )}

            {!isLoading && Object.entries(groupedLevels).map(([category, categoryLevels]) => (
              <Card
                key={category}
                className={cn(
                  "bg-[#0E0F12]/80 backdrop-blur-sm rounded-xl overflow-hidden",
                  CATEGORY_BG[category] || 'border border-white/8'
                )}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/10 p-2 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-violet-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-base">{category}</CardTitle>
                        <CardDescription className="text-slate-400 text-xs mt-0.5">
                          {categoryLevels.length} nivel{categoryLevels.length !== 1 ? 'es' : ''}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={cn('border', CATEGORY_COLORS[category] || 'border-white/20 text-slate-400')}>
                      {category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* Header row */}
                  <div className="grid grid-cols-12 gap-2 px-1 mb-2">
                    <div className="col-span-1 text-xs text-slate-500 uppercase tracking-wider">Nivel</div>
                    <div className="col-span-4 text-xs text-slate-500 uppercase tracking-wider">Nombre</div>
                    <div className="col-span-3 text-xs text-slate-500 uppercase tracking-wider">Objetivo Anual</div>
                    <div className="col-span-2 text-xs text-slate-500 uppercase tracking-wider">%</div>
                    <div className="col-span-2"></div>
                  </div>

                  {categoryLevels.map((level) => (
                    <div
                      key={level.id}
                      className="grid grid-cols-12 gap-2 items-center p-3 rounded-lg glass border border-white/8 hover:border-white/15 transition-colors group"
                    >
                      <div className="col-span-1">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-violet-400">{level.levelNumber}</span>
                        </div>
                      </div>
                      <div className="col-span-4">
                        <p className="text-white font-medium text-sm">{level.name}</p>
                      </div>
                      <div className="col-span-3 flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-white text-sm font-medium">
                          ${level.annualGoalUsd.toLocaleString('es-MX')}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <Badge variant="outline" className="border-white/10 text-slate-400 text-xs">
                          {level.percentage}%
                        </Badge>
                      </div>
                      <div className="col-span-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditForm(level)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-violet-400 hover:bg-violet-500/10"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteLevelId(level.id)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            {/* Info card */}
            <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 p-1.5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Briefcase className="h-4 w-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium mb-1">¿Cómo funciona el Plan de Carrera?</p>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      El progreso de cada miembro se calcula automáticamente según su producción anual activa (prima mensual × 12).
                      Los gerentes ven el progreso de su equipo junto con el propio.
                      Cada nivel tiene un objetivo en USD que determina el rango de progreso.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>

      {/* ============================================ */}
      {/* Create/Edit Level Modal */}
      {/* ============================================ */}
      <Dialog open={formOpen} onOpenChange={(open) => {
        setFormOpen(open);
        if (!open) setEditingLevel(null);
      }}>
        <DialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingLevel ? 'Editar Nivel' : 'Nuevo Nivel'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingLevel
                ? 'Actualiza la información del nivel de carrera.'
                : 'Define un nuevo nivel para el plan de carrera.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={levelForm.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Número de nivel</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  {...levelForm.register('levelNumber', { valueAsNumber: true })}
                  className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
                />
                {levelForm.formState.errors.levelNumber && (
                  <p className="text-xs text-red-400">{levelForm.formState.errors.levelNumber.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Categoría</Label>
                <Select
                  value={levelForm.watch('category')}
                  onValueChange={(val) => levelForm.setValue('category', val as typeof careerPlanCategories[number])}
                >
                  <SelectTrigger className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0E0F12] border-white/8">
                    {careerPlanCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Nombre del nivel</Label>
              <Input
                {...levelForm.register('name')}
                placeholder="Ej: Agente F. Junior III"
                className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
              />
              {levelForm.formState.errors.name && (
                <p className="text-xs text-red-400">{levelForm.formState.errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Objetivo anual (USD)</Label>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  {...levelForm.register('annualGoalUsd', { valueAsNumber: true })}
                  className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
                />
                {levelForm.formState.errors.annualGoalUsd && (
                  <p className="text-xs text-red-400">{levelForm.formState.errors.annualGoalUsd.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Porcentaje</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  {...levelForm.register('percentage', { valueAsNumber: true })}
                  className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
                />
                {levelForm.formState.errors.percentage && (
                  <p className="text-xs text-red-400">{levelForm.formState.errors.percentage.message}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setFormOpen(false); setEditingLevel(null); }}
                className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl text-slate-300"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-violet-500 hover:bg-violet-600"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editingLevel ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* Delete Confirmation */}
      {/* ============================================ */}
      <AlertDialog open={!!deleteLevelId} onOpenChange={() => setDeleteLevelId(null)}>
        <AlertDialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Eliminar Nivel</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              ¿Estás seguro de que deseas eliminar este nivel? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl text-slate-300">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => deleteLevelId && deleteMutation.mutate(deleteLevelId)}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ============================================ */}
      {/* Restore Default Levels Confirmation */}
      {/* ============================================ */}
      <AlertDialog open={restoreConfirmOpen} onOpenChange={setRestoreConfirmOpen}>
        <AlertDialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Restaurar Niveles por Defecto</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Esto eliminará todos los niveles actuales y los reemplazará con los 10 niveles estándar
              (5 Junior, 3 Semi-Senior, 2 Senior). Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl text-slate-300">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-violet-500 hover:bg-violet-600"
              onClick={() => restoreMutation.mutate()}
            >
              {restoreMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : 'Restaurar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
