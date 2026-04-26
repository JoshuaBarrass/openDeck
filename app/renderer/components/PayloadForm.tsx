import React, { useState } from "react"
import type { ParamDefinition, ParamSchema, ActionDetail } from "../../shared/types"

interface PayloadFormProps {
    detail: ActionDetail | undefined
    payload: Record<string, unknown> | undefined
    onChange: (payload: Record<string, unknown> | undefined) => void
}

/** Coerce legacy `string` definitions into a normalized ParamSchema */
function normalize(def: ParamDefinition): ParamSchema {
    if (typeof def === "string") {
        return { type: "string", description: def }
    }
    return def
}

function setKey(
    payload: Record<string, unknown> | undefined,
    key: string,
    value: unknown,
): Record<string, unknown> | undefined {
    const next = { ...(payload || {}) }
    if (value === undefined || value === "" || value === null) {
        delete next[key]
    } else {
        next[key] = value
    }
    return Object.keys(next).length === 0 ? undefined : next
}

export default function PayloadForm({ detail, payload, onChange }: PayloadFormProps) {
    const params = detail?.params

    if (!params || Object.keys(params).length === 0) {
        return (
            <p className="payload-form-empty">
                This action has no parameters.
            </p>
        )
    }

    return (
        <div className="payload-form">
            {Object.entries(params).map(([key, rawDef]) => {
                const schema = normalize(rawDef)
                const currentValue = payload?.[key]
                return (
                    <ParamField
                        key={key}
                        name={key}
                        schema={schema}
                        value={currentValue}
                        onChange={v => onChange(setKey(payload, key, v))}
                    />
                )
            })}
        </div>
    )
}

interface FieldProps {
    name: string
    schema: ParamSchema
    value: unknown
    onChange: (value: unknown) => void
}

function ParamField({ name, schema, value, onChange }: FieldProps) {
    return (
        <div className="payload-form-field">
            <label className="payload-form-label">
                <span className="payload-form-name">
                    {name}
                    {schema.required && <span className="payload-form-required"> *</span>}
                </span>
                {schema.description && (
                    <span className="payload-form-desc">{schema.description}</span>
                )}
            </label>
            <FieldInput name={name} schema={schema} value={value} onChange={onChange} />
        </div>
    )
}

function FieldInput({ name: _name, schema, value, onChange }: FieldProps) {
    switch (schema.type) {
        case "string": {
            const v = (value as string) ?? schema.default ?? ""
            return (
                <input
                    className="settings-input"
                    type="text"
                    value={v}
                    placeholder={schema.placeholder}
                    onChange={e => onChange(e.target.value)}
                    spellCheck={false}
                />
            )
        }

        case "textarea": {
            const v = (value as string) ?? schema.default ?? ""
            return (
                <textarea
                    className="settings-input payload-input"
                    value={v}
                    placeholder={schema.placeholder}
                    rows={schema.rows ?? 3}
                    onChange={e => onChange(e.target.value)}
                    spellCheck={false}
                />
            )
        }

        case "number": {
            const v = value === undefined || value === null
                ? (schema.default ?? "")
                : (value as number)
            return (
                <input
                    className="settings-input"
                    type="number"
                    value={v as number | string}
                    placeholder={schema.placeholder}
                    min={schema.min}
                    max={schema.max}
                    step={schema.step ?? 1}
                    onChange={e => {
                        const raw = e.target.value
                        if (raw === "") onChange(undefined)
                        else {
                            const num = Number(raw)
                            if (!Number.isNaN(num)) onChange(num)
                        }
                    }}
                />
            )
        }

        case "boolean": {
            const v = (value as boolean | undefined) ?? schema.default ?? false
            return (
                <div className="button-editor-toggle">
                    <button
                        type="button"
                        className={`toggle-btn ${v ? "active" : ""}`}
                        onClick={() => onChange(true)}
                    >On</button>
                    <button
                        type="button"
                        className={`toggle-btn ${!v ? "active" : ""}`}
                        onClick={() => onChange(false)}
                    >Off</button>
                </div>
            )
        }

        case "select": {
            const v = (value as string) ?? schema.default ?? ""
            return (
                <select
                    className="settings-input"
                    value={v}
                    onChange={e => onChange(e.target.value)}
                >
                    <option value="" disabled>
                        Select…
                    </option>
                    {schema.options.map(opt => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label ?? opt.value}
                        </option>
                    ))}
                </select>
            )
        }

        case "file": {
            return <FilePicker schema={schema} value={value as string | undefined} onChange={onChange} />
        }
    }
}

function FilePicker({
    schema,
    value,
    onChange,
}: {
    schema: Extract<ParamSchema, { type: "file" }>
    value: string | undefined
    onChange: (v: unknown) => void
}) {
    const [picking, setPicking] = useState(false)
    const v = value ?? schema.default ?? ""
    const canPick = typeof window !== "undefined" && !!window.electronAPI?.pickFile

    const handlePick = async () => {
        if (!canPick) return
        setPicking(true)
        try {
            const picked = await window.electronAPI!.pickFile({
                title: "Select a file",
                defaultPath: v || undefined,
                filters: schema.filters,
            })
            if (picked) onChange(picked)
        } finally {
            setPicking(false)
        }
    }

    return (
        <div className="payload-form-file-row">
            <input
                className="settings-input"
                style={{ flex: 1 }}
                value={v}
                placeholder={schema.placeholder}
                onChange={e => onChange(e.target.value)}
                spellCheck={false}
            />
            {canPick && (
                <button
                    type="button"
                    className="settings-btn small"
                    onClick={handlePick}
                    disabled={picking}
                >
                    {picking ? "…" : "Browse"}
                </button>
            )}
        </div>
    )
}
