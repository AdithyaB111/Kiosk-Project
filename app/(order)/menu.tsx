/**
 * Menu Browsing Screen (Step 2)
 * Categories sidebar + items grid for kiosk ordering
 *
 * Migrated from: pos_main_screen.dart (shop view portion)
 * - _buildCategoriesList → horizontal category pills
 * - _buildItemsGrid → item cards grid
 * - _buildHeader → simplified for kiosk
 *
 * Kiosk-specific: FloatingCart bottom bar, inactivity timer integration,
 * simplified layout (no ticket panel, no cashier controls)
 */

import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useInactivityTimer } from "@/src/hooks/useInactivityTimer";
import { useKiosk } from "@/src/store/kioskStore";
import type { Department, Item } from "@/src/types";
import { formatCurrency } from "@/src/utils/cartUtils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLUMN_COUNT = 3;
const ITEM_GAP = 14;
const HORIZONTAL_PADDING = 24;
const ITEM_WIDTH =
    (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - ITEM_GAP * (COLUMN_COUNT - 1)) /
    COLUMN_COUNT;

export default function MenuScreen() {
    const router = useRouter();
    const {
        state,
        visibleDepartments,
        filteredItems,
        addToCart,
        dispatch,
        cartItemCount,
        grandTotal,
    } = useKiosk();

    const { resetTimer } = useInactivityTimer(2 * 60 * 1000, true);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const cartSlideAnim = useRef(new Animated.Value(100)).current;
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, []);

    // Animate cart bar when items are in cart
    useEffect(() => {
        Animated.spring(cartSlideAnim, {
            toValue: cartItemCount > 0 ? 0 : 100,
            useNativeDriver: true,
            tension: 80,
            friction: 12,
        }).start();
    }, [cartItemCount]);

    // ─── Category Selection ────────────────────────────────────
    const handleCategorySelect = useCallback(
        (deptId: string | null) => {
            resetTimer();
            dispatch({ type: "SET_SELECTED_DEPARTMENT", payload: deptId });
        },
        [dispatch, resetTimer]
    );

    // ─── Item Click → Detail or Direct Add ─────────────────────
    const handleItemPress = useCallback(
        (item: Item) => {
            resetTimer();
            // Check if item has modifiers
            const hasModifiers = (state.modifiersOfItems || []).some(
                (m) => m.itemId === item.itemId
            );

            if (hasModifiers) {
                router.push({
                    pathname: "/(order)/item-detail",
                    params: { itemId: item.itemId },
                });
            } else {
                // Quick-add: no modifiers, add directly
                addToCart(item);
            }
        },
        [state.modifiersOfItems, router, addToCart, resetTimer]
    );

    // ─── View Cart ─────────────────────────────────────────────
    const handleViewCart = useCallback(() => {
        resetTimer();
        router.push("/(order)/cart");
    }, [router, resetTimer]);

    // ─── Filtered Items (with search) ──────────────────────────
    const displayItems = useMemo(() => {
        if (!searchQuery.trim()) return filteredItems;
        const q = searchQuery.toLowerCase();
        return filteredItems.filter(
            (item) =>
                item.itemName.toLowerCase().includes(q) ||
                (item.itemId && item.itemId.toLowerCase().includes(q))
        );
    }, [filteredItems, searchQuery]);

    // ─── Render Category Pill ──────────────────────────────────
    const renderCategoryPill = useCallback(
        (dept: Department | null, index: number) => {
            const isAll = dept === null;
            const isActive = isAll
                ? state.selectedDepartmentId === null
                : state.selectedDepartmentId === dept?.deptId;

            return (
                <TouchableOpacity
                    key={isAll ? "all" : dept!.deptId}
                    style={[
                        styles.categoryPill,
                        isActive && styles.categoryPillActive,
                        index === 0 && { marginLeft: HORIZONTAL_PADDING },
                    ]}
                    onPress={() =>
                        handleCategorySelect(isAll ? null : dept!.deptId)
                    }
                    activeOpacity={0.7}
                >
                    <Text
                        style={[
                            styles.categoryPillText,
                            isActive && styles.categoryPillTextActive,
                        ]}
                        numberOfLines={1}
                    >
                        {isAll ? "All" : dept!.deptName}
                    </Text>
                </TouchableOpacity>
            );
        },
        [state.selectedDepartmentId, handleCategorySelect]
    );

    // ─── Render Item Card ──────────────────────────────────────
    const renderItemCard = useCallback(
        ({ item }: { item: Item }) => {
            const hasImage = item.onlineImageLink || item.picturePath;

            return (
                <TouchableOpacity
                    style={styles.itemCard}
                    onPress={() => handleItemPress(item)}
                    activeOpacity={0.85}
                >
                    {/* Image */}
                    <View style={styles.itemImageContainer}>
                        {hasImage ? (
                            <Image
                                source={{
                                    uri:
                                        item.onlineImageLink ||
                                        item.picturePath ||
                                        "",
                                }}
                                style={styles.itemImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={styles.itemImagePlaceholder}>
                                <Text style={styles.itemImagePlaceholderText}>
                                    {item.itemName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}

                        {/* Quick-add badge */}
                        <View style={styles.addBadge}>
                            <Text style={styles.addBadgeText}>+</Text>
                        </View>
                    </View>

                    {/* Info */}
                    <View style={styles.itemInfo}>
                        <Text
                            style={styles.itemName}
                            numberOfLines={2}
                        >
                            {item.itemName}
                        </Text>
                        <Text style={styles.itemPrice}>
                            {formatCurrency(item.itemPrice ?? 0)}
                        </Text>
                    </View>
                </TouchableOpacity>
            );
        },
        [handleItemPress]
    );

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            {/* ─── Header ─────────────────────────────────── */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Menu</Text>
                <View style={styles.headerRight}>
                    {cartItemCount > 0 && (
                        <TouchableOpacity
                            style={styles.cartIconButton}
                            onPress={handleViewCart}
                        >
                            <Text style={styles.cartIconText}>🛒</Text>
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>
                                    {cartItemCount}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* ─── Categories ─────────────────────────────── */}
            <View style={styles.categoriesContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesContent}
                >
                    {/* "All" pill */}
                    {renderCategoryPill(null, 0)}

                    {/* Department pills */}
                    {visibleDepartments.map((dept, idx) =>
                        renderCategoryPill(dept, idx + 1)
                    )}
                </ScrollView>
            </View>

            {/* ─── Items Grid ─────────────────────────────── */}
            {displayItems.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>🍽️</Text>
                    <Text style={styles.emptyTitle}>No items found</Text>
                    <Text style={styles.emptySubtitle}>
                        {state.selectedDepartmentId
                            ? "Try selecting a different category"
                            : "Menu data is loading..."}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={displayItems}
                    renderItem={renderItemCard}
                    keyExtractor={(item) => item.itemId}
                    numColumns={COLUMN_COUNT}
                    contentContainerStyle={styles.gridContent}
                    columnWrapperStyle={styles.gridRow}
                    showsVerticalScrollIndicator={false}
                    onScrollBeginDrag={resetTimer}
                />
            )}

            {/* ─── Floating Cart Bar ─────────────────────── */}
            <Animated.View
                style={[
                    styles.floatingCartContainer,
                    { transform: [{ translateY: cartSlideAnim }] },
                ]}
            >
                <TouchableOpacity
                    style={styles.floatingCart}
                    onPress={handleViewCart}
                    activeOpacity={0.9}
                >
                    <View style={styles.floatingCartLeft}>
                        <View style={styles.floatingCartBadge}>
                            <Text style={styles.floatingCartBadgeText}>
                                {cartItemCount}
                            </Text>
                        </View>
                        <Text style={styles.floatingCartLabel}>View Cart</Text>
                    </View>
                    <Text style={styles.floatingCartTotal}>
                        {formatCurrency(grandTotal)}
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000000",
    },
    // ─── Header ──────────────────────────────
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingTop: 56,
        paddingBottom: 16,
        backgroundColor: "#000000",
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
        fontSize: 28,
        fontWeight: "800",
        color: "#ffffff",
        letterSpacing: -0.3,
    },
    headerRight: {
        width: 48,
        alignItems: "center",
    },
    cartIconButton: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: "#1C1C1E",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#38383A",
    },
    cartIconText: {
        fontSize: 22,
    },
    cartBadge: {
        position: "absolute",
        top: -4,
        right: -4,
        backgroundColor: "#ff3b30",
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: "center",
        alignItems: "center",
    },
    cartBadgeText: {
        color: "#ffffff",
        fontSize: 12,
        fontWeight: "800",
    },
    // ─── Categories ──────────────────────────
    categoriesContainer: {
        marginBottom: 8,
    },
    categoriesContent: {
        paddingRight: HORIZONTAL_PADDING,
        paddingVertical: 8,
        gap: 10,
    },
    categoryPill: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        backgroundColor: "#1C1C1E",
        borderWidth: 1,
        borderColor: "#38383A",
    },
    categoryPillActive: {
        backgroundColor: "#ff3b30",
        borderColor: "#ff3b30",
        shadowColor: "#ff3b30",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 6,
    },
    categoryPillText: {
        color: "#EBEBF599",
        fontSize: 15,
        fontWeight: "700",
    },
    categoryPillTextActive: {
        color: "#ffffff",
    },
    // ─── Items Grid ──────────────────────────
    gridContent: {
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingTop: 8,
        paddingBottom: 120,
    },
    gridRow: {
        gap: ITEM_GAP,
        marginBottom: ITEM_GAP,
    },
    itemCard: {
        width: ITEM_WIDTH,
        backgroundColor: "#1C1C1E",
        borderRadius: 24,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#38383A",
    },
    itemImageContainer: {
        width: "100%",
        aspectRatio: 4 / 3,
        backgroundColor: "#0A0A0A",
    },
    itemImage: {
        width: "100%",
        height: "100%",
    },
    itemImagePlaceholder: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0A0A0A",
    },
    itemImagePlaceholderText: {
        fontSize: 36,
        fontWeight: "800",
        color: "#38383A",
    },
    addBadge: {
        position: "absolute",
        top: 10,
        right: 10,
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: "#ff3b30",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#ff3b30",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    addBadgeText: {
        color: "#ffffff",
        fontSize: 22,
        fontWeight: "800",
        lineHeight: 24,
    },
    itemInfo: {
        padding: 14,
    },
    itemName: {
        fontSize: 15,
        fontWeight: "700",
        color: "#ffffff",
        marginBottom: 6,
        lineHeight: 20,
    },
    itemPrice: {
        fontSize: 18,
        fontWeight: "800",
        color: "#ff3b30",
        letterSpacing: -0.3,
    },
    // ─── Empty State ─────────────────────────
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 48,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: "#ffffff",
        marginBottom: 10,
        letterSpacing: -0.3,
    },
    emptySubtitle: {
        fontSize: 15,
        color: "#EBEBF599",
        textAlign: "center",
        lineHeight: 22,
    },
    // ─── Floating Cart ───────────────────────
    floatingCartContainer: {
        position: "absolute",
        bottom: 32,
        left: HORIZONTAL_PADDING,
        right: HORIZONTAL_PADDING,
    },
    floatingCart: {
        backgroundColor: "#ff3b30",
        borderRadius: 24,
        paddingVertical: 18,
        paddingHorizontal: 24,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: "#ff3b30",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 20,
        elevation: 12,
    },
    floatingCartLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    floatingCartBadge: {
        width: 32,
        height: 32,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,
    },
    floatingCartBadgeText: {
        color: "#ffffff",
        fontSize: 15,
        fontWeight: "800",
    },
    floatingCartLabel: {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "800",
        letterSpacing: -0.3,
    },
    floatingCartTotal: {
        color: "#ffffff",
        fontSize: 20,
        fontWeight: "800",
        letterSpacing: -0.3,
    },
});
