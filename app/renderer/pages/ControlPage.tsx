import React from "react"
import Grid from "../components/Grid"
import { useDeckConfig } from "../hooks/useDeckConfig"
import { useSocket } from "../hooks/useSocket"
import { useWakeLock } from "../hooks/useWakeLock"
import { useFullscreen } from "../hooks/useFullscreen"

export default function ControlPage() {
    const { pages, currentPageIndex, setCurrentPageIndex, displayImage } = useDeckConfig()
    const { connected } = useSocket()

    // Activate wake lock when device is connected to prevent auto-sleep
    useWakeLock(connected)

    // Manage fullscreen mode
    const { containerRef, isSupported: isFullscreenSupported, isFullscreen, toggleFullscreen } = useFullscreen()

    const currentPage = pages[currentPageIndex]

    return (
        <div className="control-page" ref={containerRef}>
            <div className="sd-device">
                <div className="sd-device-frame">
                    {displayImage && (
                        <img className="sd-display-image" src={displayImage} alt="" draggable={false} />
                    )}
                    <Grid buttons={currentPage.grid} columns={5} rows={3} />
                </div>
            </div>
            <nav className="sd-page-bar">
                {pages.map((page, index) => (
                    <button
                        key={page.name}
                        className={`sd-page-tab ${index === currentPageIndex ? "active" : ""}`}
                        onClick={() => setCurrentPageIndex(index)}
                    >
                        {page.name}
                    </button>
                ))}
                {isFullscreenSupported && (
                    <button
                        className={`sd-fullscreen-btn ${isFullscreen ? "active" : ""}`}
                        onClick={toggleFullscreen}
                        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                    >
                        {isFullscreen ? "⛶" : "⛶"}
                    </button>
                )}
            </nav>
        </div>
    )
}
