/**
 * Cart Utility Functions
 * Business logic for cart calculations
 * Migrated from Flutter POS_Lite CartItem model
 */

import type { CartItem, Item } from '../types';

let idCounter = 0;

/**
 * Generate a unique ID for cart items
 */
export function generateUniqueId(): string {
    idCounter = (idCounter + 1) % 10000;
    return `${Date.now()}${idCounter.toString().padStart(4, '0')}`;
}

/**
 * Create a new CartItem from an Item
 */
export function createCartItem(item: Item, quantity: number = 1): CartItem {
    return {
        uniqueId: generateUniqueId(),
        item,
        quantity,
        priceOverride: null,
        isModifier: false,
        parentItemId: null,
        taxRate: item.taxRate ?? null,
        modifiers: [],
    };
}

/**
 * Create a modifier CartItem
 */
export function createModifierCartItem(item: Item, parentItemId: string): CartItem {
    return {
        uniqueId: generateUniqueId(),
        item,
        quantity: 1,
        priceOverride: null,
        isModifier: true,
        parentItemId,
        taxRate: item.taxRate ?? null,
        modifiers: [],
    };
}

/**
 * Get the effective price of a cart item
 */
export function getItemPrice(cartItem: CartItem): number {
    return cartItem.priceOverride ?? cartItem.item.itemPrice ?? 0;
}

/**
 * Get the total price of a cart item (price * quantity)
 */
export function getItemTotal(cartItem: CartItem): number {
    return getItemPrice(cartItem) * cartItem.quantity;
}

/**
 * Get total price of modifiers for a cart item
 */
export function getModifiersTotal(cartItem: CartItem): number {
    return cartItem.modifiers.reduce(
        (sum, mod) => sum + getItemPrice(mod) * mod.quantity,
        0
    );
}

/**
 * Get total price including modifiers
 */
export function getTotalPrice(cartItem: CartItem): number {
    return getItemTotal(cartItem) + getModifiersTotal(cartItem);
}

/**
 * Check if an item is taxable
 */
export function isTaxable(cartItem: CartItem): boolean {
    return cartItem.item.tax1Status === 'OK';
}

/**
 * Calculate tax amount for a cart item
 */
export function getTaxAmount(cartItem: CartItem): number {
    if (!isTaxable(cartItem) || !cartItem.taxRate || cartItem.taxRate <= 0) {
        return 0;
    }
    const total = getTotalPrice(cartItem);
    // Truncate to 2 decimal places (no rounding) - matches C# behavior
    return Math.trunc((total * cartItem.taxRate / 100) * 100) / 100;
}

/**
 * Calculate cart subtotal
 */
export function calculateSubtotal(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + getTotalPrice(item), 0);
}

/**
 * Calculate cart tax total
 */
export function calculateTaxTotal(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + getTaxAmount(item), 0);
}

/**
 * Calculate cart grand total
 */
export function calculateGrandTotal(items: CartItem[]): number {
    return calculateSubtotal(items) + calculateTaxTotal(items);
}

/**
 * Format currency value
 */
export function formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
}
