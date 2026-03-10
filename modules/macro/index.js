// Macro Module — keyboard macros, hotkeys, text input, and app launching on Windows
const { execSync } = require("child_process")

// Common Windows Virtual Key codes
const VK = {
    BACKSPACE: 0x08, TAB: 0x09, ENTER: 0x0D, SHIFT: 0x10, CTRL: 0x11,
    ALT: 0x12, PAUSE: 0x13, CAPSLOCK: 0x14, ESCAPE: 0x1B, SPACE: 0x20,
    PAGEUP: 0x21, PAGEDOWN: 0x22, END: 0x23, HOME: 0x24,
    LEFT: 0x25, UP: 0x26, RIGHT: 0x27, DOWN: 0x28,
    PRINTSCREEN: 0x2C, INSERT: 0x2D, DELETE: 0x2E,
    LWIN: 0x5B, RWIN: 0x5C,
    F1: 0x70, F2: 0x71, F3: 0x72, F4: 0x73, F5: 0x74, F6: 0x75,
    F7: 0x76, F8: 0x77, F9: 0x78, F10: 0x79, F11: 0x7A, F12: 0x7B,
    NUMLOCK: 0x90, SCROLLLOCK: 0x91,
}

// Map friendly names to VK codes (case-insensitive lookup)
const KEY_NAMES = {}
for (const [name, code] of Object.entries(VK)) {
    KEY_NAMES[name.toLowerCase()] = code
}
// Aliases
KEY_NAMES["control"] = VK.CTRL
KEY_NAMES["return"] = VK.ENTER
KEY_NAMES["esc"] = VK.ESCAPE
KEY_NAMES["del"] = VK.DELETE
KEY_NAMES["ins"] = VK.INSERT
KEY_NAMES["win"] = VK.LWIN
KEY_NAMES["windows"] = VK.LWIN
KEY_NAMES["pgup"] = VK.PAGEUP
KEY_NAMES["pgdn"] = VK.PAGEDOWN
KEY_NAMES["prtsc"] = VK.PRINTSCREEN

function resolveVK(key) {
    const k = key.trim().toLowerCase()
    // Named key
    if (KEY_NAMES[k] !== undefined) return KEY_NAMES[k]
    // Single printable character — use its ASCII/VK code (A-Z, 0-9)
    if (k.length === 1) {
        const ch = k.toUpperCase().charCodeAt(0)
        if ((ch >= 0x30 && ch <= 0x39) || (ch >= 0x41 && ch <= 0x5A)) return ch
    }
    // Hex code like "0x41"
    if (k.startsWith("0x")) {
        const parsed = parseInt(k, 16)
        if (!isNaN(parsed)) return parsed
    }
    throw new Error(`Unknown key: "${key}"`)
}

const U32_SETUP = `Add-Type -MemberDefinition '[DllImport(\\"user32.dll\\")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);' -Name U32 -Namespace W;`

function pressKey(vk) {
    const ps = `${U32_SETUP}[W.U32]::keybd_event(${vk},0,0,[UIntPtr]::Zero);[W.U32]::keybd_event(${vk},0,2,[UIntPtr]::Zero)`
    execSync(`powershell -NoProfile -Command "${ps}"`, { windowsHide: true })
}

function pressCombo(vks) {
    const downs = vks.map(v => `[W.U32]::keybd_event(${v},0,0,[UIntPtr]::Zero);`).join("")
    const ups = vks.slice().reverse().map(v => `[W.U32]::keybd_event(${v},0,2,[UIntPtr]::Zero);`).join("")
    const ps = `${U32_SETUP}${downs}${ups}`
    execSync(`powershell -NoProfile -Command "${ps}"`, { windowsHide: true })
}

// Sanitize a string for safe embedding in a PowerShell -Command argument
function sanitize(str) {
    return str.replace(/["`$]/g, "")
}

module.exports = {
    actions: {
        // Press a key combination like "ctrl+shift+s" or "alt+tab"
        // Payload: { keys: "ctrl+c" }
        "macro.hotkey": async (payload) => {
            const raw = payload && payload.keys
            if (!raw || typeof raw !== "string") throw new Error("Payload must include 'keys' (e.g. \"ctrl+c\")")
            const parts = raw.split("+").map(k => k.trim())
            const vks = parts.map(resolveVK)
            pressCombo(vks)
            console.log(`[Macro] Hotkey: ${raw}`)
        },

        // Press a single key (by name or character)
        // Payload: { key: "enter" } or { key: "a" }
        "macro.keypress": async (payload) => {
            const raw = payload && payload.key
            if (!raw || typeof raw !== "string") throw new Error("Payload must include 'key' (e.g. \"enter\")")
            const vk = resolveVK(raw)
            pressKey(vk)
            console.log(`[Macro] Keypress: ${raw}`)
        },

        // Type a text string using PowerShell SendKeys
        // Payload: { text: "hello world" }
        "macro.type": async (payload) => {
            const text = payload && payload.text
            if (!text || typeof text !== "string") throw new Error("Payload must include 'text'")
            const safe = sanitize(text)
            const ps = `Add-Type -AssemblyName System.Windows.Forms;[System.Windows.Forms.SendKeys]::SendWait('${safe.replace(/'/g, "''")}')`
            execSync(`powershell -NoProfile -Command "${ps}"`, { windowsHide: true })
            console.log(`[Macro] Typed text (${text.length} chars)`)
        },

        // Launch an application or open a URL/file
        // Payload: { target: "notepad" } or { target: "https://github.com" } or { target: "C:\\file.txt" }
        "macro.launch": async (payload) => {
            const target = payload && payload.target
            if (!target || typeof target !== "string") throw new Error("Payload must include 'target'")
            // Validate target: only allow URLs with http/https, or local paths, or known program names
            const isUrl = /^https?:\/\//i.test(target)
            const isPath = /^[a-zA-Z]:\\/.test(target) || /^\.{0,2}\//.test(target)
            const isSimpleName = /^[a-zA-Z0-9_.\-]+$/.test(target)
            if (!isUrl && !isPath && !isSimpleName) {
                throw new Error("Invalid target — must be a URL (http/https), file path, or program name")
            }
            const safe = sanitize(target)
            execSync(`powershell -NoProfile -Command "Start-Process '${safe.replace(/'/g, "''")}'\"`, { windowsHide: true })
            console.log(`[Macro] Launched: ${target}`)
        },
    },
}
