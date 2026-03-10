import React, { useState, useRef, useEffect } from "react"
import { useDeckConfig } from "../hooks/useDeckConfig"
import ButtonEditor from "../components/ButtonEditor"

interface ActionDetail {
    description: string
    params?: Record<string, string>
}

interface ModuleInfo {
    name: string
    version: string
    description?: string
    actions: string[]
    actionDetails: Record<string, ActionDetail>
}

type SettingsTab = "config" | "actions"

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

    const [activeTab, setActiveTab] = useState<SettingsTab>("config")
    const [modules, setModules] = useState<ModuleInfo[]>([])
    const [modulesLoading, setModulesLoading] = useState(false)
    const [newPageName, setNewPageName] = useState("")
    const [editingButton, setEditingButton] = useState<number | null>(null)
    const [renamingPage, setRenamingPage] = useState<number | null>(null)
    const [renameValue, setRenameValue] = useState("")
    const [newVarKey, setNewVarKey] = useState("")
    const [newVarValue, setNewVarValue] = useState("")
    const [newVarDesc, setNewVarDesc] = useState("")

    const currentPage = pages[currentPageIndex]

    useEffect(() => {
        if (activeTab === "actions" && modules.length === 0 && !modulesLoading) {
            setModulesLoading(true)
            const port = 4020
            fetch(`http://${window.location.hostname}:${port}/api/modules`)
                .then(res => res.json())
                .then((data: ModuleInfo[]) => setModules(data))
                .catch(err => console.error("Failed to load modules:", err))
                .finally(() => setModulesLoading(false))
        }
    }, [activeTab])

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

    return (
        <div className="settings-page">
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
                    <p className="settings-hint">All actions registered by loaded modules. Use the Action ID in your button config.</p>
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
                                    const detail = mod.actionDetails[actionId]
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
                                                    {Object.entries(detail.params).map(([param, desc]) => (
                                                        <div key={param} className="actions-param-row">
                                                            <code className="actions-param-name">{param}</code>
                                                            <span className="actions-param-desc">{desc}</span>
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
                    {/* Page Management */}
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
                                                onClick={() => setCurrentPageIndex(index)}
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

                    {/* Button Management */}
                    <section className="settings-section">
                        <h2>Buttons — {currentPage.name}</h2>
                        <div className="settings-button-grid">
                            {currentPage.grid.map((button, index) => (
                                <div
                                    key={button.id}
                                    className={`settings-button-card ${!(button as any).disabled ? "" : "disabled"} ${editingButton === index ? "editing" : ""}`}
                                >
                                    <div className="settings-button-preview" onClick={() => setEditingButton(editingButton === index ? null : index)}>
                                        {button.icon && (button.iconType === "image" || button.icon.startsWith("data:image/") || button.icon.startsWith("http")) ? (
                                            <img className="settings-button-img" src={button.icon} alt={button.label} />
                                        ) : (
                                            <span className="settings-button-icon">{button.icon || "—"}</span>
                                        )}
                                        <span className="settings-button-name">{button.label || `Slot ${index + 1}`}</span>
                                    </div>
                                    <div className="settings-button-toolbar">
                                        <button
                                            className="settings-btn icon small"
                                            onClick={() => moveButton(currentPageIndex, index, Math.max(0, index - 1))}
                                            disabled={index === 0}
                                            title="Move left"
                                        >◀</button>
                                        <button
                                            className="settings-btn icon small"
                                            onClick={() => moveButton(currentPageIndex, index, Math.min(currentPage.grid.length - 1, index + 1))}
                                            disabled={index === currentPage.grid.length - 1}
                                            title="Move right"
                                        >▶</button>
                                        <button
                                            className={`settings-btn icon small ${!(button as any).disabled ? "active" : ""}`}
                                            onClick={() => toggleButton(currentPageIndex, index)}
                                            title={!(button as any).disabled ? "Disable" : "Enable"}
                                        >{!(button as any).disabled ? "👁️" : "🚫"}</button>
                                        <button
                                            className="settings-btn icon small danger"
                                            onClick={() => {
                                                if (editingButton === index) setEditingButton(null)
                                                removeButton(currentPageIndex, index)
                                            }}
                                            title="Remove"
                                        >✕</button>
                                    </div>
                                    {editingButton === index && (
                                        <ButtonEditor
                                            button={button}
                                            onChange={(updates) => updateButton(currentPageIndex, index, updates)}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        <button className="settings-btn" onClick={() => addButton(currentPageIndex)}>
                            + Add Button
                        </button>
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
