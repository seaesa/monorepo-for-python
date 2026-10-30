import { FlatList, RefreshControl, View } from "react-native"

import { TODO_STATUS_FILTERS, useTodoList } from "@workspace/core/todos"
import { useTranslation } from "@workspace/i18n"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Text } from "@/components/ui/text"
import { useRefreshOnFocus } from "@/hooks/use-refresh-on-focus"

import { TodoComposer } from "./todo-composer"
import { TodoItem } from "./todo-item"

export function TodoList() {
  const { t } = useTranslation()
  const {
    todos,
    status,
    setStatus,
    isPending,
    isError,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useTodoList()
  useRefreshOnFocus(refetch)

  return (
    <FlatList
      data={todos}
      keyExtractor={(todo) => todo.id}
      renderItem={({ item }) => <TodoItem todo={item} />}
      ItemSeparatorComponent={Separator}
      contentContainerClassName="pb-8"
      keyboardShouldPersistTaps="handled"
      onEndReached={() => {
        if (hasNextPage) void fetchNextPage()
      }}
      onEndReachedThreshold={0.5}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
      ListHeaderComponent={
        <View className="gap-4 p-4">
          <TodoComposer />
          <View className="flex-row gap-2">
            {TODO_STATUS_FILTERS.map(({ key }) => (
              <Button
                key={key}
                size="sm"
                variant={status === key ? "secondary" : "ghost"}
                onPress={() => setStatus(key)}
              >
                <Text>{t(`todos.filters.${key}`)}</Text>
              </Button>
            ))}
          </View>
        </View>
      }
      ListEmptyComponent={
        isPending ? (
          <View className="gap-2 px-4">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </View>
        ) : (
          <View className="items-center gap-3 p-8">
            <Text className="text-muted-foreground">
              {isError ? t("todos.loadError") : t("todos.empty.title")}
            </Text>
            {isError && (
              <Button variant="outline" onPress={() => refetch()}>
                <Text>{t("common.retry")}</Text>
              </Button>
            )}
          </View>
        )
      }
    />
  )
}
