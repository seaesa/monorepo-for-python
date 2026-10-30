import { focusManager, QueryClientProvider } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { AppState, Platform } from "react-native"

import { createQueryClient } from "@workspace/core"
import { useRealtimeConnection } from "@workspace/core/realtime"

function RealtimeConnection() {
  useRealtimeConnection()
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient)

  // Treat "app in foreground" as window focus so stale queries refetch on resume.
  useEffect(() => {
    if (Platform.OS === "web") return
    const sub = AppState.addEventListener("change", (status) =>
      focusManager.setFocused(status === "active")
    )
    return () => sub.remove()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeConnection />
      {children}
    </QueryClientProvider>
  )
}
