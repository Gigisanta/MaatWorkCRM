'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { cn } from '@/lib/utils/utils';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, AlertTriangle, Lightbulb, Palette, User } from 'lucide-react';
import { PlanningFormData } from './usePlanningDialog';

// Schema for obligacion
const obligacionFormSchema = z.object({
  acreedor: z.string().min(1, 'El acreedor es requerido'),
  tipo: z.string().optional(),
  saldoPendiente: z.coerce.number().min(0).optional(),
  tasaInteres: z.coerce.number().min(0).max(100).optional(),
  cuotaMensual: z.coerce.number().min(0).optional(),
  fechaVencimiento: z.string().optional(),
});

type ObligacionFormData = z.infer<typeof obligacionFormSchema>;

// Schema for riesgo
const riesgoFormSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  tipo: z.string().optional(),
  probabilidad: z.enum(['baja', 'media', 'alta']).optional(),
  impacto: z.enum(['bajo', 'medio', 'alto']).optional(),
  mitigacion: z.string().optional(),
  severity: z.string().optional(),
});

type RiesgoFormData = z.infer<typeof riesgoFormSchema>;

interface PlanningFinalStepProps {
  data: PlanningFormData;
  onUpdate: (data: Partial<PlanningFormData>) => void;
}

const TIPO_OBLIGACION_OPTIONS = [
  'Hipoteca',
  'Prestamo Personal',
  'Tarjeta de Credito',
  'Prestamo Auto',
  'Deuda Familiar',
  'Otro',
];

const TIPO_RIESGO_OPTIONS = [
  'Mercado',
  'Credito',
  'Liquidez',
  'Operativo',
  'Tasas de Cambio',
  'Inflacion',
  'Geopolitico',
  'Otro',
];

const SEVERITY_OPTIONS = ['critical', 'high', 'medium', 'low'];

