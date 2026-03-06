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
