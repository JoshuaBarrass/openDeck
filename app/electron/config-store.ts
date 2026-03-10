import fs from "fs"
import path from "path"
import { app } from "electron"
import type { DeckPage, DeckVariable } from "../shared/types"

interface StoredConfig {
    pages: DeckPage[]
    variables: DeckVariable[]
    displayImage: string
}

const CONFIG_FILE = path.join(app.getPath("userData"), "opendeck-config.json")

class ConfigStore {
    private config: StoredConfig = {
        pages: [],
        variables: [],
        displayImage: "",
    }
    private loaded = false

    load(): StoredConfig {
        if (this.loaded) return this.config
        try {
            if (fs.existsSync(CONFIG_FILE)) {
                const raw = fs.readFileSync(CONFIG_FILE, "utf-8")
                const parsed = JSON.parse(raw)
                if (parsed && typeof parsed === "object") {
                    this.config = {
                        pages: Array.isArray(parsed.pages) ? parsed.pages : [],
                        variables: Array.isArray(parsed.variables) ? parsed.variables : [],
                        displayImage: typeof parsed.displayImage === "string" ? parsed.displayImage : "",
                    }
                }
            }
        } catch {
            // use defaults
        }
        this.loaded = true
        return this.config
    }

    save(config: Partial<StoredConfig>) {
        if (config.pages !== undefined) this.config.pages = config.pages
        if (config.variables !== undefined) this.config.variables = config.variables
        if (config.displayImage !== undefined) this.config.displayImage = config.displayImage
        try {
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config), "utf-8")
        } catch (err) {
            console.error("Failed to save config:", err)
        }
    }

    get(): StoredConfig {
        return this.config
    }
}

export const configStore = new ConfigStore()
