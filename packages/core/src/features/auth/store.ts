import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { TokenPair, TokenStore } from "@workspace/api-client"

import { persistStorage } from "../../lib/storage"

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  hydrated: boolean
  setTokens: (tokens: TokenPair) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      hydrated: false,
      setTokens: ({ accessToken, refreshToken }) => set({ accessToken, refreshToken }),
      clear: () => set({ accessToken: null, refreshToken: null }),
    }),
    {
      name: "auth",
      storage: persistStorage,
      partialize: ({ accessToken, refreshToken }) => ({ accessToken, refreshToken }),
      skipHydration: true,
      onRehydrateStorage: () => () => useAuthStore.setState({ hydrated: true }),
    }
  )
)

/** Adapter consumed by `configureApiClient` interceptors. */
export const authTokenStore: TokenStore = {
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  setTokens: (tokens) => useAuthStore.getState().setTokens(tokens),
  clear: () => useAuthStore.getState().clear(),
}

export const useIsAuthenticated = () => useAuthStore((s) => !!s.accessToken)
