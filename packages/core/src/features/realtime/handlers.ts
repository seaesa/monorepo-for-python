import type { QueryClient } from "@tanstack/react-query"

import type { RealtimeEvents } from "@workspace/api-client"

import { todosRealtime } from "../todos/realtime"

export type RealtimeHandlers = {
  [K in keyof RealtimeEvents]?: (payload: RealtimeEvents[K], queryClient: QueryClient) => void
}

/** Cache sync rules per feature. A new feature with events adds its handlers here. */
export const realtimeHandlers: RealtimeHandlers[] = [todosRealtime]
