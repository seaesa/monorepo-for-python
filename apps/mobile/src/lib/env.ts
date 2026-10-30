import { createEnv } from "@t3-oss/env-core"
import Constants from "expo-constants"
import { z } from "zod"

/**
 * In development the API runs on the machine serving Metro. `localhost` only reaches it from
 * a simulator, so it is swapped for Metro's LAN host, which physical devices can reach too.
 */
function reachableFromDevice(url: string) {
  const metroHost = Constants.expoConfig?.hostUri?.split(":")[0]
  if (!__DEV__ || !metroHost) return url
  const parsed = new URL(url)
  if (parsed.hostname === "localhost") parsed.hostname = metroHost
  return parsed.origin
}

/**
 * The only module that reads `process.env` at runtime (enforced by oxlint). Values come from
 * `.env.development` (committed) / `.env.local` (personal) in dev and from the EAS environment
 * of the build profile otherwise. EXPO_PUBLIC_* values are inlined by Metro, so they must be
 * referenced statically below.
 */
const parsed = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  client: {
    /** Origin only: generated SDK paths already include `/api/v1`. */
    EXPO_PUBLIC_API_URL: z.url(),
    EXPO_PUBLIC_APP_ENV: z.enum(["development", "preview", "production"]),
    /** Error reporting is off until set. */
    EXPO_PUBLIC_SENTRY_DSN: z.url().optional(),
    /** Numeric App Store id, for the "update required" button on iOS. */
    EXPO_PUBLIC_IOS_STORE_ID: z.string().regex(/^\d+$/).optional(),
  },
  runtimeEnv: {
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
    EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
    EXPO_PUBLIC_IOS_STORE_ID: process.env.EXPO_PUBLIC_IOS_STORE_ID,
  },
  emptyStringAsUndefined: true,
})

export const env = {
  ...parsed,
  EXPO_PUBLIC_API_URL: reachableFromDevice(parsed.EXPO_PUBLIC_API_URL),
}
