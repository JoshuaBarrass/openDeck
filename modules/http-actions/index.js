// HTTP Actions Module — send HTTP requests from button presses

const http = require("http")
const https = require("https")
const url = require("url")

function makeRequest(method, targetUrl, body) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(targetUrl)
        const transport = parsed.protocol === "https:" ? https : http

        const options = {
            hostname: parsed.hostname,
            port: parsed.port,
            path: parsed.pathname + parsed.search,
            method: method.toUpperCase(),
            headers: { "Content-Type": "application/json" },
        }

        const req = transport.request(options, (res) => {
            let data = ""
            res.on("data", (chunk) => (data += chunk))
            res.on("end", () => resolve({ status: res.statusCode, data }))
        })

        req.on("error", reject)

        if (body) {
            req.write(JSON.stringify(body))
        }

        req.end()
    })
}

module.exports = {
    actions: {
        "http.get": async (payload) => {
            const targetUrl = payload?.url
            if (!targetUrl || typeof targetUrl !== "string") {
                console.log("[HTTP] GET — no URL provided in payload")
                return
            }
            console.log(`[HTTP] GET ${targetUrl}`)
            const result = await makeRequest("GET", targetUrl)
            console.log(`[HTTP] Response: ${result.status}`)
        },

        "http.post": async (payload) => {
            const targetUrl = payload?.url
            if (!targetUrl || typeof targetUrl !== "string") {
                console.log("[HTTP] POST — no URL provided in payload")
                return
            }
            const body = payload?.body || {}
            console.log(`[HTTP] POST ${targetUrl}`)
            const result = await makeRequest("POST", targetUrl, body)
            console.log(`[HTTP] Response: ${result.status}`)
        },
    },
}
