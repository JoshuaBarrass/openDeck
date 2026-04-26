import React from "react"
import type { DeckButton as DeckButtonType } from "../../shared/types"

function isImageIcon(icon?: string, iconType?: string): boolean {
    if (iconType === "image") return true
    if (!icon) return false
    return icon.startsWith("data:image/") || icon.startsWith("http://") || icon.startsWith("https://")
}

interface PreviewGridProps {
    buttons: DeckButtonType[]
    columns?: number
    rows?: number
    selectedIndex: number | null
    onSelect: (index: number) => void
}

export default function PreviewGrid({
    buttons,
    columns = 5,
    rows = 3,
    selectedIndex,
    onSelect,
}: PreviewGridProps) {
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
            {slots.map((button, index) => {
                const isSelected = selectedIndex === index
                const disabled = (button as { disabled?: boolean } | null)?.disabled
                return (
                    <div key={button?.id || `empty-${index}`} className="sd-grid-slot">
                        {button ? (
                            <PreviewButton
                                button={button}
                                disabled={!!disabled}
                                selected={isSelected}
                                onClick={() => onSelect(index)}
                            />
                        ) : (
                            <button
                                type="button"
                                className={`sd-button-empty preview-empty ${isSelected ? "selected" : ""}`}
                                onClick={() => onSelect(index)}
                                aria-label={`Empty slot ${index + 1}`}
                            />
                        )}
                    </div>
                )
            })}
        </div>
    )
}

function PreviewButton({
    button,
    disabled,
    selected,
    onClick,
}: {
    button: DeckButtonType
    disabled: boolean
    selected: boolean
    onClick: () => void
}) {
    const { label, icon, iconType, fillImage, hideLabel } = button
    const showImage = isImageIcon(icon, iconType)
    const fill = showImage && fillImage
    const showLabel = !hideLabel && label

    return (
        <button
            type="button"
            className={`sd-button preview-button ${selected ? "selected" : ""} ${disabled ? "preview-disabled" : ""}${fill ? " fill" : ""}`}
            onClick={onClick}
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
