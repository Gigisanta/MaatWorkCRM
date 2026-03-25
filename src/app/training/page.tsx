"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  BookOpen,
  Video,
  FileText,
  GraduationCap,
  ExternalLink,
  Clock,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
} from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { useSidebar } from "@/lib/sidebar-context";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { format, parseISO } from "date-fns";
import { useAuth } from "@/lib/auth-context";
import { EmptyState } from "@/components/ui/empty-state";

// Types
interface TrainingMaterial {
  id: string;
  title: string;
  description: string | null;
  category: "course" | "video" | "document" | "guide" | "other";
  url: string | null;
  content: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TrainingResponse {
  materials: TrainingMaterial[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Zod Schema
const materialSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(200, "El título es muy largo"),
  description: z.string().max(2000, "La descripción es muy larga").optional().nullable(),
  category: z.enum(["course", "video", "document", "guide", "other"]).default("other"),
  url: z.string().url("URL inválida").optional().nullable().or(z.literal("")),
  content: z.string().max(10000, "El contenido es muy largo").optional().nullable(),
  duration: z.string().max(50, "La duración es muy larga").optional().nullable(),
});

type MaterialFormDataInput = z.input<typeof materialSchema>;
type MaterialFormData = z.infer<typeof materialSchema>;

// Category config
const categoryConfig = {
  course: { icon: GraduationCap, color: "text-violet-400", bgColor: "bg-violet-500/10", label: "Curso" },
  video: { icon: Video, color: "text-rose-400", bgColor: "bg-rose-500/10", label: "Video" },
  document: { icon: FileText, color: "text-blue-400", bgColor: "bg-blue-500/10", label: "Documento" },
  guide: { icon: BookOpen, color: "text-emerald-400", bgColor: "bg-emerald-500/10", label: "Guía" },
  other: { icon: FileText, color: "text-slate-400", bgColor: "bg-slate-500/10", label: "Otro" },
};

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// API Functions
async function fetchMaterials(params: {
  organizationId: string;
  category?: string;
  search?: string;
}): Promise<TrainingResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("organizationId", params.organizationId);

  if (params.category && params.category !== "all") {
    searchParams.set("category", params.category);
  }
  if (params.search) {
    searchParams.set("search", params.search);
  }

  const response = await fetch(`/api/training?${searchParams.toString()}`, { credentials: 'include' });
  if (!response.ok) {
    throw new Error("Error al cargar materiales");
  }
  return response.json();
}

