import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react"
import type { ModuleManifest } from "../../shared/types"

export interface ModuleInfo {
    name: string
    version: string
    description?: string
    actions: string[]
    actionDetails: ModuleManifest["actionDetails"]
}

interface ModulesContextValue {
    modules: ModuleInfo[]
    loading: boolean
    error: string | null
    refresh: () => void
}

const ModulesContext = createContext<ModulesContextValue | undefined>(undefined)

const API_PORT = 4020

export function ModulesProvider({ children }: { children: ReactNode }) {
    const [modules, setModules] = useState<ModuleInfo[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const refresh = useCallback(() => {
        setLoading(true)
        setError(null)
        fetch(`http://${window.location.hostname}:${API_PORT}/api/modules`)
            .then(res => res.json())
            .then((data: ModuleInfo[]) => setModules(data))
            .catch(err => setError(err instanceof Error ? err.message : "Failed to load modules"))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        refresh()
    }, [refresh])

    return (
        <ModulesContext.Provider value={{ modules, loading, error, refresh }}>
            {children}
        </ModulesContext.Provider>
    )
}

export function useModules(): ModulesContextValue {
    const ctx = useContext(ModulesContext)
    if (!ctx) throw new Error("useModules must be used within ModulesProvider")
    return ctx
}

/** Look up an action and its module by action ID */
export function useActionLookup(actionId: string | undefined) {
    const { modules } = useModules()
    if (!actionId) return null
    for (const mod of modules) {
        if (mod.actionDetails && actionId in mod.actionDetails) {
            return { module: mod, detail: mod.actionDetails[actionId] }
        }
        if (mod.actions.includes(actionId)) {
            return { module: mod, detail: { description: actionId } }
        }
    }
    return null
}
