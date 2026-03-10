import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from "react"
import type { ClientMessage, ServerMessage } from "../../shared/types"

interface SocketContextValue {
  send: (type: ClientMessage["type"], action?: string, payload?: Record<string, unknown>) => void
  lastMessage: ServerMessage | null
  connected: boolean
}

const SocketContext = createContext<SocketContextValue>({
  send: () => { },
  lastMessage: null,
  connected: false,
})

export function SocketProvider({ children }: { children: ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<ServerMessage | null>(null)
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>()

  const connect = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const host = window.location.port === "5173"
      ? `${window.location.hostname}:4020`
      : window.location.host
    const wsUrl = `${protocol}//${host}`

    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      setConnected(true)
      ws.send(
        JSON.stringify({
          type: "device.connect",
          payload: { userAgent: navigator.userAgent },
        })
      )
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage
        setLastMessage(message)
      } catch {
        // ignore malformed messages
      }
    }

    ws.onclose = () => {
      setConnected(false)
      // Auto-reconnect after 2 seconds
      reconnectTimeout.current = setTimeout(connect, 2000)
    }

    ws.onerror = () => {
      ws.close()
    }

    wsRef.current = ws
  }, [])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimeout.current)
      wsRef.current?.close()
    }
  }, [connect])

  const send = useCallback(
    (
      type: ClientMessage["type"],
      action?: string,
      payload?: Record<string, unknown>
    ) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const message: ClientMessage = { type, action, payload }
        wsRef.current.send(JSON.stringify(message))
      }
    },
    []
  )

  return (
    <SocketContext.Provider value={{ send, lastMessage, connected }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
