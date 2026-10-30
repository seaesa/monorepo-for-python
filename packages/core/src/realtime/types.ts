import type { QueryClient } from "@tanstack/react-query"

import type { RealtimeEvents } from "@workspace/api-client"

/** Per-feature cache-sync rules: one handler per server event the feature cares about. */
export type RealtimeHandlers = {
  [K in keyof RealtimeEvents]?: (payload: RealtimeEvents[K], queryClient: QueryClient) => void
}
