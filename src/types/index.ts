/**
 * Kiosk Types - Migrated from Flutter POS_Lite
 * Only includes types relevant to the self-service kiosk flow
 */

// ─── Department (Category) ─────────────────────────────────────────────────
export interface Department {
    deptId: string;
    deptName: string;
    picturePath?: string | null;
    visible: string;
    btnColor?: string | null;
    nameVisible?: string | null;
    pictureVisible?: string | null;
    listOrder?: number | null;
    showInOrderTablet?: boolean | null;
    taxRate?: number | null;
    localImagePath?: string | null;
}

// ─── Item (Menu Item) ──────────────────────────────────────────────────────
export interface Item {
    itemId: string;
    itemName: string;
    itemDeptId: string;
    itemPrice?: number | null;
    onlineImageLink?: string | null;
    taxRate?: number | null;
    tax1Status: string;
    picturePath?: string | null;
    pricePrompt: string;
    btnColor?: string | null;
    visible: string;
    enableName?: string | null;
    enablePicture?: string | null;
    listOrder?: number | null;
    isKot?: number | null;
    isKot2?: boolean | null;
    isModifier?: boolean | null;
    isDeleted?: boolean | null;
    promptDescription?: boolean | null;
    showInKitchenDisplay?: boolean | null;
    loyalityCredit?: number | null;
    qty?: number | null;
    localImagePath?: string | null;
}

// ─── Modifier Group ────────────────────────────────────────────────────────
export interface ModifierGroup {
    modifierGroupId?: number | null;
    groupName?: string | null;
    description?: string | null;
    promptName?: string | null;
    maximumSelect?: number | null;
    status?: boolean | null;
    hide?: boolean | null;
    btnColor?: string | null;
}

// ─── Modifier-Item Link ────────────────────────────────────────────────────
export interface ModifiersOfItem {
    id?: number | null;
    itemId?: string | null;
    modifierGroupId?: number | null;
    isRequired?: boolean | null;
    maximumSelect?: number | null;
    forced?: boolean | null;
}

// ─── Cart Item ─────────────────────────────────────────────────────────────
export interface CartItem {
    uniqueId: string;
    item: Item;
    quantity: number;
    priceOverride?: number | null;
    isModifier: boolean;
    parentItemId?: string | null;
    taxRate?: number | null;
    modifiers: CartItem[];
}

// ─── Transaction Main ──────────────────────────────────────────────────────
export interface TransMain {
    invoiceId?: number | null;
    invoiceIdShortCode?: string | null;
    holdName?: string | null;
    transType?: string | null;
    subtotal: number;
    tax1: number;
    grandTotal: number;
    saleDateTime: string;
    cashAmount: number;
    cardAmount: number;
    cardNumber?: string | null;
    stationId?: string | null;
    cashierId?: string | null;
    cashChangeAmount: number;
    paidby?: string | null;
    retref?: string | null;
    cardType?: string | null;
    cardHolder?: string | null;
    invoiceDiscount: number;
    phoneNo?: string | null;
    entryMethod?: string | null;
    accountType?: string | null;
    aid?: string | null;
    tcarqc?: string | null;
    href?: string | null;
    hostRefNum?: string | null;
    deviceOrgRefNum?: string | null;
    customerId?: string | null;
    totalCredit?: number | null;
    tipAmount: number;
    giftCardNumber?: string | null;
    checkNumber?: string | null;
    customerName?: string | null;
    loyaltyDiscount?: number | null;
    invoiceUniqueId?: string | null;
    orderType: string;
    isUploaded: boolean;
    cloudId?: number | null;
}

// ─── Transaction Item (Sub) ────────────────────────────────────────────────
export interface TransItem {
    idkey: string;
    id?: string | null;
    transMainId?: number | null;
    itemId?: string | null;
    itemType?: string | null;
    itemName?: string | null;
    itemPrice?: number | null;
    qty: number;
    tax1?: number | null;
    amount: number;
    saleDateTime?: string | null;
    credits?: number | null;
    discount?: number | null;
    actualPrice?: number | null;
    orderId?: number | null;
    tax1Status?: string | null;
}

// ─── Transaction Data Root (for API sync) ──────────────────────────────────
export interface TransDataRoot {
    date: string;
    time: string;
    transmain: TransMain;
    transitems: TransItem[];
}

// ─── Loyalty Customer ──────────────────────────────────────────────────────
export interface LoyaltyCustomer {
    id: string;
    memberedStoreGroupId?: string | null;
    phoneNo?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    status: boolean;
    taxExempt: boolean;
    loyaltyPoints?: string | null;
    membershipCard?: string | null;
    planId?: string | null;
}

// ─── Gift Card Models ──────────────────────────────────────────────────────
export interface GiftCardRedeemRequest {
    encrypted: string;
    cardToken: string;
    amount: number;
    franchiseeId: string;
    posRef: string;
    acceptPartialAmount: boolean;
}

export interface GiftCardRedeemResponse {
    statusCode?: string | null;
    description?: string | null;
    hostRef?: string | null;
    cardNo?: string | null;
    approvedBalance: number;
    previousBalance: number;
    newBalance: number;
    status: boolean;
    franchiseeId?: string | null;
    storeName?: string | null;
    storeAddress?: string | null;
}

export interface GiftCardBalanceResponse {
    statusCode?: string | null;
    description?: string | null;
    cardEnding?: string | null;
    balance: number;
    status: boolean;
}

// ─── Business Info ─────────────────────────────────────────────────────────
export interface BusinessInfo {
    storeId: string;
    businessName?: string | null;
    businessAddress?: string | null;
    cityStateZip?: string | null;
    businessPhone?: string | null;
    businessEmail?: string | null;
    ownerName?: string | null;
    ownerPhone?: string | null;
    logoPath?: string | null;
    footer1?: string | null;
    footer2?: string | null;
    footer3?: string | null;
    footer4?: string | null;
    encryptionKey?: string | null;
}

// ─── Tax Rate ──────────────────────────────────────────────────────────────
export interface TaxRate {
    taxNo: number;
    taxRate?: number | null;
}

// ─── POS Data Response (from cloud API) ────────────────────────────────────
export interface PosDataResponse {
    items: Item[];
    departments: Department[];
    modifierGroups: ModifierGroup[];
    modifiersOfItems: ModifiersOfItem[];
    businessInfo: BusinessInfo[];
}

// ─── POSLink Response (PAX terminal) ───────────────────────────────────────
export interface POSLinkResponse {
    responseCode: string;
    responseMessage: string;
    rawData: Record<string, any>;
}

// ─── Kiosk Settings ────────────────────────────────────────────────────────
export interface KioskSettings {
    apiBaseUrl: string;
    transServerUrl: string;
    paxIpAddress: string;
    paxPort: number;
    printerType: 'serial' | 'usb' | 'network';
    printerAddress: string;
    kioskStatus: 'active' | 'closed' | 'out_of_order';
    storeId: string;
    dbName: string;
    settingsPassword: string;
}

// ─── Kiosk Mode ────────────────────────────────────────────────────────────
export type KioskMode = 'active' | 'closed' | 'out_of_order';

// ─── Customer Type ─────────────────────────────────────────────────────────
export type CustomerType = 'member' | 'guest';

// ─── Payment Method ────────────────────────────────────────────────────────
export type PaymentMethod = 'card' | 'gift_card';
