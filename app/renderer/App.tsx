import React, { useState, useEffect, useCallback } from "react"
import { QRCodeSVG } from "qrcode.react"
import { SocketProvider } from "./hooks/useSocket"
import { DeckConfigProvider } from "./hooks/useDeckConfig"
import ControlPage from "./pages/ControlPage"
import SettingsPage from "./pages/SettingsPage"

type View = "deck" | "settings"

const isElectron = navigator.userAgent.includes("Electron")

function ConnectModal({ onClose }: { onClose: () => void }) {
    const [addresses, setAddresses] = useState<string[]>([])
    const [port, setPort] = useState(4020)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`http://${window.location.hostname}:4020/api/network`)
            .then(res => res.json())
            .then(data => {
                setAddresses(data.addresses || [])
                setPort(data.port || 4020)
            })
            .catch(() => setAddresses([]))
            .finally(() => setLoading(false))
    }, [])

    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose()
    }, [onClose])

    const url = addresses.length > 0 ? `http://${addresses[0]}:${port}` : ""

    return (
        <div className="connect-backdrop" onClick={handleBackdropClick}>
            <div className="connect-modal">
                <div className="connect-header">
                    <h2>Connect a Device</h2>
                    <button className="connect-close" onClick={onClose}>✕</button>
                </div>
                <p className="connect-hint">Scan the QR code or open the URL on any device on your local network.</p>
                {loading ? (
                    <p className="connect-hint">Detecting network…</p>
                ) : addresses.length === 0 ? (
                    <p className="connect-hint">No network interfaces found.</p>
                ) : (
                    <>
                        <div className="connect-qr">
                            <QRCodeSVG value={url} size={180} bgColor="transparent" fgColor="#e8e8e8" />
                        </div>
                        <div className="connect-urls">
                            {addresses.map(addr => {
                                const fullUrl = `http://${addr}:${port}`
                                return (
                                    <div key={addr} className="connect-url-row">
                                        <code className="connect-url">{fullUrl}</code>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default function App() {
    const [view, setView] = useState<View>("deck")
    const [showConnect, setShowConnect] = useState(false)

    return (
        <SocketProvider>
            <DeckConfigProvider>
                <div className="app">
                    <header className={`app-header${isElectron ? "" : " app-header-remote"}`}>
                        <h1>OpenDeck</h1>
                        {isElectron && (
                            <nav className="app-nav">
                                <button
                                    className="app-nav-btn"
                                    onClick={() => setShowConnect(true)}
                                    title="Connect a device"
                                >
                                    📲 Connect
                                </button>
                                <button
                                    className={`app-nav-btn ${view === "deck" ? "active" : ""}`}
                                    onClick={() => setView("deck")}
                                >
                                    Deck
                                </button>
                                <button
                                    className={`app-nav-btn ${view === "settings" ? "active" : ""}`}
                                    onClick={() => setView("settings")}
                                >
                                    ⚙ Settings
                                </button>
                            </nav>
                        )}
                    </header>
                    <main>
                        {view === "deck" || !isElectron ? <ControlPage /> : <SettingsPage />}
                    </main>
                    {showConnect && <ConnectModal onClose={() => setShowConnect(false)} />}
                    <footer className="app-footer">
                        <a href="https://github.com/JoshuaBarrass/openDeck" target="_blank" rel="noopener noreferrer">
                            Developed by Joshua Barrass
                        </a>
                    </footer>
                </div>
            </DeckConfigProvider>
        </SocketProvider>
    )
}
