import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("electronAPI", {
    pickFile: (options?: {
        title?: string
        filters?: { name: string; extensions: string[] }[]
        defaultPath?: string
    }): Promise<string | null> =>
        ipcRenderer.invoke("dialog:pickFile", options),
})
