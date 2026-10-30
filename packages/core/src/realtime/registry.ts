import { todosRealtime } from "../features/todos"
import type { RealtimeHandlers } from "./types"

/** Cache sync rules per feature. A new feature with events adds its handlers here. */
export const realtimeHandlers: RealtimeHandlers[] = [todosRealtime]
