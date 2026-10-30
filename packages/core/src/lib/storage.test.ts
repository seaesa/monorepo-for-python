import { describe, expect, it } from "vitest"
import type { StateStorage } from "zustand/middleware"

import { persistStorage as maybePersistStorage, setPlatformStorage } from "./storage"

// `createJSONStorage` is typed as possibly undefined; it is not, because the delegate is a
// function that always returns an object.
const persistStorage = maybePersistStorage
if (!persistStorage) throw new Error("persistStorage is undefined")

function memoryStorage() {
  const data = new Map<string, string>()
  const storage: StateStorage = {
    getItem: (name) => data.get(name) ?? null,
    setItem: (name, value) => {
      data.set(name, value)
    },
    removeItem: (name) => {
      data.delete(name)
    },
  }
  return { data, storage }
}

describe("persistStorage", () => {
  it("re-resolves the platform storage installed after the store was created", async () => {
    const first = memoryStorage()
    setPlatformStorage(first.storage)

    await persistStorage.setItem("auth", { state: { accessToken: "first" }, version: 0 })
    expect(first.data.get("auth")).toContain("first")

    const second = memoryStorage()
    setPlatformStorage(second.storage)

    // The delegate is looked up per call, so the new storage is empty and used from now on.
    expect(await persistStorage.getItem("auth")).toBeNull()

    await persistStorage.setItem("auth", { state: { accessToken: "second" }, version: 0 })
    expect(second.data.get("auth")).toContain("second")
    expect(first.data.get("auth")).not.toContain("second")
  })

  it("round-trips a value through JSON", async () => {
    const { storage } = memoryStorage()
    setPlatformStorage(storage)

    await persistStorage.setItem("preferences", { state: { locale: "vi" }, version: 1 })

    expect(await persistStorage.getItem("preferences")).toEqual({
      state: { locale: "vi" },
      version: 1,
    })
  })
})
