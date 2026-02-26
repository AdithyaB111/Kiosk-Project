import CryptoJS from 'crypto-js';

/**
 * Encryption Service
 * Matches Flutter EncryptionService / C# CLSencryption exactly
 */
export class EncryptionService {
    private static readonly ENCRYPTION_KEY = 'Admin573184#';

    // Ivan Medvedev in ASCII (matching Flutter Uint8List)
    private static readonly SALT = CryptoJS.enc.Hex.parse('4976616e204d65647665646576');

    // Gift Card Encryption Key (AES-256)
    private static readonly GIFT_CARD_KEY_BASE64 = 'R9a3VjNu5J8Q0oNj3V1XZzO1L9pQiB4M5z5Ht5GJNRg=';

    /**
     * Encrypt PIN/Password matching Flutter encryptPin
     */
    static encryptPin(clearText: string): string {
        try {
            // Derive key and IV using PBKDF2 (matching C# Rfc2898DeriveBytes)
            // Flutter: 1000 iterations, 48 bytes (32 key + 16 IV)
            const derived = CryptoJS.PBKDF2(this.ENCRYPTION_KEY, this.SALT, {
                keySize: (32 + 16) / 4, // in 32-bit words
                iterations: 1000,
                hasher: CryptoJS.algo.SHA1
            });

            const key = CryptoJS.lib.WordArray.create(derived.words.slice(0, 8)); // 32 bytes
            const iv = CryptoJS.lib.WordArray.create(derived.words.slice(8, 12)); // 16 bytes

            // Encode using UTF-16LE to match C# Encoding.Unicode
            const clearBytes = this.encodeUTF16LE(clearText);

            const encrypted = CryptoJS.AES.encrypt(clearBytes, key, {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });

            return encrypted.toString(); // Base64
        } catch (e) {
            console.error('Encryption error:', e);
            return '';
        }
    }

    /**
     * Decrypt PIN matching Flutter decryptPin
     */
    static decryptPin(cipherText: string): string {
        try {
            const cleanCipherText = cipherText.replace(/ /g, '+');

            const derived = CryptoJS.PBKDF2(this.ENCRYPTION_KEY, this.SALT, {
                keySize: (32 + 16) / 4,
                iterations: 1000,
                hasher: CryptoJS.algo.SHA1
            });

            const key = CryptoJS.lib.WordArray.create(derived.words.slice(0, 8));
            const iv = CryptoJS.lib.WordArray.create(derived.words.slice(8, 12));

            const decrypted = CryptoJS.AES.decrypt(cleanCipherText, key, {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });

            return this.decodeUTF16LE(decrypted);
        } catch (e) {
            console.error('Decryption error:', e);
            return cipherText;
        }
    }

    /**
     * Encrypt gift card token matching Flutter encryptGiftCard
     */
    static encryptGiftCard(plainText: string): string {
        try {
            const key = CryptoJS.enc.Base64.parse(this.GIFT_CARD_KEY_BASE64);
            const iv = CryptoJS.lib.WordArray.random(16);

            const encrypted = CryptoJS.AES.encrypt(plainText, key, {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });

            // Combine IV + Encrypted Data (matching Flutter)
            const combined = iv.concat(encrypted.ciphertext);
            return CryptoJS.enc.Base64.stringify(combined);
        } catch (e) {
            console.error('Gift Card Encryption error:', e);
            return '';
        }
    }

    /**
     * Encode string to UTF-16LE WordArray
     */
    private static encodeUTF16LE(text: string): CryptoJS.lib.WordArray {
        const bytes: number[] = [];
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            bytes.push(charCode & 0xFF);         // Low byte
            bytes.push((charCode >> 8) & 0xFF);  // High byte
        }

        // Convert byte array to WordArray
        const words: number[] = [];
        for (let i = 0; i < bytes.length; i += 4) {
            words.push(
                (bytes[i] << 24) |
                ((bytes[i + 1] || 0) << 16) |
                ((bytes[i + 2] || 0) << 8) |
                (bytes[i + 3] || 0)
            );
        }
        return CryptoJS.lib.WordArray.create(words, bytes.length);
    }

    /**
     * Decode UTF-16LE WordArray to string
     */
    private static decodeUTF16LE(wordArray: CryptoJS.lib.WordArray): string {
        const words = wordArray.words;
        const sigBytes = wordArray.sigBytes;
        const bytes: number[] = [];

        for (let i = 0; i < sigBytes; i++) {
            const byte = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xFF;
            bytes.push(byte);
        }

        const charCodes: number[] = [];
        for (let i = 0; i < bytes.length - 1; i += 2) {
            charCodes.push(bytes[i] | (bytes[i + 1] << 8));
        }
        return String.fromCharCode(...charCodes);
    }
}
