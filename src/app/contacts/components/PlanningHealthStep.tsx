'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PlanningFormData } from './usePlanningDialog';

const healthFormSchema = z.object({
  ingresosMensuales: z.coerce.number().min(0).optional(),
  gastosMensuales: z.coerce.number().min(0).optional(),
  fondoEmergenciaMeses: z.coerce.number().min(0).optional(),
  fondoEmergenciaActual: z.coerce.number().min(0).optional(),
  patrimonioActivos: z.coerce.number().min(0).optional(),
  patrimonioDeudas: z.coerce.number().min(0).optional(),
});

type HealthFormData = z.infer<typeof healthFormSchema>;

interface PlanningHealthStepProps {
  data: PlanningFormData;
  onUpdate: (data: Partial<PlanningFormData>) => void;
}

export function PlanningHealthStep({ data, onUpdate }: PlanningHealthStepProps) {
  const form = useForm<HealthFormData>({
    resolver: zodResolver(healthFormSchema),
    defaultValues: {
      ingresosMensuales: data.ingresosMensuales,
      gastosMensuales: data.gastosMensuales,
      fondoEmergenciaMeses: data.fondoEmergenciaMeses,
      fondoEmergenciaActual: data.fondoEmergenciaActual,
      patrimonioActivos: data.patrimonioActivos,
      patrimonioDeudas: data.patrimonioDeudas,
    },
  });

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      onUpdate(values as Partial<PlanningFormData>);
    });
    return () => subscription.unsubscribe();
  }, [form, onUpdate]);

  const formValues = form.watch();

  // Calculate ratios
  const ratioEmergencia = formValues.ingresosMensuales && formValues.gastosMensuales
    ? Math.round((formValues.ingresosMensuales - formValues.gastosMensuales))
    : null;

  const patrimonioNeto = formValues.patrimonioActivos && formValues.patrimonioDeudas
    ? formValues.patrimonioActivos - formValues.patrimonioDeudas
    : null;

  const ratioAhorro = formValues.ingresosMensuales && formValues.gastosMensuales && formValues.ingresosMensuales > 0
    ? Math.round(((formValues.ingresosMensuales - formValues.gastosMensuales) / formValues.ingresosMensuales) * 100)
    : null;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-white">Salud Financiera</h3>
        <p className="text-sm text-slate-400">Situacion financiera actual del cliente</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass border-white/10 p-4">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-300">Ingresos y Gastos</h4>
            <Form {...form}>
              <div className="space-y-4">
                <FormField
                  name="ingresosMensuales"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-400">Ingresos Mensuales (USD)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="5000"
                          className="glass border-white/10 bg-white/5 text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="gastosMensuales"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-400">Gastos Mensuales (USD)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="3000"
                          className="glass border-white/10 bg-white/5 text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Form>
          </div>
        </Card>

        <Card className="glass border-white/10 p-4">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-300">Fondo de Emergencia</h4>
            <Form {...form}>
              <div className="space-y-4">
                <FormField
                  name="fondoEmergenciaActual"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-400">Fondo Actual (USD)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="15000"
                          className="glass border-white/10 bg-white/5 text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="fondoEmergenciaMeses"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-400">Meses de Cobertura</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="6"
                          className="glass border-white/10 bg-white/5 text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Form>
          </div>
        </Card>
      </div>

      <Card className="glass border-white/10 p-4">
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-300">Patrimonio</h4>
          <Form {...form}>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="patrimonioActivos"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-400">Activos Totales (USD)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="200000"
                        className="glass border-white/10 bg-white/5 text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="patrimonioDeudas"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-400">Deudas Totales (USD)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="50000"
                        className="glass border-white/10 bg-white/5 text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </div>
      </Card>

      {/* Calculated Ratios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={cn(
          'glass border-white/10 p-4',
          ratioAhorro !== null && ratioAhorro >= 20 && 'border-emerald-500/30',
          ratioAhorro !== null && ratioAhorro < 20 && ratioAhorro >= 10 && 'border-amber-500/30',
          ratioAhorro !== null && ratioAhorro < 10 && 'border-rose-500/30'
        )}>
          <p className="text-xs text-slate-400 mb-1">Ratio de Ahorro</p>
          <p className="text-2xl font-bold text-white">
            {ratioAhorro !== null ? `${ratioAhorro}%` : '--'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {ratioAhorro !== null && (
              ratioAhorro >= 20 ? 'Excelente' :
              ratioAhorro >= 10 ? 'Aceptable' : 'Necesita mejora'
            )}
          </p>
        </Card>

        <Card className="glass border-white/10 p-4">
          <p className="text-xs text-slate-400 mb-1">Ahorro Neto Mensual</p>
          <p className="text-2xl font-bold text-white">
            {ratioEmergencia !== null ? `$${ratioEmergencia.toLocaleString()}` : '--'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Ingresos - Gastos</p>
        </Card>

        <Card className="glass border-white/10 p-4">
          <p className="text-xs text-slate-400 mb-1">Patrimonio Neto</p>
          <p className="text-2xl font-bold text-white">
            {patrimonioNeto !== null ? `$${patrimonioNeto.toLocaleString()}` : '--'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Activos - Deudas</p>
        </Card>
      </div>
    </div>
  );
}
