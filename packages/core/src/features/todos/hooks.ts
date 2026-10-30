import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from "@tanstack/react-query"
import { useState } from "react"

import {
  listTodos,
  type CursorPageTodoRead,
  type ListTodosData,
  type TodoRead,
  type TodoUpdate,
} from "@workspace/api-client"
import {
  createTodoMutation,
  deleteTodoMutation,
  getTodoQueryKey,
  listTodosInfiniteQueryKey,
  updateTodoMutation,
} from "@workspace/api-client/query"

import { invalidateTodoLists, todoListKeyPrefix } from "./keys"

export type TodoFilters = NonNullable<ListTodosData["query"]>

/** Cursor pagination: each page carries `nextCursor` for the following request. */
export function useInfiniteTodos(filters: TodoFilters = {}) {
  return useInfiniteQuery({
    queryKey: listTodosInfiniteQueryKey({ query: filters }),
    // The generated infinite options branch on `typeof pageParam === "object"`, which is also
    // true for `null` — the "first page" sentinel — so they throw before the first request.
    // This is the same generated call without that branch: no cursor means "newest first".
    queryFn: async ({ pageParam, signal }) => {
      const { data } = await listTodos({
        query: { ...filters, cursor: pageParam ?? undefined },
        signal,
        throwOnError: true,
      })
      return data
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    placeholderData: keepPreviousData,
  })
}

/** Status tabs shown above the list; `key` is the i18n suffix (`todos.filters.<key>`). */
export const TODO_STATUS_FILTERS = [
  { key: "all", completed: undefined },
  { key: "active", completed: false },
  { key: "done", completed: true },
] as const

export type TodoStatusFilter = (typeof TODO_STATUS_FILTERS)[number]["key"]

/** List screen state: status filter + flattened pages (page size: the API default). */
export function useTodoList() {
  const [status, setStatus] = useState<TodoStatusFilter>("all")
  const completed = TODO_STATUS_FILTERS.find((f) => f.key === status)?.completed
  const query = useInfiniteTodos({ completed })
  const todos = query.data?.pages.flatMap((page) => page.items) ?? []
  return { ...query, todos, status, setStatus }
}

type TodoPages = InfiniteData<CursorPageTodoRead>
type TodoCacheSnapshot = [QueryKey, TodoPages | undefined][]

type TodoPatch = Partial<Pick<TodoRead, "title" | "description" | "completed">>

/** Only the fields the client actually sent, with nulls for non-nullable ones dropped. */
function toPatch(body: TodoUpdate): TodoPatch {
  const patch: TodoPatch = {}
  if (body.title != null) patch.title = body.title
  if (body.description !== undefined) patch.description = body.description
  if (body.completed != null) patch.completed = body.completed
  return patch
}

function mapItems(pages: TodoPages, update: (todo: TodoRead) => TodoRead): TodoPages {
  return {
    ...pages,
    pages: pages.pages.map((page) => ({ ...page, items: page.items.map(update) })),
  }
}

function withoutItem(pages: TodoPages, todoId: string): TodoPages {
  return {
    ...pages,
    pages: pages.pages.map((page) => ({
      ...page,
      items: page.items.filter((todo) => todo.id !== todoId),
    })),
  }
}

/** Write an optimistic change into every cached list, remembering what to restore. */
async function optimistically(
  queryClient: ReturnType<typeof useQueryClient>,
  change: (pages: TodoPages) => TodoPages,
  alsoPatchDetail?: () => void
): Promise<TodoCacheSnapshot> {
  await queryClient.cancelQueries({ queryKey: todoListKeyPrefix() })
  const previous = queryClient.getQueriesData<TodoPages>({ queryKey: todoListKeyPrefix() })
  queryClient.setQueriesData<TodoPages>({ queryKey: todoListKeyPrefix() }, (pages) =>
    pages ? change(pages) : pages
  )
  alsoPatchDetail?.()
  return previous
}

function rollback(
  queryClient: ReturnType<typeof useQueryClient>,
  previous: TodoCacheSnapshot | undefined
) {
  for (const [key, data] of previous ?? []) queryClient.setQueryData(key, data)
}

/** Every todo mutation refetches all cached todo lists (any filter/page). */
function useInvalidateTodos() {
  const queryClient = useQueryClient()
  return () => invalidateTodoLists(queryClient)
}

export function useCreateTodo() {
  const onSettled = useInvalidateTodos()
  return useMutation({ ...createTodoMutation(), onSettled })
}

export function useUpdateTodo() {
  const onSettled = useInvalidateTodos()
  return useMutation({ ...updateTodoMutation(), onSettled })
}

/** Flips `completed` immediately and rolls back if the server rejects it. */
export function useToggleTodo() {
  const queryClient = useQueryClient()
  const onSettled = useInvalidateTodos()
  const mutation = useMutation({
    ...updateTodoMutation(),
    onMutate: ({ path, body }) => {
      const todoId = path.todoId
      const patch = toPatch(body)
      const detailKey = getTodoQueryKey({ path: { todoId } })
      return optimistically(
        queryClient,
        (pages) => mapItems(pages, (todo) => (todo.id === todoId ? { ...todo, ...patch } : todo)),
        () => {
          const detail = queryClient.getQueryData<TodoRead>(detailKey)
          if (detail) queryClient.setQueryData<TodoRead>(detailKey, { ...detail, ...patch })
        }
      )
    },
    onError: (_error, _vars, previous) => rollback(queryClient, previous),
    onSettled,
  })
  return {
    ...mutation,
    toggle: (id: string, completed: boolean) =>
      mutation.mutate({ path: { todoId: id }, body: { completed } }),
  }
}

/** Removes the todo from every cached list immediately, restoring it on failure. */
export function useDeleteTodo() {
  const queryClient = useQueryClient()
  const onSettled = useInvalidateTodos()
  return useMutation({
    ...deleteTodoMutation(),
    onMutate: ({ path }) => optimistically(queryClient, (pages) => withoutItem(pages, path.todoId)),
    onError: (_error, _vars, previous) => rollback(queryClient, previous),
    onSettled,
  })
}
