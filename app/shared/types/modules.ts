export interface ActionDetail {
    description: string
    params?: Record<string, string>
}

export interface ModuleManifest {
    name: string
    version: string
    description?: string
    actions: string[]
    actionDetails?: Record<string, ActionDetail>
}

export interface ModuleActionHandler {
    (payload?: Record<string, unknown>): Promise<void>
}

export interface OpenDeckModule {
    manifest: ModuleManifest
    actions: Record<string, ModuleActionHandler>
}
