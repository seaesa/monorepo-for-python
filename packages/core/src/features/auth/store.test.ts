import { beforeEach, describe, expect, it } from "vitest"

import { setPlatformStorage } from "../../lib/storage"
import { authTokenStore, useAuthStore } from "./store"

let data: Map<string, string>

beforeEach(() => {
  data = new Map()
  setPlatformStorage({
    getItem: (name) => data.get(name) ?? null,
    setItem: (name, value) => {
      data.set(name, value)
    },
    removeItem: (name) => {
      data.delete(name)
    },
  })
  useAuthStore.setState({ accessToken: null, refreshToken: null, hydrated: false })
})

function persisted() {
  const raw = data.get("auth")
  return raw ? JSON.parse(raw) : null
}

describe("useAuthStore", () => {
  it("persists the tokens and nothing else", () => {
    useAuthStore
      .getState()
      .setTokens({ accessToken: "access-1", refreshToken: "refresh-1", expiresIn: 900 })

    expect(persisted()).toEqual({
      state: { accessToken: "access-1", refreshToken: "refresh-1" },
      version: 0,
    })
  })

  it("restores the tokens and marks the store hydrated", async () => {
    useAuthStore
      .getState()
      .setTokens({ accessToken: "access-1", refreshToken: "refresh-1", expiresIn: 900 })
    // A later `set` would rewrite the persisted entry, so keep the stored payload aside.
    const stored = data.get("auth")
    useAuthStore.setState({ accessToken: null, refreshToken: null, hydrated: false })
    if (stored) data.set("auth", stored)

    await useAuthStore.persist.rehydrate()

    expect(useAuthStore.getState()).toMatchObject({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      hydrated: true,
    })
  })

  it("clears both tokens but stays hydrated", () => {
    useAuthStore.setState({ hydrated: true })
    useAuthStore
      .getState()
      .setTokens({ accessToken: "access-1", refreshToken: "refresh-1", expiresIn: 900 })

    authTokenStore.clear()

    expect(useAuthStore.getState()).toMatchObject({
      accessToken: null,
      refreshToken: null,
      hydrated: true,
    })
    expect(persisted()).toEqual({ state: { accessToken: null, refreshToken: null }, version: 0 })
  })
})

describe("authTokenStore", () => {
  it("exposes the store to the api client", () => {
    authTokenStore.setTokens({ accessToken: "access-1", refreshToken: "refresh-1", expiresIn: 900 })

    expect(authTokenStore.getAccessToken()).toBe("access-1")
    expect(authTokenStore.getRefreshToken()).toBe("refresh-1")
  })
})
