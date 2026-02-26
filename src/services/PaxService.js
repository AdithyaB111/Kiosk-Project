import { NativeModules, NativeEventEmitter } from 'react-native';

const { PaxModule } = NativeModules;
const paxEventEmitter = new NativeEventEmitter(PaxModule);

class PaxService {
    constructor() {
        this.statusListener = null;
    }

    /**
     * Sets TCP communication settings
     * @param {string} ip - IP address of the PAX terminal
     * @param {string} port - Port number (default: 10009)
     * @param {number} timeout - Timeout in seconds
     */
    setTcpSetting(ip, port = '10009', timeout = 90) {
        PaxModule.setTcpSetting(ip, port, timeout);
    }

    /**
     * Sets HTTP communication settings
     * @param {string} ip - IP address of the PAX terminal
     * @param {string} port - Port number
     * @param {number} timeout - Timeout in seconds
     */
    setHttpSetting(ip, port, timeout = 90) {
        PaxModule.setHttpSetting(ip, port, timeout);
    }

    /**
     * Sets USB communication settings. Automatically detects PAX device.
     * @param {number} timeout - Timeout in seconds
     */
    setUsbSetting(timeout = 90) {
        PaxModule.setUsbSetting(timeout);
    }

    /**
     * Performs handshake with terminal
     * @returns {Promise<boolean>}
     */
    async handshake() {
        return await PaxModule.handshake();
    }

    /**
     * Executes a credit transaction
     * @param {Object} request - Transaction request object
     * @returns {Promise<Object>} - Parsed response
     */
    async doCredit(request) {
        const responseJson = await PaxModule.doCredit(JSON.stringify(request));
        return JSON.parse(responseJson);
    }

    /**
     * Executes a debit transaction
     * @param {Object} request - Transaction request object
     * @returns {Promise<Object>} - Parsed response
     */
    async doDebit(request) {
        const responseJson = await PaxModule.doDebit(JSON.stringify(request));
        return JSON.parse(responseJson);
    }

    /**
     * Executes a gift transaction
     * @param {Object} request - Transaction request object
     * @returns {Promise<Object>} - Parsed response
     */
    async doGift(request) {
        const responseJson = await PaxModule.doGift(JSON.stringify(request));
        return JSON.parse(responseJson);
    }

    /**
     * Cancels current transaction
     * @returns {Promise<boolean>}
     */
    async cancel() {
        return await PaxModule.cancel();
    }

    /**
     * Subscribes to PAX status updates (e.g., "SWIPE CARD", "PROCESSING...")
     * @param {Function} callback 
     * @returns {Object} Subscription object (call remove() to unsubscribe)
     */
    onStatusUpdate(callback) {
        return paxEventEmitter.addListener('onPaxStatus', callback);
    }
}

export default new PaxService();
