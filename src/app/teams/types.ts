import * as z from "zod";

// ============ DATA TYPES ============

export interface TeamMember {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export interface TeamGoal {
  id: string;
  title: string;
  type: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  period: string;
  status: string;
  description?: string | null;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  leaderId: string | null;
  leader: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  members: TeamMember[];
  goals: TeamGoal[];
  _count?: {
    members: number;
    goals: number;
    calendarEvents: number;
  };
}

export interface User {
  id: string;
  name: string | null;
  email: string;
}

export interface TeamsResponse {
  teams: Team[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============ ZOD SCHEMAS ============

export const createTeamSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
  leaderId: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
});

export const createGoalSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(100, "Máximo 100 caracteres"),
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
  type: z.enum(["new_aum", "new_clients", "meetings", "revenue", "custom"], {
    required_error: "Selecciona un tipo",
  }),
  targetValue: z.number().min(1, "El valor objetivo debe ser mayor a 0"),
  currentValue: z.number().min(0, "El valor actual no puede ser negativo").default(0),
  unit: z.enum(["currency", "count", "percentage"]).default("count"),
});

export const updateGoalProgressSchema = z.object({
  currentValue: z.number().min(0, "El valor actual no puede ser negativo"),
});

export const addMemberSchema = z.object({
  userId: z.string().min(1, "Selecciona un usuario"),
  role: z.enum(["member", "leader"]).default("member"),
});

// ============ TYPE ALIASES ============

export type CreateTeamFormInput = z.input<typeof createTeamSchema>;
export type CreateGoalFormInput = z.input<typeof createGoalSchema>;
export type CreateTeamForm = z.infer<typeof createTeamSchema>;
export type CreateGoalForm = z.infer<typeof createGoalSchema>;
export type UpdateGoalProgressForm = z.infer<typeof updateGoalProgressSchema>;
export type AddMemberFormInput = z.input<typeof addMemberSchema>;
export type AddMemberForm = z.infer<typeof addMemberSchema>;

// ============ HELPER FUNCTIONS ============

export function getGoalStatus(
  current: number,
  target: number
): { label: string; variant: "emerald" | "sky" | "amber" | "rose" } {
  if (target <= 0) return { label: "Sin meta", variant: "sky" };
  const pct = (current / target) * 100;
  if (pct >= 100) return { label: "Completado", variant: "emerald" };
  if (pct >= 70) return { label: "En camino", variant: "sky" };
  if (pct >= 30) return { label: "En riesgo", variant: "amber" };
  return { label: "Retrasado", variant: "rose" };
}

export const statusColors = {
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  sky: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
} as const;

export function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    new_aum: "Nuevos Activos",
    new_clients: "Nuevos Clientes",
    meetings: "Reuniones",
    revenue: "Ingresos",
    custom: "Personalizado",
  };
  return labels[type] || type;
}

export function formatValue(value: number, unit: string): string {
  if (unit === "currency") return `$${value.toLocaleString()}`;
  if (unit === "percentage") return `${value}%`;
  return value.toLocaleString();
}
