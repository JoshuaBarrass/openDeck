import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react"
import type { DeckPage, DeckButton, DeckVariable } from "../../shared/types"
import { useSocket } from "./useSocket"

const STORAGE_KEY = "opendeck-config"
const VARS_STORAGE_KEY = "opendeck-variables"
const DISPLAY_IMAGE_KEY = "opendeck-display-image"

const defaultPages: DeckPage[] = [
    {
        name: "Main",
        grid: [
            { id: "1", label: "Start Stream", icon: "🎬", action: "obs.startStreaming" },
            { id: "2", label: "Stop Stream", icon: "⏹️", action: "obs.stopStreaming" },
            { id: "3", label: "Mute Mic", icon: "🎙️", action: "obs.toggleMute" },
            { id: "4", label: "Scene 1", icon: "1️⃣", action: "obs.switchScene" },
            { id: "5", label: "Scene 2", icon: "2️⃣", action: "obs.switchScene" },
            { id: "6", label: "Webhook", icon: "🌐", action: "http.post" },
            { id: "7", label: "", icon: "", action: "" },
            { id: "8", label: "", icon: "", action: "" },
            { id: "9", label: "", icon: "", action: "" },
            { id: "10", label: "", icon: "", action: "" },
            { id: "11", label: "", icon: "", action: "" },
            { id: "12", label: "", icon: "", action: "" },
            { id: "13", label: "", icon: "", action: "" },
            { id: "14", label: "", icon: "", action: "" },
            { id: "15", label: "", icon: "", action: "" },
        ],
    },
    {
        name: "Media",
        grid: [
            { id: "16", label: "Play/Pause", icon: "⏯️", action: "media.playPause" },
            { id: "17", label: "Next", icon: "⏭️", action: "media.next" },
            { id: "18", label: "Previous", icon: "⏮️", action: "media.previous" },
            { id: "19", label: "Vol Up", icon: "🔊", action: "media.volumeUp" },
            { id: "20", label: "Vol Down", icon: "🔉", action: "media.volumeDown" },
            { id: "21", label: "Mute", icon: "🔇", action: "media.mute" },
            { id: "22", label: "", icon: "", action: "" },
            { id: "23", label: "", icon: "", action: "" },
            { id: "24", label: "", icon: "", action: "" },
            { id: "25", label: "", icon: "", action: "" },
            { id: "26", label: "", icon: "", action: "" },
            { id: "27", label: "", icon: "", action: "" },
            { id: "28", label: "", icon: "", action: "" },
            { id: "29", label: "", icon: "", action: "" },
            { id: "30", label: "", icon: "", action: "" },
        ],
    },
]

function loadConfig(): DeckPage[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed) && parsed.length > 0) return parsed
        }
    } catch { /* use defaults */ }
    return defaultPages
}

function saveConfig(pages: DeckPage[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pages))
}

function loadVariables(): DeckVariable[] {
    try {
        const raw = localStorage.getItem(VARS_STORAGE_KEY)
        if (raw) {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) return parsed
        }
    } catch { /* use defaults */ }
    return []
}

function saveVariables(vars: DeckVariable[]) {
    localStorage.setItem(VARS_STORAGE_KEY, JSON.stringify(vars))
}

let nextId = 100

function generateId(): string {
    return String(nextId++)
}

interface DeckConfigContextValue {
    pages: DeckPage[]
    currentPageIndex: number
    setCurrentPageIndex: (i: number) => void
    updateButton: (pageIndex: number, buttonIndex: number, updates: Partial<DeckButton>) => void
    addButton: (pageIndex: number) => void
    removeButton: (pageIndex: number, buttonIndex: number) => void
    moveButton: (pageIndex: number, fromIndex: number, toIndex: number) => void
    toggleButton: (pageIndex: number, buttonIndex: number) => void
    addPage: (name: string) => void
    removePage: (pageIndex: number) => void
    renamePage: (pageIndex: number, name: string) => void
    variables: DeckVariable[]
    addVariable: (key: string, value: string, description?: string) => void
    updateVariable: (index: number, updates: Partial<DeckVariable>) => void
    removeVariable: (index: number) => void
    displayImage: string
    setDisplayImage: (img: string) => void
}

const DeckConfigContext = createContext<DeckConfigContextValue>(null!)

const isElectron = navigator.userAgent.includes("Electron")

