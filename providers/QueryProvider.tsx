/**
 * React Query Provider
 * Configures global cache settings for stays data
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,

      // Cache is garbage collected after 10 minutes
      gcTime: 10 * 60 * 1000,

      // Don't refetch on window focus (we have auto-refresh)
      refetchOnWindowFocus: false,

      // Use cached data on mount if available
      refetchOnMount: false,

      // Retry failed requests twice
      retry: 2,

      // Exponential backoff for retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

interface QueryProviderProps {
  children?: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}