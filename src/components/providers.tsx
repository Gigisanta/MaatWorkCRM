'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth-context';
import { QuickActionsProvider } from '@/lib/quick-actions-context';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // 5 minutes stale time - reduce unnecessary refetches
        staleTime: 5 * 60 * 1000,
        // 10 minutes garbage collection - keep unused data longer
        gcTime: 10 * 60 * 1000,
        // Don't refetch on window focus in dev (causes excessive API calls)
        refetchOnWindowFocus: process.env.NODE_ENV !== 'development',
        // Single retry on failure
        retry: 1,
        // Exponential backoff delay
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        // Keep failed mutations in cache for retry
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <QuickActionsProvider>
          {children}
        </QuickActionsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
