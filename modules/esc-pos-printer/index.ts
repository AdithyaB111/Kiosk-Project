import { requireNativeModule, NativeModule } from 'expo-modules-core';
import { EventEmitter } from 'expo-modules-core';

type EscPosPrinterModuleEvents = {
    onPrinterStatusChange: (status: string) => void;
};

declare class EscPosPrinterModule extends NativeModule<EscPosPrinterModuleEvents> {
    // Network
    connectNetwork(host: string, port: number): Promise<void>;

    // USB
    /**
     * Scans for connected USB devices and returns a list.
     * Note: This usually requires USB permissions.
     */
    scanUsbDevices(): Promise<{ deviceId: number; vendorId: number; productId: number; deviceName: string }[]>;
    connectUsb(vendorId: number, productId: number): Promise<void>;

    // Common
    disconnect(): Promise<void>;

    /**
     * Sends raw bytes to the printer.
     * @param data Array of bytes (integers 0-255)
     */
    print(data: number[]): Promise<void>;

    /**
     * Sends raw bytes as a Base64 string.
     * @param base64Data Base64 encoded string of the bytes
     */
    printBase64(base64Data: string): Promise<void>;
}

// This call loads the native module object from the JSI.
let EscPosPrinter: EscPosPrinterModule;
try {
    EscPosPrinter = requireNativeModule<EscPosPrinterModule>('EscPosPrinterModule');
} catch (e) {
    console.warn('EscPosPrinterModule native module not found. Using mock implementation.');
    EscPosPrinter = {
        connectNetwork: async () => console.warn('EscPosPrinter.connectNetwork called on mock'),
        scanUsbDevices: async () => [],
        connectUsb: async () => console.warn('EscPosPrinter.connectUsb called on mock'),
        disconnect: async () => console.warn('EscPosPrinter.disconnect called on mock'),
        print: async () => console.warn('EscPosPrinter.print called on mock'),
        printBase64: async () => console.warn('EscPosPrinter.printBase64 called on mock'),
        addListener: () => { },
        removeListeners: () => { }
    } as unknown as EscPosPrinterModule;
}

export default EscPosPrinter;
