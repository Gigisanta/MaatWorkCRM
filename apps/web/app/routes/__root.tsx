import { QueryClientProvider } from "@tanstack/react-query";
import { HeadContent, Outlet, Scripts, ScrollRestoration, createRootRoute } from "@tanstack/react-router";
import { queryClient } from "~/lib/query-client";

import "../styles/globals.css";

if (typeof window !== "undefined") {
  (window as any).global = window;
  (window as any).process = {
    env: {},
    version: "",
  };
  if (!(window as any).Buffer) {
    (window as any).Buffer = {
      isBuffer: () => false,
      alloc: (size: number, fill?: string) => new Array(size).fill(fill || "\0").join(""),
      allocUnsafe: (size: number) =>
        new Array(size)
          .fill(0)
          .map(() => String.fromCharCode(Math.floor(Math.random() * 256)))
          .join(""),
      from: (str: string) => str.split("").map((c) => c.charCodeAt(0)),
      concat: (arr: Uint8Array[]) => arr,
      byteLength: (str: string) => str.length,
      isEncoding: () => true,
    };
  }
}

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
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
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
