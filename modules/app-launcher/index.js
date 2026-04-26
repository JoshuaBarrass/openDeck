const { execFile } = require("child_process")

module.exports = {
    actions: {
        // Open an application, file, or folder via Windows shell
        // Payload: { path: "C:\\Program Files\\...\\app.exe" }
        "launch.open": async (payload) => {
            const target = payload && payload.path
            if (!target || typeof target !== "string") {
                throw new Error("Payload must include 'path'")
            }

            // Only allow absolute Windows paths or UNC paths — block shell metacharacters
            const isAbsolutePath = /^[a-zA-Z]:\\/.test(target) || target.startsWith("\\\\")
            if (!isAbsolutePath) {
                throw new Error("Path must be an absolute Windows path (e.g. C:\\...)")
            }

            await new Promise((resolve, reject) => {
                // Use cmd /c start "" to open via shell associations (handles .exe, .lnk, folders, etc.)
                execFile("cmd.exe", ["/c", "start", "", target], { windowsHide: true }, (err) => {
                    if (err) reject(new Error(`Failed to launch: ${err.message}`))
                    else resolve(undefined)
                })
            })

            console.log(`[AppLauncher] Opened: ${target}`)
        },
    },
}
