/**
 * Settings Auth Screen - PIN entry to access settings
 * 4-digit PIN protection (matches Flutter POS_Lite pattern)
 */

import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { StorageService } from "@/src/services/storageService";

const PIN_LENGTH = 4;

export default function SettingsAuthScreen() {
    const router = useRouter();
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);

    const handleKeyPress = useCallback(
        async (key: string) => {
            if (key === "back") {
                setPin((prev) => prev.slice(0, -1));
                setError(false);
                return;
            }

            const newPin = pin + key;
            setPin(newPin);

            if (newPin.length === PIN_LENGTH) {
                // Verify PIN
                const settings = await StorageService.loadSettings();
                const correctPin = settings.settingsPassword || "1234";

                if (newPin === correctPin) {
                    setError(false);
                    router.replace("/settings");
                } else {
                    setError(true);
                    setTimeout(() => {
                        setPin("");
                        setError(false);
                    }, 800);
                }
            }
        },
        [pin, router]
    );

    const handleCancel = useCallback(() => {
        router.back();
    }, [router]);

    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.lockIcon}>🔒</Text>
                <Text style={styles.title}>Settings Access</Text>
                <Text style={styles.subtitle}>Enter your 4-digit PIN</Text>

                {/* PIN Dots */}
                <View style={styles.pinDotsContainer}>
                    {Array.from({ length: PIN_LENGTH }).map((_, idx) => (
                        <View
                            key={idx}
                            style={[
                                styles.pinDot,
                                idx < pin.length && styles.pinDotFilled,
                                error && styles.pinDotError,
                            ]}
                        />
                    ))}
                </View>

                {error && (
                    <Text style={styles.errorText}>Incorrect PIN. Try again.</Text>
                )}

                {/* Numpad */}
                <View style={styles.numpad}>
                    {keys.map((key, idx) => {
                        if (key === "") {
                            return <View key={idx} style={styles.numpadKeyEmpty} />;
                        }

                        return (
                            <TouchableOpacity
                                key={idx}
                                style={styles.numpadKey}
                                onPress={() => handleKeyPress(key)}
                                activeOpacity={0.6}
                                disabled={key !== "back" && pin.length >= PIN_LENGTH}
                            >
                                <Text style={styles.numpadKeyText}>
                                    {key === "back" ? "⌫" : key}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0f0f13",
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 50,
        alignItems: "flex-end",
    },
    cancelButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    cancelText: {
        color: "#ff3b30",
        fontSize: 16,
        fontWeight: "600",
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
        marginTop: -40,
    },
    lockIcon: {
        fontSize: 48,
        marginBottom: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: "800",
        color: "#ffffff",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: "#8e8e93",
        marginBottom: 40,
    },
    pinDotsContainer: {
        flexDirection: "row",
        gap: 20,
        marginBottom: 16,
    },
    pinDot: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: "#3a3a4a",
        backgroundColor: "transparent",
    },
    pinDotFilled: {
        backgroundColor: "#ff3b30",
        borderColor: "#ff3b30",
    },
    pinDotError: {
        backgroundColor: "#ff3b30",
        borderColor: "#ff3b30",
    },
    errorText: {
        color: "#ff3b30",
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 16,
    },
    numpad: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        width: 280,
        gap: 14,
        marginTop: 24,
    },
    numpadKey: {
        width: 74,
        height: 74,
        borderRadius: 37,
        backgroundColor: "#1a1a24",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#2e2e3a",
    },
    numpadKeyEmpty: {
        width: 74,
        height: 74,
    },
    numpadKeyText: {
        color: "#ffffff",
        fontSize: 28,
        fontWeight: "600",
    },
});
