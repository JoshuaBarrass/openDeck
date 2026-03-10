import React, { useState, useEffect, useRef } from "react"
import { useSocket } from "../hooks/useSocket"
import type { DeckButton as DeckButtonType } from "../../shared/types"

function isImageIcon(icon?: string, iconType?: string): boolean {
    if (iconType === "image") return true
    if (!icon) return false
    return icon.startsWith("data:image/") || icon.startsWith("http://") || icon.startsWith("https://")
}

export default function DeckButton({ id, action, label, icon, iconType, fillImage, hideLabel, payload }: DeckButtonType) {
    const { send, lastMessage } = useSocket()
    const [feedback, setFeedback] = useState<"idle" | "success" | "error">("idle")
    const [pressed, setPressed] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout>>()

    const handleDown = () => {
        setPressed(true)
        setFeedback("idle")
        send("button.press", action, { buttonId: id, ...payload })
    }

    const handleUp = () => {
        setPressed(false)
    }

    useEffect(() => {
        if (
            lastMessage?.type === "button.feedback" &&
            lastMessage.payload?.action === action
        ) {
            const status = lastMessage.payload.status as string
            if (status === "success" || status === "error") {
                setFeedback(status)
                clearTimeout(timerRef.current)
                timerRef.current = setTimeout(() => setFeedback("idle"), 1200)
            }
        }
    }, [lastMessage, action])

    useEffect(() => () => clearTimeout(timerRef.current), [])

    const showImage = isImageIcon(icon, iconType)

    const fill = showImage && fillImage
    const showLabel = !hideLabel && label

    return (
        <button
            className={`sd-button ${feedback} ${pressed ? "pressed" : ""}${fill ? " fill" : ""}`}
            onPointerDown={handleDown}
            onPointerUp={handleUp}
            onPointerLeave={handleUp}
        >
            <div className="sd-button-face">
                {icon && showImage ? (
                    <img className="sd-button-img" src={icon} alt={label} draggable={false} />
                ) : icon ? (
                    <span className="sd-button-icon">{icon}</span>
                ) : null}
                {showLabel && <span className="sd-button-label">{label}</span>}
            </div>
        </button>
    )
}
