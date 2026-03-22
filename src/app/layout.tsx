import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { Outfit } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { Providers } from "@/components/providers";
import { SkipLink } from "@/components/ui/skip-link";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { QuickActionsModals } from "@/components/quick-actions-modals";

// DM Sans - Primary font for display, headings, and body
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Outfit - Secondary font for labels, overlines, and auxiliary elements
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

// Geist Mono - Monospace for code
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MaatWork CRM - Software Factory",
  description: "Automatizamos procesos críticos para que tu equipo se enfoque en lo que realmente importa. CRM moderno para gestión de contactos, pipeline de ventas, tareas y equipos.",
  keywords: ["CRM", "MaatWork", "Ventas", "Pipeline", "Gestión", "Contactos", "Software Factory"],
  authors: [{ name: "MaatWork Team" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${outfit.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
          forcedTheme="dark"
        >
          <Providers>
            <SkipLink href="#main-content">Saltar al contenido principal</SkipLink>
            <main id="main-content">
              {children}
            </main>
            <Toaster position="bottom-right" richColors closeButton />
            <QuickActionsModals />
          </Providers>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
