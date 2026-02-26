/**
 * Kiosk Store - Central State Management
 * Replaces Flutter providers (PosProvider, SettingsProvider)
 * Uses React Context + useReducer for clean state management
 */

import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import type {
    CartItem,
    Item,
    Department,
    ModifierGroup,
    ModifiersOfItem,
    BusinessInfo,
    TaxRate,
    LoyaltyCustomer,
    KioskMode,
    CustomerType,
    TransDataRoot,
    TransMain,
    TransItem,
} from '../types';
import {
    createCartItem,
    createModifierCartItem,
    calculateSubtotal,
    calculateTaxTotal,
    calculateGrandTotal,
    generateUniqueId,
} from '../utils/cartUtils';
import { ApiService, StorageService, ConnectivityService } from '../services';
import { RuntimeConfig } from '../config/apiConfig';

// ─── State ─────────────────────────────────────────────────────────────────
export interface KioskState {
    // Data
    departments: Department[];
    items: Item[];
    modifierGroups: ModifierGroup[];
    modifiersOfItems: ModifiersOfItem[];
    businessInfo: BusinessInfo | null;
    taxRates: TaxRate[];

    // Cart
    cartItems: CartItem[];
    selectedDepartmentId: string | null;

    // Customer
    customerType: CustomerType | null;
    loyaltyCustomer: LoyaltyCustomer | null;
    customerName: string;

    // System
    kioskMode: KioskMode;
    isOnline: boolean;
    isLoading: boolean;
    isDataLoaded: boolean;
    error: string | null;

    // Order
    currentOrderNumber: number;
}

const initialState: KioskState = {
    departments: [],
    items: [],
    modifierGroups: [],
    modifiersOfItems: [],
    businessInfo: null,
    taxRates: [],
    cartItems: [],
    selectedDepartmentId: null,
    customerType: null,
    loyaltyCustomer: null,
    customerName: '',
    kioskMode: 'active',
    isOnline: false,
    isLoading: false,
    isDataLoaded: false,
    error: null,
    currentOrderNumber: 0,
};

// ─── Actions ───────────────────────────────────────────────────────────────
type KioskAction =
    | { type: 'SET_DATA'; payload: Partial<KioskState> }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_ONLINE'; payload: boolean }
    | { type: 'SET_KIOSK_MODE'; payload: KioskMode }
    | { type: 'SET_SELECTED_DEPARTMENT'; payload: string | null }
    | { type: 'ADD_TO_CART'; payload: CartItem }
    | { type: 'REMOVE_FROM_CART'; payload: string }
    | { type: 'UPDATE_CART_ITEM_QTY'; payload: { uniqueId: string; quantity: number } }
    | { type: 'ADD_MODIFIER_TO_ITEM'; payload: { parentId: string; modifier: CartItem } }
    | { type: 'REMOVE_MODIFIER_FROM_ITEM'; payload: { parentId: string; modifierId: string } }
    | { type: 'CLEAR_CART' }
    | { type: 'SET_CUSTOMER_TYPE'; payload: CustomerType | null }
    | { type: 'SET_LOYALTY_CUSTOMER'; payload: LoyaltyCustomer | null }
    | { type: 'SET_CUSTOMER_NAME'; payload: string }
    | { type: 'RESET_ORDER' };

