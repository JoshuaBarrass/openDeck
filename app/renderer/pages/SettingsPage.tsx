import React, { useState, useRef } from "react"
import { useDeckConfig } from "../hooks/useDeckConfig"
import { useModules } from "../hooks/useModules"
import ButtonEditor from "../components/ButtonEditor"
import PreviewGrid from "../components/PreviewGrid"
import type { ParamDefinition } from "../../shared/types"

type SettingsTab = "config" | "actions"

function paramDescription(def: ParamDefinition): string {
    if (typeof def === "string") return def
    return def.description || ""
}

function paramTypeLabel(def: ParamDefinition): string {
    if (typeof def === "string") return "string"
    return def.type
}

export default function SettingsPage() {
    const {
        pages,
        currentPageIndex,
        setCurrentPageIndex,
        updateButton,
        addButton,
        removeButton,
        moveButton,
        toggleButton,
        addPage,
        removePage,
        renamePage,
        variables,
        addVariable,
        updateVariable,
        removeVariable,
        displayImage,
        setDisplayImage,
    } = useDeckConfig()

    const displayImageRef = useRef<HTMLInputElement>(null)
    const { modules, loading: modulesLoading } = useModules()

    const [activeTab, setActiveTab] = useState<SettingsTab>("config")
    const [newPageName, setNewPageName] = useState("")
    const [selectedButton, setSelectedButton] = useState<number | null>(null)
    const [renamingPage, setRenamingPage] = useState<number | null>(null)
    const [renameValue, setRenameValue] = useState("")
    const [newVarKey, setNewVarKey] = useState("")
    const [newVarValue, setNewVarValue] = useState("")
    const [newVarDesc, setNewVarDesc] = useState("")

    const currentPage = pages[currentPageIndex]
    const selectedSlot =
        selectedButton !== null ? currentPage.grid[selectedButton] : undefined

    const handleAddPage = () => {
        const name = newPageName.trim()
        if (!name) return
        addPage(name)
        setNewPageName("")
    }

    const startRenamePage = (index: number) => {
        setRenamingPage(index)
        setRenameValue(pages[index].name)
    }

    const confirmRenamePage = () => {
        if (renamingPage !== null && renameValue.trim()) {
            renamePage(renamingPage, renameValue.trim())
        }
        setRenamingPage(null)
    }

    const handleSelectButton = (index: number) => {
        setSelectedButton(index)
        // If the slot is empty, create a new button there
        if (!currentPage.grid[index]) {
            addButton(currentPageIndex)
        }
    }

    const handlePageSelect = (index: number) => {
        setCurrentPageIndex(index)
        setSelectedButton(null)
    }

    return (
        <div className={`settings-page ${activeTab === "config" ? "with-inspector" : ""}`}>
            {/* Tab Bar */}
            <div className="settings-tabs">
                <button
                    className={`settings-tab ${activeTab === "config" ? "active" : ""}`}
                    onClick={() => setActiveTab("config")}
                >Configuration</button>
                <button
                    className={`settings-tab ${activeTab === "actions" ? "active" : ""}`}
                    onClick={() => setActiveTab("actions")}
                >Actions</button>
            </div>

            {activeTab === "actions" && (
                <section className="settings-section">
                    <h2>Available Actions</h2>
                    <p className="settings-hint">All actions registered by loaded modules.</p>
                    {modulesLoading && <p className="settings-hint">Loading…</p>}
                    {modules.map(mod => (
                        <div key={mod.name} className="actions-module">
                            <div className="actions-module-header">
                                <span className="actions-module-name">{mod.name}</span>
                                <span className="actions-module-version">v{mod.version}</span>
                            </div>
                            {mod.description && <p className="actions-module-desc">{mod.description}</p>}
                            <div className="actions-list">
                                {mod.actions.map(actionId => {
                                    const detail = mod.actionDetails?.[actionId]
                                    return (
                                        <div key={actionId} className="actions-item">
                                            <div className="actions-item-header">
                                                <code className="actions-item-id">{actionId}</code>
                                                {detail?.description && (
                                                    <span className="actions-item-desc">{detail.description}</span>
                                                )}
                                            </div>
                                            {detail?.params && Object.keys(detail.params).length > 0 && (
                                                <div className="actions-params">
                                                    {Object.entries(detail.params).map(([param, def]) => (
                                                        <div key={param} className="actions-param-row">
                                                            <code className="actions-param-name">{param}</code>
                                                            <span className="actions-param-type">{paramTypeLabel(def)}</span>
                                                            <span className="actions-param-desc">{paramDescription(def)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </section>
            )}

            {activeTab === "config" && (
                <>
                    {/* Two-column workspace: deck preview (left) + inspector (right) */}
                    <div className="settings-workspace">
                        {/* Left: Deck preview */}
                        <div className="settings-canvas">
                            <div className="settings-canvas-header">
                                <h2>{currentPage.name}</h2>
                                <span className="settings-canvas-hint">
                                    Click a button to edit
                                </span>
                            </div>
                            <div className="sd-device settings-canvas-device">
                                <div className="sd-device-frame">
                                    {displayImage && (
                                        <img className="sd-display-image" src={displayImage} alt="" draggable={false} />
                                    )}
                                    <PreviewGrid
                                        buttons={currentPage.grid}
                                        columns={5}
                                        rows={3}
                                        selectedIndex={selectedButton}
                                        onSelect={handleSelectButton}
                                    />
                                </div>
                            </div>
                            <nav className="sd-page-bar settings-canvas-pagebar">
                                {pages.map((page, index) => (
                                    <button
                                        key={page.name + index}
                                        className={`sd-page-tab ${index === currentPageIndex ? "active" : ""}`}
                                        onClick={() => handlePageSelect(index)}
                                    >
                                        {page.name}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Right: Inspector */}
                        <aside className="settings-inspector">
                            {selectedButton === null || !selectedSlot ? (
                                <div className="settings-inspector-empty">
                                    <div className="settings-inspector-empty-icon">⊕</div>
                                    <p>Select a button to edit its action and appearance.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="settings-inspector-header">
                                        <div className="settings-inspector-title">
                                            <span className="settings-inspector-eyebrow">
                                                Slot {selectedButton + 1}
                                            </span>
                                            <h3>{selectedSlot.label || "Untitled button"}</h3>
                                        </div>
                                        <button
                                            className="settings-btn icon"
                                            onClick={() => setSelectedButton(null)}
                                            title="Close"
                                        >✕</button>
                                    </div>

                                    <div className="settings-inspector-toolbar">
                                        <button
                                            className="settings-btn icon small"
                                            onClick={() => {
                                                const newIndex = Math.max(0, selectedButton - 1)
                                                moveButton(currentPageIndex, selectedButton, newIndex)
                                                setSelectedButton(newIndex)
                                            }}
                                            disabled={selectedButton === 0}
                                            title="Move left"
                                        >◀</button>
                                        <button
                                            className="settings-btn icon small"
                                            onClick={() => {
                                                const newIndex = Math.min(currentPage.grid.length - 1, selectedButton + 1)
                                                moveButton(currentPageIndex, selectedButton, newIndex)
                                                setSelectedButton(newIndex)
                                            }}
                                            disabled={selectedButton === currentPage.grid.length - 1}
                                            title="Move right"
                                        >▶</button>
                                        <button
                                            className={`settings-btn icon small ${!(selectedSlot as any).disabled ? "active" : ""}`}
                                            onClick={() => toggleButton(currentPageIndex, selectedButton)}
                                            title={!(selectedSlot as any).disabled ? "Disable" : "Enable"}
                                        >{!(selectedSlot as any).disabled ? "👁️" : "🚫"}</button>
                                        <div className="settings-inspector-toolbar-spacer" />
                                        <button
                                            className="settings-btn icon small danger"
                                            onClick={() => {
                                                removeButton(currentPageIndex, selectedButton)
                                                setSelectedButton(null)
                                            }}
                                            title="Remove button"
                                        >🗑️</button>
                                    </div>

                                    <div className="settings-inspector-body">
                                        <ButtonEditor
                                            button={selectedSlot}
                                            onChange={updates => updateButton(currentPageIndex, selectedButton, updates)}
                                        />
                                    </div>
                                </>
                            )}
                        </aside>
                    </div>

                    {/* Pages */}
                    <section className="settings-section">
                        <h2>Pages</h2>
                        <div className="settings-page-list">
                            {pages.map((page, index) => (
                                <div
                                    key={index}
                                    className={`settings-page-item ${index === currentPageIndex ? "active" : ""}`}
                                >
                                    {renamingPage === index ? (
                                        <div className="settings-rename-row">
                                            <input
                                                className="settings-input"
                                                value={renameValue}
                                                onChange={e => setRenameValue(e.target.value)}
                                                onKeyDown={e => e.key === "Enter" && confirmRenamePage()}
                                                autoFocus
                                            />
                                            <button className="settings-btn small" onClick={confirmRenamePage}>Save</button>
                                        </div>
                                    ) : (
                                        <>
                                            <span
                                                className="settings-page-name"
                                                onClick={() => handlePageSelect(index)}
                                            >
                                                {page.name}
                                            </span>
                                            <div className="settings-page-actions">
                                                <button className="settings-btn icon" onClick={() => startRenamePage(index)} title="Rename">✏️</button>
                                                {pages.length > 1 && (
                                                    <button className="settings-btn icon danger" onClick={() => removePage(index)} title="Delete">🗑️</button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="settings-add-page">
                            <input
                                className="settings-input"
                                placeholder="New page name..."
                                value={newPageName}
                                onChange={e => setNewPageName(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleAddPage()}
                            />
                            <button className="settings-btn" onClick={handleAddPage}>Add Page</button>
                        </div>
                    </section>

                    {/* Variables */}
                    <section className="settings-section">
                        <h2>Variables</h2>
                        <p className="settings-hint">Variables are sent to the backend and available to all modules. Use them for API keys, URLs, or any shared config.</p>
                        <div className="settings-var-list">
                            {variables.map((v, index) => (
                                <div key={index} className="settings-var-row">
                                    <input
                                        className="settings-input var-key"
                                        value={v.key}
                                        onChange={e => updateVariable(index, { key: e.target.value })}
                                        placeholder="Key"
                                    />
                                    <input
                                        className="settings-input var-value"
                                        value={v.value}
                                        onChange={e => updateVariable(index, { value: e.target.value })}
                                        placeholder="Value"
                                    />
                                    <input
                                        className="settings-input var-desc"
                                        value={v.description || ""}
                                        onChange={e => updateVariable(index, { description: e.target.value })}
                                        placeholder="Description (optional)"
                                    />
                                    <button
                                        className="settings-btn icon danger"
                                        onClick={() => removeVariable(index)}
                                        title="Remove"
                                    >✕</button>
                                </div>
                            ))}
                        </div>
                        <div className="settings-var-add">
                            <input
                                className="settings-input var-key"
                                value={newVarKey}
                                onChange={e => setNewVarKey(e.target.value)}
                                placeholder="Key"
                                onKeyDown={e => {
                                    if (e.key === "Enter" && newVarKey.trim()) {
                                        addVariable(newVarKey.trim(), newVarValue, newVarDesc || undefined)
                                        setNewVarKey(""); setNewVarValue(""); setNewVarDesc("")
                                    }
                                }}
                            />
                            <input
                                className="settings-input var-value"
                                value={newVarValue}
                                onChange={e => setNewVarValue(e.target.value)}
                                placeholder="Value"
                            />
                            <input
                                className="settings-input var-desc"
                                value={newVarDesc}
                                onChange={e => setNewVarDesc(e.target.value)}
                                placeholder="Description"
                            />
                            <button
                                className="settings-btn"
                                onClick={() => {
                                    if (!newVarKey.trim()) return
                                    addVariable(newVarKey.trim(), newVarValue, newVarDesc || undefined)
                                    setNewVarKey(""); setNewVarValue(""); setNewVarDesc("")
                                }}
                            >+ Add</button>
                        </div>
                    </section>

                    {/* Display Image */}
                    <section className="settings-section">
                        <h2>Display Image</h2>
                        <p className="settings-hint">Set a background image for the device frame. The image will be overlayed behind the buttons.</p>
                        <div className="settings-display-image">
                            {displayImage && (
                                <div className="settings-display-preview-wrap">
                                    <img className="settings-display-preview" src={displayImage} alt="Display" />
                                </div>
                            )}
                            <div className="settings-display-actions">
                                <button className="settings-btn" onClick={() => displayImageRef.current?.click()}>
                                    {displayImage ? "Change Image" : "Upload Image"}
                                </button>
                                {displayImage && (
                                    <button className="settings-btn danger" onClick={() => setDisplayImage("")}>
                                        Remove
                                    </button>
                                )}
                                <input
                                    ref={displayImageRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    onChange={e => {
                                        const file = e.target.files?.[0]
                                        if (!file || !file.type.startsWith("image/")) return
                                        const reader = new FileReader()
                                        reader.onload = () => setDisplayImage(reader.result as string)
                                        reader.readAsDataURL(file)
                                        e.target.value = ""
                                    }}
                                />
                            </div>
                        </div>
                    </section>
                </>
            )}
        </div>
    )
}
