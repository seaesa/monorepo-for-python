import { create } from "zustand"

interface AppUpdateState {
  /** The API refused this build (`app_update_required`): only an install can fix it. */
  required: boolean
}

export const useAppUpdateStore = create<AppUpdateState>(() => ({ required: false }))

export function markAppUpdateRequired() {
  useAppUpdateStore.setState({ required: true })
}
