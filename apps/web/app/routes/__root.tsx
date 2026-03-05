// ============================================================
// MaatWork CRM — Root Route (__root.tsx)
// ============================================================

import { createRootRoute, Outlet, ScrollRestoration } from "@tanstack/react-router";
import { Meta, Scripts } from "@tanstack/react-start";

import "../styles/globals.css";

export const Route = createRootRoute({
  component: RootLayout,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MaatWork CRM — Gestión de Clientes para Asesores" },
      { name: "description", content: "CRM profesional para asesores financieros. Gestiona clientes, pipeline, tareas y objetivos de equipo." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
    ],
  }),
});

function RootLayout() {
  return (
    <html lang="es">
      <head>
        <Meta />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
