// ============================================================
// MaatWork CRM — Drizzle Schema: Identity & Security Module
// ============================================================
// Tables: users, sessions, accounts, verifications, organizations, members
// Compatible with better-auth v1.5.x Drizzle adapter
// Database: PostgreSQL (Neon)
// ============================================================

import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// ── Users ────────────────────────────────────────────────────
// User roles: developer (full access), dueno (business functions), manager (team management), asesor (sales)
export const USER_ROLES = ["developer", "dueno", "manager", "asesor"] as const;
export type UserRole = (typeof USER_ROLES)[number];

// Career levels for asesores
export const CAREER_LEVELS = ["junior", "semi-senior", "senior", "lead"] as const;
export type CareerLevel = (typeof CAREER_LEVELS)[number];

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false),
  image: text("image"),
  role: text("role", { enum: USER_ROLES }).notNull().default("asesor"),
  careerLevel: text("career_level", { enum: CAREER_LEVELS }).default("junior"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Sessions (better-auth managed) ───────────────────────────
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Accounts (OAuth providers — better-auth managed) ─────────
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Verifications (email verification tokens) ────────────────
export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Organizations (multi-tenant) ─────────────────────────────
export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Members (org memberships) ────────────────────────────────
export const members = pgTable("members", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["member", "admin", "owner"] })
    .notNull()
    .default("member"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
