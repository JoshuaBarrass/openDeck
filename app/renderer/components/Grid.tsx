import React from "react"
import DeckButton from "./DeckButton"
import type { DeckButton as DeckButtonType } from "../../shared/types"

interface GridProps {
    buttons: DeckButtonType[]
    columns?: number
    rows?: number
}

export default function Grid({ buttons, columns = 5, rows = 3 }: GridProps) {
    const totalSlots = columns * rows
    const slots = Array.from({ length: totalSlots }, (_, i) => buttons[i] || null)

    return (
        <div
            className="sd-grid"
            style={{
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
            }}
        >
            {slots.map((button, index) => (
                <div key={button?.id || `empty-${index}`} className="sd-grid-slot">
                    {button && button.action ? (
                        <DeckButton {...button} />
                    ) : (
                        <div className="sd-button-empty" />
                    )}
                </div>
            ))}
        </div>
    )
}
