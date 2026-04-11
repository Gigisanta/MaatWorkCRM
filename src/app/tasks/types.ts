// Types
export interface TaskUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export interface TaskContact {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  emoji?: string;
}

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

export interface TasksResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Priority config
export const priorityConfig = {
  low: { color: "bg-slate-500", label: "Baja", textColor: "text-slate-400" },
  medium: { color: "bg-blue-500", label: "Media", textColor: "text-blue-400" },
  high: { color: "bg-amber-500", label: "Alta", textColor: "text-amber-400" },
  urgent: { color: "bg-rose-500", label: "Urgente", textColor: "text-rose-400" },
} as const;

export type Priority = keyof typeof priorityConfig;
export type RecurrenceRule = "daily" | "weekly" | "monthly";
