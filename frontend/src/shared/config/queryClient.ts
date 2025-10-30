import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (typeof error === 'object' && error !== null && 'status' in (error as Record<string, unknown>)) {
          const status = Number((error as Record<string, unknown>).status);
          if (!Number.isNaN(status) && status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: 0,
    },
  },
});
