"use client";

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
// Type Inferences
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
// Session
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
// User Settings
// ============================================

export interface UserSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  taskReminders: boolean;
  goalProgressAlerts: boolean;
  newLeadsNotifications: boolean;
}

// ============================================
// Organization
// ============================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  members?: OrganizationMember[];
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

// ============================================
// Parsed User Agent
// ============================================

export interface ParsedUserAgent {
  browser: string;
  os: string;
}
