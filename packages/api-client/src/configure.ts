import { isAxiosError, type AxiosError, type InternalAxiosRequestConfig } from "axios"

import { client } from "./gen/client.gen"
import { refreshToken } from "./gen/sdk.gen"
import type { ErrorCode, ErrorResponse, FieldError, TokenPair } from "./gen/types.gen"

/** Storage-agnostic token access; each app wires it to its own auth store. */
export interface TokenStore {
  getAccessToken: () => string | null | undefined
  getRefreshToken: () => string | null | undefined
  setTokens: (tokens: TokenPair) => void
  clear: () => void
}

export interface ApiClientOptions {
  baseURL: string
  tokens: TokenStore
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

let refreshing: Promise<string | null> | null = null

/** Single-flight refresh: concurrent 401s share one `/auth/refresh` call. */
function refreshAccessToken(tokens: TokenStore): Promise<string | null> {
  refreshing ??= (async () => {
    const current = tokens.getRefreshToken()
    if (!current) return null
    try {
      const { data } = await refreshToken({
        body: { refreshToken: current },
        throwOnError: true,
      })
      tokens.setTokens(data)
      return data.accessToken
    } catch {
      tokens.clear()
      return null
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

let interceptorIds: { request: number; response: number } | null = null
let activeTokens: TokenStore | null = null

/**
 * Refresh the access token now (shared single-flight with the 401 interceptor). Used by
 * non-HTTP transports, e.g. the realtime socket after an "unauthorized" handshake.
 */
export function refreshSession(): Promise<string | null> {
  return activeTokens ? refreshAccessToken(activeTokens) : Promise.resolve(null)
}

/** Call once at app start (web: providers, mobile: root layout). Idempotent. */
export function configureApiClient({ baseURL, tokens }: ApiClientOptions) {
  client.setConfig({ baseURL })
  activeTokens = tokens
  const axios = client.instance

  if (interceptorIds) {
    axios.interceptors.request.eject(interceptorIds.request)
    axios.interceptors.response.eject(interceptorIds.response)
  }

  const request = axios.interceptors.request.use((config) => {
    const token = tokens.getAccessToken()
    if (token) config.headers.set("Authorization", `Bearer ${token}`)
    return config
  })

  const response = axios.interceptors.response.use(undefined, async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined
    const isAuthCall = config?.url?.includes("/auth/")
    if (error.response?.status !== 401 || !config || config._retry || isAuthCall) {
      throw error
    }
    config._retry = true
    const accessToken = await refreshAccessToken(tokens)
    if (!accessToken) throw error
    config.headers.set("Authorization", `Bearer ${accessToken}`)
    return axios.request(config)
  })

  interceptorIds = { request, response }
}

/** Backend codes plus the two the client produces itself (no response / unknown shape). */
export type ClientErrorCode = ErrorCode | "network_error" | "unknown_error"

export type ApiError = Omit<ErrorResponse, "code"> & { code: ClientErrorCode }

/** Normalised error from the backend `ErrorResponse` envelope. */
export function getApiError(error: unknown): ApiError {
  if (isAxiosError<ErrorResponse>(error)) {
    if (error.response?.data?.code) return error.response.data
    if (!error.response) return { code: "network_error", message: "Cannot reach the server" }
  }
  return { code: "unknown_error", message: "Something went wrong" }
}

/** Field-level errors (422 validation, or domain errors raised with `field=`). */
export function getFieldErrors(error: unknown): FieldError[] {
  return getApiError(error).details ?? []
}