async function createMaterial(data: MaterialFormData & { duration?: string | null; organizationId: string }): Promise<TrainingMaterial> {
  const response = await fetch("/api/training", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: 'include',
    body: JSON.stringify({
      ...data,
      url: data.url || null,
      content: data.content || null,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al crear material");
  }
  return response.json();
}

async function updateMaterial(id: string, data: Partial<MaterialFormData>): Promise<TrainingMaterial> {
  const response = await fetch(`/api/training/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: 'include',
    body: JSON.stringify({
      ...data,
      url: data.url || null,
      content: data.content || null,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al actualizar material");
  }
  return response.json();
}

async function deleteMaterial(id: string): Promise<void> {
  const response = await fetch(`/api/training/${id}`, {
    method: "DELETE",
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al eliminar material");
  }
}

// Material Card Component
function MaterialCard({
  material,
  onEdit,
  onDelete,
}: {
  material: TrainingMaterial;
  onEdit: (material: TrainingMaterial) => void;
  onDelete: (id: string) => void;
}) {
  const config = categoryConfig[material.category];
  const Icon = config.icon;

  const handleOpenUrl = () => {
    if (material.url) {
      window.open(material.url, "_blank");
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl h-full hover:border-white/20 transition-all group flex flex-col">
        {/* Card header */}
        <div className="p-5 pb-3">
          <div className="flex items-start gap-3">
            <div className={cn("p-2.5 rounded-xl flex-shrink-0", config.bgColor)}>
              <Icon className={cn("h-5 w-5", config.color)} strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <span className={cn("text-[10px] font-medium uppercase tracking-wider", config.color)}>
                {config.label}
              </span>
              <h3 className="text-sm font-semibold text-white truncate mt-0.5">{material.title}</h3>
              {material.description && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{material.description}</p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 flex-shrink-0 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {material.url && (
                  <DropdownMenuItem onClick={handleOpenUrl}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onEdit(material)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-rose-500"
                  onClick={() => onDelete(material.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Card footer */}
        <div className="px-5 pb-4 pt-2 border-t border-white/5 mt-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {format(parseISO(material.createdAt), "d MMM yyyy")}
            </span>
            {material.url ? (
              <a
                href={material.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
              >
                Ver recurso
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="text-xs text-slate-600 flex items-center gap-1">
                <LinkIcon className="h-3 w-3" />
                Sin enlace
              </span>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Material Skeleton
function MaterialSkeleton() {
  return (
    <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3 mb-4" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-16 rounded" />
        </div>
        <div className="mt-3 pt-3 border-t border-white/10 flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

// Material Dialog Component
function MaterialDialog({
  open,
  onOpenChange,
  material,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material?: TrainingMaterial | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEditing = !!material;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<MaterialFormDataInput>({
    resolver: zodResolver(materialSchema) as any,
    defaultValues: {
      title: material?.title || "",
      description: material?.description || "",
      category: material?.category || "other",
      url: material?.url || "",
      content: material?.content || "",
    },
  });

  const watchCategory = watch("category");

  // Reset form when material changes
  React.useEffect(() => {
    if (open) {
      reset({
        title: material?.title || "",
        description: material?.description || "",
        category: material?.category || "other",
        url: material?.url || "",
        content: material?.content || "",
      });
    }
  }, [open, material, reset]);

  const mutation = useMutation({
    mutationFn: async (data: MaterialFormData) => {
      if (isEditing && material) {
        return updateMaterial(material.id, data);
      }
      return createMaterial({ ...data, organizationId: user?.organizationId ?? "" });
    },
    onSuccess: () => {
      toast.success(isEditing ? "Material actualizado" : "Material creado");
      queryClient.invalidateQueries({ queryKey: ["training-materials"] });
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: MaterialFormDataInput) => {
    mutation.mutate(data as MaterialFormData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-slate-900/95 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? "Editar Material" : "Añadir Material"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los detalles del material de capacitación"
              : "Completa los detalles para añadir un nuevo material de capacitación"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">Título *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Título del material"
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
              placeholder="Descripción del material (opcional)"
              className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white resize-none"
              rows={3}
            />
            {errors.description && (
              <p className="text-xs text-rose-400">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Categoría</Label>
              <Select
                value={watchCategory}
                onValueChange={(value) => setValue("category", value as MaterialFormData["category"])}
              >
                <SelectTrigger className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className={cn("h-4 w-4", config.color)} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="url" className="text-white">URL (opcional)</Label>
              <Input
                id="url"
                {...register("url")}
                placeholder="https://..."
                className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
              />
              {errors.url && (
                <p className="text-xs text-rose-400">{errors.url.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="text-white">Contenido interno (opcional)</Label>
            <Textarea
              id="content"
              {...register("content")}
              placeholder="Contenido del material si no hay URL externa..."
              className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white resize-none"
              rows={4}
            />
            {errors.content && (
              <p className="text-xs text-rose-400">{errors.content.message}</p>
            )}
          </div>

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
export default function TrainingPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [search, setSearch] = React.useState("");
  const [filterCategory, setFilterCategory] = React.useState("all");

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [selectedMaterial, setSelectedMaterial] = React.useState<TrainingMaterial | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [materialToDelete, setMaterialToDelete] = React.useState<string | null>(null);
  const { collapsed, setCollapsed } = useSidebar();

  // Debounced search
  const debouncedSearch = useDebounce(search, 300);

  // Fetch materials
  const { data, isLoading, error } = useQuery({
    queryKey: ["training-materials", filterCategory, debouncedSearch, user?.organizationId],
    queryFn: () => fetchMaterials({
      organizationId: user?.organizationId ?? "",
      category: filterCategory,
      search: debouncedSearch,
    }),
    enabled: !!user?.organizationId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteMaterial,
    onSuccess: () => {
      toast.success("Material eliminado");
      queryClient.invalidateQueries({ queryKey: ["training-materials"] });
      setDeleteDialogOpen(false);
      setMaterialToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Handlers
  const handleEditMaterial = (material: TrainingMaterial) => {
    setSelectedMaterial(material);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setMaterialToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (materialToDelete) {
      deleteMutation.mutate(materialToDelete);
    }
  };

  // Count by category
  const categoryCounts = React.useMemo(() => {
    const materials = data?.materials || [];
    return {
      course: materials.filter(m => m.category === "course").length,
      video: materials.filter(m => m.category === "video").length,
      document: materials.filter(m => m.category === "document").length,
      guide: materials.filter(m => m.category === "guide").length,
      other: materials.filter(m => m.category === "other").length,
    };
  }, [data]);

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
                <p className="text-white mb-2">Error al cargar materiales</p>
                <p className="text-slate-400 text-sm mb-4">{(error as Error).message}</p>
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["training-materials"] })}>
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
                  <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-1">CAPACITACIÓN</p>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Capacitación</h1>
                  <p className="text-slate-500 mt-1 text-sm">Materiales de formación y recursos del equipo</p>
                </div>
              </div>
              <Button
                className="bg-violet-500 hover:bg-violet-600"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Añadir Material
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(categoryConfig).slice(0, 4).map(([key, config]) => {
                const count = categoryCounts[key as keyof typeof categoryCounts] || 0;
                const Icon = config.icon;
                return (
                  <Card key={key} className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", config.bgColor)}>
                          <Icon className={cn("h-5 w-5", config.color)} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-white">{count}</p>
                          <p className="text-xs text-slate-400">{config.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Filters */}
            <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      placeholder="Buscar materiales..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setFilterCategory("all")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                  filterCategory === "all"
                    ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                    : "bg-white/4 text-slate-400 border border-white/8 hover:bg-white/8 hover:text-slate-300"
                )}
              >
                Todos
              </button>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setFilterCategory(key)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                    filterCategory === key
                      ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                      : "bg-white/4 text-slate-400 border border-white/8 hover:bg-white/8 hover:text-slate-300"
                  )}
                >
                  {config.label}
                </button>
              ))}
            </div>

            {/* Materials Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <MaterialSkeleton key={i} />
                ))}
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {data?.materials && data.materials.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.materials.map((material) => (
                      <MaterialCard
                        key={material.id}
                        material={material}
                        onEdit={handleEditMaterial}
                        onDelete={handleDeleteClick}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={GraduationCap}
                    title={search ? "Sin resultados" : "No hay materiales de capacitación"}
                    description={
                      search
                        ? `No se encontraron materiales para "${search}"`
                        : "Añade recursos de formación para tu equipo"
                    }
                    action={!search ? { label: "Añadir material", onClick: () => setCreateDialogOpen(true) } : undefined}
                  />
                )}
              </AnimatePresence>
            )}
          </motion.div>
        </main>
      </div>

      {/* Create Material Dialog */}
      <MaterialDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {}}
      />

      {/* Edit Material Dialog */}
      <MaterialDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        material={selectedMaterial}
        onSuccess={() => setSelectedMaterial(null)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-slate-900/95">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Eliminar material?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El material será eliminado permanentemente.
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
