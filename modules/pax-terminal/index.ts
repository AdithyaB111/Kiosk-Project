import { requireNativeModule } from 'expo-modules-core';

/**
 * Load native module or fallback to mock for emulator/dev
 */
let PaxTerminalModule: any;
try {
  PaxTerminalModule = requireNativeModule('PaxTerminal');
} catch (e) {
  console.warn('PaxTerminal native module not found. Using mock implementation.');
  PaxTerminalModule = {
    setTcpSetting: async (_ip: string, _port: number, _timeout: number) => {
      console.warn('PaxTerminal.setTcpSetting mock');
      return true;
    },
    init: async () => {
      console.warn('PaxTerminal.init mock');
      return JSON.stringify({ ResponseCode: '000000', ResponseMessage: 'OK' });
    },
    handshake: async () => {
      console.warn('PaxTerminal.handshake mock');
      return true;
    },
    doCredit: async (jsonStr: string) => {
      console.warn('PaxTerminal.doCredit mock:', jsonStr);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const req = JSON.parse(jsonStr);
      return JSON.stringify({
        ResponseCode: '000000',
        ResponseMessage: 'APPROVED',
        hostInformation: {
          hostResponseCode: '000000',
          hostResponseMessage: 'APPROVED',
          hostReferenceNumber: 'MOCK' + Date.now(),
          authCode: 'MOCK' + Math.floor(Math.random() * 999999),
        },
        accountInformation: {
          account: '************4242',
          cardType: 'VISA',
          entryMode: Object.keys(req.TransactionBehavior?.EntryMode || {}).find(
            key => (req.TransactionBehavior?.EntryMode as any)[key]
          )?.toUpperCase() || 'MANUAL',
        },
        amountInformation: {
          approvedAmount: req.amountInformation?.transactionAmount || '0',
        },
      });
    },
    doGift: async (jsonStr: string) => {
      console.warn('PaxTerminal.doGift mock:', jsonStr);
      return PaxTerminalModule.doCredit(jsonStr);
    },
    cancel: async () => {
      console.warn('PaxTerminal.cancel mock');
    },
    batchClose: async () => {
      console.warn('PaxTerminal.batchClose mock');
      return JSON.stringify({ ResponseCode: '000000', ResponseMessage: 'OK' });
    },
    remove: async () => {
      console.warn('PaxTerminal.remove mock');
    },
    cameraScan: async ({ timeout, cameraType }: { timeout: number; cameraType: string }) => {
      console.warn(`PaxTerminal.cameraScan mock: ${cameraType}, timeout ${timeout}s`);
      await new Promise(resolve => setTimeout(resolve, 500));
      return 'MOCK_QR_123456';
    },
    getSdkVersion: async () => {
      console.warn('PaxTerminal.getSdkVersion mock');
      return 'Mock SDK v1.0.0';
    },
  };
}

// ─── Types ──────────────────────────────────────────────────────────────────
export interface TransactionEntryModeBitmap {
  manual?: boolean;
  swipe?: boolean;
  chip?: boolean;
  contactless?: boolean;
  scan?: boolean;
}

export interface AmountInformation {
  transactionAmount: string; // cents
  tipAmount?: string;
  cashbackAmount?: string;
  taxAmount?: string;
}

export interface TraceInformation {
  ecrReferenceNumber?: string;
  transactionNumber?: string;
}

export interface TransactionBehavior {
  EntryMode?: TransactionEntryModeBitmap;
}

export interface DoCreditRequest {
  transactionType: string;
  tenderType?: string;
  amountInformation: AmountInformation;
  traceInformation?: TraceInformation;
  TransactionBehavior?: TransactionBehavior;
}

export interface POSLinkResponse {
  responseCode: string;
  responseMessage: string;
  rawData: Record<string, any>;
  isSuccess: boolean;
}

export type PaymentMethod = 'qr' | 'nfc' | 'swipe' | 'all';

// ─── Entry Mode Presets ─────────────────────────────────────────────────────
export const EntryModePresets: Record<PaymentMethod, TransactionEntryModeBitmap> = {
  qr: { manual: false, swipe: false, chip: false, contactless: false, scan: true },
  nfc: { manual: false, swipe: false, chip: false, contactless: true, scan: false },
  swipe: { manual: false, swipe: true, chip: true, contactless: false, scan: false },
  all: { manual: true, swipe: true, chip: true, contactless: true, scan: true },
};

