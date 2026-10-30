import { useMutation } from "@tanstack/react-query"

import {
  registerPushDevice,
  unregisterPushDevice,
  type PushDeviceRegister,
} from "@workspace/api-client"
import { sendTestPushMutation } from "@workspace/api-client/query"
import type { Locale } from "@workspace/i18n"

import { usePushDeviceStore } from "./store"

/**
 * Idempotent. The server renders pushes in `locale`, so call it again whenever the app language
 * changes; it also moves the token to the signed-in user.
 */
export function useRegisterPushDevice() {
  const setToken = usePushDeviceStore((s) => s.setToken)
  return useMutation({
    mutationFn: ({ locale, ...body }: PushDeviceRegister & { locale: Locale }) =>
      registerPushDevice({ body, headers: { "Accept-Language": locale }, throwOnError: true }),
    onSuccess: (_, { token }) => setToken(token),
  })
}

export function useSendTestPush() {
  return useMutation({ ...sendTestPushMutation() })
}

/** Best effort, while the session is still valid: a signed-out device must stop receiving pushes. */
export async function unregisterCurrentPushDevice() {
  const { token, setToken } = usePushDeviceStore.getState()
  if (!token) return
  await unregisterPushDevice({ path: { token } }).catch(() => null)
  setToken(null)
}
