import { DeckVariable } from "../shared/types"

class VariableStore {
    private variables: Map<string, DeckVariable> = new Map()

    setAll(vars: DeckVariable[]) {
        this.variables.clear()
        for (const v of vars) {
            this.variables.set(v.key, v)
        }
    }

    get(key: string): string | undefined {
        return this.variables.get(key)?.value
    }

    getAll(): DeckVariable[] {
        return Array.from(this.variables.values())
    }

    toRecord(): Record<string, string> {
        const record: Record<string, string> = {}
        for (const [key, v] of this.variables) {
            record[key] = v.value
        }
        return record
    }
}

export const variableStore = new VariableStore()
