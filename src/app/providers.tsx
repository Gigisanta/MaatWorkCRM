'use client';

import { ThemeProvider } from 'next-themes';
import { Providers } from '@/components/providers';
import { SkipLink } from '@/components/ui/skip-link';
import { Toaster } from '@/components/ui/sonner';
import { QuickActionsModals } from '@/components/quick-actions-modals';
import { SidebarProvider } from '@/contexts/sidebar-context';

export function ProvidersWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
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
    </SidebarProvider>
  );
}
