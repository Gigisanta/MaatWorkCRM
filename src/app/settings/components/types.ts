// Settings Module Types - Shared types for settings page components

import { z } from "zod";

// ============================================
// Validation Schemas
// ============================================

export const profileSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  bio: z.string().max(500, "La biografía no puede exceder 500 caracteres").optional(),
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida"),
  newPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  confirmPassword: z.string().min(1, "Confirma la nueva contraseña"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export const organizationSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().optional(),
  role: z.enum(["owner", "admin", "member"]),
});

// ============================================
// Form Types
// ============================================

export type ProfileForm = z.infer<typeof profileSchema>;
export type PasswordForm = z.infer<typeof passwordSchema>;
export type OrganizationForm = z.infer<typeof organizationSchema>;
export type InviteMemberForm = z.infer<typeof inviteMemberSchema>;

// ============================================
// Notification Settings
// ============================================

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  taskReminders: boolean;
  goalProgressAlerts: boolean;
  newLeadsNotifications: boolean;
}

// ============================================
// Session Info
// ============================================

export interface Session {
  id: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  isCurrent: boolean;
}

// ============================================
// Organization Member
// ============================================

export interface OrganizationMember {
  id: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: string;
    isActive: boolean;
  };
}

// ============================================
// Organization Data
// ============================================

export interface OrganizationData {
  organization?: {
    id: string;
    name: string;
    slug: string;
    members?: OrganizationMember[];
  };
}

// ============================================
// User Settings
// ============================================

export interface UserSettings {
  settings?: NotificationSettings;
}

// ============================================
// Role Change Request
// ============================================

export interface RoleChangeRequest {
  id: string;
  userId: string;
  requestedRole: string;
  reason: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: string;
  };
}

export interface RoleRequestsResponse {
  roleChangeRequests: RoleChangeRequest[];
}

// ============================================
// Team Join Request
// ============================================

export interface TeamJoinRequest {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  status: string;
  createdAt: string;
  team: {
    id: string;
    name: string;
  };
  inviter: {
    id: string;
    name: string | null;
  };
}

// ============================================
// Admin Panel Types
// ============================================

export interface TeamMember {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: string;
    careerLevel: string | null;
  };
}

export interface Team {
  id: string;
  name: string;
  leader: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  members: TeamMember[];
  memberCount: number;
}

export interface TeamsResponse {
  teams: Team[];
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLogsResponse {
  auditLogs: AuditLog[];
  total: number;
  page: number;
  limit: number;
}
