import { z } from 'zod';

export const productionTypes = [
  'seguro_vida',
  'seguro_accidentes',
  'inversion',
  'fondo',
  'deposito',
  'otro',
] as const;

export const productionEstados = ['activo', 'cancelado', 'suspendido'] as const;

export const productionCreateSchema = z.object({
  contactId: z.string().min(1, 'Contacto requerido'),
  nombreProducto: z.string().min(1, 'Nombre del producto requerido'),
  tipo: z.enum(productionTypes),
  emisor: z.string().optional(),
  numeroPoliza: z.string().optional(),
  primaMensual: z.number().positive('La prima debe ser un número positivo').optional(),
  incrementPercentage: z.number().min(0).max(100).optional(),
  valorTotal: z.number().positive().optional(),
  moneda: z.string().optional(),
  fechaInicio: z.string().optional(),
  fechaVencimiento: z.string().optional(),
  estado: z.enum(productionEstados).default('activo'),
  notas: z.string().optional(),
});

export const productionUpdateSchema = productionCreateSchema.partial();

export type ProductionCreateInput = z.infer<typeof productionCreateSchema>;
export type ProductionUpdateInput = z.infer<typeof productionUpdateSchema>;
