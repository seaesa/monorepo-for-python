import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import { Alert, View } from "react-native"

import type { TodoRead } from "@workspace/api-client"
import { formatRelative } from "@workspace/core"
import { useDeleteTodo, useToggleTodo } from "@workspace/core/todos"
import { useTranslation } from "@workspace/i18n"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Icon } from "@/components/ui/icon"
import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"

export function TodoItem({ todo }: { todo: TodoRead }) {
  const { t } = useTranslation()
  const { toggle } = useToggleTodo()
  const deleteTodo = useDeleteTodo()

  const confirmDelete = () =>
    Alert.alert(t("todos.deleteTitle"), t("todos.deleteDescription"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("todos.delete"),
        style: "destructive",
        onPress: () => deleteTodo.mutate({ path: { todoId: todo.id } }),
      },
    ])

  return (
    <View className="flex-row items-center gap-3 px-4 py-3">
      <Checkbox
        checked={todo.completed}
        onCheckedChange={(checked) => toggle(todo.id, checked)}
        aria-label={t(todo.completed ? "todos.markNotDone" : "todos.markDone", {
          title: todo.title,
        })}
      />
      <View className="flex-1">
        <Text
          numberOfLines={1}
          className={cn(todo.completed && "text-muted-foreground line-through")}
        >
          {todo.title}
        </Text>
        <Text className="text-muted-foreground text-xs">{formatRelative(todo.createdAt)}</Text>
      </View>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("todos.delete")}
        disabled={deleteTodo.isPending}
        onPress={confirmDelete}
      >
        <Icon icon={Delete02Icon} className="text-muted-foreground size-4.5" />
      </Button>
    </View>
  )
}
