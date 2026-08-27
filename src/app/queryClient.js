import { QueryClient } from '@tanstack/react-query'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error?.status === 401 || error?.status === 403) return false
          return failureCount < 1
        },
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export const queryClient = createQueryClient()
