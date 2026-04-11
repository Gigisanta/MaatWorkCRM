import { z } from "zod";
import type { Task, TasksResponse, RecurrenceRule } from "./types";

// Zod Schema
export const taskSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(200, "El título es muy largo"),
  description: z.string().max(1000, "La descripción es muy larga").optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: z.string().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  isRecurrent: z.boolean().default(false),
  recurrenceRule: z.enum(["daily", "weekly", "monthly"]).optional().nullable(),
});

export type TaskFormDataInput = z.input<typeof taskSchema>;
export type TaskFormData = z.infer<typeof taskSchema>;

// Fetch tasks
export async function fetchTasks(params: {
  organizationId: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  overdue?: boolean;
}): Promise<TasksResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("organizationId", params.organizationId);

  if (params.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }
  if (params.priority && params.priority !== "all") {
    searchParams.set("priority", params.priority);
  }
  if (params.assignedTo && params.assignedTo !== "all") {
    searchParams.set("assignedTo", params.assignedTo);
  }
  if (params.overdue) {
    searchParams.set("overdue", "true");
  }

  const response = await fetch(`/api/tasks?${searchParams.toString()}`, { credentials: 'include' });
  if (!response.ok) {
    throw new Error("Error al cargar tareas");
  }
  return response.json();
}

// Create task
export async function createTask(data: TaskFormData & { organizationId: string }): Promise<Task> {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      recurrenceRule: data.isRecurrent && data.recurrenceRule
        ? `FREQ=${data.recurrenceRule.toUpperCase()}`
        : null,
    }),
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al crear tarea");
  }
  return response.json();
}

// Update task
export async function updateTask(id: string, data: Partial<TaskFormData>): Promise<Task> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      recurrenceRule: data.isRecurrent && data.recurrenceRule
        ? `FREQ=${data.recurrenceRule.toUpperCase()}`
        : null,
    }),
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al actualizar tarea");
  }
  return response.json();
}

// Complete task
export async function completeTask(id: string): Promise<{ completedTask: Task; newRecurrentTask: Task | null }> {
  const response = await fetch(`/api/tasks/${id}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ createNextRecurrence: true }),
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al completar tarea");
  }
  return response.json();
}

// Delete task
export async function deleteTask(id: string): Promise<void> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "DELETE",
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al eliminar tarea");
  }
}

// Users response type
export interface UsersResponse {
  users: { id: string; name: string | null }[];
}

// Fetch users for assignment dropdown
export async function fetchUsers(organizationId: string): Promise<UsersResponse> {
  const res = await fetch(`/api/users?organizationId=${organizationId}`, { credentials: 'include' });
  if (!res.ok) return { users: [] };
  return res.json();
}
