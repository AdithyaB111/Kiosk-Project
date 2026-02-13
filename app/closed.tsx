/**
 * Kiosk Closed Screen - Displayed when kiosk is set to "closed" mode
 */

import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ClosedScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.icon}>🕐</Text>
                <Text style={styles.title}>We're Currently Closed</Text>
                <Text style={styles.subtitle}>
                    This kiosk is not accepting orders right now.{"\n"}
                    Please visit the counter for assistance.
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
        color: "#ffffff",
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
