import { create } from "zustand"

interface PushDeviceState {
  /** Push token of this install once registered with the API; null on web or when denied. */
  token: string | null
  setToken: (token: string | null) => void
}

export const usePushDeviceStore = create<PushDeviceState>()((set) => ({
  token: null,
  setToken: (token) => set({ token }),
}))
