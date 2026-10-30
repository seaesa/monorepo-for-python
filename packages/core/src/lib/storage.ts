import { createJSONStorage, type StateStorage } from "zustand/middleware"

const memoryStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

let platformStorage: StateStorage = memoryStorage

/**
 * Persist storage for every core store. `createJSONStorage` resolves its storage once,
 * at store creation — before the app plugs in the platform storage — so delegate.
 */
export const persistStorage = createJSONStorage(() => ({
  getItem: (name) => platformStorage.getItem(name),
  setItem: (name, value) => platformStorage.setItem(name, value),
  removeItem: (name) => platformStorage.removeItem(name),
}))

export function setPlatformStorage(storage: StateStorage) {
  platformStorage = storage
}
