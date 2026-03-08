// ============================================================
// MaatWork CRM — Auth Client (browser-side)
// ============================================================

import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? `${window.location.origin}/auth-api` : "http://localhost:3000/auth-api",
  plugins: [organizationClient()],
});

export const { signIn, signUp, signOut, useSession, getSession, organization: orgClient } = authClient;
