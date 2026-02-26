/**
 * Cart Screen (Step 3) - Review order, edit quantities, proceed to checkout
 */

import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useKiosk } from "@/src/store/kioskStore";
import type { CartItem } from "@/src/types";
import {
    formatCurrency,
    getItemPrice,
    getTotalPrice
} from "@/src/utils/cartUtils";

export default function CartScreen() {
    const router = useRouter();
    const {
        state,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        taxTotal,
        grandTotal,
        cartItemCount,
    } = useKiosk();

    const handleCheckout = useCallback(() => {
        if (cartItemCount === 0) return;
        router.push("/(order)/customer-type");
    }, [cartItemCount, router]);

    const handleAddMore = useCallback(() => {
        router.back();
    }, [router]);

    const renderCartItem = useCallback(
        ({ item }: { item: CartItem }) => {
            const itemPrice = getItemPrice(item);
            const totalPrice = getTotalPrice(item);

            return (
                <View style={styles.cartItem}>
                    {/* Item Info */}
                    <View style={styles.cartItemTop}>
                        <View style={styles.cartItemLeft}>
                            <View style={styles.itemInitial}>
                                <Text style={styles.itemInitialText}>
                                    {item.item.itemName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.cartItemInfo}>
                                <Text style={styles.cartItemName} numberOfLines={2}>
                                    {item.item.itemName}
                                </Text>
                                <Text style={styles.cartItemUnitPrice}>
                                    {formatCurrency(itemPrice)} each
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.cartItemTotal}>{formatCurrency(totalPrice)}</Text>
                    </View>

                    {/* Modifiers */}
                    {item.modifiers.length > 0 && (
                        <View style={styles.modifiersContainer}>
                            {item.modifiers.map((mod) => (
                                <View key={mod.uniqueId} style={styles.modifierRow}>
                                    <Text style={styles.modifierName}>+ {mod.item.itemName}</Text>
                                    {(mod.item.itemPrice ?? 0) > 0 && (
                                        <Text style={styles.modifierPrice}>
                                            {formatCurrency(mod.item.itemPrice ?? 0)}
                                        </Text>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Quantity Controls */}
                    <View style={styles.cartItemBottom}>
                        <View style={styles.quantityRow}>
                            <TouchableOpacity
                                style={styles.qtyBtn}
                                onPress={() => updateQuantity(item.uniqueId, item.quantity - 1)}
                            >
                                <Text style={styles.qtyBtnText}>
                                    {item.quantity === 1 ? "🗑" : "−"}
                                </Text>
                            </TouchableOpacity>
                            <Text style={styles.qtyValue}>{item.quantity}</Text>
                            <TouchableOpacity
                                style={styles.qtyBtn}
                                onPress={() => updateQuantity(item.uniqueId, item.quantity + 1)}
                            >
                                <Text style={styles.qtyBtnText}>+</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.removeBtn}
                            onPress={() => removeFromCart(item.uniqueId)}
                        >
                            <Text style={styles.removeBtnText}>Remove</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        },
        [removeFromCart, updateQuantity]
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Your Order</Text>
                <TouchableOpacity
                    style={styles.clearButton}
                    onPress={clearCart}
                    disabled={cartItemCount === 0}
                >
                    <Text
                        style={[
                            styles.clearButtonText,
                            cartItemCount === 0 && styles.clearButtonDisabled,
                        ]}
                    >
                        Clear All
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Cart Items */}
            {cartItemCount === 0 ? (
                <View style={styles.emptyCart}>
                    <Text style={styles.emptyCartEmoji}>🛒</Text>
                    <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
                    <Text style={styles.emptyCartSubtitle}>
                        Add some items from the menu to get started
                    </Text>
                    <TouchableOpacity
                        style={styles.browseButton}
                        onPress={handleAddMore}
                    >
                        <Text style={styles.browseButtonText}>Browse Menu</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <FlatList
                        data={state.cartItems}
                        renderItem={renderCartItem}
                        keyExtractor={(item) => item.uniqueId}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListFooterComponent={
                            <TouchableOpacity
                                style={styles.addMoreButton}
                                onPress={handleAddMore}
                            >
                                <Text style={styles.addMoreText}>+ Add more items</Text>
                            </TouchableOpacity>
                        }
                    />

                    {/* Order Summary */}
                    <View style={styles.summaryContainer}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Tax</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(taxTotal)}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.summaryRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>{formatCurrency(grandTotal)}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.checkoutButton}
                            onPress={handleCheckout}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </View>
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
    clearButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    clearButtonText: {
        color: "#ff3b30",
        fontSize: 15,
        fontWeight: "700",
    },
    clearButtonDisabled: {
        color: "#EBEBF54D",
    },
    listContent: {
        padding: 24,
        paddingBottom: 20,
    },
    cartItem: {
        backgroundColor: "#1C1C1E",
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#38383A",
    },
    cartItemTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    cartItemLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginRight: 16,
    },
    itemInitial: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: "#0A0A0A",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,
    },
    itemInitialText: {
        fontSize: 22,
        fontWeight: "800",
        color: "#ff3b30",
    },
    cartItemInfo: {
        flex: 1,
    },
    cartItemName: {
        fontSize: 17,
        fontWeight: "700",
        color: "#ffffff",
        marginBottom: 6,
        lineHeight: 22,
    },
    cartItemUnitPrice: {
        fontSize: 14,
        color: "#EBEBF599",
        fontWeight: "600",
    },
    cartItemTotal: {
        fontSize: 20,
        fontWeight: "800",
        color: "#ffffff",
        letterSpacing: -0.3,
    },
    modifiersContainer: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: "#38383A",
    },
    modifierRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    modifierName: {
        fontSize: 14,
        color: "#EBEBF599",
        fontWeight: "600",
        flex: 1,
    },
    modifierPrice: {
        fontSize: 14,
        color: "#EBEBF599",
        fontWeight: "700",
    },
    cartItemBottom: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#38383A",
    },
    quantityRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    qtyBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: "#0A0A0A",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#38383A",
    },
    qtyBtnText: {
        color: "#ffffff",
        fontSize: 20,
        fontWeight: "800",
    },
    qtyValue: {
        fontSize: 20,
        fontWeight: "800",
        color: "#ffffff",
        minWidth: 32,
        textAlign: "center",
    },
    removeBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    removeBtnText: {
        color: "#ff3b30",
        fontSize: 14,
        fontWeight: "700",
    },
    addMoreButton: {
        padding: 20,
        alignItems: "center",
    },
    addMoreText: {
        color: "#ff3b30",
        fontSize: 16,
        fontWeight: "700",
    },
    emptyCart: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 48,
    },
    emptyCartEmoji: {
        fontSize: 80,
        marginBottom: 24,
    },
    emptyCartTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: "#ffffff",
        marginBottom: 12,
        letterSpacing: -0.3,
    },
    emptyCartSubtitle: {
        fontSize: 16,
        color: "#EBEBF599",
        textAlign: "center",
        marginBottom: 40,
        lineHeight: 24,
    },
    browseButton: {
        backgroundColor: "#ff3b30",
        paddingHorizontal: 40,
        paddingVertical: 18,
        borderRadius: 20,
        shadowColor: "#ff3b30",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    browseButtonText: {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "800",
    },
    summaryContainer: {
        padding: 28,
        backgroundColor: "#1C1C1E",
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        borderWidth: 1,
        borderColor: "#38383A",
        borderBottomWidth: 0,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 16,
        color: "#EBEBF599",
        fontWeight: "600",
    },
    summaryValue: {
        fontSize: 16,
        color: "#ffffff",
        fontWeight: "700",
    },
    divider: {
        height: 1,
        backgroundColor: "#38383A",
        marginVertical: 16,
    },
    totalLabel: {
        fontSize: 22,
        fontWeight: "800",
        color: "#ffffff",
        letterSpacing: -0.3,
    },
    totalValue: {
        fontSize: 26,
        fontWeight: "800",
        color: "#ff3b30",
        letterSpacing: -0.5,
    },
    checkoutButton: {
        backgroundColor: "#ff3b30",
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        marginTop: 20,
        shadowColor: "#ff3b30",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },
    checkoutButtonText: {
        color: "#ffffff",
        fontSize: 19,
        fontWeight: "800",
        letterSpacing: -0.3,
    },
});
