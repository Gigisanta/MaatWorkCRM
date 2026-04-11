'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  Search,
  Loader2,
  MoreHorizontal,
  Trash2,
  Edit,
  AlertCircle,
  CheckCircle,
  Download,
  Clock,
  TrendingUp,
  GraduationCap,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { useSidebar } from '@/contexts/sidebar-context';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils/utils';
import { EmptyState } from '@/components/ui/empty-state';

// Dynamic imports for dialogs to avoid hydration mismatch
const Dialog = dynamic(
  () => import('@/components/ui/dialog').then(m => m.Dialog),
  { ssr: false }
);
const DialogContent = dynamic(
  () => import('@/components/ui/dialog').then(m => m.DialogContent),
  { ssr: false }
);
const DialogHeader = dynamic(
  () => import('@/components/ui/dialog').then(m => m.DialogHeader),
  { ssr: false }
);
const DialogTitle = dynamic(
  () => import('@/components/ui/dialog').then(m => m.DialogTitle),
  { ssr: false }
);
const DialogFooter = dynamic(
  () => import('@/components/ui/dialog').then(m => m.DialogFooter),
  { ssr: false }
);
const DialogDescription = dynamic(
  () => import('@/components/ui/dialog').then(m => m.DialogDescription),
  { ssr: false }
);

// Types
interface Reclutado {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: 'prospecto' | 'contactado' | 'entrevista' | 'incorporado' | 'rechazado';
  etapa: number;
  notas?: string;
  createdAt: string;
  assignedTo?: { id: string; name: string };
}

interface ReclutadosResponse {
  items: Reclutado[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Status config
const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: typeof CheckCircle }> = {
  prospecto: { label: 'Prospecto', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: Clock },
  contactado: { label: 'Contactado', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Users },
  entrevista: { label: 'Entrevista', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: GraduationCap },
  incorporado: { label: 'Incorporado', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle },
  rechazado: { label: 'Rechazado', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: AlertCircle },
};

// Mock data for demo (since no API exists yet)
const mockReclutados: Reclutado[] = [
  {
    id: '1',
    name: 'María García',
    email: 'maria.garcia@ejemplo.com',
    phone: '+52 55 1234 5678',
    company: 'Tech Startups',
    status: 'prospecto',
    etapa: 1,
    createdAt: '2026-04-01T10:00:00.000Z',
    assignedTo: { id: '1', name: 'Giovanni Admin' },
  },
  {
    id: '2',
    name: 'Carlos López',
    email: 'carlos.lopez@ejemplo.com',
    status: 'contactado',
    etapa: 2,
    createdAt: '2026-04-03T14:30:00.000Z',
    assignedTo: { id: '1', name: 'Giovanni Admin' },
  },
  {
    id: '3',
    name: 'Ana Martínez',
    email: 'ana.martinez@ejemplo.com',
    company: 'Innovatech',
    status: 'entrevista',
    etapa: 3,
    createdAt: '2026-04-05T09:15:00.000Z',
    assignedTo: { id: '1', name: 'Giovanni Admin' },
  },
  {
    id: '4',
    name: 'Pedro Sánchez',
    email: 'pedro.sanchez@ejemplo.com',
    status: 'incorporado',
    etapa: 5,
    createdAt: '2026-04-08T16:45:00.000Z',
    assignedTo: { id: '1', name: 'Giovanni Admin' },
  },
];

// Fetch reclutados (mock for now)
async function fetchReclutados(params: {
  organizationId: string;
  status?: string;
  search?: string;
}): Promise<ReclutadosResponse> {
  // TODO: Replace with actual API call when backend is ready
  // const response = await fetch(`/api/reclutados?${searchParams.toString()}`, { credentials: 'include' });
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

  let items = [...mockReclutados];

  if (params.status && params.status !== 'all') {
    items = items.filter(r => r.status === params.status);
  }

  if (params.search) {
    const search = params.search.toLowerCase();
    items = items.filter(r =>
      r.name.toLowerCase().includes(search) ||
      r.email.toLowerCase().includes(search) ||
      r.company?.toLowerCase().includes(search)
    );
  }

  return {
    items,
    pagination: { page: 1, limit: 50, total: items.length, totalPages: 1 },
  };
}

// Delete reclutado (mock)
async function deleteReclutado(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300));
}

