/**
 * Order Complete Screen (Step 7) - Success confirmation
 * Shows order number, auto-resets after timeout
 */

import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useKiosk } from "@/src/store/kioskStore";

const RESET_TIMEOUT_SECONDS = 15;

export default function OrderCompleteScreen() {
    const router = useRouter();
    const { state, resetOrder } = useKiosk();
    const [countdown, setCountdown] = useState(RESET_TIMEOUT_SECONDS);

    // Animations
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const checkAnim = useRef(new Animated.Value(0)).current;

    // Entry animations
    useEffect(() => {
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(checkAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, []);

    // Auto-reset countdown
    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleDone();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleDone = useCallback(() => {
        resetOrder();
        router.replace("/");
    }, [resetOrder, router]);

    const orderNumber = state.customerName || "Guest";

    return (
        <View style={styles.container}>
            {/* Background accents */}
            <View style={[styles.bgCircle, styles.bgCircle1]} />
            <View style={[styles.bgCircle, styles.bgCircle2]} />

            <View style={styles.content}>
                {/* Success Icon */}
                <Animated.View
                    style={[
                        styles.successCircle,
                        {
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <Animated.Text
                        style={[
                            styles.successIcon,
                            {
                                opacity: checkAnim,
                            },
                        ]}
                    >
                        ✓
                    </Animated.Text>
                </Animated.View>

                {/* Order Confirmed */}
                <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
                    <Text style={styles.successTitle}>Order Confirmed!</Text>
                    <Text style={styles.successSubtitle}>
                        Your order has been sent to the kitchen
                    </Text>

                    {/* Order Info Card */}
                    <View style={styles.orderCard}>
                        <View style={styles.orderField}>
                            <Text style={styles.orderFieldLabel}>Name</Text>
                            <Text style={styles.orderFieldValue}>{orderNumber}</Text>
                        </View>

                        <View style={styles.orderDivider} />

                        <View style={styles.orderField}>
                            <Text style={styles.orderFieldLabel}>Status</Text>
                            <View style={styles.preparingBadge}>
                                <View style={styles.preparingDot} />
                                <Text style={styles.preparingText}>Preparing</Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.pickupMessage}>
                        We'll call your name when your order is ready for pickup
                    </Text>

                    {/* Receipt Note */}
                    <View style={styles.receiptNote}>
                        <Text style={styles.receiptNoteIcon}>🧾</Text>
                        <Text style={styles.receiptNoteText}>
                            Your receipt is printing...
                        </Text>
                    </View>
                </Animated.View>

                {/* Done Button */}
                <Animated.View style={[styles.bottomArea, { opacity: fadeAnim }]}>
                    <TouchableOpacity
                        style={styles.doneButton}
                        onPress={handleDone}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.doneButtonText}>Done</Text>
                    </TouchableOpacity>

                    <Text style={styles.countdownText}>
                        Returning to home in {countdown}s
                    </Text>
                </Animated.View>
            </View>
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
        backgroundColor: "rgba(52, 199, 89, 0.03)",
    },
    bgCircle1: {
        width: 500,
        height: 500,
        top: -80,
        right: -120,
    },
    bgCircle2: {
        width: 350,
        height: 350,
        bottom: 60,
        left: -100,
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
    },
    successCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: "#30D158",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 40,
        shadowColor: "#30D158",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
        elevation: 16,
    },
    successIcon: {
        fontSize: 72,
        fontWeight: "800",
        color: "#ffffff",
    },
    textContainer: {
        alignItems: "center",
        width: "100%",
    },
    successTitle: {
        fontSize: 38,
        fontWeight: "800",
        color: "#ffffff",
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    successSubtitle: {
        fontSize: 17,
        color: "#EBEBF599",
        fontWeight: "600",
        marginBottom: 40,
        textAlign: "center",
        lineHeight: 24,
    },
    orderCard: {
        backgroundColor: "#1C1C1E",
        borderRadius: 24,
        padding: 28,
        width: "100%",
        marginBottom: 28,
        borderWidth: 1,
        borderColor: "#38383A",
    },
    orderField: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    orderFieldLabel: {
        fontSize: 16,
        color: "#EBEBF599",
        fontWeight: "600",
    },
    orderFieldValue: {
        fontSize: 24,
        fontWeight: "800",
        color: "#ffffff",
        letterSpacing: -0.3,
    },
    orderDivider: {
        height: 1,
        backgroundColor: "#38383A",
        marginVertical: 20,
    },
    preparingBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(52, 199, 89, 0.1)",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
    },
    preparingDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#30D158",
        marginRight: 10,
    },
    preparingText: {
        color: "#30D158",
        fontSize: 15,
        fontWeight: "800",
    },
    pickupMessage: {
        fontSize: 16,
        color: "#EBEBF599",
        fontWeight: "600",
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 24,
        paddingHorizontal: 12,
    },
    receiptNote: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255, 204, 0, 0.08)",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255, 204, 0, 0.15)",
    },
    receiptNoteIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    receiptNoteText: {
        color: "#FFD60A",
        fontSize: 15,
        fontWeight: "700",
    },
    bottomArea: {
        position: "absolute",
        bottom: 56,
        left: 32,
        right: 32,
        alignItems: "center",
    },
    doneButton: {
        backgroundColor: "#30D158",
        borderRadius: 20,
        padding: 22,
        alignItems: "center",
        width: "100%",
        marginBottom: 18,
        shadowColor: "#30D158",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },
    doneButtonText: {
        color: "#ffffff",
        fontSize: 19,
        fontWeight: "800",
        letterSpacing: -0.3,
    },
    countdownText: {
        color: "#EBEBF54D",
        fontSize: 14,
        fontWeight: "600",
    },
});
