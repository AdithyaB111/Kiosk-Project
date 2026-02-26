/**
 * Welcome / Idle Screen (Step 1)
 * Entry point for the kiosk. Loads kiosk status, POS data,
 * and presents a "Touch to Order" call-to-action.
 *
 * Migrated from: splash_screen.dart (partial)
 * Kiosk-specific additions: kiosk mode routing, hidden settings access
 */

import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Easing,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { StorageService } from "@/src/services/storageService";
import { useKiosk } from "@/src/store/kioskStore";

const SETTINGS_TAP_COUNT = 5;
const SETTINGS_TAP_WINDOW_MS = 3000;

export default function WelcomeScreen() {
    const router = useRouter();
    const { state, loadPosData, dispatch } = useKiosk();
    const [settingsTaps, setSettingsTaps] = useState(0);
    const settingsTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ─── Animations ────────────────────────────────────────────
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0.3)).current;

    // Pulse animation for CTA ring
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.15,
                    duration: 1800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();


        const glow = Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 0.7,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0.3,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        glow.start();

        // Fade in content
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();

        return () => {
            pulse.stop();
            glow.stop();
        };
    }, []);

    // ─── Load Kiosk Mode & Data ────────────────────────────────
    useEffect(() => {
        const init = async () => {
            try {
                // Load saved kiosk status
                const settings = await StorageService.loadSettings();
                const mode = settings.kioskStatus || "active";
                dispatch({ type: "SET_KIOSK_MODE", payload: mode as any });

                // Route based on kiosk mode
                if (mode === "closed") {
                    router.replace("/closed");
                    return;
                }
                if (mode === "out_of_order") {
                    router.replace("/out-of-order");
                    return;
                }

                // Load POS data if not already loaded
                if (!state.isDataLoaded) {
                    await loadPosData();
                }
            } catch (e) {
                console.log("Welcome init error:", e);
            }
        };

        init();
    }, []);

    // ─── Start Order ───────────────────────────────────────────
    const handleStartOrder = useCallback(() => {
        if (!state.isDataLoaded) return;
        router.push("/(order)/menu");
    }, [state.isDataLoaded, router]);

    // ─── Hidden Settings Access (5-tap logo) ───────────────────
    const handleSettingsTap = useCallback(() => {
        const newCount = settingsTaps + 1;
        setSettingsTaps(newCount);

        // Clear existing timer
        if (settingsTapTimer.current) {
            clearTimeout(settingsTapTimer.current);
        }

        if (newCount >= SETTINGS_TAP_COUNT) {
            setSettingsTaps(0);
            router.push("/settings-auth");
        } else {
            // Reset counter after window
            settingsTapTimer.current = setTimeout(() => {
                setSettingsTaps(0);
            }, SETTINGS_TAP_WINDOW_MS);
        }
    }, [settingsTaps, router]);

    return (
        <View style={styles.container}>
            {/* Background accent circles */}
            <View style={[styles.bgCircle, styles.bgCircle1]} />
            <View style={[styles.bgCircle, styles.bgCircle2]} />
            <View style={[styles.bgCircle, styles.bgCircle3]} />

            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                {/* Settings Icon (top-right) */}
                <TouchableOpacity
                    style={styles.settingsTapArea}
                    onPress={() => router.push("/settings")}
                    activeOpacity={0.7}
                >
                    <Text style={styles.settingsIcon}>⚙️</Text>
                </TouchableOpacity>

                {/* Logo / Brand */}
                <View style={styles.brandContainer}>
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoText}>K</Text>
                    </View>
                    <Text style={styles.brandTitle}>Self-Service Kiosk</Text>
                </View>

                {/* CTA Section */}
                <TouchableOpacity
                    style={styles.ctaContainer}
                    onPress={handleStartOrder}
                    activeOpacity={0.9}
                    disabled={state.isLoading || !state.isDataLoaded}
                >
                    {/* Pulsing ring */}
                    <Animated.View
                        style={[
                            styles.pulseRing,
                            {
                                transform: [{ scale: pulseAnim }],
                                opacity: glowAnim,
                            },
                        ]}
                    />

                    {/* Main CTA button */}
                    <View style={styles.ctaButton}>
                        {state.isLoading ? (
                            <ActivityIndicator size="large" color="#ffffff" />
                        ) : (
                            <>
                                <Text style={styles.ctaEmoji}>👆</Text>
                                <Text style={styles.ctaText}>
                                    Touch to Order
                                </Text>
                            </>
                        )}
                    </View>
                </TouchableOpacity>

                {/* Status Messages */}
                {state.isLoading && (
                    <Text style={styles.loadingText}>
                        Loading menu...
                    </Text>
                )}

                {state.error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{state.error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={loadPosData}
                        >
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    {/* Connectivity indicator */}
                    <View style={styles.statusRow}>
                        <View
                            style={[
                                styles.statusDot,
                                state.isOnline
                                    ? styles.statusOnline
                                    : styles.statusOffline,
                            ]}
                        />
                        <Text style={styles.statusText}>
                            {state.isOnline ? "Connected" : "Offline Mode"}
                        </Text>
                    </View>

                    {state.businessInfo?.businessName && (
                        <Text style={styles.storeNameText}>
                            {state.businessInfo.businessName}
                        </Text>
                    )}
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000000",
    },
    bgCircle: {
        position: "absolute",
        borderRadius: 999,
    },
    bgCircle1: {
        width: 600,
        height: 600,
        top: -200,
        right: -200,
        backgroundColor: "rgba(255, 59, 48, 0.03)",
    },
    bgCircle2: {
        width: 400,
        height: 400,
        bottom: -100,
        left: -150,
        backgroundColor: "rgba(255, 59, 48, 0.02)",
    },
    bgCircle3: {
        width: 300,
        height: 300,
        top: "40%" as any,
        left: "50%" as any,
        marginLeft: -150,
        backgroundColor: "rgba(255, 59, 48, 0.015)",
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
    },
    settingsTapArea: {
        position: "absolute",
        top: 20,
        right: 20,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "rgba(255,255,255,0.08)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },
    settingsIcon: {
        fontSize: 24,
    },
    brandContainer: {
        alignItems: "center",
        marginBottom: 80,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: "#ff3b30",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
        shadowColor: "#ff3b30",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 12,
    },
    logoText: {
        fontSize: 38,
        fontWeight: "900",
        color: "#ffffff",
        letterSpacing: -1,
    },
    brandTitle: {
        fontSize: 32,
        fontWeight: "800",
        color: "#ffffff",
        letterSpacing: -0.5,
        textAlign: "center",
    },
    ctaContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 48,
    },
    pulseRing: {
        position: "absolute",
        width: 220,
        height: 220,
        borderRadius: 110,
        borderWidth: 2,
        borderColor: "#ff3b30",
    },
    ctaButton: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: "#ff3b30",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#ff3b30",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 16,
    },
    ctaEmoji: {
        fontSize: 48,
        marginBottom: 8,
    },
    ctaText: {
        fontSize: 20,
        fontWeight: "800",
        color: "#ffffff",
        letterSpacing: -0.3,
    },
    loadingText: {
        color: "#EBEBF599",
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 24,
    },
    errorContainer: {
        alignItems: "center",
        marginBottom: 24,
    },
    errorText: {
        color: "#ff6b5e",
        fontSize: 15,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 16,
        lineHeight: 22,
    },
    retryButton: {
        backgroundColor: "#1C1C1E",
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#38383A",
    },
    retryText: {
        color: "#ff3b30",
        fontSize: 16,
        fontWeight: "700",
    },
    footer: {
        position: "absolute",
        bottom: 48,
        alignItems: "center",
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusOnline: {
        backgroundColor: "#30D158",
    },
    statusOffline: {
        backgroundColor: "#ff9500",
    },
    statusText: {
        color: "#EBEBF54D",
        fontSize: 13,
        fontWeight: "600",
    },
    storeNameText: {
        color: "#EBEBF54D",
        fontSize: 14,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
});
