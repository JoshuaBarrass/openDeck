import { ClientMessage, ServerMessage } from "../types"

export function createClientMessage(
    type: ClientMessage["type"],
    action?: string,
    payload?: Record<string, unknown>
): string {
    const message: ClientMessage = { type, action, payload }
    return JSON.stringify(message)
}

export function createServerMessage(
    type: ServerMessage["type"],
    payload?: Record<string, unknown>
): string {
    const message: ServerMessage = { type, payload }
    return JSON.stringify(message)
}

export function parseMessage<T extends ClientMessage | ServerMessage>(
    raw: string
): T | null {
    try {
        const parsed = JSON.parse(raw)
        if (typeof parsed === "object" && parsed !== null && typeof parsed.type === "string") {
            return parsed as T
        }
        return null
    } catch {
        return null
    }
}
