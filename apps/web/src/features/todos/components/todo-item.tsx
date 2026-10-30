"use client"

import { Delete02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import type { TodoRead } from "@workspace/api-client"
import { formatRelative } from "@workspace/core"
import { useDeleteTodo, useToggleTodo } from "@workspace/core/todos"
import { useTranslation } from "@workspace/i18n"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

export function TodoItem({ todo }: { todo: TodoRead }) {
  const { t } = useTranslation()
  const { toggle } = useToggleTodo()
  const deleteTodo = useDeleteTodo()

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <Checkbox
        checked={todo.completed}
        onCheckedChange={(checked) => toggle(todo.id, checked)}
        aria-label={t(todo.completed ? "todos.markNotDone" : "todos.markDone", {
          title: todo.title,
        })}
      />
      <div className="min-w-0 flex-1">
        <p className={cn("truncate", todo.completed && "text-muted-foreground line-through")}>
          {todo.title}
        </p>
        <p className="text-xs text-muted-foreground">{formatRelative(todo.createdAt)}</p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("todos.delete")}
        disabled={deleteTodo.isPending}
        onClick={() => deleteTodo.mutate({ path: { todoId: todo.id } })}
      >
        <HugeiconsIcon icon={Delete02Icon} />
      </Button>
    </li>
  )
}
