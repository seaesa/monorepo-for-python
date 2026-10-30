"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { useAuthStore } from "@workspace/core/auth"

import { Spinner } from "@/components/ui/spinner"

/**
 * Client-side route gate. Tokens live in client storage, so the check runs after
 * hydration. `require="auth"` protects app pages, `require="guest"` auth pages.
 */
export function AuthGate({
  require,
  children,
}: {
  require: "auth" | "guest"
  children: React.ReactNode
}) {
  const router = useRouter()
  const hydrated = useAuthStore((s) => s.hydrated)
  const authenticated = useAuthStore((s) => !!s.accessToken)
  const allowed = require === "auth" ? authenticated : !authenticated

  useEffect(() => {
    if (hydrated && !allowed) router.replace(require === "auth" ? "/login" : "/todos")
  }, [hydrated, allowed, require, router])

  if (!hydrated || !allowed) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }
  return children
}
