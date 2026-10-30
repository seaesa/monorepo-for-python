import { QueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"

import { QUERY_MAX_RETRIES, QUERY_STALE_TIME_MS } from "../config"

/** Shared React Query defaults: no retries on 4xx, short stale time. */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS,
        retry: (failureCount, error) => {
          const status = isAxiosError(error) ? error.response?.status : undefined
          if (status && status >= 400 && status < 500) return false
          return failureCount < QUERY_MAX_RETRIES
        },
      },
      mutations: { retry: false },
    },
  })
}
