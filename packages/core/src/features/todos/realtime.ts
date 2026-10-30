import { getTodoQueryKey } from "@workspace/api-client/query"

import type { RealtimeHandlers } from "../realtime/handlers"
import { invalidateTodoLists } from "./keys"

/** Keep caches in sync when todos change on another device/tab. */
export const todosRealtime: RealtimeHandlers = {
  "todo.changed": ({ action, id, todo }, queryClient) => {
    const detailKey = getTodoQueryKey({ path: { todoId: id } })
    if (action === "deleted") queryClient.removeQueries({ queryKey: detailKey })
    else if (todo) queryClient.setQueryData(detailKey, todo)
    void invalidateTodoLists(queryClient)
  },
}
