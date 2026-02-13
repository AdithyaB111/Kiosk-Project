/**
 * Settings Screen - Manager access for kiosk configuration
 * Matches Flutter POS_Lite settings structure
 */

import React, { useState, useCallback, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    TextInput,
    Alert,
    Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { StorageService } from "../src/services/storageService";
import { RuntimeConfig } from "../src/config/apiConfig";
import { useKiosk } from "../src/store/kioskStore";
import type { KioskSettings, KioskMode } from "../src/types";

export default function SettingsScreen() {
    const router = useRouter();
    const { state, dispatch, loadPosData } = useKiosk();

    const [settings, setSettings] = useState<KioskSettings>({
        apiBaseUrl: "",
        transServerUrl: "",
        paxIpAddress: "",
        paxPort: 10009,
        printerType: "usb",
        printerAddress: "",
        kioskStatus: "active",
        storeId: "",
        dbName: "",
        settingsPassword: "1234",
    });

    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const loaded = await StorageService.loadSettings();
        setSettings(loaded);
    };

    const updateSetting = useCallback(
        (key: keyof KioskSettings, value: any) => {
            setSettings((prev) => ({ ...prev, [key]: value }));
            setHasChanges(true);
        },
        []
    );

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        try {
            await StorageService.saveSettings(settings);

            // Update runtime config
            RuntimeConfig.paxIpAddress = settings.paxIpAddress;
            RuntimeConfig.paxPort = settings.paxPort;
            RuntimeConfig.storeId = settings.storeId;
            RuntimeConfig.myDb = settings.dbName;

            // Update kiosk mode
            dispatch({ type: "SET_KIOSK_MODE", payload: settings.kioskStatus });

            setHasChanges(false);
            Alert.alert("Settings Saved", "Your settings have been updated.");
        } catch (e) {
            Alert.alert("Error", "Failed to save settings.");
        } finally {
            setIsSaving(false);
        }
    }, [settings, dispatch]);

    const handleSyncData = useCallback(async () => {
        Alert.alert("Sync Data", "This will reload all menu data from the server.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Sync Now",
                onPress: async () => {
                    await loadPosData();
                    Alert.alert("Success", "Menu data has been refreshed.");
                },
            },
        ]);
    }, [loadPosData]);

    const handleSetMode = useCallback(
        (mode: KioskMode) => {
            updateSetting("kioskStatus", mode);
        },
        [updateSetting]
    );

    const handleExit = useCallback(() => {
        if (hasChanges) {
            Alert.alert("Unsaved Changes", "You have unsaved changes. Discard?", [
                { text: "Stay", style: "cancel" },
                {
                    text: "Discard",
                    style: "destructive",
                    onPress: () => router.replace("/"),
                },
            ]);
        } else {
            router.replace("/");
        }
    }, [hasChanges, router]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
                    <Text style={styles.exitButtonText}>← Exit</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <TouchableOpacity
                    style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={!hasChanges || isSaving}
                >
                    <Text
                        style={[
                            styles.saveButtonText,
                            !hasChanges && styles.saveButtonTextDisabled,
                        ]}
                    >
                        {isSaving ? "Saving..." : "Save"}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Kiosk Status */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Kiosk Status</Text>
                    <View style={styles.statusOptions}>
                        {(["active", "closed", "out_of_order"] as KioskMode[]).map(
                            (mode) => (
                                <TouchableOpacity
                                    key={mode}
                                    style={[
                                        styles.statusOption,
                                        settings.kioskStatus === mode && styles.statusOptionActive,
                                        mode === "active" &&
                                        settings.kioskStatus === mode &&
                                        styles.statusOptionGreen,
                                        mode === "closed" &&
                                        settings.kioskStatus === mode &&
                                        styles.statusOptionRed,
                                        mode === "out_of_order" &&
                                        settings.kioskStatus === mode &&
                                        styles.statusOptionYellow,
                                    ]}
                                    onPress={() => handleSetMode(mode)}
                                >
                                    <Text
                                        style={[
                                            styles.statusOptionText,
                                            settings.kioskStatus === mode &&
                                            styles.statusOptionTextActive,
                                        ]}
                                    >
                                        {mode === "active"
                                            ? "✓ Active"
                                            : mode === "closed"
                                                ? "✕ Closed"
                                                : "⚠ Out of Order"}
                                    </Text>
                                </TouchableOpacity>
                            )
                        )}
                    </View>
                </View>

                {/* API Configuration */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>API Configuration</Text>

                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Database Name</Text>
                        <TextInput
                            style={styles.fieldInput}
                            value={settings.dbName}
                            onChangeText={(v) => updateSetting("dbName", v)}
                            placeholder="e.g. 170"
                            placeholderTextColor="#636366"
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Store ID</Text>
                        <TextInput
                            style={styles.fieldInput}
                            value={settings.storeId}
                            onChangeText={(v) => updateSetting("storeId", v)}
                            placeholder="Store ID"
                            placeholderTextColor="#636366"
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>API Base URL</Text>
                        <TextInput
                            style={styles.fieldInput}
                            value={settings.apiBaseUrl}
                            onChangeText={(v) => updateSetting("apiBaseUrl", v)}
                            placeholder="https://..."
                            placeholderTextColor="#636366"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Transaction Server URL</Text>
                        <TextInput
                            style={styles.fieldInput}
                            value={settings.transServerUrl}
                            onChangeText={(v) => updateSetting("transServerUrl", v)}
                            placeholder="https://..."
                            placeholderTextColor="#636366"
                            autoCapitalize="none"
                        />
                    </View>
                </View>

                {/* PAX Terminal */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PAX Terminal</Text>

                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>IP Address</Text>
                        <TextInput
                            style={styles.fieldInput}
                            value={settings.paxIpAddress}
                            onChangeText={(v) => updateSetting("paxIpAddress", v)}
                            placeholder="10.0.0.1"
                            placeholderTextColor="#636366"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Port</Text>
                        <TextInput
                            style={styles.fieldInput}
                            value={settings.paxPort.toString()}
                            onChangeText={(v) =>
                                updateSetting("paxPort", parseInt(v, 10) || 10009)
                            }
                            placeholder="10009"
                            placeholderTextColor="#636366"
                            keyboardType="number-pad"
                        />
                    </View>
                </View>

                {/* Printer Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Printer</Text>

                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Printer Type</Text>
                        <View style={styles.printerTypeRow}>
                            {(["usb", "serial", "network"] as const).map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.printerTypeOption,
                                        settings.printerType === type && styles.printerTypeActive,
                                    ]}
                                    onPress={() => updateSetting("printerType", type)}
                                >
                                    <Text
                                        style={[
                                            styles.printerTypeText,
                                            settings.printerType === type &&
                                            styles.printerTypeTextActive,
                                        ]}
                                    >
                                        {type.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Printer Address</Text>
                        <TextInput
                            style={styles.fieldInput}
                            value={settings.printerAddress}
                            onChangeText={(v) => updateSetting("printerAddress", v)}
                            placeholder="COM3 or IP address"
                            placeholderTextColor="#636366"
                        />
                    </View>
                </View>

                {/* Security */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security</Text>

                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Settings PIN</Text>
                        <TextInput
                            style={styles.fieldInput}
                            value={settings.settingsPassword}
                            onChangeText={(v) => updateSetting("settingsPassword", v)}
                            placeholder="4-digit PIN"
                            placeholderTextColor="#636366"
                            keyboardType="number-pad"
                            maxLength={4}
                            secureTextEntry
                        />
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Actions</Text>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleSyncData}
                    >
                        <Text style={styles.actionButtonIcon}>🔄</Text>
                        <Text style={styles.actionButtonText}>Sync Menu Data</Text>
                    </TouchableOpacity>

                    <View style={styles.infoCard}>
                        <Text style={styles.infoText}>
                            Online: {state.isOnline ? "✓ Connected" : "✕ Disconnected"}
                        </Text>
                        <Text style={styles.infoText}>
                            Items: {state.items.length} | Categories:{" "}
                            {state.departments.length}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0f0f13",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 16,
    },
    exitButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    exitButtonText: {
        color: "#ff3b30",
        fontSize: 16,
        fontWeight: "600",
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#ffffff",
    },
    saveButton: {
        backgroundColor: "#ff3b30",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    saveButtonDisabled: {
        backgroundColor: "#3a3a4a",
    },
    saveButtonText: {
        color: "#ffffff",
        fontSize: 15,
        fontWeight: "700",
    },
    saveButtonTextDisabled: {
        color: "#636366",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#ffffff",
        marginBottom: 16,
    },
    statusOptions: {
        flexDirection: "row",
        gap: 10,
    },
    statusOption: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: "#1a1a24",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#2e2e3a",
    },
    statusOptionActive: {
        borderWidth: 2,
    },
    statusOptionGreen: {
        borderColor: "#34c759",
        backgroundColor: "rgba(52, 199, 89, 0.1)",
    },
    statusOptionRed: {
        borderColor: "#ff3b30",
        backgroundColor: "rgba(255, 59, 48, 0.1)",
    },
    statusOptionYellow: {
        borderColor: "#ffcc00",
        backgroundColor: "rgba(255, 204, 0, 0.1)",
    },
    statusOptionText: {
        color: "#8e8e93",
        fontSize: 13,
        fontWeight: "600",
    },
    statusOptionTextActive: {
        color: "#ffffff",
    },
    field: {
        marginBottom: 16,
    },
    fieldLabel: {
        fontSize: 14,
        color: "#8e8e93",
        fontWeight: "600",
        marginBottom: 8,
    },
    fieldInput: {
        backgroundColor: "#1a1a24",
        borderRadius: 14,
        padding: 16,
        fontSize: 15,
        fontWeight: "600",
        color: "#ffffff",
        borderWidth: 1,
        borderColor: "#2e2e3a",
    },
    printerTypeRow: {
        flexDirection: "row",
        gap: 10,
    },
    printerTypeOption: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: "#1a1a24",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#2e2e3a",
    },
    printerTypeActive: {
        borderColor: "#ff3b30",
        backgroundColor: "rgba(255, 59, 48, 0.1)",
    },
    printerTypeText: {
        color: "#8e8e93",
        fontSize: 13,
        fontWeight: "700",
    },
    printerTypeTextActive: {
        color: "#ff3b30",
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1a1a24",
        borderRadius: 16,
        padding: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#2e2e3a",
    },
    actionButtonIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    actionButtonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "600",
    },
    infoCard: {
        backgroundColor: "#1a1a24",
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: "#2e2e3a",
    },
    infoText: {
        color: "#8e8e93",
        fontSize: 13,
        fontWeight: "500",
        marginBottom: 4,
    },
});
