/**
 * Connectivity Service
 * Monitors network status
 */
export class ConnectivityService {
    private static listeners: ((isOnline: boolean) => void)[] = [];
    private static isOnline: boolean = true;
    private static interval: any = null;

    /**
     * Start monitoring
     */
    static startMonitoring() {
        if (this.interval) return;

        this.checkConnection();
        this.interval = setInterval(() => this.checkConnection(), 30000);
    }

    /**
     * Add listener for connectivity changes
     */
    static addListener(callback: (isOnline: boolean) => void) {
        this.listeners.push(callback);
        callback(this.isOnline);

        if (!this.interval) this.startMonitoring();

        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    /**
     * Check connection by reaching a host
     */
    private static async checkConnection() {
        try {
            // Simple ping check or fetch
            const response = await fetch('https://google.com', { method: 'HEAD', mode: 'no-cors' });
            const online = response.type !== 'error'; // Basic check

            if (online !== this.isOnline) {
                this.isOnline = online;
                this.notifyListeners();
            }
        } catch (e) {
            if (this.isOnline) {
                this.isOnline = false;
                this.notifyListeners();
            }
        }
    }

    private static notifyListeners() {
        this.listeners.forEach(l => l(this.isOnline));
    }
}
