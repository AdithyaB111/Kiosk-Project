import { requireNativeModule } from 'expo-modules-core';

// It loads the native module object from the JSI or requires it from the NativeModules proxy
let PaxTerminalModule: any;
try {
    PaxTerminalModule = requireNativeModule('PaxTerminal');
} catch (e) {
    console.warn('PaxTerminal native module not found. Using mock implementation.');
    PaxTerminalModule = {
        initialize: async () => {
            console.warn('PaxTerminal.initialize called on mock (Success)');
            return true;
        },
        processPayment: async (request: any) => {
            console.warn('PaxTerminal.processPayment called on mock (Simulating Success)');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
            return {
                status: 'APPROVED',
                authCode: 'MOCK123',
                referenceNumber: request.referenceNumber || 'REF' + Date.now(),
                cardNumber: '************4242',
                cardType: 'VISA',
                approvedAmount: request.amount,
                message: 'APPROVED'
            };
        },
        voidTransaction: async () => {
            console.warn('PaxTerminal.voidTransaction called on mock');
            return { status: 'APPROVED' };
        },
        checkStatus: async () => {
            console.warn('PaxTerminal.checkStatus called on mock');
            return { status: 'READY', connected: true };
        }
    };
}

export interface PaxPaymentRequest {
    amount: number; // In cents or major unit depending on SDK, usually cents for int, but let's assume major unit (dollars) and convert in native
    tip?: number;
    transactionType: 'SALE' | 'RETURN' | 'VOID' | 'AUTH';
    referenceNumber?: string;
    extData?: string;
}

export interface PaxPaymentResponse {
    status: 'APPROVED' | 'DECLINED' | 'ERROR' | 'TIMEOUT';
    authCode?: string;
    referenceNumber?: string; // Host Ref Num
    cardNumber?: string; // Masked PAN
    cardType?: string;
    message?: string;
    approvedAmount?: number;
    rawResponse?: any; // Full JSON response from SDK
}

/**
 * Initialize the connection to the PAX terminal
 * @param ip IP Address of the terminal
 * @param port Port number (default 10009)
 */
export async function initialize(ip: string, port: number): Promise<boolean> {
    return await PaxTerminalModule.initialize(ip, port);
}

/**
 * Process a payment transaction on the PAX terminal
 * @param request Payment details
 */
export async function processPayment(request: PaxPaymentRequest): Promise<PaxPaymentResponse> {
    return await PaxTerminalModule.processPayment(request);
}

/**
 * Void a transaction
 * @param originalRefNumber Original Host Reference Number to void
 */
export async function voidTransaction(originalRefNumber: string): Promise<PaxPaymentResponse> {
    return await PaxTerminalModule.voidTransaction(originalRefNumber);
}

/**
 * Get terminal status / check connection
 */
export async function checkStatus(): Promise<{ status: string; connected: boolean }> {
    return await PaxTerminalModule.checkStatus();
}
