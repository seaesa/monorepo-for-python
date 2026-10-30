"use client"

import { Delete02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"

import type { TodoRead } from "@workspace/api-client"
import { formatRelative } from "@workspace/core"
import { useDeleteTodo, useToggleTodo } from "@workspace/core/todos"
import { useTranslation } from "@workspace/i18n"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

export function TodoItem({ todo }: { todo: TodoRead }) {
  const { t } = useTranslation()
  const { toggle } = useToggleTodo()
  const deleteTodo = useDeleteTodo()
  const [confirmOpen, setConfirmOpen] = useState(false)

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
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("todos.delete")}
              disabled={deleteTodo.isPending}
            />
          }
        >
          <HugeiconsIcon icon={Delete02Icon} />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("todos.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("todos.deleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setConfirmOpen(false)
                deleteTodo.mutate({ path: { todoId: todo.id } })
              }}
            >
              {t("todos.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  )
}
