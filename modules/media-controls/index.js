// Media Controls Module — Windows media key simulation via keybd_event
const { execSync } = require("child_process")

// Windows Virtual Key codes for media keys
const VK = {
    MEDIA_PLAY_PAUSE: 0xB3,
    MEDIA_NEXT_TRACK: 0xB0,
    MEDIA_PREV_TRACK: 0xB1,
    VOLUME_UP: 0xAF,
    VOLUME_DOWN: 0xAE,
    VOLUME_MUTE: 0xAD,
}

function pressMediaKey(vk) {
    const ps = `Add-Type -MemberDefinition '[DllImport(\\"user32.dll\\")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);' -Name U32 -Namespace W;[W.U32]::keybd_event(${vk},0,0,[UIntPtr]::Zero);[W.U32]::keybd_event(${vk},0,2,[UIntPtr]::Zero)`
    execSync(`powershell -NoProfile -Command "${ps}"`, { windowsHide: true })
}

module.exports = {
    actions: {
        "media.playPause": async () => {
            pressMediaKey(VK.MEDIA_PLAY_PAUSE)
            console.log("[Media] Play/Pause toggled")
        },

        "media.next": async () => {
            pressMediaKey(VK.MEDIA_NEXT_TRACK)
            console.log("[Media] Next track")
        },

        "media.previous": async () => {
            pressMediaKey(VK.MEDIA_PREV_TRACK)
            console.log("[Media] Previous track")
        },

        "media.volumeUp": async () => {
            pressMediaKey(VK.VOLUME_UP)
            console.log("[Media] Volume up")
        },

        "media.volumeDown": async () => {
            pressMediaKey(VK.VOLUME_DOWN)
            console.log("[Media] Volume down")
        },

        "media.mute": async () => {
            pressMediaKey(VK.VOLUME_MUTE)
            console.log("[Media] Mute toggled")
        },
    },
}
