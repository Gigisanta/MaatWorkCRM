'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils/utils';
import { PlanningFormData } from './usePlanningDialog';

const clientFormSchema = z.object({
  edad: z.coerce.number().min(18, 'La edad debe ser al menos 18').max(120).optional(),
  profesion: z.string().optional(),
  objetivo: z.string().optional(),
  perfilRiesgo: z.enum(['conservador', 'moderado', 'agresivo']).optional(),
  aporteInicial: z.coerce.number().min(0).optional(),
  aporteMensual: z.coerce.number().min(0).optional(),
  horizonteMeses: z.coerce.number().min(1).max(600).optional(),
});

type ClientFormData = z.infer<typeof clientFormSchema>;

interface PlanningClientStepProps {
  data: PlanningFormData;
  onUpdate: (data: Partial<PlanningFormData>) => void;
}

export function PlanningClientStep({ data, onUpdate }: PlanningClientStepProps) {
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      edad: data.edad,
      profesion: data.profesion,
      objetivo: data.objetivo,
      perfilRiesgo: data.perfilRiesgo,
      aporteInicial: data.aporteInicial,
      aporteMensual: data.aporteMensual,
      horizonteMeses: data.horizonteMeses,
    },
  });

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      onUpdate(values as Partial<PlanningFormData>);
    });
    return () => subscription.unsubscribe();
  }, [form, onUpdate]);

  const profileOptions = [
    { value: 'conservador', label: 'Conservador', description: 'Prioriza seguridad sobre rendimientos' },
    { value: 'moderado', label: 'Moderado', description: 'Equilibrio entre riesgo y rendimiento' },
    { value: 'agresivo', label: 'Agresivo', description: 'Prioriza rendimientos aceptando mayor riesgo' },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-white">Informacion del Cliente</h3>
        <p className="text-sm text-slate-400">Datos basicos del cliente para el plan financiero</p>
      </div>

      <Form {...form}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="edad"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Edad</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder="35"
                    className="glass border-white/10 bg-white/5 text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="profesion"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Profesion</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ingeniero Comercial"
                    className="glass border-white/10 bg-white/5 text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="perfilRiesgo"
            control={form.control}
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="text-slate-300">Perfil de Riesgo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="glass border-white/10 bg-white/5 text-white">
                      <SelectValue placeholder="Seleccionar perfil" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="glass border-white/10 bg-slate-900">
                    {profileOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-slate-400">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          name="objetivo"
          control={form.control}
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel className="text-slate-300">Objetivo Financiero</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Describa los objetivos financieros del cliente..."
                  className="glass border-white/10 bg-white/5 text-white min-h-[100px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <FormField
            name="aporteInicial"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Aporte Inicial (USD)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder="10000"
                    className="glass border-white/10 bg-white/5 text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="aporteMensual"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Aporte Mensual (USD)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder="500"
                    className="glass border-white/10 bg-white/5 text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="horizonteMeses"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Horizonte (meses)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder="120"
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
  );
}
