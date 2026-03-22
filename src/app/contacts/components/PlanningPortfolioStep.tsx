'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, PieChart, AlertCircle } from 'lucide-react';
import { PlanningFormData } from './usePlanningDialog';

const instrumentoFormSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  tipo: z.string().optional(),
  claseActivo: z.string().optional(),
  emisor: z.string().optional(),
  moneda: z.enum(['USD', 'ARS', 'Mix']).optional(),
  rendimientoEsperado: z.coerce.number().min(0).max(100).optional(),
  participacion: z.coerce.number().min(0).max(100).optional(),
});

const asignacionFormSchema = z.object({
  claseActivo: z.string().min(1, 'La clase de activo es requerida'),
  porcentaje: z.coerce.number().min(0).max(100),
});

type InstrumentoFormData = z.infer<typeof instrumentoFormSchema>;
type AsignacionFormData = z.infer<typeof asignacionFormSchema>;

interface PlanningPortfolioStepProps {
  data: PlanningFormData;
  onUpdate: (data: Partial<PlanningFormData>) => void;
}

const CLASE_ACTIVO_OPTIONS = [
  'Renta Fija',
  'Renta Variable',
  'Efectivo',
  'Inmuebles',
  ' Commodities',
  'Criptoactivos',
  'Otros',
];

const TIPO_INSTRUMENTO_OPTIONS = [
  'ETF',
  'Fondo Mutuo',
  'ACCION',
  'BONO',
  'DEPOSITO',
  'Fondo Indexado',
  'Seguro',
  'Otro',
];

