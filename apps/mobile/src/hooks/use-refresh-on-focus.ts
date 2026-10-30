import { useFocusEffect } from "expo-router"
import { useCallback, useRef } from "react"

/** Refetch when a screen regains focus (React Query's window-focus refetch has no RN equivalent). */
export function useRefreshOnFocus(refetch: () => unknown) {
  const firstTime = useRef(true)
  useFocusEffect(
    useCallback(() => {
      if (firstTime.current) {
        firstTime.current = false
        return
      }
      refetch()
    }, [refetch])
  )
}
