import { useEffect, useRef, useState, useCallback } from "react"

/**
 * Hook to manage fullscreen mode for the application
 * Shows fullscreen button for external devices connecting via web browser
 */
export function useFullscreen() {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isSupported, setIsSupported] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)

    // Check if this is an external device (not running in Electron)
    const isExternalDevice = useCallback(() => {
        return !navigator.userAgent.includes("Electron")
    }, [])

    // Check if Fullscreen API is supported
    useEffect(() => {
        // Show button for external devices OR if fullscreen API is available
        const hasFullscreenAPI =
            document.fullscreenEnabled ||
            (document as any).webkitFullscreenEnabled ||
            (document as any).mozFullScreenEnabled ||
            (document as any).msFullscreenEnabled

        const isExternal = isExternalDevice()
        setIsSupported(isExternal || hasFullscreenAPI)
    }, [isExternalDevice])

    // Handle fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen =
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement ||
                (document as any).msFullscreenElement

            setIsFullscreen(!!isCurrentlyFullscreen)
        }

        document.addEventListener("fullscreenchange", handleFullscreenChange)
        document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
        document.addEventListener("mozfullscreenchange", handleFullscreenChange)
        document.addEventListener("msfullscreenchange", handleFullscreenChange)

        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange)
            document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
            document.removeEventListener("mozfullscreenchange", handleFullscreenChange)
            document.removeEventListener("msfullscreenchange", handleFullscreenChange)
        }
    }, [])

    // Toggle fullscreen
    const toggleFullscreen = useCallback(async () => {
        if (!containerRef.current) return

        try {
            if (isFullscreen) {
                // Exit fullscreen
                if (document.fullscreenElement) {
                    await document.exitFullscreen()
                } else if ((document as any).webkitFullscreenElement) {
                    await (document as any).webkitExitFullscreen()
                } else if ((document as any).mozFullScreenElement) {
                    await (document as any).mozCancelFullScreen()
                } else if ((document as any).msFullscreenElement) {
                    await (document as any).msExitFullscreen()
                }
            } else {
                // Enter fullscreen - try multiple APIs
                const elem = containerRef.current
                try {
                    if (elem.requestFullscreen) {
                        await elem.requestFullscreen()
                    } else if ((elem as any).webkitRequestFullscreen) {
                        await (elem as any).webkitRequestFullscreen()
                    } else if ((elem as any).mozRequestFullScreen) {
                        await (elem as any).mozRequestFullScreen()
                    } else if ((elem as any).msRequestFullscreen) {
                        await (elem as any).msRequestFullscreen()
                    } else {
                        console.warn("Fullscreen API not available on this browser")
                    }
                } catch (innerErr) {
                    console.warn("Failed to request fullscreen:", innerErr)
                }
            }
        } catch (err) {
            console.warn("Failed to toggle fullscreen:", err)
        }
    }, [isFullscreen])

    return { containerRef, isSupported, isFullscreen, toggleFullscreen }
}