export function DeckConfigProvider({ children }: { children: ReactNode }) {
    const [pages, setPages] = useState<DeckPage[]>(loadConfig)
    const [currentPageIndex, setCurrentPageIndex] = useState(0)
    const [variables, setVariables] = useState<DeckVariable[]>(loadVariables)
    const [displayImage, setDisplayImageState] = useState<string>(() => {
        try { return localStorage.getItem(DISPLAY_IMAGE_KEY) || "" } catch { return "" }
    })
    const { send, lastMessage } = useSocket()
    const serverUpdateCount = useRef(0)
    const initialLoad = useRef(true)

    // Listen for config.sync from the server (sent on connect or from other clients)
    useEffect(() => {
        if (
            lastMessage?.type === "config.sync" &&
            lastMessage.payload
        ) {
            const p = lastMessage.payload as any
            let updates = 0
            if (Array.isArray(p.pages) && p.pages.length > 0) {
                setPages(p.pages)
                saveConfig(p.pages)
                updates++
            }
            if (Array.isArray(p.variables)) {
                setVariables(p.variables)
                saveVariables(p.variables)
                updates++
            }
            if (typeof p.displayImage === "string") {
                setDisplayImageState(p.displayImage)
                try { localStorage.setItem(DISPLAY_IMAGE_KEY, p.displayImage) } catch { /* ignore */ }
            }
            serverUpdateCount.current += updates
        }
    }, [lastMessage])

    // Push full config to server — only from Electron (PC) app, only on user-initiated changes
    const sendConfigToServer = useCallback((p: DeckPage[], v: DeckVariable[], img: string) => {
        if (!isElectron) return
        if (serverUpdateCount.current > 0) {
            serverUpdateCount.current--
            return
        }
        send("config.update", undefined, {
            pages: p as any,
            variables: v as any,
            displayImage: img,
        })
    }, [send])

    useEffect(() => {
        if (initialLoad.current) {
            initialLoad.current = false
            return
        }
        saveConfig(pages)
        sendConfigToServer(pages, variables, displayImage)
    }, [pages])

    useEffect(() => {
        saveVariables(variables)
        sendConfigToServer(pages, variables, displayImage)
    }, [variables])

    const updateButton = useCallback((pageIndex: number, buttonIndex: number, updates: Partial<DeckButton>) => {
        setPages(prev => {
            const next = prev.map((p, pi) => {
                if (pi !== pageIndex) return p
                return {
                    ...p,
                    grid: p.grid.map((b, bi) => bi === buttonIndex ? { ...b, ...updates } : b),
                }
            })
            return next
        })
    }, [])

    const addButton = useCallback((pageIndex: number) => {
        setPages(prev => prev.map((p, pi) => {
            if (pi !== pageIndex) return p
            return {
                ...p,
                grid: [...p.grid, { id: generateId(), label: "", icon: "", action: "" }],
            }
        }))
    }, [])

    const removeButton = useCallback((pageIndex: number, buttonIndex: number) => {
        setPages(prev => prev.map((p, pi) => {
            if (pi !== pageIndex) return p
            return { ...p, grid: p.grid.filter((_, bi) => bi !== buttonIndex) }
        }))
    }, [])

    const moveButton = useCallback((pageIndex: number, fromIndex: number, toIndex: number) => {
        setPages(prev => prev.map((p, pi) => {
            if (pi !== pageIndex) return p
            const grid = [...p.grid]
            const [moved] = grid.splice(fromIndex, 1)
            grid.splice(toIndex, 0, moved)
            return { ...p, grid }
        }))
    }, [])

    const toggleButton = useCallback((pageIndex: number, buttonIndex: number) => {
        setPages(prev => prev.map((p, pi) => {
            if (pi !== pageIndex) return p
            return {
                ...p,
                grid: p.grid.map((b, bi) => {
                    if (bi !== buttonIndex) return b
                    return { ...b, disabled: !((b as any).disabled) }
                }),
            }
        }))
    }, [])

    const addPage = useCallback((name: string) => {
        const grid: DeckButton[] = Array.from({ length: 15 }, (_, i) => ({
            id: generateId(),
            label: "",
            icon: "",
            action: "",
        }))
        setPages(prev => [...prev, { name, grid }])
    }, [])

    const removePage = useCallback((pageIndex: number) => {
        setPages(prev => {
            if (prev.length <= 1) return prev
            const next = prev.filter((_, i) => i !== pageIndex)
            return next
        })
        setCurrentPageIndex(prev => Math.min(prev, pages.length - 2))
    }, [pages.length])

    const renamePage = useCallback((pageIndex: number, name: string) => {
        setPages(prev => prev.map((p, i) => i === pageIndex ? { ...p, name } : p))
    }, [])

    const addVariable = useCallback((key: string, value: string, description?: string) => {
        setVariables(prev => [...prev, { key, value, description }])
    }, [])

    const updateVariable = useCallback((index: number, updates: Partial<DeckVariable>) => {
        setVariables(prev => prev.map((v, i) => i === index ? { ...v, ...updates } : v))
    }, [])

    const removeVariable = useCallback((index: number) => {
        setVariables(prev => prev.filter((_, i) => i !== index))
    }, [])

    const setDisplayImage = useCallback((img: string) => {
        setDisplayImageState(img)
        try { localStorage.setItem(DISPLAY_IMAGE_KEY, img) } catch { /* ignore */ }
        sendConfigToServer(pages, variables, img)
    }, [pages, variables, sendConfigToServer])

    return (
        <DeckConfigContext.Provider value={{
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
        }}>
            {children}
        </DeckConfigContext.Provider>
    )
}

export function useDeckConfig() {
    return useContext(DeckConfigContext)
}
