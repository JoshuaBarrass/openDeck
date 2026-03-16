// App Launcher Module — launch executables directly by file path
const { execSync } = require("child_process")

// Sanitize a string for safe embedding in a PowerShell single-quoted string.
// Removes characters dangerous in the outer double-quoted shell layer,
// and escapes single quotes for the inner PowerShell string layer.
function sanitize(str) {
    return str.replace(/["`$]/g, "").replace(/'/g, "''")
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
            let ps = `Start-Process -FilePath '${safePath}'`

            if (args) {
                ps += ` -ArgumentList '${args}'`
            }

            if (workingDir) {
                ps += ` -WorkingDirectory '${workingDir}'`
            }

            execSync(`powershell -NoProfile -Command "${ps}"`, { windowsHide: true })
            console.log(`[App Launcher] Launched: ${exePath}${args ? " " + args : ""}`)
        },
    },
}
