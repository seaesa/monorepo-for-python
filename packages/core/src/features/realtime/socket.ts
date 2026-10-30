import { io, type Socket } from "socket.io-client"

import { refreshSession, type RealtimeEvents } from "@workspace/api-client"

import { useAuthStore } from "../auth/store"

/** Server -> client events, typed from the backend contract (`RealtimeEvents` in OpenAPI). */
type ServerEvents = {
  [K in keyof RealtimeEvents]: (payload: RealtimeEvents[K]) => void
}

export type RealtimeSocket = Socket<ServerEvents>

/** Must match `SOCKETIO_PATH` in apps/api/src/app/core/realtime.py. */
const SOCKETIO_PATH = "/ws/socket.io"

let socket: RealtimeSocket | null = null

/** Create the (not yet connected) socket. Connection follows auth state, see `useRealtimeConnection`. */
export function initRealtime(apiUrl: string) {
  socket ??= io(apiUrl, {
    path: SOCKETIO_PATH,
    transports: ["websocket"], // no long-polling: works the same on web and React Native
    autoConnect: false,
    // Read on every (re)connect, so a refreshed token is always used.
    auth: (cb) => cb({ token: useAuthStore.getState().accessToken }),
  })

  socket.on("connect_error", async (error) => {
    // The server rejects expired tokens; Socket.IO does not retry rejected handshakes.
    if (error.message !== "unauthorized") return
    if (await refreshSession()) socket?.connect()
  })
}

export function getSocket(): RealtimeSocket | null {
  return socket
}