export function PlanningPortfolioStep({ data, onUpdate }: PlanningPortfolioStepProps) {
  const [isAddingInstrument, setIsAddingInstrument] = React.useState(false);
  const [editingInstrumentId, setEditingInstrumentId] = React.useState<string | null>(null);
  const [isAddingAsignacion, setIsAddingAsignacion] = React.useState(false);

  const instrumentoForm = useForm<InstrumentoFormData>({
    resolver: zodResolver(instrumentoFormSchema),
    defaultValues: {
      nombre: '',
      tipo: '',
      claseActivo: '',
      emisor: '',
      moneda: 'USD',
      rendimientoEsperado: undefined,
      participacion: undefined,
    },
  });

  const asignacionForm = useForm<AsignacionFormData>({
    resolver: zodResolver(asignacionFormSchema),
    defaultValues: {
      claseActivo: '',
      porcentaje: 0,
    },
  });

  const totalAsignacion = data.asignaciones.reduce((sum, a) => sum + a.porcentaje, 0);
  const isValidAsignacion = Math.abs(totalAsignacion - 100) < 0.01;

  // Handlers for instruments
  const handleAddInstrument = (instrumentData: InstrumentoFormData) => {
    const newInstrument = {
      ...instrumentData,
      id: `temp-${Date.now()}`,
    };

    onUpdate({
      instrumentos: [...data.instrumentos, newInstrument],
    });

    toast.success('Instrumento agregado');
    setIsAddingInstrument(false);
    instrumentoForm.reset();
  };

  const handleUpdateInstrument = (instrumentData: InstrumentoFormData) => {
    if (!editingInstrumentId) return;

    onUpdate({
      instrumentos: data.instrumentos.map((i) =>
        i.id === editingInstrumentId ? { ...i, ...instrumentData } : i
      ),
    });

    toast.success('Instrumento actualizado');
    setEditingInstrumentId(null);
    instrumentoForm.reset();
  };

  const handleDeleteInstrument = (instrumentId: string) => {
    onUpdate({
      instrumentos: data.instrumentos.filter((i) => i.id !== instrumentId),
    });
    toast.success('Instrumento eliminado');
  };

  const startEditingInstrument = (instrument: InstrumentoFormData & { id: string }) => {
    setEditingInstrumentId(instrument.id);
    setIsAddingInstrument(false);
    instrumentoForm.reset(instrument);
  };

  // Handlers for asignaciones
  const handleAddAsignacion = (asignacionData: AsignacionFormData) => {
    const existing = data.asignaciones.find(
      (a) => a.claseActivo === asignacionData.claseActivo
    );

    if (existing) {
      // Update existing
      onUpdate({
        asignaciones: data.asignaciones.map((a) =>
          a.claseActivo === asignacionData.claseActivo
            ? { ...a, porcentaje: asignacionData.porcentaje }
            : a
        ),
      });
      toast.success('Asignacion actualizada');
    } else {
      onUpdate({
        asignaciones: [...data.asignaciones, { ...asignacionData, id: `temp-${Date.now()}` }],
      });
      toast.success('Asignacion agregada');
    }

    setIsAddingAsignacion(false);
    asignacionForm.reset();
  };

  const handleDeleteAsignacion = (claseActivo: string) => {
    onUpdate({
      asignaciones: data.asignaciones.filter((a) => a.claseActivo !== claseActivo),
    });
    toast.success('Asignacion eliminada');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-white">Cartera de Instrumentos</h3>
        <p className="text-sm text-slate-400">Define los instrumentos financieros y la asignacion estrategica</p>
      </div>

      {/* Instruments Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-300">Instrumentos</h4>

        <AnimatePresence>
          {data.instrumentos.map((instrument) => (
            <motion.div
              key={instrument.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="glass border-white/10 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white">{instrument.nombre}</h4>
                      {instrument.tipo && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                          {instrument.tipo}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                      {instrument.claseActivo && <span>{instrument.claseActivo}</span>}
                      {instrument.emisor && <span>{instrument.emisor}</span>}
                      {instrument.moneda && <span>{instrument.moneda}</span>}
                      {instrument.rendimientoEsperado && (
                        <span className="text-emerald-400">
                          {instrument.rendimientoEsperado}% TAE
                        </span>
                      )}
                      {instrument.participacion && (
                        <span className="text-amber-400">
                          {instrument.participacion}% participacion
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEditingInstrument(instrument as InstrumentoFormData & { id: string })}
                      className="text-slate-400 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteInstrument(instrument.id!)}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add/Edit Instrument Form */}
        <AnimatePresence>
          {(isAddingInstrument || editingInstrumentId) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="glass border-indigo-500/30 p-4 space-y-4">
                <Form {...instrumentoForm}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      name="nombre"
                      control={instrumentoForm.control}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="text-slate-300">Nombre del Instrumento</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="VWCE"
                              className="glass border-white/10 bg-white/5 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      name="tipo"
                      control={instrumentoForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Tipo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="glass border-white/10 bg-white/5 text-white">
                                <SelectValue placeholder="Seleccionar tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="glass border-white/10 bg-slate-900">
                              {TIPO_INSTRUMENTO_OPTIONS.map((tipo) => (
                                <SelectItem key={tipo} value={tipo}>
                                  {tipo}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      name="claseActivo"
                      control={instrumentoForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Clase de Activo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="glass border-white/10 bg-white/5 text-white">
                                <SelectValue placeholder="Seleccionar clase" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="glass border-white/10 bg-slate-900">
                              {CLASE_ACTIVO_OPTIONS.map((clase) => (
                                <SelectItem key={clase} value={clase}>
                                  {clase}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      name="emisor"
                      control={instrumentoForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Emisor</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Vanguard"
                              className="glass border-white/10 bg-white/5 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      name="moneda"
                      control={instrumentoForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Moneda</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="glass border-white/10 bg-white/5 text-white">
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="glass border-white/10 bg-slate-900">
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="ARS">ARS</SelectItem>
                              <SelectItem value="Mix">Mix</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      name="rendimientoEsperado"
                      control={instrumentoForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Rendimiento Esperado (%)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              placeholder="7"
                              className="glass border-white/10 bg-white/5 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      name="participacion"
                      control={instrumentoForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Participacion (%)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              placeholder="20"
                              className="glass border-white/10 bg-white/5 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingInstrumentId(null);
                        setIsAddingInstrument(false);
                        instrumentoForm.reset();
                      }}
                      className="glass border-white/10"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={instrumentoForm.handleSubmit(editingInstrumentId ? handleUpdateInstrument : handleAddInstrument)}
                      className="bg-indigo-500 hover:bg-indigo-600"
                    >
                      {editingInstrumentId ? 'Actualizar' : 'Agregar'} Instrumento
                    </Button>
                  </div>
                </Form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {!isAddingInstrument && !editingInstrumentId && (
          <Button
            variant="outline"
            onClick={() => setIsAddingInstrument(true)}
            className="w-full glass border-white/10 border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Instrumento
          </Button>
        )}
      </div>

      {/* Strategic Allocation Section */}
      <div className="space-y-3 mt-6">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Asignacion Estrategica por Clase de Activo
          </h4>
          {totalAsignacion > 0 && (
            <span className={cn(
              'text-sm',
              isValidAsignacion ? 'text-emerald-400' : 'text-amber-400'
            )}>
              Total: {totalAsignacion}%
            </span>
          )}
        </div>

        {!isValidAsignacion && totalAsignacion > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            La suma de asignaciones debe ser 100% (actual: {totalAsignacion}%)
          </div>
        )}

        <AnimatePresence>
          {data.asignaciones.map((asignacion) => (
            <motion.div
              key={asignacion.claseActivo}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-4 p-3 rounded-lg glass border-white/10"
            >
              <span className="flex-1 text-white">{asignacion.claseActivo}</span>
              <span className="text-lg font-semibold text-indigo-400">{asignacion.porcentaje}%</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteAsignacion(asignacion.claseActivo)}
                className="text-slate-400 hover:text-rose-400"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add Asignacion Form */}
        <AnimatePresence>
          {isAddingAsignacion && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="glass border-indigo-500/30 p-4 space-y-4">
                <Form {...asignacionForm}>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      name="claseActivo"
                      control={asignacionForm.control}
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel className="text-slate-300">Clase de Activo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="glass border-white/10 bg-white/5 text-white">
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="glass border-white/10 bg-slate-900">
                              {CLASE_ACTIVO_OPTIONS.filter(
                                (c) => !data.asignaciones.some((a) => a.claseActivo === c)
                              ).map((clase) => (
                                <SelectItem key={clase} value={clase}>
                                  {clase}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      name="porcentaje"
                      control={asignacionForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Porcentaje</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              placeholder="25"
                              className="glass border-white/10 bg-white/5 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddingAsignacion(false);
                        asignacionForm.reset();
                      }}
                      className="glass border-white/10"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={asignacionForm.handleSubmit(handleAddAsignacion)}
                      className="bg-indigo-500 hover:bg-indigo-600"
                    >
                      Agregar
                    </Button>
                  </div>
                </Form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {!isAddingAsignacion && (
          <Button
            variant="outline"
            onClick={() => setIsAddingAsignacion(true)}
            className="w-full glass border-white/10 border-dashed"
            disabled={data.asignaciones.length >= CLASE_ACTIVO_OPTIONS.length}
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Asignacion
          </Button>
        )}
      </div>
    </motion.div>
  );
}
