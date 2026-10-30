"use client"

import type { TodoRead } from "@workspace/api-client"
import { TODO_STATUS_FILTERS, useTodoList } from "@workspace/core/todos"
import { useTranslation } from "@workspace/i18n"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"

import { TodoItem } from "./todo-item"
import { TodoListSkeleton } from "./todo-list-skeleton"

export function TodoList() {
  const { t } = useTranslation()
  const {
    todos,
    status,
    setStatus,
    isPending,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTodoList()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {TODO_STATUS_FILTERS.map(({ key }) => (
          <Button
            key={key}
            size="sm"
            variant={status === key ? "secondary" : "ghost"}
            onClick={() => setStatus(key)}
          >
            {t(`todos.filters.${key}`)}
          </Button>
        ))}
      </div>

      <TodoListBody
        todos={todos}
        isPending={isPending}
        isError={isError}
        onRetry={() => void refetch()}
      />

      {hasNextPage && (
        <Button
          variant="outline"
          disabled={isFetchingNextPage}
          onClick={() => void fetchNextPage()}
        >
          {isFetchingNextPage ? t("common.loading") : t("todos.loadMore")}
        </Button>
      )}
    </div>
  )
}

interface TodoListBodyProps {
  todos: TodoRead[]
  isPending: boolean
  isError: boolean
  onRetry: () => void
}

function TodoListBody({ todos, isPending, isError, onRetry }: TodoListBodyProps) {
  const { t } = useTranslation()

  if (isPending) return <TodoListSkeleton />

  if (isError) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>{t("todos.loadError")}</EmptyTitle>
          <Button variant="outline" onClick={onRetry}>
            {t("common.retry")}
          </Button>
        </EmptyHeader>
      </Empty>
    )
  }

  if (todos.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>{t("todos.empty.title")}</EmptyTitle>
          <EmptyDescription>{t("todos.empty.description")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <Card className="py-0">
      <ul className="divide-y">
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </ul>
    </Card>
  )
}
