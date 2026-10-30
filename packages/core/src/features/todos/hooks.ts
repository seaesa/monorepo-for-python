import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { ListTodosData } from "@workspace/api-client"
import {
  createTodoMutation,
  deleteTodoMutation,
  listTodosOptions,
  updateTodoMutation,
} from "@workspace/api-client/query"

import { invalidateTodoLists } from "./keys"

export type TodoFilters = NonNullable<ListTodosData["query"]>

export function useTodos(filters: TodoFilters = {}) {
  return useQuery({ ...listTodosOptions({ query: filters }), placeholderData: keepPreviousData })
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

export function useToggleTodo() {
  const update = useUpdateTodo()
  return {
    ...update,
    toggle: (id: string, completed: boolean) =>
      update.mutate({ path: { todoId: id }, body: { completed } }),
  }
}

export function useDeleteTodo() {
  const onSettled = useInvalidateTodos()
  return useMutation({ ...deleteTodoMutation(), onSettled })
}
