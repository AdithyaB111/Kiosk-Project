/**
 * Enter Name Screen (Step 5) - Customer name for order
 * Simple name entry before payment
 */

import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Animated,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useKiosk } from "@/src/store/kioskStore";

export default function EnterNameScreen() {
    const router = useRouter();
    const { state, setCustomerName } = useKiosk();
    const [name, setName] = useState(state.customerName || "");
    const inputRef = useRef<TextInput>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();

        setTimeout(() => inputRef.current?.focus(), 500);
    }, []);

    const handleContinue = useCallback(() => {
        const trimmed = name.trim();
        setCustomerName(trimmed || "Guest");
        router.push("/(order)/payment");
    }, [name, setCustomerName, router]);

    const handleSkip = useCallback(() => {
        setCustomerName("Guest");
        router.push("/(order)/payment");
    }, [setCustomerName, router]);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                </View>

                {/* Title */}
                <View style={styles.titleContainer}>
                    <Text style={styles.emoji}>👋</Text>
                    <Text style={styles.title}>What's your name?</Text>
                    <Text style={styles.subtitle}>
                        We'll call your name when your order is ready
                    </Text>
                </View>

                {/* Name Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        ref={inputRef}
                        style={styles.nameInput}
                        placeholder="Enter your name"
                        placeholderTextColor="#636366"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        returnKeyType="done"
                        maxLength={30}
                        onSubmitEditing={handleContinue}
                    />
                </View>

                {/* Buttons */}
                <View style={styles.buttonsContainer}>
                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            !name.trim() && styles.continueButtonMuted,
                        ]}
                        onPress={handleContinue}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.continueButtonText}>
                            {name.trim() ? "Continue" : "Continue as Guest"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                        <Text style={styles.skipButtonText}>Skip this step</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000000",
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
    },
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: "#1C1C1E",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#38383A",
    },
    backButtonText: {
        color: "#ffffff",
        fontSize: 24,
        fontWeight: "700",
    },
    titleContainer: {
        alignItems: "center",
        paddingTop: 60,
        marginBottom: 60,
    },
    emoji: {
        fontSize: 72,
        marginBottom: 28,
    },
    title: {
        fontSize: 36,
        fontWeight: "800",
        color: "#ffffff",
        marginBottom: 14,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 17,
        color: "#EBEBF599",
        textAlign: "center",
        fontWeight: "600",
        lineHeight: 26,
        paddingHorizontal: 20,
    },
    inputContainer: {
        marginBottom: 48,
    },
    nameInput: {
        backgroundColor: "#1C1C1E",
        borderRadius: 24,
        padding: 24,
        fontSize: 24,
        fontWeight: "700",
        color: "#ffffff",
        textAlign: "center",
        borderWidth: 1,
        borderColor: "#38383A",
        letterSpacing: 0.5,
    },
    buttonsContainer: {
        gap: 16,
    },
    continueButton: {
        backgroundColor: "#ff3b30",
        borderRadius: 20,
        padding: 22,
        alignItems: "center",
        shadowColor: "#ff3b30",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },
    continueButtonMuted: {
        backgroundColor: "#3A3A3C",
        shadowOpacity: 0,
    },
    continueButtonText: {
        color: "#ffffff",
        fontSize: 19,
        fontWeight: "800",
        letterSpacing: -0.3,
    },
    skipButton: {
        padding: 18,
        alignItems: "center",
    },
    skipButtonText: {
        color: "#EBEBF599",
        fontSize: 16,
        fontWeight: "700",
    },
});
