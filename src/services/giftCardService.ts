import { EncryptionService } from './encryptionService';
import { ApiConfig } from '../config/apiConfig';

/**
 * Gift Card Service
 * Handles gift card operations via REST API
 */
export class GiftCardService {
    private static readonly BASE_URL = 'https://giftcard.myposerver.com';
    private static readonly AUTH_HEADER = 'Basic YWRtaW46cGFzc3dvcmQ='; // admin:password

    static giftCardStoreId: string = '';

    /**
     * Check gift card balance
     */
    static async checkBalance(cardToken: string) {
        try {
            console.log('GiftCard: Checking Balance via API (Token: ' + cardToken + ')');

            const cleanToken = cardToken.replace(/[\s-]/g, '');
            const encrypted = EncryptionService.encryptGiftCard(cleanToken);

            const response = await fetch(`${this.BASE_URL}/Transaction/balancecheck`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.AUTH_HEADER,
                    'User-Agent': 'RestSharp/106.11.7.0',
                },
                body: JSON.stringify({
                    encrypted: encrypted
                })
            });

            console.log('GiftCard: Balance Response Status:', response.status);
            const data = await response.json();
            console.log('GiftCard: Balance Response Body:', data);

            if (response.ok) {
                return {
                    balance: parseFloat(data.balance?.toString() || '0.0'),
                    status: data.status === true,
                    statusCode: data.statuscode?.toString() || '000000'
                };
            } else {
                return {
                    balance: 0.0,
                    status: false,
                    statusCode: response.status.toString()
                };
            }
        } catch (e) {
            console.error('Error checking gift card balance:', e);
            return null;
        }
    }

    /**
     * Redeem gift card
     */
    static async redeem(params: { cardToken: string, amount: number, acceptPartialAmount?: boolean }) {
        try {
            const { cardToken, amount, acceptPartialAmount = true } = params;
            console.log(`GiftCard: Redeeming via API for $${amount} (Token: ${cardToken})`);

            let franchiseeId = this.giftCardStoreId;
            const guidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

            if (!guidPattern.test(franchiseeId)) {
                console.warn('GiftCard: FranchiseeID is not a valid GUID. Using fallback.');
                franchiseeId = `00000000-0000-0000-0000-${franchiseeId.padStart(12, '0')}`;
            }

            const cleanToken = cardToken.replace(/[\s-]/g, '');
            const encrypted = EncryptionService.encryptGiftCard(cleanToken);

            const response = await fetch(`${this.BASE_URL}/Transaction/radeem`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.AUTH_HEADER,
                    'User-Agent': 'RestSharp/106.11.7.0',
                },
                body: JSON.stringify({
                    encrypted: encrypted,
                    cardToken: "",
                    amount: amount,
                    franchiseeId: franchiseeId,
                    posRef: "PosP",
                    acceptPartialAmount: acceptPartialAmount
                })
            });

            const data = await response.json();
            console.log('GiftCard: Redeem Response:', data);

            if (response.ok) {
                return {
                    status: data.status === true,
                    statusCode: data.statuscode?.toString() || '000000',
                    hostRef: data.HostRef?.toString() || '',
                    approvedBalance: parseFloat(data.balance?.toString() || '0.0'),
                    newBalance: parseFloat(data.newBalance?.toString() || '0.0'),
                    description: data.description || ''
                };
            } else {
                return {
                    status: false,
                    statusCode: response.status.toString(),
                    description: data.message || data.title || 'Redemption failed'
                };
            }
        } catch (e) {
            console.error('Error redeeming gift card:', e);
            return {
                status: false,
                statusCode: '999',
                description: `Exception: ${e instanceof Error ? e.message : String(e)}`
            };
        }
    }

    /**
     * Mask card number for display
     */
    static maskCardNumber(cardNumber: string): string {
        const cleaned = cardNumber.replace(/[\s-]/g, '');
        if (cleaned.length <= 4) return cleaned;
        return `****${cleaned.substring(cleaned.length - 4)}`;
    }
}
