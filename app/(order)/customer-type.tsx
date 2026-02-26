/**
 * Customer Type Screen (Step 4) - Member or Guest selection
 * Scan QR, enter phone, or continue as guest
 */

import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useKiosk } from "@/src/store/kioskStore";

export default function CustomerTypeScreen() {
    const router = useRouter();
    const { setCustomerType, setLoyaltyCustomer, setCustomerName, searchLoyaltyByPhone } =
        useKiosk();

    const [showPhoneInput, setShowPhoneInput] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGuest = useCallback(() => {
        setCustomerType("guest");
        setLoyaltyCustomer(null);
        router.push("/(order)/enter-name");
    }, [setCustomerType, setLoyaltyCustomer, router]);

    const handlePhoneSearch = useCallback(async () => {
        if (phoneNumber.length < 10) {
            setError("Please enter a valid phone number");
            return;
        }

        setIsSearching(true);
        setError(null);

        try {
            const customer = await searchLoyaltyByPhone(phoneNumber);

            if (customer) {
                setCustomerType("member");
                setLoyaltyCustomer(customer);
                // Auto-fill name from loyalty customer
                const fullName = `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim();
                if (fullName) {
                    setCustomerName(fullName);
                }
                router.push("/(order)/payment");
            } else {
                setError("No member found with this number. Try again or continue as guest.");
            }
        } catch (e) {
            setError("Unable to search. Please try again or continue as guest.");
        } finally {
            setIsSearching(false);
        }
    }, [phoneNumber, searchLoyaltyByPhone, setCustomerType, setLoyaltyCustomer, setCustomerName, router]);

    const handleScanQR = useCallback(() => {
        router.push("/(order)/scan-qr");
    }, [router]);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>How would you like to order?</Text>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.content}>
                {!showPhoneInput ? (
                    <>
                        {/* Member Option - Scan QR */}
                        <TouchableOpacity
                            style={styles.optionCard}
                            onPress={handleScanQR}
                            activeOpacity={0.8}
                        >
                            <View style={styles.optionIcon}>
                                <Text style={styles.optionIconText}>📱</Text>
                            </View>
                            <View style={styles.optionInfo}>
                                <Text style={styles.optionTitle}>Scan Member QR</Text>
                                <Text style={styles.optionSubtitle}>
                                    Use your loyalty membership QR code
                                </Text>
                            </View>
                            <Text style={styles.optionArrow}>→</Text>
                        </TouchableOpacity>

                        {/* Member Option - Phone */}
                        <TouchableOpacity
                            style={styles.optionCard}
                            onPress={() => setShowPhoneInput(true)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.optionIcon}>
                                <Text style={styles.optionIconText}>📞</Text>
                            </View>
                            <View style={styles.optionInfo}>
                                <Text style={styles.optionTitle}>Enter Phone Number</Text>
                                <Text style={styles.optionSubtitle}>
                                    Look up your loyalty membership
                                </Text>
                            </View>
                            <Text style={styles.optionArrow}>→</Text>
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.orDivider}>
                            <View style={styles.orLine} />
                            <Text style={styles.orText}>OR</Text>
                            <View style={styles.orLine} />
                        </View>

                        {/* Guest Option */}
                        <TouchableOpacity
                            style={[styles.optionCard, styles.guestCard]}
                            onPress={handleGuest}
                            activeOpacity={0.8}
                        >
                            <View style={styles.optionIcon}>
                                <Text style={styles.optionIconText}>👤</Text>
                            </View>
                            <View style={styles.optionInfo}>
                                <Text style={styles.optionTitle}>Continue as Guest</Text>
                                <Text style={styles.optionSubtitle}>
                                    No membership? No problem!
                                </Text>
                            </View>
                            <Text style={styles.optionArrow}>→</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    /* Phone Number Input */
                    <View style={styles.phoneInputContainer}>
                        <Text style={styles.phoneTitle}>Enter your phone number</Text>
                        <Text style={styles.phoneSubtitle}>
                            We'll look up your loyalty membership
                        </Text>

                        <TextInput
                            style={styles.phoneInput}
                            placeholder="(555) 123-4567"
                            placeholderTextColor="#636366"
                            value={phoneNumber}
                            onChangeText={(text) => {
                                setPhoneNumber(text.replace(/[^0-9]/g, ""));
                                setError(null);
                            }}
                            keyboardType="phone-pad"
                            maxLength={15}
                            autoFocus
                        />

                        {error && <Text style={styles.errorText}>{error}</Text>}

                        <TouchableOpacity
                            style={[
                                styles.searchButton,
                                phoneNumber.length < 10 && styles.searchButtonDisabled,
                            ]}
                            onPress={handlePhoneSearch}
                            disabled={isSearching || phoneNumber.length < 10}
                            activeOpacity={0.85}
                        >
                            {isSearching ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text style={styles.searchButtonText}>Search Member</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.backLink} onPress={() => setShowPhoneInput(false)}>
                            <Text style={styles.backLinkText}>← Back to options</Text>
                        </TouchableOpacity>

                        <View style={styles.dividerSmall} />

                        <TouchableOpacity
                            style={styles.guestLink}
                            onPress={handleGuest}
                        >
                            <Text style={styles.guestLinkText}>
                                Skip — Continue as Guest
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000000",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 24,
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
    headerTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#ffffff",
        flex: 1,
        textAlign: "center",
        letterSpacing: -0.3,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    optionCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1C1C1E",
        borderRadius: 24,
        padding: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#38383A",
    },
    guestCard: {
        borderColor: "rgba(255, 59, 48, 0.3)",
    },
    optionIcon: {
        width: 60,
        height: 60,
        borderRadius: 18,
        backgroundColor: "#0A0A0A",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 18,
    },
    optionIconText: {
        fontSize: 28,
    },
    optionInfo: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#ffffff",
        marginBottom: 6,
    },
    optionSubtitle: {
        fontSize: 14,
        color: "#EBEBF599",
        fontWeight: "600",
        lineHeight: 20,
    },
    optionArrow: {
        fontSize: 24,
        color: "#EBEBF54D",
        fontWeight: "700",
    },
    orDivider: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 28,
    },
    orLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#38383A",
    },
    orText: {
        color: "#EBEBF54D",
        fontSize: 15,
        fontWeight: "700",
        marginHorizontal: 20,
    },
    phoneInputContainer: {
        flex: 1,
        paddingTop: 24,
    },
    phoneTitle: {
        fontSize: 32,
        fontWeight: "800",
        color: "#ffffff",
        marginBottom: 10,
        textAlign: "center",
        letterSpacing: -0.5,
    },
    phoneSubtitle: {
        fontSize: 16,
        color: "#EBEBF599",
        marginBottom: 40,
        textAlign: "center",
        lineHeight: 24,
    },
    phoneInput: {
        backgroundColor: "#1C1C1E",
        borderRadius: 20,
        padding: 22,
        fontSize: 28,
        fontWeight: "700",
        color: "#ffffff",
        textAlign: "center",
        borderWidth: 1,
        borderColor: "#38383A",
        letterSpacing: 2,
        marginBottom: 20,
    },
    errorText: {
        color: "#ff3b30",
        fontSize: 15,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 20,
    },
    searchButton: {
        backgroundColor: "#ff3b30",
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        marginBottom: 20,
        shadowColor: "#ff3b30",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    searchButtonDisabled: {
        backgroundColor: "#3A3A3C",
        shadowOpacity: 0,
    },
    searchButtonText: {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "800",
    },
    backLink: {
        padding: 14,
        alignItems: "center",
    },
    backLinkText: {
        color: "#EBEBF599",
        fontSize: 16,
        fontWeight: "700",
    },
    dividerSmall: {
        height: 1,
        backgroundColor: "#38383A",
        marginVertical: 24,
    },
    guestLink: {
        padding: 18,
        alignItems: "center",
    },
    guestLinkText: {
        color: "#ff6b5e",
        fontSize: 17,
        fontWeight: "700",
    },
});
