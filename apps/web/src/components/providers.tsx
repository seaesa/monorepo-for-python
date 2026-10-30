"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState } from "react"

import { createQueryClient, setupCore } from "@workspace/core"
import { useRealtimeConnection } from "@workspace/core/realtime"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { PreferencesSync } from "@/features/preferences/components/preferences-sync"
import { env } from "@/lib/env"

if (typeof window !== "undefined") {
  void setupCore({
    apiUrl: env.NEXT_PUBLIC_API_URL,
    storage: window.localStorage,
    detectLocale: () => navigator.language,
  })
}

function RealtimeConnection() {
  useRealtimeConnection()
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeConnection />
      <ThemeProvider>
        <PreferencesSync />
        {children}
        <Toaster richColors position="top-right" />
      </ThemeProvider>
      <ReactQueryDevtools buttonPosition="bottom-left" />
    </QueryClientProvider>
  )
}
