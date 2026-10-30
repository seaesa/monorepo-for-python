import Constants from "expo-constants"
import { z } from "zod"

/**
 * In dev, default to the machine running Metro (works on simulators *and* physical
 * devices on the same network). Override with EXPO_PUBLIC_API_URL (origin only; paths already include /api/v1).
 */
function defaultApiUrl() {
  const host = Constants.expoConfig?.hostUri?.split(":")[0] ?? "localhost"
  return `http://${host}:8000`
}

export const env = z
  .object({ EXPO_PUBLIC_API_URL: z.url().default(defaultApiUrl()) })
  // EXPO_PUBLIC_* must be referenced statically to be inlined by Metro.
  .parse({ EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL || undefined })
