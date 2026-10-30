import { useEffect, useRef } from "react"

import { useApiForm } from "../../lib/form"
import { useForgotPassword, useLogin, useRegister, useResetPassword, useVerifyEmail } from "./hooks"
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./schemas"

export function useLoginForm() {
  const login = useLogin()
  return useApiForm(loginSchema, {
    defaultValues: { email: "", password: "" },
    submit: (body) => login.mutateAsync({ body }),
  })
}

export function useRegisterForm() {
  const register = useRegister()
  return useApiForm(registerSchema, {
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
    submit: register.submit,
  })
}

/** `sentTo` is set once the reset email is queued; the screen then shows the confirmation. */
export function useForgotPasswordForm() {
  const forgot = useForgotPassword()
  const apiForm = useApiForm(forgotPasswordSchema, {
    defaultValues: { email: "" },
    submit: (body) => forgot.mutateAsync({ body }),
  })
  return { ...apiForm, sentTo: forgot.isSuccess ? forgot.variables.body.email : undefined }
}

export function useResetPasswordForm(token: string) {
  const reset = useResetPassword()
  const apiForm = useApiForm(resetPasswordSchema, {
    defaultValues: { token, password: "", confirmPassword: "" },
    submit: reset.submit,
  })
  return { ...apiForm, isDone: reset.isSuccess }
}

/**
 * Manual code entry, plus auto-submit when the screen is opened from the email link
 * (`linkToken`). `isVerifyingLink` covers that automatic attempt until it settles.
 */
export function useVerifyEmailForm(linkToken = "") {
  const verify = useVerifyEmail()
  const apiForm = useApiForm(verifyEmailSchema, {
    defaultValues: { token: linkToken },
    submit: (body) => verify.mutateAsync({ body }),
  })
  const autoSubmitted = useRef(false)
  const { onSubmit } = apiForm

  useEffect(() => {
    if (!linkToken || autoSubmitted.current) return
    autoSubmitted.current = true
    void onSubmit()
  }, [linkToken, onSubmit])

  return {
    ...apiForm,
    isDone: verify.isSuccess,
    isVerifyingLink: Boolean(linkToken) && !verify.isSuccess && !verify.isError,
  }
}