// Reclutado Row Component
function ReclutadoRow({
  reclutado,
  onDelete,
}: {
  reclutado: Reclutado;
  onDelete: (id: string) => void;
}) {
  const status = statusConfig[reclutado.status] || statusConfig.prospecto;
  const StatusIcon = status.icon;

  return (
    <TableRow className="border-b border-white/8 hover:bg-white/4 transition-colors">
      <TableCell className="text-white font-medium">{reclutado.name}</TableCell>
      <TableCell className="text-slate-400">{reclutado.email}</TableCell>
      <TableCell className="text-slate-400">{reclutado.company || '-'}</TableCell>
      <TableCell>
        <Badge variant="outline" className={cn('text-xs', status.bg, status.color, status.border)}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {status.label}
        </Badge>
      </TableCell>
      <TableCell className="text-slate-400">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((etapa) => (
            <div
              key={etapa}
              className={cn(
                'h-1.5 w-6 rounded-full',
                etapa <= reclutado.etapa ? 'bg-violet-500' : 'bg-white/10'
              )}
            />
          ))}
        </div>
      </TableCell>
      <TableCell className="text-slate-400">
        {reclutado.assignedTo?.name || '-'}
      </TableCell>
      <TableCell className="text-slate-400">
        {format(parseISO(reclutado.createdAt), 'd MMM yyyy')}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-rose-500" onClick={() => onDelete(reclutado.id)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// Main Page
export default function ReclutamientoPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [search, setSearch] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [reclutadoToDelete, setReclutadoToDelete] = React.useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const [newReclutado, setNewReclutado] = React.useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'prospecto' as const,
  });

  const { collapsed, setCollapsed } = useSidebar();

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fix hydration mismatch with Radix UI
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch reclutados
  const { data, isLoading, error } = useQuery({
    queryKey: ['reclutados', filterStatus, debouncedSearch],
    queryFn: () => fetchReclutados({
      organizationId: user?.organizationId ?? '',
      status: filterStatus,
      search: debouncedSearch,
    }),
    enabled: !!user?.organizationId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteReclutado,
    onSuccess: () => {
      toast.success('Reclutado eliminado');
      queryClient.invalidateQueries({ queryKey: ['reclutados'] });
      setDeleteDialogOpen(false);
      setReclutadoToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Handlers
  const handleDeleteClick = (id: string) => {
    setReclutadoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (reclutadoToDelete) {
      deleteMutation.mutate(reclutadoToDelete);
    }
  };

  const reclutados = data?.items ?? [];

  // Stats
  const stats = React.useMemo(() => {
    const all = mockReclutados;
    return {
      total: all.length,
      prospectos: all.filter(r => r.status === 'prospecto').length,
      contactados: all.filter(r => r.status === 'contactado').length,
      entrevistas: all.filter(r => r.status === 'entrevista').length,
      incorporados: all.filter(r => r.status === 'incorporado').length,
    };
  }, [data]);

  // Handle error
  if (error) {
    return (
      <div className="min-h-screen gradient-bg">
        <AppSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
        <div className={cn('transition-all duration-300', collapsed ? 'lg:pl-[80px]' : 'lg:pl-[220px]')}>
          <AppHeader />
          <main className="p-4 lg:p-6">
            <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-3" />
                <p className="text-white mb-2">Error al cargar reclutados</p>
                <p className="text-slate-400 text-sm mb-4">{(error as Error).message}</p>
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['reclutados'] })}>
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
      <div className={cn('transition-all duration-300', collapsed ? 'lg:pl-[80px]' : 'lg:pl-[220px]')}>
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
                <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-1">RECLUTAMIENTO</p>
                <h1 className="text-2xl font-bold text-white tracking-tight">Startup 100</h1>
                <p className="text-slate-500 mt-1 text-sm">
                  Gestiona el proceso de reclutamiento del programa
                </p>
              </div>
              <div className="flex gap-3">
                <a
                  href="/api/teams/template/startup-100"
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 rounded-lg text-violet-300 text-sm transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Descargar Plantilla Excel
                </a>
                <Button className="bg-violet-500 hover:bg-violet-600" onClick={() => setCreateDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Nuevo Prospecto
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-violet-500/10 p-2.5 rounded-xl">
                      <Users className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.total}</p>
                      <p className="text-xs text-slate-400">Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-500/10 p-2.5 rounded-xl">
                      <Clock className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.prospectos}</p>
                      <p className="text-xs text-slate-400">Prospectos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-500/10 p-2.5 rounded-xl">
                      <GraduationCap className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.entrevistas}</p>
                      <p className="text-xs text-slate-400">Entrevistas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/10 p-2.5 rounded-xl">
                      <TrendingUp className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.incorporados}</p>
                      <p className="text-xs text-slate-400">Incorporados</p>
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
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      placeholder="Buscar por nombre, email o empresa..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px] bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="prospecto">Prospecto</SelectItem>
                      <SelectItem value="contactado">Contactado</SelectItem>
                      <SelectItem value="entrevista">Entrevista</SelectItem>
                      <SelectItem value="incorporado">Incorporado</SelectItem>
                      <SelectItem value="rechazado">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl overflow-hidden">
                <CardContent className="p-0">
                  {reclutados.length === 0 ? (
                    <EmptyState
                      icon={Users}
                      title="No hay reclutados"
                      description={
                        search
                          ? `No se encontraron resultados para "${search}"`
                          : "Comienza agregando tu primer prospecto"
                      }
                      action={!search ? { label: "Agregar prospecto", onClick: () => {} } : undefined}
                    />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-white/8 hover:bg-transparent">
                          <TableHead className="text-slate-400">Nombre</TableHead>
                          <TableHead className="text-slate-400">Email</TableHead>
                          <TableHead className="text-slate-400">Empresa</TableHead>
                          <TableHead className="text-slate-400">Estado</TableHead>
                          <TableHead className="text-slate-400">Etapa</TableHead>
                          <TableHead className="text-slate-400">Asignado</TableHead>
                          <TableHead className="text-slate-400">Fecha</TableHead>
                          <TableHead className="text-right text-slate-400">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {reclutados.map((reclutado) => (
                            <ReclutadoRow
                              key={reclutado.id}
                              reclutado={reclutado}
                              onDelete={handleDeleteClick}
                            />
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </main>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-slate-900/95">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Eliminar reclutado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El reclutado será eliminado permanentemente.
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

      {/* Create New Prospecto Dialog */}
      {createDialogOpen && (
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Nuevo Prospecto</DialogTitle>
            <DialogDescription className="sr-only">
              Formulario para registrar un nuevo prospecto de reclutamiento
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Nombre *</label>
              <Input
                value={newReclutado.name}
                onChange={(e) => setNewReclutado({ ...newReclutado, name: e.target.value })}
                placeholder="Nombre completo"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Email</label>
              <Input
                type="email"
                value={newReclutado.email}
                onChange={(e) => setNewReclutado({ ...newReclutado, email: e.target.value })}
                placeholder="correo@ejemplo.com"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Teléfono</label>
              <Input
                value={newReclutado.phone}
                onChange={(e) => setNewReclutado({ ...newReclutado, phone: e.target.value })}
                placeholder="+52 55 1234 5678"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Empresa</label>
              <Input
                value={newReclutado.company}
                onChange={(e) => setNewReclutado({ ...newReclutado, company: e.target.value })}
                placeholder="Empresa o startup"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                className="border-white/10"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="bg-violet-500 hover:bg-violet-600"
                onClick={() => {
                  // TODO: Connect to API when backend is ready
                  toast.success('Prospecto creado (mock)');
                  setCreateDialogOpen(false);
                  setNewReclutado({ name: '', email: '', phone: '', company: '', status: 'prospecto' });
                }}
              >
                Crear Prospecto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}
