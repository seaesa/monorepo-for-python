import type { QueryClient } from "@tanstack/react-query"

import { listTodosQueryKey } from "@workspace/api-client/query"

/** Every cached todo list (any filter/page) shares the generated operation id. */
export function invalidateTodoLists(queryClient: QueryClient) {
  const [{ _id }] = listTodosQueryKey()
  return queryClient.invalidateQueries({ queryKey: [{ _id }] })
}