// ─── Reducer ───────────────────────────────────────────────────────────────
function kioskReducer(state: KioskState, action: KioskAction): KioskState {
    switch (action.type) {
        case 'SET_DATA':
            return { ...state, ...action.payload };

        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };

        case 'SET_ERROR':
            return { ...state, error: action.payload };

        case 'SET_ONLINE':
            return { ...state, isOnline: action.payload };

        case 'SET_KIOSK_MODE':
            return { ...state, kioskMode: action.payload };

        case 'SET_SELECTED_DEPARTMENT':
            return { ...state, selectedDepartmentId: action.payload };

        case 'ADD_TO_CART': {
            // Check if same item already in cart (without modifiers)
            const existingIdx = state.cartItems.findIndex(
                (ci) => ci.item.itemId === action.payload.item.itemId && !ci.isModifier && ci.modifiers.length === 0
            );
            if (existingIdx >= 0 && action.payload.modifiers.length === 0) {
                const updated = [...state.cartItems];
                updated[existingIdx] = {
                    ...updated[existingIdx],
                    quantity: updated[existingIdx].quantity + action.payload.quantity,
                };
                return { ...state, cartItems: updated };
            }
            return { ...state, cartItems: [...state.cartItems, action.payload] };
        }

        case 'REMOVE_FROM_CART':
            return {
                ...state,
                cartItems: state.cartItems.filter((ci) => ci.uniqueId !== action.payload),
            };

        case 'UPDATE_CART_ITEM_QTY': {
            const { uniqueId, quantity } = action.payload;
            if (quantity <= 0) {
                return {
                    ...state,
                    cartItems: state.cartItems.filter((ci) => ci.uniqueId !== uniqueId),
                };
            }
            return {
                ...state,
                cartItems: state.cartItems.map((ci) =>
                    ci.uniqueId === uniqueId ? { ...ci, quantity } : ci
                ),
            };
        }

        case 'ADD_MODIFIER_TO_ITEM': {
            const { parentId, modifier } = action.payload;
            return {
                ...state,
                cartItems: state.cartItems.map((ci) =>
                    ci.uniqueId === parentId
                        ? { ...ci, modifiers: [...ci.modifiers, modifier] }
                        : ci
                ),
            };
        }

        case 'REMOVE_MODIFIER_FROM_ITEM': {
            const { parentId, modifierId } = action.payload;
            return {
                ...state,
                cartItems: state.cartItems.map((ci) =>
                    ci.uniqueId === parentId
                        ? { ...ci, modifiers: ci.modifiers.filter((m) => m.uniqueId !== modifierId) }
                        : ci
                ),
            };
        }

        case 'CLEAR_CART':
            return { ...state, cartItems: [] };

        case 'SET_CUSTOMER_TYPE':
            return { ...state, customerType: action.payload };

        case 'SET_LOYALTY_CUSTOMER':
            return { ...state, loyaltyCustomer: action.payload };

        case 'SET_CUSTOMER_NAME':
            return { ...state, customerName: action.payload };

        case 'RESET_ORDER':
            return {
                ...state,
                cartItems: [],
                customerType: null,
                loyaltyCustomer: null,
                customerName: '',
                selectedDepartmentId: null,
                error: null,
            };

        default:
            return state;
    }
}

// ─── Context ───────────────────────────────────────────────────────────────
interface KioskContextValue {
    state: KioskState;
    dispatch: React.Dispatch<KioskAction>;

    // Data loading
    loadPosData: () => Promise<void>;

    // Cart operations
    addToCart: (item: Item, modifiers?: CartItem[]) => void;
    removeFromCart: (uniqueId: string) => void;
    updateQuantity: (uniqueId: string, qty: number) => void;
    clearCart: () => void;

    // Customer
    setCustomerType: (type: CustomerType | null) => void;
    setLoyaltyCustomer: (customer: LoyaltyCustomer | null) => void;
    setCustomerName: (name: string) => void;
    searchLoyaltyByPhone: (phone: string) => Promise<LoyaltyCustomer | null>;
    searchLoyaltyByCard: (cardNumber: string) => Promise<LoyaltyCustomer | null>;

    // Order
    submitOrder: (paymentMethod: string, paymentDetails: any) => Promise<boolean>;
    resetOrder: () => void;

    // Computed
    subtotal: number;
    taxTotal: number;
    grandTotal: number;
    cartItemCount: number;
    filteredItems: Item[];
    visibleDepartments: Department[];
}

const KioskContext = createContext<KioskContextValue | undefined>(undefined);

