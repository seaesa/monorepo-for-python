import * as Location from "expo-location"
import { useCallback, useState } from "react"

type LocationStatus = "idle" | "loading" | "denied" | "error" | "ready"

/** Foreground, one-shot location on demand. Background tracking needs a separate task + config. */
export function useCurrentLocation() {
  const [status, setStatus] = useState<LocationStatus>("idle")
  const [coords, setCoords] = useState<Location.LocationObjectCoords | null>(null)

  const request = useCallback(async () => {
    setStatus("loading")
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync()
      if (!granted) {
        setStatus("denied")
        return
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      setCoords(position.coords)
      setStatus("ready")
    } catch {
      setStatus("error")
    }
  }, [])

  return { status, coords, request }
}
