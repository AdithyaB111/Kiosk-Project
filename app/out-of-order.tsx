/**
 * Out of Order Screen - Displayed when kiosk has technical issues
 */

import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function OutOfOrderScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.icon}>⚠️</Text>
                <Text style={styles.title}>Out of Order</Text>
                <Text style={styles.subtitle}>
                    This kiosk is temporarily unavailable.{"\n"}
                    Please place your order at the counter.{"\n\n"}
                    We apologize for the inconvenience.
                </Text>
            </View>

            {/* Hidden settings access */}
            <TouchableOpacity
                style={styles.hiddenSettingsArea}
                onPress={() => router.push("/settings-auth")}
                activeOpacity={1}
            >
                <View />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000000",
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        alignItems: "center",
        paddingHorizontal: 56,
    },
    icon: {
        fontSize: 96,
        marginBottom: 40,
    },
    title: {
        fontSize: 34,
        fontWeight: "800",
        color: "#FFD60A",
        marginBottom: 20,
        textAlign: "center",
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 17,
        color: "#EBEBF599",
        textAlign: "center",
        lineHeight: 28,
        fontWeight: "600",
    },
    hiddenSettingsArea: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 60,
        height: 60,
    },
});
