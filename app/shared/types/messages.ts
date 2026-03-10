// Client → Server message types
export type ClientMessageType =
    | "button.press"
    | "page.change"
    | "device.connect"
    | "config.update"

// Server → Client message types
export type ServerMessageType =
    | "state.update"
    | "button.feedback"
    | "page.update"
    | "config.sync"

export interface ClientMessage {
    type: ClientMessageType
    action?: string
    payload?: Record<string, unknown>
}

export interface ServerMessage {
    type: ServerMessageType
    payload?: Record<string, unknown>
}

export interface ButtonFeedbackPayload {
    buttonId: string
    status: "success" | "error" | "running"
    message?: string
}
