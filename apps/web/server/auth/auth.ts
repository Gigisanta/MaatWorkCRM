// ============================================================
// Server Auth Helpers for TanStack Start
// ============================================================

import { auth } from "./index";

export async function getSession() {
  const { getRequest } = await import("@tanstack/react-start/server");
  const request = getRequest();
  const headers = request?.headers;
  
  if (!headers) {
    return null;
  }
  
  return await auth.api.getSession({
    headers,
  });
}

/**
 * Ensure session exists - throws redirect if not authenticated
 * Convenience wrapper for protected routes
 */
export async function ensureSession() {
  const session = await getSession();
  if (!session) {
    throw new Response(null, {
      status: 302,
      headers: { Location: "/login" },
    });
  }
  return session;
}

/**
 * Get current user from session
 */
export async function getUser() {
  const session = await getSession();
  return session?.user ?? null;
}
