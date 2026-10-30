import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { logout } from "@workspace/api-client"
import { getMeOptions, loginMutation, registerMutation } from "@workspace/api-client/query"

import type { RegisterValues } from "./schemas"
import { useAuthStore, useIsAuthenticated } from "./store"

export function useLogin() {
  const setTokens = useAuthStore((s) => s.setTokens)
  return useMutation({ ...loginMutation(), onSuccess: setTokens })
}

export function useRegister() {
  const setTokens = useAuthStore((s) => s.setTokens)
  const mutation = useMutation({ ...registerMutation(), onSuccess: setTokens })
  return {
    ...mutation,
    /** Accepts the form values directly (drops UI-only `confirmPassword`). */
    submit: ({ confirmPassword: _, ...body }: RegisterValues) => mutation.mutateAsync({ body }),
  }
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { refreshToken, clear } = useAuthStore.getState()
      if (refreshToken) await logout({ body: { refreshToken } }).catch(() => undefined)
      clear()
      queryClient.clear()
    },
  })
}

export function useCurrentUser() {
  const isAuthenticated = useIsAuthenticated()
  return useQuery({ ...getMeOptions(), enabled: isAuthenticated })
}
