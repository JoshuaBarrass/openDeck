// App Launcher Module — launch executables directly by file path
const { exec } = require("child_process")
const path = require("path")

// Sanitize a string for safe embedding in a PowerShell -Command argument
function sanitize(str) {
    return str.replace(/["`$]/g, "")
}

// Validate that the path looks like a valid executable file path
function isValidExePath(filePath) {
    // Must be an absolute Windows path (e.g. C:\...) or a UNC path (e.g. \\server\...)
    const isAbsWin = /^[a-zA-Z]:\\/.test(filePath)
    const isUNC = /^\\\\/.test(filePath)
    return isAbsWin || isUNC
}

module.exports = {
    actions: {
        // Launch an executable by its file path
        // Payload: { path: "C:\\Program Files\\App\\app.exe" }
        //          { path: "C:\\tools\\run.exe", args: "--verbose", workingDir: "C:\\tools" }
        "app.launch": async (payload) => {
            const exePath = payload && payload.path
            if (!exePath || typeof exePath !== "string") {
                throw new Error("Payload must include 'path' (absolute path to the .exe)")
            }

            if (!isValidExePath(exePath)) {
                throw new Error(
                    "Invalid path — must be an absolute file path (e.g. C:\\\\Program Files\\\\App\\\\app.exe)"
                )
            }

            const safePath = sanitize(exePath)
            const args = payload.args && typeof payload.args === "string" ? sanitize(payload.args) : ""
            const workingDir =
                payload.workingDir && typeof payload.workingDir === "string"
                    ? sanitize(payload.workingDir)
                    : ""

            // Build PowerShell Start-Process command
            let ps = `Start-Process -FilePath '${safePath.replace(/'/g, "''")}'`

            if (args) {
                ps += ` -ArgumentList '${args.replace(/'/g, "''")}'`
            }

            if (workingDir) {
                ps += ` -WorkingDirectory '${workingDir.replace(/'/g, "''")}'`
            }

            exec(
                `powershell -NoProfile -Command "${ps}"`,
                { windowsHide: true },
                (err) => {
                    if (err) {
                        console.error(`[App Launcher] Failed to launch: ${exePath}`, err.message)
                    }
                }
            )

            console.log(`[App Launcher] Launched: ${exePath}${args ? " " + args : ""}`)
        },
    },
}