export function PlanningFinalStep({ data, onUpdate }: PlanningFinalStepProps) {
  // State for obligaciones
  const [isAddingObligacion, setIsAddingObligacion] = React.useState(false);
  const [editingObligacionId, setEditingObligacionId] = React.useState<string | null>(null);

  // State for riesgos
  const [isAddingRiesgo, setIsAddingRiesgo] = React.useState(false);
  const [editingRiesgoId, setEditingRiesgoId] = React.useState<string | null>(null);

  // Forms
  const obligacionForm = useForm<ObligacionFormData>({
    resolver: zodResolver(obligacionFormSchema),
    defaultValues: {
      acreedor: '',
      tipo: '',
      saldoPendiente: undefined,
      tasaInteres: undefined,
      cuotaMensual: undefined,
      fechaVencimiento: '',
    },
  });

  const riesgoForm = useForm<RiesgoFormData>({
    resolver: zodResolver(riesgoFormSchema),
    defaultValues: {
      nombre: '',
      tipo: '',
      probabilidad: 'media',
      impacto: 'medio',
      mitigacion: '',
      severity: '',
    },
  });

  // Handlers for obligaciones
  const handleAddObligacion = (obligacionData: ObligacionFormData) => {
    const newObligacion = {
      ...obligacionData,
      id: `temp-${Date.now()}`,
    };
    onUpdate({ obligaciones: [...data.obligaciones, newObligacion] });
    toast.success('Obligacion agregada');
    setIsAddingObligacion(false);
    obligacionForm.reset();
  };

  const handleUpdateObligacion = (obligacionData: ObligacionFormData) => {
    if (!editingObligacionId) return;
    onUpdate({
      obligaciones: data.obligaciones.map((o) =>
        o.id === editingObligacionId ? { ...o, ...obligacionData } : o
      ),
    });
    toast.success('Obligacion actualizada');
    setEditingObligacionId(null);
    obligacionForm.reset();
  };

  const handleDeleteObligacion = (id: string) => {
    onUpdate({ obligaciones: data.obligaciones.filter((o) => o.id !== id) });
    toast.success('Obligacion eliminada');
  };

  const startEditingObligacion = (obligacion: ObligacionFormData & { id: string }) => {
    setEditingObligacionId(obligacion.id);
    setIsAddingObligacion(false);
    obligacionForm.reset(obligacion);
  };

  // Handlers for riesgos
  const handleAddRiesgo = (riesgoData: RiesgoFormData) => {
    const newRiesgo = {
      ...riesgoData,
      id: `temp-${Date.now()}`,
    };
    onUpdate({ riesgos: [...data.riesgos, newRiesgo] });
    toast.success('Riesgo agregado');
    setIsAddingRiesgo(false);
    riesgoForm.reset();
  };

  const handleUpdateRiesgo = (riesgoData: RiesgoFormData) => {
    if (!editingRiesgoId) return;
    onUpdate({
      riesgos: data.riesgos.map((r) =>
        r.id === editingRiesgoId ? { ...r, ...riesgoData } : r
      ),
    });
    toast.success('Riesgo actualizado');
    setEditingRiesgoId(null);
    riesgoForm.reset();
  };

  const handleDeleteRiesgo = (id: string) => {
    onUpdate({ riesgos: data.riesgos.filter((r) => r.id !== id) });
    toast.success('Riesgo eliminado');
  };

  const startEditingRiesgo = (riesgo: RiesgoFormData & { id: string }) => {
    setEditingRiesgoId(riesgo.id);
    setIsAddingRiesgo(false);
    riesgoForm.reset(riesgo);
  };

  const severityColors = {
    critical: 'text-rose-400 bg-rose-400/10 border-rose-400/30',
    high: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
    medium: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    low: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-white">Informacion Final</h3>
        <p className="text-sm text-slate-400">Obligaciones, riesgos, branding y asesor</p>
      </div>

      {/* Obligaciones Negociables */}
      <Card className="glass border-white/10 p-4">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Obligaciones Negociables</h4>

        <AnimatePresence>
          {data.obligaciones.map((obligacion) => (
            <motion.div
              key={obligacion.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 rounded-lg glass border-white/10 mb-2"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{obligacion.acreedor}</span>
                    {obligacion.tipo && (
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-500/20 text-slate-400">
                        {obligacion.tipo}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                    {obligacion.saldoPendiente && (
                      <span>Saldo: ${obligacion.saldoPendiente.toLocaleString()}</span>
                    )}
                    {obligacion.tasaInteres && (
                      <span>{obligacion.tasaInteres}% tasa</span>
                    )}
                    {obligacion.cuotaMensual && (
                      <span>Cuota: ${obligacion.cuotaMensual.toLocaleString()}/mes</span>
                    )}
                    {obligacion.fechaVencimiento && (
                      <span>Vence: {new Date(obligacion.fechaVencimiento).toLocaleDateString('es-ES')}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => startEditingObligacion(obligacion as ObligacionFormData & { id: string })} className="text-slate-400 hover:text-white">
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteObligacion(obligacion.id!)} className="text-slate-400 hover:text-rose-400">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {(isAddingObligacion || editingObligacionId) && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Form {...obligacionForm}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3 pt-3 border-t border-white/10">
                  <FormField name="acreedor" control={obligacionForm.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-400 text-xs">Acreedor</FormLabel>
                      <FormControl><Input {...field} placeholder="Banco X" className="glass border-white/10 bg-white/5 text-white h-8 text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name="tipo" control={obligacionForm.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-400 text-xs">Tipo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="glass border-white/10 bg-white/5 text-white h-8 text-sm"><SelectValue placeholder="Tipo" /></SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass border-white/10 bg-slate-900">
                          {TIPO_OBLIGACION_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name="saldoPendiente" control={obligacionForm.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-400 text-xs">Saldo (USD)</FormLabel>
                      <FormControl><Input {...field} type="number" placeholder="50000" className="glass border-white/10 bg-white/5 text-white h-8 text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name="tasaInteres" control={obligacionForm.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-400 text-xs">Tasa (%)</FormLabel>
                      <FormControl><Input {...field} type="number" placeholder="12" className="glass border-white/10 bg-white/5 text-white h-8 text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name="cuotaMensual" control={obligacionForm.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-400 text-xs">Cuota (USD)</FormLabel>
                      <FormControl><Input {...field} type="number" placeholder="800" className="glass border-white/10 bg-white/5 text-white h-8 text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name="fechaVencimiento" control={obligacionForm.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-400 text-xs">Vencimiento</FormLabel>
                      <FormControl><Input {...field} type="date" className="glass border-white/10 bg-white/5 text-white h-8 text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={() => { setEditingObligacionId(null); setIsAddingObligacion(false); obligacionForm.reset(); }} className="glass border-white/10 h-8">Cancelar</Button>
                  <Button size="sm" onClick={obligacionForm.handleSubmit(editingObligacionId ? handleUpdateObligacion : handleAddObligacion)} className="bg-violet-500 hover:bg-violet-600 h-8">{editingObligacionId ? 'Actualizar' : 'Agregar'}</Button>
                </div>
              </Form>
            </motion.div>
          )}
        </AnimatePresence>

        {!isAddingObligacion && !editingObligacionId && (
          <Button variant="outline" onClick={() => setIsAddingObligacion(true)} className="w-full mt-2 glass border-white/10 border-dashed h-8 text-xs">
            <Plus className="w-3 h-3 mr-1" /> Agregar Obligacion
          </Button>
        )}
      </Card>

      {/* Riesgos */}
      <Card className="glass border-white/10 p-4">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Riesgos Identificados</h4>

        <AnimatePresence>
          {data.riesgos.map((riesgo) => (
            <motion.div key={riesgo.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-3 rounded-lg glass border-white/10 mb-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="font-medium text-white">{riesgo.nombre}</span>
                    {riesgo.severity && <span className={cn('text-xs px-2 py-0.5 rounded-full border', severityColors[riesgo.severity as keyof typeof severityColors])}>{riesgo.severity}</span>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                    {riesgo.tipo && <span>{riesgo.tipo}</span>}
                    {riesgo.probabilidad && <span>Prob: {riesgo.probabilidad}</span>}
                    {riesgo.impacto && <span>Impacto: {riesgo.impacto}</span>}
                  </div>
                  {riesgo.mitigacion && <p className="text-xs text-slate-500 mt-1">Mitigacion: {riesgo.mitigacion}</p>}
                </div>
                <div className="flex gap-1 ml-2">
                  <Button variant="ghost" size="icon" onClick={() => startEditingRiesgo(riesgo as RiesgoFormData & { id: string })} className="text-slate-400 hover:text-white"><Edit2 className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteRiesgo(riesgo.id!)} className="text-slate-400 hover:text-rose-400"><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {(isAddingRiesgo || editingRiesgoId) && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Form {...riesgoForm}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-white/10">
                  <FormField name="nombre" control={riesgoForm.control} render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-slate-400 text-xs">Nombre del Riesgo</FormLabel>
                      <FormControl><Input {...field} placeholder="Inflacion" className="glass border-white/10 bg-white/5 text-white h-8 text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name="tipo" control={riesgoForm.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-400 text-xs">Tipo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="glass border-white/10 bg-white/5 text-white h-8 text-sm"><SelectValue placeholder="Tipo" /></SelectTrigger></FormControl>
                        <SelectContent className="glass border-white/10 bg-slate-900">
                          {TIPO_RIESGO_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name="severity" control={riesgoForm.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-400 text-xs">Severidad</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="glass border-white/10 bg-white/5 text-white h-8 text-sm"><SelectValue placeholder="Severidad" /></SelectTrigger></FormControl>
                        <SelectContent className="glass border-white/10 bg-slate-900">
                          {SEVERITY_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name="probabilidad" control={riesgoForm.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-400 text-xs">Probabilidad</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="glass border-white/10 bg-white/5 text-white h-8 text-sm"><SelectValue placeholder="Probabilidad" /></SelectTrigger></FormControl>
                        <SelectContent className="glass border-white/10 bg-slate-900">
                          <SelectItem value="baja">Baja</SelectItem>
                          <SelectItem value="media">Media</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name="impacto" control={riesgoForm.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-400 text-xs">Impacto</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="glass border-white/10 bg-white/5 text-white h-8 text-sm"><SelectValue placeholder="Impacto" /></SelectTrigger></FormControl>
                        <SelectContent className="glass border-white/10 bg-slate-900">
                          <SelectItem value="bajo">Bajo</SelectItem>
                          <SelectItem value="medio">Medio</SelectItem>
                          <SelectItem value="alto">Alto</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name="mitigacion" control={riesgoForm.control} render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-slate-400 text-xs">Mitigacion</FormLabel>
                      <FormControl><Input {...field} placeholder="Estrategia de mitigacion" className="glass border-white/10 bg-white/5 text-white h-8 text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={() => { setEditingRiesgoId(null); setIsAddingRiesgo(false); riesgoForm.reset(); }} className="glass border-white/10 h-8">Cancelar</Button>
                  <Button size="sm" onClick={riesgoForm.handleSubmit(editingRiesgoId ? handleUpdateRiesgo : handleAddRiesgo)} className="bg-violet-500 hover:bg-violet-600 h-8">{editingRiesgoId ? 'Actualizar' : 'Agregar'}</Button>
                </div>
              </Form>
            </motion.div>
          )}
        </AnimatePresence>

        {!isAddingRiesgo && !editingRiesgoId && (
          <Button variant="outline" onClick={() => setIsAddingRiesgo(true)} className="w-full mt-2 glass border-white/10 border-dashed h-8 text-xs">
            <Plus className="w-3 h-3 mr-1" /> Agregar Riesgo
          </Button>
        )}
      </Card>

      {/* AI Options */}
      <Card className="glass border-white/10 p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-medium text-slate-300">Opciones de IA</h4>
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <label className="text-sm text-white">Usar Termino IA</label>
                <p className="text-xs text-slate-500">Agregar terminos financieros explicados por IA</p>
              </div>
              <Switch checked={data.usarTerminoIA} onCheckedChange={(checked) => onUpdate({ usarTerminoIA: checked })} />
            </div>

            {data.usarTerminoIA && (
              <Textarea value={data.terminoFinanciero || ''} onChange={(e) => onUpdate({ terminoFinanciero: e.target.value })} placeholder="ETF, Ratio de Sharpe, Diversificacion..." className="glass border-white/10 bg-white/5 text-white min-h-[60px]" />
            )}

            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <label className="text-sm text-white">Usar Consejo IA</label>
                <p className="text-xs text-slate-500">Agregar consejo final generado por IA</p>
              </div>
              <Switch checked={data.usarConsejoIA} onCheckedChange={(checked) => onUpdate({ usarConsejoIA: checked })} />
            </div>

            {data.usarConsejoIA && (
              <Textarea value={data.consejoFinal || ''} onChange={(e) => onUpdate({ consejoFinal: e.target.value })} placeholder="Consejo personalizado para el cliente..." className="glass border-white/10 bg-white/5 text-white min-h-[60px]" />
            )}
          </div>
        </div>
      </Card>

      {/* Branding */}
      <Card className="glass border-white/10 p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-violet-400" />
            <h4 className="text-sm font-medium text-slate-300">Branding del Plan</h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Color Principal</label>
              <div className="flex gap-2">
                <input type="color" value={data.colorPrincipal || '#8B5CF6'} onChange={(e) => onUpdate({ colorPrincipal: e.target.value })} className="w-10 h-10 rounded cursor-pointer border border-white/10" />
                <Input value={data.colorPrincipal || '#8B5CF6'} onChange={(e) => onUpdate({ colorPrincipal: e.target.value })} className="glass border-white/10 bg-white/5 text-white h-10" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400">Color Acento</label>
              <div className="flex gap-2">
                <input type="color" value={data.colorAcento || '#10b981'} onChange={(e) => onUpdate({ colorAcento: e.target.value })} className="w-10 h-10 rounded cursor-pointer border border-white/10" />
                <Input value={data.colorAcento || '#10b981'} onChange={(e) => onUpdate({ colorAcento: e.target.value })} className="glass border-white/10 bg-white/5 text-white h-10" />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Asesor */}
      <Card className="glass border-white/10 p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-medium text-slate-300">Informacion del Asesor</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Nombre del Asesor</label>
              <Input value={data.asesorNombre || ''} onChange={(e) => onUpdate({ asesorNombre: e.target.value })} placeholder="Juan Perez" className="glass border-white/10 bg-white/5 text-white h-9" />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400">Telefono</label>
              <Input value={data.asesorTelefono || ''} onChange={(e) => onUpdate({ asesorTelefono: e.target.value })} placeholder="+54 11 1234 5678" className="glass border-white/10 bg-white/5 text-white h-9" />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400">Mensaje Predefinido</label>
              <Input value={data.asesorMensajePredefinido || ''} onChange={(e) => onUpdate({ asesorMensajePredefinido: e.target.value })} placeholder="Estoy a disposicion..." className="glass border-white/10 bg-white/5 text-white h-9" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
