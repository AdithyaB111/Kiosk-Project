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
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { StorageService } from "@/src/services/storageService";
import { RuntimeConfig } from "@/src/config/apiConfig";
import { PaxBridgeService } from "@/src/services/paxBridgeService";
import { useKiosk } from "@/src/store/kioskStore";
import type { KioskSettings, KioskMode } from "@/src/types";

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

    // PAX connection state
    const [paxStatus, setPaxStatus] = useState<"idle" | "testing" | "connected" | "error">("idle");
    const [paxMessage, setPaxMessage] = useState("");
    const [paxInitialized, setPaxInitialized] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [isBatchClosing, setIsBatchClosing] = useState(false);


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

    // ── PAX TCP Test Connection ──
    const handleTestConnection = useCallback(async () => {
        setIsTesting(true);
        setPaxStatus("testing");
        setPaxMessage("Testing TCP connection...");

        try {
            const ip = settings.paxIpAddress || "192.168.1.100";
            const port = settings.paxPort || 10009;

            // Step 1: Set TCP settings
            let tcpOk = false;
            try {
                tcpOk = await PaxBridgeService.setTcpSetting(ip, port, 30);
            } catch (tcpErr) {
                setPaxStatus("error");
                setPaxMessage(`Failed to configure TCP: ${tcpErr instanceof Error ? tcpErr.message : String(tcpErr)}`);
                return;
            }
            if (!tcpOk) {
                setPaxStatus("error");
                setPaxMessage("Failed to configure TCP settings. setTcpSetting returned false.");
                return;
            }

            // Step 2: Handshake (test connection)
            setPaxMessage("Sending handshake...");
            const connected = await PaxBridgeService.handshake();

            if (connected) {
                setPaxStatus("connected");
                setPaxMessage(`[V] Connected to PAX at ${ip}:${port}`);
            } else {
                setPaxStatus("error");
                setPaxMessage(`[X] Cannot reach PAX at ${ip}:${port}\nCheck IP, port, and that terminal is on.`);
            }
        } catch (e) {
            setPaxStatus("error");
            setPaxMessage(
                `✗ Connection Error: ${e instanceof Error ? e.message : String(e)}`
            );
        } finally {
            setIsTesting(false);
        }
    }, [settings.paxIpAddress, settings.paxPort]);

    // ── PAX Initialize Terminal ──
    const handleInitializeTerminal = useCallback(async () => {
        setIsInitializing(true);
        setPaxMessage("Initializing terminal...");

        try {
            const ip = settings.paxIpAddress || "192.168.1.100";
            const port = settings.paxPort || 10009;

            // init() internally calls setTcpSetting then native init()
            const ok = await PaxBridgeService.init(ip, port, 30);

            if (ok) {
                setPaxInitialized(true);
                setPaxStatus("connected");
                setPaxMessage(`[V] Terminal initialized and ready!\nIP: ${ip}:${port}`);

                // Update RuntimeConfig
                RuntimeConfig.paxIpAddress = ip;
                RuntimeConfig.paxPort = port;

                Alert.alert(
                    "Terminal Ready",
                    `PAX terminal at ${ip}:${port} is initialized and ready for payments.`
                );
            } else {
                setPaxStatus("error");
                setPaxMessage(`[X] Init failed. Check IP/port and that terminal is powered on.`);
            }
        } catch (e) {
            setPaxStatus("error");
            setPaxMessage(
                `[X] Init Error: ${e instanceof Error ? e.message : String(e)}`
            );
        } finally {
            setIsInitializing(false);
        }
    }, [settings.paxIpAddress, settings.paxPort]);

    // ── PAX Batch Close ──
    const handleBatchClose = useCallback(async () => {
        setIsBatchClosing(true);
        setPaxMessage("Closing batch...");
        try {
            const result = await PaxBridgeService.batchClose();
            if (result.isSuccess) {
                setPaxMessage("[V] Batch closed successfully");
                Alert.alert("Success", "Batch closed successfully.");
            } else {
                setPaxMessage(`[X] Batch Close Failed: ${result.responseMessage}`);
            }
        } catch (e) {
            setPaxMessage(`[X] Error: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            setIsBatchClosing(false);
        }
    }, []);

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

    // PAX status color helper
    const getPaxStatusColor = () => {
        switch (paxStatus) {
            case "connected":
                return "#34c759";
            case "error":
                return "#ff3b30";
            case "testing":
                return "#ffcc00";
            default:
                return "#636366";
        }
    };

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
                                            ? "Active"
                                            : mode === "closed"
                                                ? "Closed"
                                                : "Out of Order"}
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

                {/* ═══ PAX Terminal ═══ */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>PAX Terminal</Text>
                        {/* Connection status badge */}
                        <View
                            style={[
                                styles.statusBadge,
                                { backgroundColor: `${getPaxStatusColor()}22`, borderColor: getPaxStatusColor() },
                            ]}
                        >
                            <View
                                style={[styles.statusDot, { backgroundColor: getPaxStatusColor() }]}
                            />
                            <Text style={[styles.statusBadgeText, { color: getPaxStatusColor() }]}>
                                {paxStatus === "connected"
                                    ? "Connected"
                                    : paxStatus === "testing"
                                        ? "Testing..."
                                        : paxStatus === "error"
                                            ? "Error"
                                            : "Not Connected"}
                            </Text>
                        </View>
                    </View>

                    {/* TCP Settings */}
                    <View style={styles.paxCard}>
                        <Text style={styles.paxCardLabel}>CONNECTION TYPE</Text>
                        <View style={styles.protocolRow}>
                            <View style={[styles.protocolOption, styles.protocolOptionActive]}>
                                <Text style={styles.protocolIcon}>*</Text>
                                <Text style={[styles.protocolText, styles.protocolTextActive]}>TCP</Text>
                            </View>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.fieldLabel}>IP Address</Text>
                            <TextInput
                                style={styles.fieldInput}
                                value={settings.paxIpAddress}
                                onChangeText={(v) => updateSetting("paxIpAddress", v)}
                                placeholder="192.168.1.100"
                                placeholderTextColor="#636366"
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.fieldLabel}>Port</Text>
                            <TextInput
                                style={styles.fieldInput}
                                value={(settings.paxPort ?? "").toString()}
                                onChangeText={(v) =>
                                    updateSetting("paxPort", parseInt(v, 10) || 10009)
                                }
                                placeholder="10009"
                                placeholderTextColor="#636366"
                                keyboardType="number-pad"
                            />
                        </View>
                    </View>

                    {/* Status Message */}
                    {paxMessage.length > 0 && (
                        <View
                            style={[
                                styles.paxMessageCard,
                                {
                                    borderColor:
                                        paxStatus === "connected"
                                            ? "rgba(52, 199, 89, 0.3)"
                                            : paxStatus === "error"
                                                ? "rgba(255, 59, 48, 0.3)"
                                                : "rgba(255, 204, 0, 0.3)",
                                    backgroundColor:
                                        paxStatus === "connected"
                                            ? "rgba(52, 199, 89, 0.08)"
                                            : paxStatus === "error"
                                                ? "rgba(255, 59, 48, 0.08)"
                                                : "rgba(255, 204, 0, 0.08)",
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.paxMessageText,
                                    {
                                        color:
                                            paxStatus === "connected"
                                                ? "#34c759"
                                                : paxStatus === "error"
                                                    ? "#ff6b5e"
                                                    : "#ffcc00",
                                    },
                                ]}
                            >
                                {paxMessage}
                            </Text>
                        </View>
                    )}


                    {/* Action Buttons */}
                    <View style={styles.paxButtonRow}>
                        {/* Test Connection */}
                        <TouchableOpacity
                            style={[styles.paxButton, styles.paxTestButton]}
                            onPress={handleTestConnection}
                            disabled={isTesting || isInitializing || isBatchClosing}
                            activeOpacity={0.8}
                        >
                            {isTesting ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <>
                                    <Text style={styles.paxButtonIcon}>P</Text>
                                    <Text style={styles.paxButtonText}>
                                        Test
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Initialize Terminal */}
                        <TouchableOpacity
                            style={[
                                styles.paxButton,
                                styles.paxInitButton,
                                paxInitialized && styles.paxInitButtonActive,
                            ]}
                            onPress={handleInitializeTerminal}
                            disabled={isTesting || isInitializing || isBatchClosing}
                            activeOpacity={0.8}
                        >
                            {isInitializing ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <>
                                    <Text style={styles.paxButtonIcon}>
                                        {paxInitialized ? "V" : "!"}
                                    </Text>
                                    <Text style={styles.paxButtonText}>
                                        {paxInitialized
                                            ? "Init OK"
                                            : "Init"}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Batch Close */}
                        <TouchableOpacity
                            style={[styles.paxButton, styles.paxBatchButton]}
                            onPress={handleBatchClose}
                            disabled={isTesting || isInitializing || isBatchClosing}
                            activeOpacity={0.8}
                        >
                            {isBatchClosing ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <>
                                    <Text style={styles.paxButtonIcon}>B</Text>
                                    <Text style={styles.paxButtonText}>
                                        Batch
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
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
            </ScrollView >
        </View >
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

    // ── PAX Terminal Styles ──
    sectionHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: "700",
    },
    paxCard: {
        backgroundColor: "#1a1a24",
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: "#2e2e3a",
        marginBottom: 12,
    },
    paxCardLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: "#636366",
        letterSpacing: 1.2,
        marginBottom: 12,
    },
    protocolRow: {
        flexDirection: "row",
        marginBottom: 16,
    },
    protocolOption: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: "#252530",
        borderWidth: 1,
        borderColor: "#3a3a4a",
    },
    protocolOptionActive: {
        borderColor: "#007aff",
        backgroundColor: "rgba(0, 122, 255, 0.15)",
    },
    protocolIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    protocolText: {
        color: "#8e8e93",
        fontSize: 14,
        fontWeight: "700",
    },
    protocolTextActive: {
        color: "#007aff",
    },
    paxMessageCard: {
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
    },
    paxMessageText: {
        fontSize: 13,
        fontWeight: "600",
        lineHeight: 20,
    },
    paxButtonRow: {
        flexDirection: "row",
        gap: 10,
    },
    paxButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 14,
        gap: 8,
    },
    paxTestButton: {
        backgroundColor: "#2c2c3a",
        borderWidth: 1,
        borderColor: "#4a4a5a",
    },
    paxInitButton: {
        backgroundColor: "#007aff",
    },
    paxInitButtonActive: {
        backgroundColor: "#34c759",
    },
    paxButtonIcon: {
        fontSize: 16,
    },
    paxButtonText: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "700",
    },
    paxBatchButton: {
        backgroundColor: "#5856d6",
    },
    sdkInfoContainer: {
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sdkInfoText: {
        color: "#8e8e93",
        fontSize: 11,
        fontWeight: "600",
        opacity: 0.8,
    },
});
