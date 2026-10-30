import { z } from "zod"

import { zLoginRequest, zUserCreate } from "@workspace/api-client/zod"

// Generated from the backend (same constraints as Pydantic); extend only for UI-only fields.
export const loginSchema = zLoginRequest

export const registerSchema = zUserCreate
  .extend({ confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    message: "validation.passwordsMismatch", // i18n key, rendered via translateMessage
    path: ["confirmPassword"],
  })

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
