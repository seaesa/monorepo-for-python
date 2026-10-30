import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { logout, type Permission } from "@workspace/api-client"
import {
  changePasswordMutation,
  deleteMeMutation,
  forgotPasswordMutation,
  getMeOptions,
  getMeQueryKey,
  loginMutation,
  registerMutation,
  resendVerificationMutation,
  resetPasswordMutation,
  verifyEmailMutation,
} from "@workspace/api-client/query"

import { acceptLanguage } from "../../lib/locale"
import { unregisterCurrentPushDevice } from "../notifications"
import type { ChangePasswordValues, RegisterValues, ResetPasswordValues } from "./schemas"
import { useAuthStore, useIsAuthenticated } from "./store"

export function useLogin() {
  const setTokens = useAuthStore((s) => s.setTokens)
  return useMutation({ ...loginMutation(), onSuccess: setTokens })
}

export function useRegister() {
  const setTokens = useAuthStore((s) => s.setTokens)
  const mutation = useMutation({
    ...registerMutation({ headers: acceptLanguage() }),
    onSuccess: setTokens,
  })
  return {
    ...mutation,
    /** Accepts the form values directly (drops UI-only `confirmPassword`). */
    submit: ({ confirmPassword: _, ...body }: RegisterValues) =>
      mutation.mutateAsync({ body, headers: acceptLanguage() }),
  }
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { refreshToken, clear } = useAuthStore.getState()
      await unregisterCurrentPushDevice()
      if (refreshToken) await logout({ body: { refreshToken } }).catch(() => null)
      clear()
      queryClient.clear()
    },
  })
}

export function useCurrentUser() {
  const isAuthenticated = useIsAuthenticated()
  return useQuery({ ...getMeOptions(), enabled: isAuthenticated })
}

/**
 * Hide UI the user may not use. The API enforces the same permission; this only avoids
 * showing a button that would answer 403. `false` while the profile is loading.
 */
export function useHasPermission(permission: Permission) {
  const { data: user } = useCurrentUser()
  return user?.permissions.includes(permission) ?? false
}

/** Drop the session locally: the server has already invalidated every token. */
function useDropSession() {
  const queryClient = useQueryClient()
  return () => {
    useAuthStore.getState().clear()
    queryClient.clear()
  }
}

export function useVerifyEmail() {
  const queryClient = useQueryClient()
  return useMutation({
    ...verifyEmailMutation(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getMeQueryKey() }),
  })
}

export function useResendVerification() {
  return useMutation({ ...resendVerificationMutation({ headers: acceptLanguage() }) })
}

export function useForgotPassword() {
  return useMutation({ ...forgotPasswordMutation({ headers: acceptLanguage() }) })
}

/** Resetting the password revokes every token, so the old session is useless. */
export function useResetPassword() {
  const dropSession = useDropSession()
  const mutation = useMutation({ ...resetPasswordMutation(), onSuccess: dropSession })
  return {
    ...mutation,
    submit: ({ confirmPassword: _, ...body }: ResetPasswordValues) =>
      mutation.mutateAsync({ body }),
  }
}

/** Changing the password revokes every token (including this one). */
export function useChangePassword() {
  const dropSession = useDropSession()
  const mutation = useMutation({ ...changePasswordMutation(), onSuccess: dropSession })
  return {
    ...mutation,
    submit: ({ confirmPassword: _, ...body }: ChangePasswordValues) =>
      mutation.mutateAsync({ body }),
  }
}

export function useDeleteAccount() {
  const dropSession = useDropSession()
  return useMutation({ ...deleteMeMutation(), onSuccess: dropSession })
}
