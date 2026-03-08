// ============================================================
// MaatWork CRM — TanStack Start Router Configuration
// ============================================================

import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { queryClient } from "~/lib/query-client";
import { routeTree } from "./routeTree.gen";

export function createRouter() {
  return createTanStackRouter({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
    defaultNotFoundComponent: () => (
      <div className="flex items-center justify-center min-h-screen bg-background text-text">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-text-secondary">Page not found</p>
        </div>
      </div>
    ),
    context: {
      queryClient,
    },
  });
}

// Ensure hydrateStart can find getRouter if needed in the latest RC builds
export const getRouter = createRouter;

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
