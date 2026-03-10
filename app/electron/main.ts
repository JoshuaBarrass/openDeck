import { app, BrowserWindow } from "electron"
import path from "path"
import { startServer } from "./server"
import { loadModules } from "./module-loader"

let mainWindow: BrowserWindow | null = null

const PORT = 4020
const isDev = !app.isPackaged

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        title: "OpenDeck",
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    })

    if (isDev) {
        mainWindow.loadURL("http://localhost:5173")
    } else {
        mainWindow.loadFile(path.join(__dirname, "../../renderer/index.html"))
    }

    mainWindow.on("closed", () => {
        mainWindow = null
    })
}

app.whenReady().then(async () => {
    // Load integration modules
    await loadModules()

    // Start HTTP + WebSocket server
    startServer(PORT)

    // Create Electron window
    await createWindow()

    console.log(`OpenDeck running — control surface at http://localhost:${PORT}`)
})

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit()
    }
})

app.on("activate", () => {
    if (mainWindow === null) {
        createWindow()
    }
})
