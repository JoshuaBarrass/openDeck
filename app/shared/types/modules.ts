/**
 * Param schema describes a single field in an action's payload form.
 *
 * Backward-compat: in older manifests, `params` was `Record<string, string>` where
 * the value was just a description. That format is still accepted — it gets coerced
 * to a `{ type: "string", description }` schema at runtime.
 */
export type ParamSchema =
    | StringParam
    | NumberParam
    | BooleanParam
    | SelectParam
    | FileParam
    | TextareaParam

interface ParamBase {
    description?: string
    placeholder?: string
    required?: boolean
}

export interface StringParam extends ParamBase {
    type: "string"
    default?: string
}

export interface TextareaParam extends ParamBase {
    type: "textarea"
    default?: string
    rows?: number
}

export interface NumberParam extends ParamBase {
    type: "number"
    default?: number
    min?: number
    max?: number
    step?: number
}

export interface BooleanParam extends ParamBase {
    type: "boolean"
    default?: boolean
}

export interface SelectParam extends ParamBase {
    type: "select"
    options: { value: string; label?: string }[]
    default?: string
}

export interface FileParam extends ParamBase {
    type: "file"
    default?: string
    /** File-extension filters used by the native picker */
    filters?: { name: string; extensions: string[] }[]
}

/** Either a rich schema or a legacy description string */
export type ParamDefinition = ParamSchema | string

export interface ActionDetail {
    description: string
    params?: Record<string, ParamDefinition>
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