// ─── Provider ──────────────────────────────────────────────────────────────
export function KioskProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(kioskReducer, initialState);
    const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Load POS Data ──
    const loadPosData = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            const settings = await StorageService.loadSettings();
            const dbName = settings.dbName || '170';

            // Try loading from API first
            const posData = await ApiService.fetchPosData(dbName);

            if (posData) {
                // Cache the data
                await StorageService.cachePosData(posData);

                const visibleDepts = (posData.departments || []).filter(
                    (d: any) => d.visible === 'OK' || d.visible === 'Y'
                );
                const visibleItems = (posData.items || []).filter(
                    (i: any) => (i.visible === 'OK' || i.visible === 'Y') && !i.isDeleted && !i.isModifier
                );

                dispatch({
                    type: 'SET_DATA',
                    payload: {
                        departments: visibleDepts,
                        items: visibleItems,
                        modifierGroups: posData.modifierGroups || [],
                        modifiersOfItems: posData.modifiersOfItems || [],
                        businessInfo: posData.businessInfo[0] ?? null,
                        isDataLoaded: true,
                        isOnline: true,
                    },
                });

                // Also load tax rates
                const taxRates = await ApiService.fetchTaxRates(dbName);
                if (taxRates.length > 0) {
                    dispatch({ type: 'SET_DATA', payload: { taxRates } });
                }

                // Set runtime config
                if (posData.businessInfo[0]) {
                    RuntimeConfig.storeId = posData.businessInfo[0].storeId;
                }
            } else {
                // Try loading from cache
                const cached = await StorageService.loadCachedPosData();
                if (cached) {
                    const visibleDepts = (cached.departments || []).filter(
                        (d: any) => d.visible === 'OK' || d.visible === 'Y'
                    );
                    const visibleItems = (cached.items || []).filter(
                        (i: any) => (i.visible === 'OK' || i.visible === 'Y') && !i.isDeleted && !i.isModifier
                    );

                    dispatch({
                        type: 'SET_DATA',
                        payload: {
                            departments: visibleDepts,
                            items: visibleItems,
                            modifierGroups: cached.modifierGroups || [],
                            modifiersOfItems: cached.modifiersOfItems || [],
                            businessInfo: cached.businessInfo?.[0] ?? null,
                            isDataLoaded: true,
                            isOnline: false,
                        },
                    });
                } else {
                    dispatch({ type: 'SET_ERROR', payload: 'Unable to load menu data. Please check your connection.' });
                }
            }
        } catch (e) {
            console.log('Error loading POS data:', e);
            dispatch({ type: 'SET_ERROR', payload: 'Failed to load menu data.' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    // ── Cart Operations ──
    const addToCart = useCallback((item: Item, modifiers: CartItem[] = []) => {
        const cartItem = createCartItem(item);
        cartItem.modifiers = modifiers;
        dispatch({ type: 'ADD_TO_CART', payload: cartItem });
    }, []);

    const removeFromCart = useCallback((uniqueId: string) => {
        dispatch({ type: 'REMOVE_FROM_CART', payload: uniqueId });
    }, []);

    const updateQuantity = useCallback((uniqueId: string, qty: number) => {
        dispatch({ type: 'UPDATE_CART_ITEM_QTY', payload: { uniqueId, quantity: qty } });
    }, []);

    const clearCart = useCallback(() => {
        dispatch({ type: 'CLEAR_CART' });
    }, []);

    // ── Customer ──
    const setCustomerType = useCallback((type: CustomerType | null) => {
        dispatch({ type: 'SET_CUSTOMER_TYPE', payload: type });
    }, []);

    const setLoyaltyCustomer = useCallback((customer: LoyaltyCustomer | null) => {
        dispatch({ type: 'SET_LOYALTY_CUSTOMER', payload: customer });
    }, []);

    const setCustomerName = useCallback((name: string) => {
        dispatch({ type: 'SET_CUSTOMER_NAME', payload: name });
    }, []);

    const searchLoyaltyByPhone = useCallback(async (phone: string): Promise<LoyaltyCustomer | null> => {
        try {
            const result = await ApiService.searchLoyaltyCustomer(phone) as any;
            if (result && result.id) {
                return {
                    id: result.id,
                    phoneNo: result.phoneNo,
                    firstName: result.firstName,
                    lastName: result.lastName,
                    email: result.email,
                    status: result.status ?? true,
                    taxExempt: result.taxexcempt ?? false,
                    loyaltyPoints: result.loyalitypoints,
                    membershipCard: result.membershipcard,
                    planId: result.planid,
                    memberedStoreGroupId: result.memberedStoregrpid,
                };
            }
            return null;
        } catch (e) {
            return null;
        }
    }, []);

    const searchLoyaltyByCard = useCallback(async (cardNumber: string): Promise<LoyaltyCustomer | null> => {
        try {
            const result = await ApiService.searchLoyaltyByCard(cardNumber) as any;
            if (result && result.id) {
                return {
                    id: result.id,
                    phoneNo: result.phoneNo,
                    firstName: result.firstName,
                    lastName: result.lastName,
                    email: result.email,
                    status: result.status ?? true,
                    taxExempt: result.taxexcempt ?? false,
                    loyaltyPoints: result.loyalitypoints,
                    membershipCard: result.membershipcard,
                    planId: result.planid,
                    memberedStoreGroupId: result.memberedStoregrpid,
                };
            }
            return null;
        } catch (e) {
            return null;
        }
    }, []);

    // ── Order Submission ──
    const submitOrder = useCallback(async (
        paymentMethod: string,
        paymentDetails: any
    ): Promise<boolean> => {
        try {
            const invoiceId = await StorageService.getNextInvoiceId();
            const now = new Date();

            const transmain: TransMain = {
                invoiceId,
                invoiceIdShortCode: `K${invoiceId.toString().slice(-4)}`,
                transType: 'SALE',
                subtotal: calculateSubtotal(state.cartItems),
                tax1: calculateTaxTotal(state.cartItems),
                grandTotal: calculateGrandTotal(state.cartItems),
                saleDateTime: now.toISOString(),
                cashAmount: 0,
                cardAmount: paymentMethod === 'card' ? calculateGrandTotal(state.cartItems) : 0,
                cardNumber: paymentDetails?.cardNumber ?? null,
                stationId: RuntimeConfig.kioskStationId,
                cashierId: RuntimeConfig.kioskCashierId,
                cashChangeAmount: 0,
                paidby: paymentMethod === 'card' ? 'Card' : 'GiftCard',
                retref: paymentDetails?.retref ?? null,
                cardType: paymentDetails?.cardType ?? null,
                cardHolder: paymentDetails?.cardHolder ?? null,
                invoiceDiscount: 0,
                phoneNo: state.loyaltyCustomer?.phoneNo ?? null,
                entryMethod: paymentDetails?.entryMethod ?? null,
                accountType: paymentDetails?.accountType ?? null,
                aid: paymentDetails?.aid ?? null,
                tcarqc: null,
                href: null,
                hostRefNum: paymentDetails?.hostRefNum ?? null,
                deviceOrgRefNum: paymentDetails?.deviceOrgRefNum ?? null,
                customerId: state.loyaltyCustomer?.id ?? null,
                totalCredit: null,
                tipAmount: 0,
                giftCardNumber: paymentDetails?.giftCardNumber ?? null,
                checkNumber: null,
                customerName: state.customerName || null,
                loyaltyDiscount: null,
                invoiceUniqueId: generateUniqueId(),
                orderType: 'Take Away',
                isUploaded: false,
                cloudId: null,
                holdName: null,
            };

            const transitems: TransItem[] = state.cartItems.flatMap((ci, idx) => {
                const items: TransItem[] = [];

                // Main item
                items.push({
                    idkey: generateUniqueId(),
                    transMainId: invoiceId,
                    itemId: ci.item.itemId,
                    itemName: ci.item.itemName,
                    itemType: 'ITEM',
                    itemPrice: ci.item.itemPrice ?? 0,
                    qty: ci.quantity,
                    tax1: ci.taxRate ? (ci.item.itemPrice ?? 0) * ci.quantity * ci.taxRate / 100 : 0,
                    tax1Status: ci.item.tax1Status,
                    amount: (ci.item.itemPrice ?? 0) * ci.quantity,
                    actualPrice: ci.item.itemPrice ?? 0,
                    discount: 0,
                    credits: 0,
                    orderId: idx + 1,
                    saleDateTime: now.toISOString(),
                    id: null,
                });

                // Modifiers
                ci.modifiers.forEach((mod) => {
                    items.push({
                        idkey: generateUniqueId(),
                        transMainId: invoiceId,
                        itemId: mod.item.itemId,
                        itemName: mod.item.itemName,
                        itemType: 'MODIFIER',
                        itemPrice: mod.item.itemPrice ?? 0,
                        qty: mod.quantity,
                        tax1: 0,
                        tax1Status: mod.item.tax1Status,
                        amount: (mod.item.itemPrice ?? 0) * mod.quantity,
                        actualPrice: mod.item.itemPrice ?? 0,
                        discount: 0,
                        credits: 0,
                        orderId: idx + 1,
                        saleDateTime: now.toISOString(),
                        id: null,
                    });
                });

                return items;
            });

            const transData: TransDataRoot = {
                date: now.toISOString().split('T')[0],
                time: now.toISOString().split('T')[1].split('.')[0],
                transmain,
                transitems,
            };

            // Always save locally first
            await StorageService.saveTransaction(transData);

            // Print Receipt
            const { ReceiptService } = require('../services/receiptService');
            // connection logic should ideally be handled at app start or settings change, 
            // but we can try to ensure connection here if needed or assume it's connected based on settings.
            // For now, just call printReceipt which handles the command generation.
            // In a real scenario, we might want to ensure the printer is connected before this.
            ReceiptService.printReceipt(transData);

            // Print Kitchen Ticket if offline (backup)
            if (!state.isOnline) {
                ReceiptService.printKitchenTicket(transData);
            }

            // Try to upload to server
            const settings = await StorageService.loadSettings();
            const uploaded = await ApiService.uploadTransaction(transData, settings.dbName);

            if (uploaded) {
                // Remove from pending queue (last item)
                const pending = await StorageService.getPendingTransactions();
                if (pending.length > 0) {
                    await StorageService.removePendingTransaction(pending.length - 1);
                }
            }

            return true;
        } catch (e) {
            console.log('Error submitting order:', e);
            return false;
        }
    }, [state.cartItems, state.customerName, state.loyaltyCustomer]);

    // ── Reset Order ──
    const resetOrder = useCallback(() => {
        dispatch({ type: 'RESET_ORDER' });
    }, []);

    // ── Computed Values ──
    const subtotal = calculateSubtotal(state.cartItems);
    const taxTotal = calculateTaxTotal(state.cartItems);
    const grandTotal = calculateGrandTotal(state.cartItems);
    const cartItemCount = state.cartItems.reduce((sum, ci) => sum + ci.quantity, 0);

    const filteredItems = state.selectedDepartmentId
        ? state.items.filter((i) => i.itemDeptId === state.selectedDepartmentId)
        : state.items;

    const visibleDepartments = state.departments.filter(
        (d) => d.visible === 'OK' || d.visible === 'Y'
    );

    // ── Sync Pending Transactions ──
    const syncTransactions = useCallback(async () => {
        if (!state.isOnline) return;

        try {
            let pending = await StorageService.getPendingTransactions();
            while (pending.length > 0) {
                const txn = pending[0];
                const settings = await StorageService.loadSettings();
                const success = await ApiService.uploadTransaction(txn, settings.dbName);

                if (success) {
                    await StorageService.removePendingTransaction(0);
                    pending = await StorageService.getPendingTransactions(); // Refresh list
                } else {
                    console.log("Failed to sync transaction, stopping.");
                    break;
                }
            }
        } catch (e) {
            console.error("Sync failed", e);
        }
    }, [state.isOnline]);

    // ── Connectivity listener ──
    useEffect(() => {
        const unsubscribe = ConnectivityService.addListener((isOnline: boolean) => {
            dispatch({ type: 'SET_ONLINE', payload: isOnline });
        });
        return unsubscribe;
    }, []);



    const value: KioskContextValue = {
        state,
        dispatch,
        loadPosData,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        setCustomerType,
        setLoyaltyCustomer,
        setCustomerName,
        searchLoyaltyByPhone,
        searchLoyaltyByCard,
        submitOrder,
        resetOrder,
        subtotal,
        taxTotal,
        grandTotal,
        cartItemCount,
        filteredItems,
        visibleDepartments,
    };

    return React.createElement(KioskContext.Provider, { value }, children);
}

// ─── Hook ──────────────────────────────────────────────────────────────────
export function useKiosk(): KioskContextValue {
    const context = useContext(KioskContext);
    if (!context) {
        throw new Error('useKiosk must be used within a KioskProvider');
    }
    return context;
}
