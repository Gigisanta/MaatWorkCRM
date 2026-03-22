// Auth Types - Re-exports from Prisma types
import type { User, Organization, Member } from '@prisma/client';

// Role type - aligned with User.role field
export type Role =
  | 'developer'
  | 'dueno'
  | 'owner'
  | 'admin'
  | 'staff'
  | 'manager'
  | 'asesor'
  | 'advisor'
  | 'member';

// Auth User - session user representation
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: Role;
  organizationId: string | null;
  managerId: string | null;
  isActive: boolean;
}

// Session info
export interface SessionInfo {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
}

// Organization with members
export interface OrganizationWithMembers extends Organization {
  members: MemberWithUser[];
}

export interface MemberWithUser extends Member {
  user: User;
}
