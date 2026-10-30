import { z } from "zod"

// Only NEXT_PUBLIC_* vars reach the browser; they are inlined at build time.
// API_URL is the origin only: generated SDK paths already include /api/v1.
export const env = z
  .object({
    NEXT_PUBLIC_API_URL: z.url().default("http://localhost:8000"),
  })
  .parse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  })
