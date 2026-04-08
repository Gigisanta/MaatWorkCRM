'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { productionCreateSchema, productionTypes, productionEstados } from '@/lib/schemas/production';

const formSchema = productionCreateSchema;

type ProductionFormDataInput = z.input<typeof formSchema>;
type ProductionFormData = z.infer<typeof formSchema>;

interface Contact {
  id: string;
  name: string;
  emoji?: string;
}

interface CreateProductionDialogProps {
  open: boolean;
  onClose: () => void;
  contactId?: string;
}

export function CreateProductionDialog({
  open,
  onClose,
  contactId: initialContactId,
}: CreateProductionDialogProps) {
  const queryClient = useQueryClient();

  // Fetch contacts for selector
  const { data: contactsData } = useQuery<{ items: Contact[] }>({
    queryKey: ['contacts-selector'],
    queryFn: async () => {
      const response = await fetch('/api/contacts?limit=100', { credentials: 'include' });
      if (!response.ok) throw new Error('Error al cargar contactos');
      return response.json();
    },
    enabled: !!open,
  });
  const contacts = contactsData?.items ?? [];

  const form = useForm<ProductionFormDataInput>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      contactId: initialContactId || '',
      nombreProducto: '',
      tipo: 'seguro_vida',
      emisor: '',
      numeroPoliza: '',
      primaMensual: undefined,
      incrementPercentage: undefined,
      valorTotal: undefined,
      moneda: 'MXN',
      fechaInicio: '',
      fechaVencimiento: '',
      estado: 'activo',
      notas: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductionFormData) => {
      const response = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear producción');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productions'] });
      toast.success('Producción creada exitosamente');
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: ProductionFormDataInput) => {
    createMutation.mutate(data as ProductionFormData);
  };

  const tipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      seguro_vida: 'Seguro de Vida',
      seguro_accidentes: 'Seguro de Accidentes',
      inversion: 'Inversión',
      fondo: 'Fondo',
      deposito: 'Depósito',
      otro: 'Otro',
    };
    return labels[tipo] || tipo;
  };

  const estadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      activo: 'Activo',
      cancelado: 'Cancelado',
      suspendido: 'Suspendido',
    };
    return labels[estado] || estado;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass border-white/10 bg-slate-900 max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Nueva Producción</DialogTitle>
          <DialogDescription className="sr-only">
            Formulario para registrar una nueva producción
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Contact Selector */}
            <FormField
              name="contactId"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-400">Contacto *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="glass border-white/10 bg-white/5 text-white">
                        <SelectValue placeholder="Seleccionar contacto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          <span className="mr-1">{contact.emoji || '👤'}</span>
                          {contact.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nombre Producto */}
            <FormField
              name="nombreProducto"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-400">Nombre del Producto *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="glass border-white/10 bg-white/5 text-white"
                      placeholder="Ej: GNP Seguro Vida Plus"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo */}
            <FormField
              name="tipo"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-400">Tipo *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="glass border-white/10 bg-white/5 text-white">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {productionTypes.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipoLabel(tipo)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Emisor y Número de Póliza */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="emisor"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-400">Emisor</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="glass border-white/10 bg-white/5 text-white"
                        placeholder="Ej: GNP"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="numeroPoliza"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-400">No. de Póliza</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="glass border-white/10 bg-white/5 text-white"
                        placeholder="Ej: POL-123456"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Prima Mensual y Moneda */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="primaMensual"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-400">Prima Mensual</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        step="0.01"
                        className="glass border-white/10 bg-white/5 text-white"
                        placeholder="Ej: 1500.00"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="moneda"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-400">Moneda</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? 'MXN'}>
                      <FormControl>
                        <SelectTrigger className="glass border-white/10 bg-white/5 text-white">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MXN">MXN</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Valor Total y Porcentaje de Incremento */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="valorTotal"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-400">Valor Total</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        step="0.01"
                        className="glass border-white/10 bg-white/5 text-white"
                        placeholder="Ej: 50000.00"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="incrementPercentage"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-400">% Incremento</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        max={100}
                        className="glass border-white/10 bg-white/5 text-white"
                        placeholder="Ej: 10"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="fechaInicio"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-400">Fecha de Inicio</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        className="glass border-white/10 bg-white/5 text-white"
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="fechaVencimiento"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-400">Fecha de Vencimiento</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        className="glass border-white/10 bg-white/5 text-white"
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Estado */}
            <FormField
              name="estado"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-400">Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="glass border-white/10 bg-white/5 text-white">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {productionEstados.map((estado) => (
                        <SelectItem key={estado} value={estado}>
                          {estadoLabel(estado)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notas */}
            <FormField
              name="notas"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-400">Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="glass border-white/10 bg-white/5 text-white resize-none"
                      placeholder="Observaciones adicionales..."
                      rows={3}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="glass border-white/10"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-violet-500 hover:bg-violet-600"
              >
                {createMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Crear Producción
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