// ─── Exported functions ─────────────────────────────────────────────────────

export async function setTcpSetting(ip: string, port = 10009, timeout = 30): Promise<boolean> {
  try {
    return await PaxTerminalModule.setTcpSetting(ip, port, timeout);
  } catch (e) {
    console.error('setTcpSetting Error:', e);
    return false;
  }
}

export async function handshake(): Promise<boolean> {
  try {
    return await PaxTerminalModule.handshake();
  } catch (e) {
    console.error('handshake Error:', e);
    return false;
  }
}

export async function remove(): Promise<void> {
  try {
    await PaxTerminalModule.remove();
  } catch (e) {
    console.error('remove Error:', e);
  }
}

export async function inputAccount(timeout: number = 30, edcType = 'CREDIT') {
  try {
    const req = {
      edcType,
      timeout: (timeout * 10).toString(), // convert to 100ms units
      transactionType: 'SALE',
      magneticSwipePinpadEnableFlag: 'ALLOWED',
      manualPinpadEnableFlag: 'ALLOWED',
      contactlessPinpadEnableFlag: edcType === 'GIFT' ? 'NOT_ALLOWED' : 'ALLOWED',
      scannerPinpadEnableFlag: 'ALLOWED',
    };
    const respStr = await PaxTerminalModule.inputAccount?.(JSON.stringify(req));
    return respStr ? JSON.parse(respStr) : { ResponseCode: 'ERROR', ResponseMessage: 'Not Supported' };
  } catch (e) {
    console.error('inputAccount Error:', e);
    return { ResponseCode: 'ERROR', ResponseMessage: String(e) };
  }
}

export async function doCreditRequest(req: DoCreditRequest): Promise<POSLinkResponse> {
  try {
    const requestStr = JSON.stringify(req);
    const respStr = await PaxTerminalModule.doCredit(requestStr);
    return parseResponse(JSON.parse(respStr));
  } catch (e) {
    return { responseCode: 'ERROR', responseMessage: String(e), rawData: {}, isSuccess: false };
  }
}

export async function doGiftRequest(req: DoCreditRequest): Promise<POSLinkResponse> {
  try {
    const requestStr = JSON.stringify(req);
    const respStr = await PaxTerminalModule.doGift(requestStr);
    return parseResponse(JSON.parse(respStr));
  } catch (e) {
    return { responseCode: 'ERROR', responseMessage: String(e), rawData: {}, isSuccess: false };
  }
}

export async function batchClose(): Promise<POSLinkResponse> {
  try {
    const respStr = await PaxTerminalModule.batchClose();
    return parseResponse(JSON.parse(respStr));
  } catch (e) {
    return { responseCode: 'ERROR', responseMessage: String(e), rawData: {}, isSuccess: false };
  }
}

export async function cameraScan(timeoutSeconds = 60, cameraType = 'REAR_CAMERA'): Promise<string | null> {
  try {
    return await PaxTerminalModule.cameraScan({ timeout: timeoutSeconds, cameraType });
  } catch (e) {
    console.error('cameraScan Error:', e);
    return null;
  }
}

export async function cancel(): Promise<void> {
  try {
    await PaxTerminalModule.cancel();
  } catch (e) {
    console.error('cancel Error:', e);
  }
}

export function parseResponse(json: Record<string, any>): POSLinkResponse {
  let code = json.ResponseCode || json.responseCode || 'ERROR';
  let msg = json.ResponseMessage || json.responseMessage || 'Unknown Error';

  if (code === 'ERROR' && msg === 'Unknown Error') {
    const hostInfo = json.hostInformation || json.HostInformation;
    if (hostInfo) {
      const hostMsg = hostInfo.hostResponseMessage || hostInfo.HostResponseMessage;
      if (hostMsg) {
        msg = String(hostMsg);
        const hostCode = hostInfo.hostResponseCode || hostInfo.HostResponseCode;
        code = hostCode || 'DECLINED';
      }
    }
  }

  return {
    responseCode: code,
    responseMessage: msg,
    rawData: json,
    isSuccess: code === '000000',
  };
}

export function doCredit(requestStr: string) {
    throw new Error('Function not implemented.');
}


export function doGift(arg0: string) {
    throw new Error('Function not implemented.');
}
