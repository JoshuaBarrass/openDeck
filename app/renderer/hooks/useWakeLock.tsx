import { useEffect, useRef, useState, useCallback } from "react"

/**
 * Hook to manage Screen Wake Lock on mobile devices
 * Prevents the device from auto-sleeping while connected to the control panel
 */
export function useWakeLock(enabled: boolean = true) {
    const wakeLockRef = useRef<WakeLockSentinel | null>(null)
    const [isSupported, setIsSupported] = useState(false)
    const [isActive, setIsActive] = useState(false)

    // Check if Wake Lock API is supported
    useEffect(() => {
        setIsSupported("wakeLock" in navigator)
    }, [])

    // Request wake lock
    const requestWakeLock = useCallback(async () => {
        if (!isSupported || !enabled) return

        try {
            if (!wakeLockRef.current) {
                wakeLockRef.current = await navigator.wakeLock.request("screen")
                setIsActive(true)
            }
        } catch (err) {
            console.warn("Failed to acquire wake lock:", err)
            setIsActive(false)
        }
    }, [isSupported, enabled])

    // Release wake lock
    const releaseWakeLock = useCallback(async () => {
        try {
            if (wakeLockRef.current) {
                await wakeLockRef.current.release()
                wakeLockRef.current = null
                setIsActive(false)
            }
        } catch (err) {
            console.warn("Failed to release wake lock:", err)
        }
    }, [])

    // Handle document visibility changes
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.hidden) {
                await releaseWakeLock()
            } else if (enabled && isSupported) {
                await requestWakeLock()
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange)
        }
    }, [enabled, isSupported, requestWakeLock, releaseWakeLock])

    // Request wake lock when enabled
    useEffect(() => {
        if (enabled && isSupported) {
            requestWakeLock()
        } else {
            releaseWakeLock()
        }

        return () => {
            releaseWakeLock()
        }
    }, [enabled, isSupported, requestWakeLock, releaseWakeLock])

    return { isSupported, isActive }
}
