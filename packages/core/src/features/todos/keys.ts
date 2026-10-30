import type { QueryClient } from "@tanstack/react-query"

import { listTodosQueryKey } from "@workspace/api-client/query"

/** Prefix matching every cached todo list (any filter, finite or infinite). */
export function todoListKeyPrefix() {
  const [{ _id }] = listTodosQueryKey()
  return [{ _id }]
}

export function invalidateTodoLists(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: todoListKeyPrefix() })
}
