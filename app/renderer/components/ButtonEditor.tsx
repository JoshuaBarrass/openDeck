import React, { useRef, useState } from "react"
import type { DeckButton, IconType } from "../../shared/types"
import { useActionLookup } from "../hooks/useModules"
import ActionPicker from "./ActionPicker"
import PayloadForm from "./PayloadForm"

declare global {
    interface Window {
        electronAPI?: {
            pickFile: (options?: {
                title?: string
                filters?: { name: string; extensions: string[] }[]
                defaultPath?: string
            }) => Promise<string | null>
        }
    }
}

interface ButtonEditorProps {
    button: DeckButton
    onChange: (updates: Partial<DeckButton>) => void
}

const MAX_IMAGE_SIZE = 50 * 1024 * 1024 // 50MB after base64

export default function ButtonEditor({ button, onChange }: ButtonEditorProps) {
    const fileRef = useRef<HTMLInputElement>(null)
    const iconType: IconType = button.iconType || "emoji"
    const [advanced, setAdvanced] = useState(false)
    const [payloadError, setPayloadError] = useState("")

    const lookup = useActionLookup(button.action)

    const handleActionChange = (actionId: string) => {
        // Auto-fill label with action description if blank
        const detail = lookup?.detail
        if (!button.label && detail?.description) {
            onChange({ action: actionId, label: detail.description })
        } else {
            onChange({ action: actionId })
        }
    }

    const payloadStr = button.payload ? JSON.stringify(button.payload, null, 2) : ""

    const handlePayloadJsonChange = (raw: string) => {
        if (!raw.trim()) {
            setPayloadError("")
            onChange({ payload: undefined })
            return
        }
        try {
            const parsed = JSON.parse(raw)
            if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
                setPayloadError("")
                onChange({ payload: parsed })
            } else {
                setPayloadError("Must be a JSON object {}")
            }
        } catch {
            setPayloadError("Invalid JSON")
        }
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith("image/")) return

        const reader = new FileReader()
        reader.onload = () => {
            const result = reader.result as string
            if (result.length > MAX_IMAGE_SIZE) {
                alert("Image too large. Please use an image under 50MB.")
                return
            }
            onChange({ icon: result, iconType: "image" })
        }
        reader.readAsDataURL(file)
        e.target.value = ""
    }

    const handleIconTypeChange = (type: IconType) => {
        if (type === "emoji" && iconType === "image") {
            onChange({ iconType: "emoji", icon: "" })
        } else {
            onChange({ iconType: type })
        }
    }

    return (
        <div className="button-editor">
            {/* Label */}
            <label className="button-editor-field">
                <span>Label</span>
                <input
                    className="settings-input"
                    value={button.label}
                    onChange={e => onChange({ label: e.target.value })}
                    placeholder="Button label"
                />
            </label>

            {/* Icon Type */}
            <div className="button-editor-field">
                <span>Icon Type</span>
                <div className="button-editor-toggle">
                    <button
                        className={`toggle-btn ${iconType === "emoji" ? "active" : ""}`}
                        onClick={() => handleIconTypeChange("emoji")}
                    >Emoji</button>
                    <button
                        className={`toggle-btn ${iconType === "image" ? "active" : ""}`}
                        onClick={() => handleIconTypeChange("image")}
                    >Image</button>
                </div>
            </div>

            {iconType === "emoji" ? (
                <label className="button-editor-field">
                    <span>Emoji</span>
                    <input
                        className="settings-input"
                        value={button.icon || ""}
                        onChange={e => onChange({ icon: e.target.value })}
                        placeholder="e.g. 🎬"
                    />
                </label>
            ) : (
                <div className="button-editor-field">
                    <span>Image</span>
                    <div className="button-editor-image-row">
                        {button.icon && button.iconType === "image" && (
                            <img className="button-editor-preview" src={button.icon} alt="icon" />
                        )}
                        <button className="settings-btn" onClick={() => fileRef.current?.click()}>
                            {button.icon && button.iconType === "image" ? "Change Image" : "Upload Image"}
                        </button>
                        {button.icon && button.iconType === "image" && (
                            <button className="settings-btn icon danger" onClick={() => onChange({ icon: "" })} title="Remove image">
                                ✕
                            </button>
                        )}
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleImageUpload}
                        />
                    </div>
                    <label className="button-editor-field" style={{ marginTop: 4 }}>
                        <span>Or paste URL</span>
                        <input
                            className="settings-input"
                            value={button.iconType === "image" ? (button.icon?.startsWith("data:") ? "" : button.icon || "") : ""}
                            onChange={e => onChange({ icon: e.target.value, iconType: "image" })}
                            placeholder="https://example.com/icon.png"
                        />
                    </label>
                </div>
            )}

            {iconType === "image" && button.icon && (
                <>
                    <div className="button-editor-field">
                        <span>Fill Button</span>
                        <div className="button-editor-toggle">
                            <button
                                className={`toggle-btn ${button.fillImage ? "active" : ""}`}
                                onClick={() => onChange({ fillImage: !button.fillImage })}
                            >{button.fillImage ? "On" : "Off"}</button>
                        </div>
                    </div>
                    <div className="button-editor-field">
                        <span>Hide Label</span>
                        <div className="button-editor-toggle">
                            <button
                                className={`toggle-btn ${button.hideLabel ? "active" : ""}`}
                                onClick={() => onChange({ hideLabel: !button.hideLabel })}
                            >{button.hideLabel ? "On" : "Off"}</button>
                        </div>
                    </div>
                </>
            )}

            {/* Action picker */}
            <div className="button-editor-field">
                <span>Action</span>
                <ActionPicker value={button.action} onChange={handleActionChange} />
            </div>

            {/* Auto-generated payload form */}
            {button.action && (
                <div className="button-editor-field">
                    <div className="button-editor-payload-header">
                        <span>Parameters</span>
                        <button
                            type="button"
                            className="button-editor-advanced-toggle"
                            onClick={() => setAdvanced(a => !a)}
                            title="Toggle raw JSON editor"
                        >
                            {advanced ? "← Form view" : "Edit JSON"}
                        </button>
                    </div>
                    {advanced ? (
                        <>
                            <textarea
                                className="settings-input payload-input"
                                defaultValue={payloadStr}
                                onBlur={e => handlePayloadJsonChange(e.target.value)}
                                placeholder={'{ "key": "value" }'}
                                rows={4}
                                spellCheck={false}
                            />
                            {payloadError && <span className="payload-error">{payloadError}</span>}
                        </>
                    ) : (
                        <PayloadForm
                            detail={lookup?.detail}
                            payload={button.payload}
                            onChange={p => onChange({ payload: p })}
                        />
                    )}
                </div>
            )}
        </div>
    )
}
