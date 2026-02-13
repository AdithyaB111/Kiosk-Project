/**
 * API Configuration - Migrated from Flutter POS_Lite ApiConfig
 * Contains all endpoint URLs and auth for the kiosk system
 */

export const ApiConfig = {
    // App
    appVersion: '1.0.0',

    // API Base URLs (from POS_Lite clsConnections)
    baseUrl: 'https://asnitagentapi.azurewebsites.net',
    transServerPrimaryUrl: 'https://transserver2.mypospointe.com:9443',
    transactionServerBackupUrl: 'https://transserver-backup.mypospointe.com:9443',
    myPosApiUrl: 'https://api3.mypospointe.com:8843',
    loyaltyServer: 'https://pospointeloyalty.azurewebsites.net/',
    giftCardServer: 'https://giftcard.myposerver.com',

    // Authentication
    transServerAuth: 'Basic YWRtaW46cGFzc3dvcmQ=',
    giftCardServerAuth: 'YWRtaW46cGFzc3dvcmQ=',

    // API Endpoints
    posDataEndpoint: '/POS',
    taxRateEndpoint: '/TaxRate',
    transactionsEndpoint: '/Transactions',
    statusEndpoint: '/Others/status',
    businessTaxEndpoint: '/Business/taxrate',

    // Dynamic (loaded from settings)
    myDb: '170',
    database: '170',

    // Feature Flags
    loyaltyActive: false,
    allowGiftCard: false,

    // Store Configuration
    storeId: '',
    storeGroupId: 'STG-000000',
} as const;

// Mutable runtime config that can be updated from settings
export class RuntimeConfig {
    static myDb: string = ApiConfig.myDb;
    static storeId: string = ApiConfig.storeId;
    static storeGroupId: string = ApiConfig.storeGroupId;
    static loyaltyActive: boolean = ApiConfig.loyaltyActive;
    static allowGiftCard: boolean = ApiConfig.allowGiftCard;

    // PAX Terminal config
    static paxIpAddress: string = '10.0.0.1';
    static paxPort: number = 10009;

    // Kiosk-specific
    static kioskStationId: string = 'KIOSK-01';
    static kioskCashierId: string = 'KIOSK';

    // Security
    static encryptionKey: string = '';
}
