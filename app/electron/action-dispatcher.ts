import { moduleRegistry } from "./module-loader"
import { variableStore } from "./variable-store"

export async function dispatchAction(
    actionId: string,
    payload?: Record<string, unknown>
): Promise<void> {
    const trimmedId = actionId.trim()
    const module = moduleRegistry.resolve(trimmedId)

    if (!module) {
        throw new Error(`No module found for action: ${trimmedId}`)
    }

    const handler = module.actions[trimmedId]
    if (!handler) {
        throw new Error(`Action not found: ${trimmedId}`)
    }

    // Merge variables into payload so modules can access them
    const enrichedPayload = {
        ...payload,
        __variables: variableStore.toRecord(),
    }

    console.log(`Dispatching action: ${actionId}`)
    await handler(enrichedPayload)
}
