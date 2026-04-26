import { useState, useRef, useEffect, useMemo, useLayoutEffect } from "react"
import { createPortal } from "react-dom"
import { useModules, type ModuleInfo } from "../hooks/useModules"

interface ActionPickerProps {
    value: string
    onChange: (actionId: string) => void
}

interface PopoverPos {
    top: number
    left: number
    width: number
}

const POPOVER_HEIGHT = 320
const POPOVER_GAP = 4

export default function ActionPicker({ value, onChange }: ActionPickerProps) {
    const { modules, loading, error } = useModules()
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [pos, setPos] = useState<PopoverPos | null>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const popoverRef = useRef<HTMLDivElement>(null)
    const searchRef = useRef<HTMLInputElement>(null)

    // Compute popover position from the trigger's bounding rect
    const updatePosition = () => {
        const el = triggerRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const wantsAbove = rect.bottom + POPOVER_HEIGHT + POPOVER_GAP > window.innerHeight
        const top = wantsAbove
            ? rect.top - POPOVER_HEIGHT - POPOVER_GAP
            : rect.bottom + POPOVER_GAP
        setPos({
            top: Math.max(8, top),
            left: rect.left,
            width: rect.width,
        })
    }

    useLayoutEffect(() => {
        if (!open) return
        updatePosition()
        const handler = () => updatePosition()
        window.addEventListener("resize", handler)
        window.addEventListener("scroll", handler, true)
        return () => {
            window.removeEventListener("resize", handler)
            window.removeEventListener("scroll", handler, true)
        }
    }, [open])

    // Close on outside click — must check both trigger and portaled popover
    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            const target = e.target as Node
            if (
                triggerRef.current?.contains(target) ||
                popoverRef.current?.contains(target)
            ) return
            setOpen(false)
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [open])

    useEffect(() => {
        if (open) {
            setSearch("")
            setTimeout(() => searchRef.current?.focus(), 0)
        }
    }, [open])

    const selected = useMemo(() => {
        for (const mod of modules) {
            if (mod.actions.includes(value)) {
                const detail = mod.actionDetails?.[value]
                return { module: mod, actionId: value, description: detail?.description }
            }
        }
        return null
    }, [modules, value])

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        return modules
            .map(mod => {
                const matchedActions = mod.actions.filter(actionId => {
                    if (!q) return true
                    const detail = mod.actionDetails?.[actionId]
                    return (
                        actionId.toLowerCase().includes(q) ||
                        mod.name.toLowerCase().includes(q) ||
                        (detail?.description?.toLowerCase().includes(q) ?? false)
                    )
                })
                return { mod, matchedActions }
            })
            .filter(g => g.matchedActions.length > 0)
    }, [modules, search])

    const handlePick = (actionId: string) => {
        onChange(actionId)
        setOpen(false)
    }

    return (
        <div className="action-picker">
            <button
                ref={triggerRef}
                type="button"
                className="action-picker-trigger"
                onClick={() => setOpen(o => !o)}
            >
                {selected ? (
                    <>
                        <span className="action-picker-trigger-module">{selected.module.name}</span>
                        <span className="action-picker-trigger-sep">›</span>
                        <span className="action-picker-trigger-action">
                            {selected.description || selected.actionId}
                        </span>
                    </>
                ) : value ? (
                    <span className="action-picker-trigger-unknown">
                        {value} <em>(not loaded)</em>
                    </span>
                ) : (
                    <span className="action-picker-trigger-empty">Select an action…</span>
                )}
                <span className="action-picker-trigger-caret">▾</span>
            </button>

            {open && pos && createPortal(
                <div
                    ref={popoverRef}
                    className="action-picker-popover"
                    style={{
                        top: pos.top,
                        left: pos.left,
                        width: pos.width,
                    }}
                >
                    <input
                        ref={searchRef}
                        className="settings-input action-picker-search"
                        placeholder="Search actions…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Escape") setOpen(false)
                        }}
                    />
                    <div className="action-picker-list">
                        {loading && <p className="action-picker-empty">Loading…</p>}
                        {error && <p className="action-picker-empty error">{error}</p>}
                        {!loading && !error && filtered.length === 0 && (
                            <p className="action-picker-empty">No actions match "{search}"</p>
                        )}
                        {filtered.map(({ mod, matchedActions }) => (
                            <ModuleGroup
                                key={mod.name}
                                mod={mod}
                                actions={matchedActions}
                                selectedActionId={value}
                                onPick={handlePick}
                            />
                        ))}
                    </div>
                </div>,
                document.body,
            )}
        </div>
    )
}

function ModuleGroup({
    mod,
    actions,
    selectedActionId,
    onPick,
}: {
    mod: ModuleInfo
    actions: string[]
    selectedActionId: string
    onPick: (id: string) => void
}) {
    return (
        <div className="action-picker-group">
            <div className="action-picker-group-header">
                <span className="action-picker-group-name">{mod.name}</span>
                <span className="action-picker-group-version">v{mod.version}</span>
            </div>
            {actions.map(actionId => {
                const detail = mod.actionDetails?.[actionId]
                const isSelected = actionId === selectedActionId
                return (
                    <button
                        key={actionId}
                        type="button"
                        className={`action-picker-item ${isSelected ? "selected" : ""}`}
                        onClick={() => onPick(actionId)}
                    >
                        <div className="action-picker-item-title">
                            {detail?.description || actionId}
                        </div>
                        <div className="action-picker-item-id">{actionId}</div>
                    </button>
                )
            })}
        </div>
    )
}
