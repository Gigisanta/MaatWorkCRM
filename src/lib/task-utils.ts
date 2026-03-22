'use client';

import { z } from "zod";

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

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string | null;
  assignedTo: string | null;
  assignedUser: TaskUser | null;
  contactId: string | null;
  contact: TaskContact | null;
  isRecurrent: boolean;
  recurrenceRule: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface TaskUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface TaskContact {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  emoji?: string;
}

export async function createTask(data: TaskFormData): Promise<Task> {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al crear tarea");
  }

  return response.json();
}

export async function updateTask(id: string, data: Partial<TaskFormData>): Promise<Task> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al actualizar tarea");
  }

  return response.json();
}
