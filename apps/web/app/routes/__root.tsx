import { QueryClientProvider } from "@tanstack/react-query";
import { HeadContent, Outlet, Scripts, ScrollRestoration, createRootRoute } from "@tanstack/react-router";
import { queryClient } from "~/lib/query-client";

import "../styles/globals.css";

export const Route = createRootRoute({
  context: () => ({
    queryClient,
  }),
  component: RootLayout,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MaatWork CRM — Gestión de Clientes para Asesores" },
      {
        name: "description",
        content:
          "CRM profesional para asesores financieros. Gestiona clientes, pipeline, tareas y objetivos de equipo.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
});

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <html lang="es" className="dark antialiased bg-background text-foreground">
        <head>
          <HeadContent />
        </head>
        <body className="font-sans min-h-screen">
          <Outlet />
          <Scripts />
        </body>
      </html>
    </QueryClientProvider>
  );
}
