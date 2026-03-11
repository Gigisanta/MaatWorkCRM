// ============================================================
// MaatWork CRM — better-auth Configuration (PostgreSQL/Neon)
// UI/UX REFINED BY JULES v2
// ============================================================

import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@server/db";
import * as schema from "@server/db/schema";
import { readFileSync } from "node:fs";

const loadEnvFile = () => {
  try {
    const envFile = readFileSync(".env", "utf-8");
    for (const line of envFile.split("\n")) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  } catch (e) {}
};

loadEnvFile();

console.log("[AUTH] DATABASE_URL from env:", process.env.DATABASE_URL?.substring(0, 50) + "...");

function createAuth() {
  const vercelUrl = process.env.VERCEL_URL;
  const productionUrl = process.env.BETTER_AUTH_URL || (vercelUrl ? `https://${vercelUrl}` : undefined);
  
  console.log("[AUTH] BETTER_AUTH_URL:", process.env.BETTER_AUTH_URL);
  console.log("[AUTH] VERCEL_URL:", vercelUrl);
  console.log("[AUTH] Final baseURL:", productionUrl);

  const trustedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://crm.maat.work",
    ...(vercelUrl ? [`https://${vercelUrl}`] : []),
  ].filter(Boolean) as string[];

  console.log("[AUTH] trustedOrigins:", trustedOrigins);

  return betterAuth({
    baseURL: productionUrl,
    basePath: "/api/betterauth",
    trustedOrigins,
    database: drizzleAdapter(db, {
      schema: {
        users: schema.users,
        sessions: schema.sessions,
        accounts: schema.accounts,
        verifications: schema.verifications,
        organizations: schema.organizations,
        members: schema.members,
      },
      usePlural: true,
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        prompt: "consent",
        accessType: "offline",
        scopes: [
          "openid",
          "https://www.googleapis.com/auth/userinfo.profile",
          "https://www.googleapis.com/auth/userinfo.email",
          "https://www.googleapis.com/auth/calendar",
          "https://www.googleapis.com/auth/calendar.events",
          "https://www.googleapis.com/auth/drive",
          "https://www.googleapis.com/auth/drive.file",
        ],
      },
    },
    plugins: [
      organization({
        allowUserToCreateOrganization: true,
      }),
      tanstackStartCookies(),
    ],
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "asesor",
        },
        careerLevel: {
          type: "string",
          required: false,
          defaultValue: "junior",
        },
      },
    },
  });
}

export const auth = createAuth();

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
