import { AxiosError, type AxiosAdapter, type AxiosResponse } from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type * as ApiClient from "@workspace/api-client"
import type { TokenStore } from "@workspace/api-client"

type ApiModule = typeof ApiClient

function response(config: unknown, status: number, data: unknown): AxiosResponse {
  return {
    config: config as AxiosResponse["config"],
    data,
    status,
    statusText: String(status),
    headers: {},
  }
}

/** A custom axios adapter has to reject non-2xx itself; axios only settles for its own. */
function fail(config: unknown, status: number, data: unknown): never {
  const res = response(config, status, data)
  throw new AxiosError(res.statusText, "ERR_BAD_REQUEST", res.config, null, res)
}

function memoryTokens(accessToken: string, refreshToken: string): TokenStore {
  const tokens: { accessToken: string | null; refreshToken: string | null } = {
    accessToken,
    refreshToken,
  }
  return {
    getAccessToken: () => tokens.accessToken,
    getRefreshToken: () => tokens.refreshToken,
    setTokens: (pair) => {
      tokens.accessToken = pair.accessToken
      tokens.refreshToken = pair.refreshToken
    },
    clear: () => {
      tokens.accessToken = null
      tokens.refreshToken = null
    },
  }
}

/**
 * `axios.create` binds `request` to the config object it was built with, and hey-api's
 * `setConfig` replaces `instance.defaults` with a copy — so the adapter has to be installed
 * on a fresh module instance, before `configureApiClient` runs.
 */
async function setup(adapter: AxiosAdapter, tokens: TokenStore): Promise<ApiModule> {
  const api = await import("@workspace/api-client")
  api.client.instance.defaults.adapter = adapter
  api.configureApiClient({ baseURL: "http://api.test", tokens })
  return api
}

beforeEach(() => {
  vi.resetModules()
})

describe("configureApiClient", () => {
  it("refreshes once for two parallel 401s and retries both", async () => {
    const tokens = memoryTokens("expired", "refresh-1")
    let refreshes = 0

    const api = await setup(async (config) => {
      if (String(config.url).includes("/auth/refresh")) {
        refreshes += 1
        return response(config, 200, { accessToken: "fresh", refreshToken: "refresh-2" })
      }
      if (config.headers.get("Authorization") === "Bearer fresh") {
        return response(config, 200, { items: [], nextCursor: null })
      }
      fail(config, 401, { code: "unauthorized", message: "Session expired" })
    }, tokens)

    const results = await Promise.all([api.listTodos(), api.listTodos()])

    expect(results.map((result) => result.data)).toEqual([
      { items: [], nextCursor: null },
      { items: [], nextCursor: null },
    ])
    expect(refreshes).toBe(1)
    expect(tokens.getAccessToken()).toBe("fresh")
    expect(tokens.getRefreshToken()).toBe("refresh-2")
  })

  it("clears the session when the refresh itself fails", async () => {
    const tokens = memoryTokens("expired", "refresh-1")

    const api = await setup(async (config) => {
      if (String(config.url).includes("/auth/refresh")) {
        fail(config, 401, { code: "invalid_token", message: "Token expired" })
      }
      fail(config, 401, { code: "unauthorized", message: "Session expired" })
    }, tokens)

    await expect(api.listTodos({ throwOnError: true })).rejects.toThrow()

    expect(tokens.getAccessToken()).toBeNull()
    expect(tokens.getRefreshToken()).toBeNull()
  })
})
