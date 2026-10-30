import { QueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"

/** Shared React Query defaults: no retries on 4xx, short stale time. */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => {
          const status = isAxiosError(error) ? error.response?.status : undefined
          if (status && status >= 400 && status < 500) return false
          return failureCount < 2
        },
      },
      mutations: { retry: false },
    },
  })
}
