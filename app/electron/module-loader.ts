import fs from "fs"
import path from "path"
import { OpenDeckModule, ModuleManifest } from "../shared/types"

export interface RegisteredModule {
    manifest: ModuleManifest
    actions: Record<string, (payload?: Record<string, unknown>) => Promise<void>>
}

class ModuleRegistry {
    private modules: Map<string, RegisteredModule> = new Map()

    register(module: OpenDeckModule) {
        this.modules.set(module.manifest.name, {
            manifest: module.manifest,
            actions: module.actions,
        })
        console.log(
            `Module loaded: ${module.manifest.name} (${module.manifest.actions.length} actions)`
        )
    }

    resolve(actionId: string): RegisteredModule | undefined {
        for (const mod of this.modules.values()) {
            if (actionId in mod.actions) {
                return mod
            }
        }
        return undefined
    }

    getAll(): RegisteredModule[] {
        return Array.from(this.modules.values())
    }

    getAllActions(): string[] {
        const actions: string[] = []
        for (const mod of this.modules.values()) {
            actions.push(...Object.keys(mod.actions))
        }
        return actions
    }
}

export const moduleRegistry = new ModuleRegistry()

export async function loadModules(): Promise<void> {
    const modulesDir = path.join(process.cwd(), "modules")

    if (!fs.existsSync(modulesDir)) {
        console.log("No modules directory found, skipping module loading")
        return
    }

    const entries = fs.readdirSync(modulesDir, { withFileTypes: true })

    for (const entry of entries) {
        if (!entry.isDirectory()) continue

        const modulePath = path.join(modulesDir, entry.name)
        const manifestPath = path.join(modulePath, "manifest.json")

        if (!fs.existsSync(manifestPath)) {
            console.warn(`Skipping ${entry.name}: no manifest.json found`)
            continue
        }

        try {
            const manifestRaw = fs.readFileSync(manifestPath, "utf-8")
            const manifest: ModuleManifest = JSON.parse(manifestRaw)

            const indexPath = path.join(modulePath, "index.js")
            if (!fs.existsSync(indexPath)) {
                console.warn(`Skipping ${entry.name}: no index.js found`)
                continue
            }

            const mod = require(indexPath)
            const moduleExport = mod.default || mod

            moduleRegistry.register({
                manifest,
                actions: moduleExport.actions || {},
            })
        } catch (err) {
            console.error(`Failed to load module ${entry.name}:`, err)
        }
    }

    console.log(
        `Loaded ${moduleRegistry.getAll().length} module(s), ${moduleRegistry.getAllActions().length} action(s) available`
    )
}
