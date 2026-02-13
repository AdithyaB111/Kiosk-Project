/**
 * useInactivityTimer - Auto-return to welcome screen after idle period
 * Kiosk requirement: reset to welcome screen if customer walks away
 */

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "expo-router";
import { useKiosk } from "../store/kioskStore";

const DEFAULT_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

export function useInactivityTimer(
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
    enabled: boolean = true,
) {
    const router = useRouter();
    const { resetOrder } = useKiosk();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const handleTimeout = useCallback(() => {
        console.log(
            "InactivityTimer: Timeout reached, resetting to welcome screen",
        );
        resetOrder();
        router.replace("/");
    }, [resetOrder, router]);

    const resetTimer = useCallback(() => {
        clearTimer();
        if (enabled) {
            timerRef.current = setTimeout(handleTimeout, timeoutMs);
        }
    }, [clearTimer, handleTimeout, timeoutMs, enabled]);

    useEffect(() => {
        if (enabled) {
            resetTimer();
        } else {
            clearTimer();
        }

        return () => clearTimer();
    }, [enabled, resetTimer, clearTimer]);

    return { resetTimer };
}
