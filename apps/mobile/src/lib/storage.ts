import * as SecureStore from "expo-secure-store"
import { Platform } from "react-native"
import type { StateStorage } from "zustand/middleware"

/** Keychain/Keystore on native, localStorage on web. Used for auth tokens. */
export const secureStorage: StateStorage =
  Platform.OS === "web"
    ? {
        getItem: (key) => globalThis.localStorage?.getItem(key) ?? null,
        setItem: (key, value) => globalThis.localStorage?.setItem(key, value),
        removeItem: (key) => globalThis.localStorage?.removeItem(key),
      }
    : {
        getItem: (key) => SecureStore.getItemAsync(key),
        setItem: (key, value) => SecureStore.setItemAsync(key, value),
        removeItem: (key) => SecureStore.deleteItemAsync(key),
      }
