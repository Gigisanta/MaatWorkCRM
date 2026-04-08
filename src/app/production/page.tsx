'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Loader2, MoreHorizontal, Trash2, Edit, DollarSign, TrendingUp, Shield, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { useSidebar } from '@/lib/sidebar-context';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { cn } from '@/lib/utils';
import { CreateProductionDialog } from './components/create-production-dialog';
import { productionEstados } from '@/lib/schemas/production';

// Types
interface ProductionContact {
  id: string;
  name: string;
  emoji?: string;
}

interface Production {
  id: string;
  contactId: string;
  contact: ProductionContact;
  nombreProducto: string;
  tipo: string;
  emisor?: string;
  numeroPoliza?: string;
  primaMensual?: number;
  incrementPercentage?: number;
  valorTotal?: number;
  moneda?: string;
  fechaInicio?: string;
  fechaVencimiento?: string;
  estado: string;
  notas?: string;
  createdAt: string;
}

interface ProductionsResponse {
  items: Production[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Fetch productions
async function fetchProductions(params: {
  status?: string;
  contactId?: string;
}): Promise<ProductionsResponse> {
  const searchParams = new URLSearchParams();
  if (params.status && params.status !== 'all') searchParams.set('status', params.status);
  if (params.contactId && params.contactId !== 'all') searchParams.set('contactId', params.contactId);

  const response = await fetch(`/api/production?${searchParams.toString()}`, { credentials: 'include' });
  if (!response.ok) throw new Error('Error al cargar producciones');
  return response.json();
}

// Delete production
async function deleteProduction(id: string): Promise<void> {
  const response = await fetch(`/api/production/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al eliminar producción');
  }
}

// Tipo labels
const tipoLabels: Record<string, string> = {
  seguro_vida: 'Seguro de Vida',
  seguro_accidentes: 'Seguro de Accidentes',
  inversion: 'Inversión',
  fondo: 'Fondo',
  deposito: 'Depósito',
  otro: 'Otro',
};

const estadoConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  activo: { label: 'Activo', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  cancelado: { label: 'Cancelado', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  suspendido: { label: 'Suspendido', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
};

// Production Row Component
function ProductionRow({
  production,
  onDelete,
}: {
  production: Production;
  onDelete: (id: string) => void;
}) {
  const estado = estadoConfig[production.estado] || estadoConfig.activo;
  const tipo = tipoLabels[production.tipo] || production.tipo;

  return (
    <TableRow className="border-b border-white/8 hover:bg-white/4 transition-colors">
      <TableCell className="text-white">
        <div className="flex items-center gap-2">
          <span>{production.contact.emoji || '👤'}</span>
          <span className="font-medium">{production.contact.name}</span>
        </div>
      </TableCell>
      <TableCell className="text-slate-300">{production.nombreProducto}</TableCell>
      <TableCell>
        <Badge variant="outline" className={cn('text-xs', estado.bg, estado.color, estado.border)}>
          {tipo}
        </Badge>
      </TableCell>
      <TableCell className="text-slate-400">{production.emisor || '-'}</TableCell>
      <TableCell className="text-slate-400">
        {production.primaMensual != null
          ? `${production.moneda || 'MXN'} ${production.primaMensual.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
          : '-'}
      </TableCell>
      <TableCell className="text-slate-400">
        {production.fechaVencimiento
          ? format(parseISO(production.fechaVencimiento), 'd MMM yyyy')
          : '-'}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={cn('text-xs', estado.bg, estado.color, estado.border)}>
          {estado.label}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-rose-500" onClick={() => onDelete(production.id)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// Main Page Content
function ProductionPageContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const [createDialogOpen, setCreateDialogOpen] = React.useState(searchParams.get('action') === 'create');
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [productionToDelete, setProductionToDelete] = React.useState<string | null>(null);
  const [filterStatus, setFilterStatus] = React.useState<string>('all');

  const { collapsed, setCollapsed } = useSidebar();

  const { data, isLoading, error } = useQuery({
    queryKey: ['productions', filterStatus],
    queryFn: () => fetchProductions({ status: filterStatus }),
    enabled: !!user?.organizationId,
  });

  const productions = data?.items ?? [];

  // Stats
  const totalPrima = productions
    .filter(p => p.estado === 'activo' && p.primaMensual != null)
    .reduce((sum, p) => sum + (p.primaMensual || 0), 0);

  const totalValor = productions
    .filter(p => p.estado === 'activo' && p.valorTotal != null)
    .reduce((sum, p) => sum + (p.valorTotal || 0), 0);

  const activeCount = productions.filter(p => p.estado === 'activo').length;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteProduction,
    onSuccess: () => {
      toast.success('Producción eliminada');
      queryClient.invalidateQueries({ queryKey: ['productions'] });
      setDeleteDialogOpen(false);
      setProductionToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleDeleteClick = (id: string) => {
    setProductionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (productionToDelete) {
      deleteMutation.mutate(productionToDelete);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen gradient-bg">
        <AppSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
        <div className={cn('transition-all duration-300', collapsed ? 'lg:pl-[80px]' : 'lg:pl-[220px]')}>
          <AppHeader />
          <main className="p-4 lg:p-6">
            <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
              <CardContent className="p-8 text-center">
                <p className="text-white mb-2">Error al cargar producciones</p>
                <p className="text-slate-400 text-sm mb-4">{(error as Error).message}</p>
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['productions'] })}>
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
                <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-1">PRODUCCIÓN</p>
                <h1 className="text-2xl font-bold text-white tracking-tight">Producción</h1>
                <p className="text-slate-500 mt-1 text-sm">
                  {productions.length} registros
                </p>
              </div>
              <Button
                className="bg-violet-500 hover:bg-violet-600"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Producción
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-violet-500/10 p-2.5 rounded-xl">
                      <DollarSign className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {totalPrima > 0
                          ? `${productions[0]?.moneda || 'MXN'} ${totalPrima.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                          : '—'}
                      </p>
                      <p className="text-xs text-slate-400">Prima Mensual Total</p>
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
                      <p className="text-2xl font-bold text-white">
                        {totalValor > 0
                          ? totalValor.toLocaleString('es-MX', { style: 'currency', currency: productions[0]?.moneda || 'MXN' })
                          : '—'}
                      </p>
                      <p className="text-xs text-slate-400">Valor Total Cartera</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-sky-500/10 p-2.5 rounded-xl">
                      <Shield className="h-5 w-5 text-sky-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{activeCount}</p>
                      <p className="text-xs text-slate-400">Producciones Activas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px] bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {productionEstados.map((estado) => (
                        <SelectItem key={estado} value={estado}>
                          {estadoConfig[estado]?.label || estado}
                        </SelectItem>
                      ))}
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
                  {productions.length === 0 ? (
                    <div className="p-8 text-center">
                      <CreditCard className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400 mb-1">No hay producciones</p>
                      <p className="text-slate-600 text-sm">Registra tu primera producción</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-white/8 hover:bg-transparent">
                          <TableHead className="text-slate-400">Contacto</TableHead>
                          <TableHead className="text-slate-400">Producto</TableHead>
                          <TableHead className="text-slate-400">Tipo</TableHead>
                          <TableHead className="text-slate-400">Emisor</TableHead>
                          <TableHead className="text-slate-400">Prima Mensual</TableHead>
                          <TableHead className="text-slate-400">Vencimiento</TableHead>
                          <TableHead className="text-slate-400">Estado</TableHead>
                          <TableHead className="text-right text-slate-400">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {productions.map((production) => (
                            <ProductionRow
                              key={production.id}
                              production={production}
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

      {/* Create Dialog */}
      <CreateProductionDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-slate-900/95">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Eliminar producción?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La producción será eliminada permanentemente.
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

function ProductionLoading() {
  return (
    <div className="min-h-screen bg-[#08090B] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
    </div>
  );
}

export default function ProductionPage() {
  return (
    <Suspense fallback={<ProductionLoading />}>
      <ProductionPageContent />
    </Suspense>
  );
}
