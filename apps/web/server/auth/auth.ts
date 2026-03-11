// ============================================================
// Server Auth Helpers for TanStack Start
// ============================================================

import { auth } from "./index";

export async function getSession() {
  try {
    const { getRequestHeaders } = await import("@tanstack/react-start/server");
    const headers = getRequestHeaders();
    
    if (!headers || Object.keys(headers).length === 0) {
      return null;
    }
    
    return await auth.api.getSession({
      headers,
    });
  } catch (error) {
    console.error("[getSession] Error:", error);
    return null;
  }
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
