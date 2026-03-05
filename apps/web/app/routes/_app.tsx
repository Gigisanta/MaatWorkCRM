// ============================================================
// MaatWork CRM — App Layout (Authenticated Shell)
// ============================================================

import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Sidebar } from "~/components/layout/Sidebar";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
