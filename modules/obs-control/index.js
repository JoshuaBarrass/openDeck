// OBS Control Module — connects to OBS via obs-websocket-js (v5)
// Requires OBS 28+ with WebSocket Server enabled (Tools → obs-websocket Settings)
// Connection uses __variables: obs_host (default ws://localhost:4455), obs_password

let OBSWebSocket = null
let obs = null
let connected = false
let connectPromise = null

async function getOBS(vars) {
    if (connected && obs) return obs

    // Avoid duplicate connection attempts
    if (connectPromise) return connectPromise

    connectPromise = (async () => {
        try {
            if (!OBSWebSocket) {
                const mod = await import("obs-websocket-js")
                OBSWebSocket = mod.default || mod.OBSWebSocket
            }

            obs = new OBSWebSocket()
            const host = (vars && vars.obs_host) || "ws://localhost:4455"
            const password = (vars && vars.obs_password) || undefined

            await obs.connect(host, password)
            connected = true
            console.log(`[OBS] Connected to ${host}`)

            obs.on("ConnectionClosed", () => {
                connected = false
                obs = null
                console.log("[OBS] Connection closed")
            })

            return obs
        } catch (err) {
            connected = false
            obs = null
            throw new Error(`Failed to connect to OBS: ${err.message}`)
        } finally {
            connectPromise = null
        }
    })()

    return connectPromise
}

module.exports = {
    actions: {
        "obs.startStreaming": async (payload) => {
            const o = await getOBS(payload && payload.__variables)
            await o.call("StartStream")
            console.log("[OBS] Streaming started")
        },

        "obs.stopStreaming": async (payload) => {
            const o = await getOBS(payload && payload.__variables)
            await o.call("StopStream")
            console.log("[OBS] Streaming stopped")
        },

        "obs.startRecording": async (payload) => {
            const o = await getOBS(payload && payload.__variables)
            await o.call("StartRecord")
            console.log("[OBS] Recording started")
        },

        "obs.stopRecording": async (payload) => {
            const o = await getOBS(payload && payload.__variables)
            await o.call("StopRecord")
            console.log("[OBS] Recording stopped")
        },

        "obs.toggleRecording": async (payload) => {
            const o = await getOBS(payload && payload.__variables)
            await o.call("ToggleRecord")
            console.log("[OBS] Recording toggled")
        },

        "obs.toggleMute": async (payload) => {
            const source = payload && payload.source
            if (!source) throw new Error("Payload must include 'source' (audio source name)")
            const o = await getOBS(payload.__variables)
            await o.call("ToggleInputMute", { inputName: source })
            console.log(`[OBS] Toggled mute: ${source}`)
        },

        "obs.setVolume": async (payload) => {
            const source = payload && payload.source
            if (!source) throw new Error("Payload must include 'source'")
            const volume = parseFloat(payload.volume)
            if (isNaN(volume)) throw new Error("Payload must include a numeric 'volume'")
            const o = await getOBS(payload.__variables)
            await o.call("SetInputVolume", {
                inputName: source,
                inputVolumeDb: volume,
            })
            console.log(`[OBS] Set volume: ${source} → ${volume} dB`)
        },

        "obs.switchScene": async (payload) => {
            const scene = payload && payload.scene
            if (!scene) throw new Error("Payload must include 'scene'")
            const o = await getOBS(payload.__variables)
            await o.call("SetCurrentProgramScene", { sceneName: scene })
            console.log(`[OBS] Switched to scene: ${scene}`)
        },

        "obs.toggleSource": async (payload) => {
            const scene = payload && payload.scene
            const source = payload && payload.source
            if (!scene || !source) throw new Error("Payload must include 'scene' and 'source'")
            const o = await getOBS(payload.__variables)
            const { sceneItemId } = await o.call("GetSceneItemId", {
                sceneName: scene,
                sourceName: source,
            })
            const { sceneItemEnabled } = await o.call("GetSceneItemEnabled", {
                sceneName: scene,
                sceneItemId,
            })
            await o.call("SetSceneItemEnabled", {
                sceneName: scene,
                sceneItemId,
                sceneItemEnabled: !sceneItemEnabled,
            })
            console.log(`[OBS] Toggled source: ${source} in ${scene} → ${!sceneItemEnabled ? "visible" : "hidden"}`)
        },
    },
}
