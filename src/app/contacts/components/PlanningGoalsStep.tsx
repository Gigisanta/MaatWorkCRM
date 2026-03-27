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
import { Plus, Trash2, Edit2, Calendar } from 'lucide-react';
import { PlanningFormData } from './usePlanningDialog';

const goalFormSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  montoObjetivo: z.coerce.number().min(0).optional(),
  fechaEstimada: z.string().optional(),
  prioridad: z.enum(['baja', 'media', 'alta']).optional(),
  notes: z.string().optional(),
});

type GoalFormData = z.infer<typeof goalFormSchema>;

interface PlanningGoalsStepProps {
  data: PlanningFormData;
  onUpdate: (data: Partial<PlanningFormData>) => void;
}

export function PlanningGoalsStep({ data, onUpdate }: PlanningGoalsStepProps) {
  const [isAddingGoal, setIsAddingGoal] = React.useState(false);
  const [editingGoalId, setEditingGoalId] = React.useState<string | null>(null);

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      nombre: '',
      montoObjetivo: undefined,
      fechaEstimada: '',
      prioridad: 'media',
      notes: '',
    },
  });

  const handleAddGoal = (goalData: GoalFormData) => {
    const newGoal = {
      ...goalData,
      id: `temp-${Date.now()}`,
    };

    onUpdate({
      metas: [...data.metas, newGoal],
    });

    toast.success('Meta agregada');
    setIsAddingGoal(false);
    form.reset();
  };

  const handleUpdateGoal = (goalData: GoalFormData) => {
    if (!editingGoalId) return;

    onUpdate({
      metas: data.metas.map((g) =>
        g.id === editingGoalId ? { ...g, ...goalData } : g
      ),
    });

    toast.success('Meta actualizada');
    setEditingGoalId(null);
    form.reset();
  };

  const handleDeleteGoal = (goalId: string) => {
    onUpdate({
      metas: data.metas.filter((g) => g.id !== goalId),
    });
    toast.success('Meta eliminada');
  };

  const startEditing = (goal: GoalFormData & { id: string }) => {
    setEditingGoalId(goal.id);
    setIsAddingGoal(false);
    form.reset(goal);
  };

  const cancelEdit = () => {
    setEditingGoalId(null);
    setIsAddingGoal(false);
    form.reset();
  };

  const prioridadColors = {
    baja: 'text-slate-400 bg-slate-400/10 border-slate-400/30',
    media: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    alta: 'text-rose-400 bg-rose-400/10 border-rose-400/30',
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-white">Metas Financieras</h3>
        <p className="text-sm text-slate-400">Define las metas y objetivos del cliente</p>
      </div>

      {/* Goals List */}
      <div className="space-y-3">
        <AnimatePresence>
          {data.metas.map((goal) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="glass border-white/10 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white">{goal.nombre}</h4>
                      {goal.prioridad && (
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full border',
                          prioridadColors[goal.prioridad]
                        )}>
                          {goal.prioridad}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                      {goal.montoObjetivo && (
                        <span>Monto: ${goal.montoObjetivo.toLocaleString()}</span>
                      )}
                      {goal.fechaEstimada && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(goal.fechaEstimada).toLocaleDateString('es-ES')}
                        </span>
                      )}
                    </div>

                    {goal.notes && (
                      <p className="text-sm text-slate-500">{goal.notes}</p>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEditing(goal as GoalFormData & { id: string })}
                      className="text-slate-400 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteGoal(goal.id!)}
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

        {data.metas.length === 0 && !isAddingGoal && (
          <div className="text-center py-8 text-slate-500">
            No hay metas definidas. Agrega una meta para continuar.
          </div>
        )}
      </div>

      {/* Add/Edit Goal Form */}
      <AnimatePresence>
        {(isAddingGoal || editingGoalId) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="glass border-violet-500/30 p-4 space-y-4">
              <Form {...form}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name="nombre"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-slate-300">Nombre de la Meta</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Jubilacion comoda"
                            className="glass border-white/10 bg-white/5 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="montoObjetivo"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Monto Objetivo (USD)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="500000"
                            className="glass border-white/10 bg-white/5 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="fechaEstimada"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Fecha Estimada</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            className="glass border-white/10 bg-white/5 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="prioridad"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Prioridad</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="glass border-white/10 bg-white/5 text-white">
                              <SelectValue placeholder="Seleccionar prioridad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="glass border-white/10 bg-slate-900">
                            <SelectItem value="baja">Baja</SelectItem>
                            <SelectItem value="media">Media</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="notes"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-slate-300">Notas</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Detalles adicionales sobre esta meta..."
                            className="glass border-white/10 bg-white/5 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={cancelEdit} className="glass border-white/10">
                    Cancelar
                  </Button>
                  <Button
                    onClick={form.handleSubmit(editingGoalId ? handleUpdateGoal : handleAddGoal)}
                    className="bg-violet-500 hover:bg-violet-600"
                  >
                    {editingGoalId ? 'Actualizar' : 'Agregar'} Meta
                  </Button>
                </div>
              </Form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Goal Button */}
      {!isAddingGoal && !editingGoalId && (
        <Button
          variant="outline"
          onClick={() => setIsAddingGoal(true)}
          className="w-full glass border-white/10 border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Meta
        </Button>
      )}

      {/* Proyeccion Jubilacion */}
      <Card className="glass border-white/10 p-4 mt-6">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Proyeccion de Jubilacion</h4>
        <Textarea
          value={data.proyeccionRetiro || ''}
          onChange={(e) => onUpdate({ proyeccionRetiro: e.target.value })}
          placeholder="Describe la vision del cliente para su jubilacion..."
          className="glass border-white/10 bg-white/5 text-white min-h-[80px]"
        />
      </Card>
    </div>
  );
}
