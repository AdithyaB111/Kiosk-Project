/**
 * Item Detail Screen - Modifier Selection
 * Shows item details and lets customers select modifiers
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useKiosk } from "../../src/store/kioskStore";
import type { CartItem, Item } from "../../src/types";
import { createModifierCartItem, formatCurrency } from "../../src/utils/cartUtils";

const { width } = Dimensions.get("window");

export default function ItemDetailScreen() {
    const router = useRouter();
    const { itemId } = useLocalSearchParams<{ itemId: string }>();
    const { state, addToCart } = useKiosk();

    const item = useMemo(
        () => state.items.find((i) => i.itemId === itemId),
        [state.items, itemId]
    );

    // Get modifier groups for this item
    const itemModifierLinks = useMemo(
        () => state.modifiersOfItems.filter((m) => m.itemId === itemId),
        [state.modifiersOfItems, itemId]
    );

    const relevantGroups = useMemo(
        () =>
            itemModifierLinks
                .map((link) =>
                    state.modifierGroups.find(
                        (g) => g.modifierGroupId === link.modifierGroupId
                    )
                )
                .filter(Boolean),
        [itemModifierLinks, state.modifierGroups]
    );

    // Get modifier items (items flagged as modifiers in the same group)
    const modifierItems = useMemo(() => {
        const modGroupIds = itemModifierLinks.map((l) => l.modifierGroupId);
        return state.items.filter(
            (i) =>
                i.isModifier &&
                modGroupIds.some((gid) => {
                    const links = state.modifiersOfItems.filter(
                        (m) => m.modifierGroupId === gid
                    );
                    return links.some((l) => l.itemId === i.itemId);
                })
        );
    }, [itemModifierLinks, state.items, state.modifiersOfItems]);

    // Track selected modifiers per group
    const [selectedModifiers, setSelectedModifiers] = useState<
        Record<number, string[]>
    >({});

    const [quantity, setQuantity] = useState(1);

    const handleToggleModifier = useCallback(
        (groupId: number, modItem: Item, maxSelect: number) => {
            setSelectedModifiers((prev) => {
                const current = prev[groupId] || [];
                const isSelected = current.includes(modItem.itemId);

                if (isSelected) {
                    return {
                        ...prev,
                        [groupId]: current.filter((id) => id !== modItem.itemId),
                    };
                }

                // Check max selection
                if (maxSelect > 0 && current.length >= maxSelect) {
                    // Replace last selected
                    return {
                        ...prev,
                        [groupId]: [...current.slice(0, -1), modItem.itemId],
                    };
                }

                return {
                    ...prev,
                    [groupId]: [...current, modItem.itemId],
                };
            });
        },
        []
    );

    const handleAddToCart = useCallback(() => {
        if (!item) return;

        // Collect selected modifier CartItems
        const modCartItems: CartItem[] = [];
        Object.values(selectedModifiers).forEach((modIds) => {
            modIds.forEach((modId) => {
                const modItem = state.items.find((i) => i.itemId === modId);
                if (modItem) {
                    modCartItems.push(createModifierCartItem(modItem, item.itemId));
                }
            });
        });

        addToCart(item, modCartItems);
        router.back();
    }, [item, selectedModifiers, state.items, addToCart, router]);

    if (!item) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Item not found</Text>
            </View>
        );
    }

    const hasImage = item.onlineImageLink || item.picturePath;

    // Calculate total with modifiers
    const modifiersTotal = Object.values(selectedModifiers)
        .flat()
        .reduce((sum, modId) => {
            const modItem = state.items.find((i) => i.itemId === modId);
            return sum + (modItem?.itemPrice ?? 0);
        }, 0);

    const totalPrice = ((item.itemPrice ?? 0) + modifiersTotal) * quantity;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Item Image */}
                <View style={styles.imageContainer}>
                    {hasImage ? (
                        <Image
                            source={{ uri: item.onlineImageLink || item.picturePath || "" }}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Text style={styles.imagePlaceholderText}>
                                {item.itemName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Item Info */}
                <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.itemName}</Text>
                    <Text style={styles.itemPrice}>
                        {formatCurrency(item.itemPrice ?? 0)}
                    </Text>
                </View>

                {/* Modifier Groups */}
                {relevantGroups.map((group) => {
                    if (!group) return null;
                    const link = itemModifierLinks.find(
                        (l) => l.modifierGroupId === group.modifierGroupId
                    );
                    const maxSelect = link?.maximumSelect ?? group.maximumSelect ?? 0;
                    const isForced = link?.forced ?? false;

                    // Get items in this modifier group
                    const groupModItems = state.items.filter((i) => {
                        const modLinks = state.modifiersOfItems.filter(
                            (m) => m.modifierGroupId === group.modifierGroupId
                        );
                        return modLinks.some((ml) => ml.itemId === i.itemId) && i.isModifier;
                    });

                    if (groupModItems.length === 0) return null;

                    return (
                        <View key={group.modifierGroupId} style={styles.modifierGroup}>
                            <View style={styles.modifierGroupHeader}>
                                <Text style={styles.modifierGroupName}>
                                    {group.promptName || group.groupName}
                                </Text>
                                {isForced && (
                                    <View style={styles.requiredBadge}>
                                        <Text style={styles.requiredBadgeText}>Required</Text>
                                    </View>
                                )}
                                {maxSelect > 0 && (
                                    <Text style={styles.maxSelectText}>
                                        Select up to {maxSelect}
                                    </Text>
                                )}
                            </View>

                            {groupModItems.map((modItem) => {
                                const isSelected = (
                                    selectedModifiers[group.modifierGroupId!] || []
                                ).includes(modItem.itemId);
                                return (
                                    <TouchableOpacity
                                        key={modItem.itemId}
                                        style={[
                                            styles.modifierOption,
                                            isSelected && styles.modifierOptionSelected,
                                        ]}
                                        onPress={() =>
                                            handleToggleModifier(
                                                group.modifierGroupId!,
                                                modItem,
                                                maxSelect
                                            )
                                        }
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.modifierOptionLeft}>
                                            <View
                                                style={[
                                                    styles.checkbox,
                                                    isSelected && styles.checkboxChecked,
                                                ]}
                                            >
                                                {isSelected && (
                                                    <Text style={styles.checkmark}>✓</Text>
                                                )}
                                            </View>
                                            <Text style={styles.modifierOptionName}>
                                                {modItem.itemName}
                                            </Text>
                                        </View>
                                        {(modItem.itemPrice ?? 0) > 0 && (
                                            <Text style={styles.modifierOptionPrice}>
                                                +{formatCurrency(modItem.itemPrice ?? 0)}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    );
                })}

                {/* Quantity Selector */}
                <View style={styles.quantitySection}>
                    <Text style={styles.quantityLabel}>Quantity</Text>
                    <View style={styles.quantityControls}>
                        <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                            <Text style={styles.quantityButtonText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.quantityValue}>{quantity}</Text>
                        <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => setQuantity(quantity + 1)}
                        >
                            <Text style={styles.quantityButtonText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Add to Cart Button */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddToCart}
                    activeOpacity={0.85}
                >
                    <Text style={styles.addButtonText}>Add to Cart</Text>
                    <Text style={styles.addButtonPrice}>{formatCurrency(totalPrice)}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000000",
    },
    errorText: {
        color: "#ff3b30",
        fontSize: 18,
        textAlign: "center",
        marginTop: 100,
    },
    header: {
        position: "absolute",
        top: 60,
        left: 24,
        zIndex: 10,
    },
    closeButton: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: "rgba(28, 28, 30, 0.95)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#38383A",
    },
    closeButtonText: {
        color: "#ffffff",
        fontSize: 20,
        fontWeight: "800",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 140,
    },
    imageContainer: {
        width: "100%",
        height: width * 0.65,
        backgroundColor: "#0A0A0A",
    },
    image: {
        width: "100%",
        height: "100%",
    },
    imagePlaceholder: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0A0A0A",
    },
    imagePlaceholderText: {
        fontSize: 96,
        fontWeight: "800",
        color: "#38383A",
    },
    itemInfo: {
        padding: 28,
        borderBottomWidth: 1,
        borderBottomColor: "#38383A",
    },
    itemName: {
        fontSize: 30,
        fontWeight: "800",
        color: "#ffffff",
        marginBottom: 12,
        letterSpacing: -0.5,
        lineHeight: 38,
    },
    itemPrice: {
        fontSize: 26,
        fontWeight: "800",
        color: "#ff3b30",
        letterSpacing: -0.5,
    },
    modifierGroup: {
        padding: 28,
        borderBottomWidth: 1,
        borderBottomColor: "#38383A",
    },
    modifierGroupHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
        flexWrap: "wrap",
        gap: 10,
    },
    modifierGroupName: {
        fontSize: 20,
        fontWeight: "800",
        color: "#ffffff",
        letterSpacing: -0.3,
    },
    requiredBadge: {
        backgroundColor: "rgba(255, 59, 48, 0.12)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    requiredBadgeText: {
        color: "#ff3b30",
        fontSize: 13,
        fontWeight: "800",
    },
    maxSelectText: {
        color: "#EBEBF599",
        fontSize: 14,
        fontWeight: "600",
    },
    modifierOption: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        paddingHorizontal: 18,
        marginBottom: 10,
        backgroundColor: "#1C1C1E",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#38383A",
    },
    modifierOptionSelected: {
        borderColor: "#ff3b30",
        borderWidth: 2,
        backgroundColor: "rgba(255, 59, 48, 0.06)",
    },
    modifierOptionLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    checkbox: {
        width: 28,
        height: 28,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#3A3A3C",
        marginRight: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    checkboxChecked: {
        borderColor: "#ff3b30",
        backgroundColor: "#ff3b30",
    },
    checkmark: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "800",
    },
    modifierOptionName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#ffffff",
        flex: 1,
    },
    modifierOptionPrice: {
        fontSize: 15,
        fontWeight: "700",
        color: "#EBEBF599",
        marginLeft: 10,
    },
    quantitySection: {
        padding: 28,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    quantityLabel: {
        fontSize: 20,
        fontWeight: "800",
        color: "#ffffff",
        letterSpacing: -0.3,
    },
    quantityControls: {
        flexDirection: "row",
        alignItems: "center",
        gap: 18,
    },
    quantityButton: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: "#1C1C1E",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#38383A",
    },
    quantityButtonText: {
        color: "#ffffff",
        fontSize: 24,
        fontWeight: "800",
        lineHeight: 26,
    },
    quantityValue: {
        fontSize: 26,
        fontWeight: "800",
        color: "#ffffff",
        minWidth: 36,
        textAlign: "center",
        letterSpacing: -0.3,
    },
    bottomBar: {
        padding: 24,
        paddingBottom: 40,
        backgroundColor: "#000000",
        borderTopWidth: 1,
        borderTopColor: "#38383A",
    },
    addButton: {
        backgroundColor: "#ff3b30",
        borderRadius: 20,
        padding: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        shadowColor: "#ff3b30",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },
    addButtonText: {
        color: "#ffffff",
        fontSize: 19,
        fontWeight: "800",
        letterSpacing: -0.3,
    },
    addButtonPrice: {
        color: "#ffffff",
        fontSize: 20,
        fontWeight: "800",
        letterSpacing: -0.3,
    },
});
