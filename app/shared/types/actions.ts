export type IconType = "emoji" | "image"

export interface DeckButton {
    id: string
    label: string
    icon?: string
    iconType?: IconType
    fillImage?: boolean
    hideLabel?: boolean
    action: string
    payload?: Record<string, unknown>
}

export interface DeckVariable {
    key: string
    value: string
    description?: string
}

export interface DeckPage {
    name: string
    grid: DeckButton[]
}

export interface DeckConfig {
    pages: DeckPage[]
    variables: DeckVariable[]
    displayImage?: string
    columns?: number
    rows?: number
}
