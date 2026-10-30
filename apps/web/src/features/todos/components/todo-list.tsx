"use client"

import { useState } from "react"

import { useTodos, type TodoFilters } from "@workspace/core/todos"
import { useTranslation } from "@workspace/i18n"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

import { TodoItem } from "./todo-item"

const FILTERS = [
  { key: "all", value: undefined },
  { key: "active", value: false },
  { key: "done", value: true },
] as const

export function TodoList() {
  const { t } = useTranslation()
  const [filters, setFilters] = useState<TodoFilters>({ page: 1, size: 10 })
  const { data, isPending, isError, refetch } = useTodos(filters)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {FILTERS.map(({ key, value }) => (
          <Button
            key={key}
            size="sm"
            variant={filters.completed === value ? "secondary" : "ghost"}
            onClick={() => setFilters((f) => ({ ...f, completed: value, page: 1 }))}
          >
            {t(`todos.filters.${key}`)}
          </Button>
        ))}
      </div>

      {isPending ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t("todos.loadError")}</EmptyTitle>
            <Button variant="outline" onClick={() => refetch()}>
              {t("common.retry")}
            </Button>
          </EmptyHeader>
        </Empty>
      ) : data.items.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>{t("todos.empty.title")}</EmptyTitle>
            <EmptyDescription>{t("todos.empty.description")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card className="py-0">
          <ul className="divide-y">
            {data.items.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </ul>
        </Card>
      )}

      {data && data.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t("todos.pagination.page", { page: data.page, pages: data.pages })} ·{" "}
            {t("todos.pagination.total", { count: data.total })}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={data.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: data.page - 1 }))}
            >
              {t("todos.pagination.previous")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={data.page >= data.pages}
              onClick={() => setFilters((f) => ({ ...f, page: data.page + 1 }))}
            >
              {t("todos.pagination.next")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
