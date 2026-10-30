import { z } from "zod"

import {
  zChangePasswordRequest,
  zDeleteAccountRequest,
  zEmailRequest,
  zLoginRequest,
  zResetPasswordRequest,
  zUserCreate,
  zVerifyEmailRequest,
} from "@workspace/api-client/zod"

// Generated from the backend (same constraints as Pydantic); extend only for UI-only fields.
export const loginSchema = zLoginRequest

export const registerSchema = zUserCreate
  .extend({ confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    message: "validation.passwordsMismatch", // i18n key, rendered via translateMessage
    path: ["confirmPassword"],
  })

export const forgotPasswordSchema = zEmailRequest

export const resetPasswordSchema = zResetPasswordRequest
  .extend({ confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    message: "validation.passwordsMismatch",
    path: ["confirmPassword"],
  })

export const changePasswordSchema = zChangePasswordRequest
  .extend({ confirmPassword: z.string() })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "validation.passwordsMismatch",
    path: ["confirmPassword"],
  })

export const deleteAccountSchema = zDeleteAccountRequest

export const verifyEmailSchema = zVerifyEmailRequest

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>
export type DeleteAccountValues = z.infer<typeof deleteAccountSchema>
