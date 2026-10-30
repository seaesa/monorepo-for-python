import { Skeleton } from "@/components/ui/skeleton"

/** Placeholder rows for the todo list, shared by `isPending` and the route `loading.tsx`. */
export function TodoListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  )
}
