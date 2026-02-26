import { ApiConfig } from '../config/apiConfig';

/**
 * API Service
 * Handles communication with the MyPos cloud APIs
 */
export class ApiService {
    /**
     * Check if the cloud server is online
     */
    static async isOnline(): Promise<boolean> {
        try {
            const response = await fetch(`${ApiConfig.transServerPrimaryUrl}${ApiConfig.statusEndpoint}`, {
                headers: { 'Authorization': ApiConfig.transServerAuth },
                method: 'GET'
            });
            return response.status === 200;
        } catch (e) {
            console.error('ApiService.isOnline Error:', e);
            return false;
        }
    }

    /**
     * Fetch all POS data (Menu, Items, Modifiers)
     */
    static async fetchPosData(dbName: string) {
        try {
            const response = await fetch(`${ApiConfig.myPosApiUrl}${ApiConfig.posDataEndpoint}`, {
                headers: { 'db': dbName }
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (e) {
            console.error('Error fetching POS data:', e);
            return null;
        }
    }

    /**
     * Fetch Tax Rates
     */
    static async fetchTaxRates(dbName: string) {
        try {
            const response = await fetch(`${ApiConfig.myPosApiUrl}${ApiConfig.taxRateEndpoint}`, {
                headers: { 'db': dbName }
            });

            if (response.ok) {
                const data = await response.json();
                return Array.isArray(data) ? data : [data];
            }
            return [];
        } catch (e) {
            console.error('Error fetching tax rates:', e);
            return [];
        }
    }

    /**
     * Upload Transaction to Cloud
     */
    static async uploadTransaction(data: any, dbName: string): Promise<boolean> {
        try {
            const response = await fetch(`${ApiConfig.transServerPrimaryUrl}${ApiConfig.transactionsEndpoint}`, {
                method: 'POST',
                headers: {
                    'db': dbName,
                    'Content-Type': 'application/json',
                    'Authorization': ApiConfig.transServerAuth
                },
                body: JSON.stringify(data)
            });

            return response.status === 200;
        } catch (e) {
            console.error('Error uploading transaction:', e);
            return false;
        }
    }

    /**
     * Search Loyalty Customer by Phone
     */
    static async searchLoyaltyCustomer(phone: string) {
        // Implementation based on need, using placeholder
        console.log('Searching loyalty customer:', phone);
        return null;
    }

    /**
     * Search Loyalty Customer by Card
     */
    static async searchLoyaltyByCard(cardNumber: string) {
        console.log('Searching loyalty by card:', cardNumber);
        return null;
    }
}
