// ============================================================
// MaatWork CRM — Auth Client (browser-side)
// ============================================================

import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? `${window.location.origin}/api/auth` : "http://localhost:3000/api/auth",
  plugins: [organizationClient()],
});

export const { signIn, signUp, signOut, useSession, getSession, organization: orgClient } = authClient;
