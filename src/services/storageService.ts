import AsyncStorage from '@react-native-async-storage/async-storage';
import { TransDataRoot } from '../types';

/**
 * Storage Service
 * Handles local data persistence using AsyncStorage
 */
export class StorageService {
    private static readonly KEYS = {
        SETTINGS: 'kiosk_settings',
        PENDING_TRANSACTIONS: 'pending_transactions',
        BUSINESS_INFO: 'business_info',
        CACHED_ITEMS: 'cached_items',
        CACHED_DEPARTMENTS: 'cached_departments'
    };

    /**
     * Save application settings
     */
    static async saveSettings(settings: any) {
        try {
            await AsyncStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
        } catch (e) {
            console.error('Error saving settings:', e);
        }
    }

    /**
     * Load application settings
     */
    static async loadSettings() {
        try {
            const settings = await AsyncStorage.getItem(this.KEYS.SETTINGS);
            return settings ? JSON.parse(settings) : { dbName: '170' };
        } catch (e) {
            console.error('Error loading settings:', e);
            return { dbName: '170' };
        }
    }

    /**
     * Save transaction locally (for offline queue)
     */
    static async saveTransaction(transaction: TransDataRoot) {
        try {
            const pending = await this.getPendingTransactions();
            pending.push(transaction);
            await AsyncStorage.setItem(this.KEYS.PENDING_TRANSACTIONS, JSON.stringify(pending));
        } catch (e) {
            console.error('Error saving transaction:', e);
        }
    }

    /**
     * Get all pending transactions
     */
    static async getPendingTransactions(): Promise<TransDataRoot[]> {
        try {
            const transactions = await AsyncStorage.getItem(this.KEYS.PENDING_TRANSACTIONS);
            return transactions ? JSON.parse(transactions) : [];
        } catch (e) {
            console.error('Error getting pending transactions:', e);
            return [];
        }
    }

    /**
     * Remove a transaction from the pending queue
     */
    static async removePendingTransaction(index: number) {
        try {
            const pending = await this.getPendingTransactions();
            if (index >= 0 && index < pending.length) {
                pending.splice(index, 1);
                await AsyncStorage.setItem(this.KEYS.PENDING_TRANSACTIONS, JSON.stringify(pending));
            }
        } catch (e) {
            console.error('Error removing pending transaction:', e);
        }
    }

    /**
     * Cache business information
     */
    static async saveBusinessInfo(info: any) {
        try {
            await AsyncStorage.setItem(this.KEYS.BUSINESS_INFO, JSON.stringify(info));
        } catch (e) {
            console.error('Error saving business info:', e);
        }
    }

    /**
     * Load cached business info
     */
    static async loadBusinessInfo() {
        try {
            const info = await AsyncStorage.getItem(this.KEYS.BUSINESS_INFO);
            return info ? JSON.parse(info) : null;
        } catch (e) {
            console.error('Error loading business info:', e);
            return null;
        }
    }

    /**
     * Cache complete POS data
     */
    static async cachePosData(data: any) {
        try {
            await AsyncStorage.setItem(this.KEYS.CACHED_ITEMS, JSON.stringify(data));
        } catch (e) {
            console.error('Error caching POS data:', e);
        }
    }

    /**
     * Load cached POS data
     */
    static async loadCachedPosData() {
        try {
            const data = await AsyncStorage.getItem(this.KEYS.CACHED_ITEMS);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error loading cached POS data:', e);
            return null;
        }
    }

    /**
     * Get next invoice ID (incrementing counter)
     */
    static async getNextInvoiceId(): Promise<number> {
        try {
            const currentStr = await AsyncStorage.getItem('last_invoice_id');
            let current = currentStr ? parseInt(currentStr) : 1000;
            const next = current + 1;
            await AsyncStorage.setItem('last_invoice_id', next.toString());
            return next;
        } catch (e) {
            console.error('Error getting next invoice ID:', e);
            return Math.floor(Date.now() / 1000);
        }
    }
}
