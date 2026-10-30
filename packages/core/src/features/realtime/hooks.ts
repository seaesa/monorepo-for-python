import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef } from "react"

import type { RealtimeEvents } from "@workspace/api-client"

import { useIsAuthenticated } from "../auth/store"
import { realtimeHandlers } from "./handlers"
import { getSocket } from "./socket"

type EventName = keyof RealtimeEvents
type Listener = (payload: never) => void

/**
 * Subscribe and return the unsubscribe function. Public APIs stay typed by `RealtimeEvents`;
 * socket.io's conditional listener types cannot follow a generic event name, so this
 * internal helper uses the untyped emitter.
 */
function subscribe(event: EventName, listener: Listener) {
  const socket = getSocket() as unknown as {
    on: (e: string, l: Listener) => void
    off: (e: string, l: Listener) => void
  } | null
  socket?.on(event, listener)
  return () => socket?.off(event, listener)
}

/**
 * Mount once at the app root (inside QueryClientProvider): connects while signed in,
 * disconnects on sign-out, and applies every feature's cache-sync handlers.
 */
export function useRealtimeConnection() {
  const queryClient = useQueryClient()
  const isAuthenticated = useIsAuthenticated()

  useEffect(() => {
    const socket = getSocket()
    if (!socket || !isAuthenticated) return

    const unsubscribers = realtimeHandlers.flatMap((handlers) =>
      (Object.keys(handlers) as EventName[]).map((event) =>
        subscribe(event, (payload) => handlers[event]?.(payload, queryClient))
      )
    )
    socket.connect()

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe())
      socket.disconnect()
    }
  }, [isAuthenticated, queryClient])
}

/** Subscribe a component to one server event (typed payload), e.g. to show a toast. */
export function useRealtimeEvent<K extends EventName>(
  event: K,
  handler: (payload: RealtimeEvents[K]) => void
) {
  const handlerRef = useRef(handler)
  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(
    () => subscribe(event, (payload: RealtimeEvents[K]) => handlerRef.current(payload)),
    [event]
  )
}
