import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

/**
 * The only module that reads `process.env` (enforced by oxlint). Values come from
 * `.env.development` (committed) / `.env.local` (personal) in dev and from the build
 * environment otherwise; a missing or malformed value fails `next dev` / `next build`.
 * NEXT_PUBLIC_* values are inlined at build time, so they must be referenced statically below.
 */
export const env = createEnv({
  client: {
    /** Origin only: generated SDK paths already include `/api/v1`. */
    NEXT_PUBLIC_API_URL: z.url(),
    NEXT_PUBLIC_APP_ENV: z.enum(["development", "staging", "production"]),
    /** Error reporting is off until set. */
    NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
  },
  shared: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },
  runtimeEnv: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NODE_ENV: process.env.NODE_ENV,
  },
  emptyStringAsUndefined: true,
})
