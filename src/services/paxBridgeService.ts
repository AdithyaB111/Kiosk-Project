import { requireNativeModule } from 'expo-modules-core';

// ─── Native Module ────────────────────────────────────────────────────────────
let PaxTerminalModule: any;
try {
  PaxTerminalModule = requireNativeModule('PaxTerminal');
} catch (e) {
  console.warn('[PAX] Native module not found — using mock');
  PaxTerminalModule = {
    setTcpSetting: async (_ip: string, _port: number, _timeout: number): Promise<boolean> => true,
    init: async (): Promise<string> => JSON.stringify({ ResponseCode: '000000', ResponseMessage: 'OK' }),
    handshake: async (): Promise<boolean> => true,
    doCredit: async (jsonStr: string): Promise<string> => {
      await new Promise(r => setTimeout(r, 1200));
      const req = JSON.parse(jsonStr);
      return JSON.stringify({
        ResponseCode: '000000', ResponseMessage: 'APPROVED',
        hostInformation: { hostResponseCode: '000000', hostResponseMessage: 'APPROVED', hostReferenceNumber: 'MOCKREF' + Date.now(), authCode: 'AUTH' + Math.floor(Math.random() * 999999) },
        accountInformation: { account: '************4242', cardType: 'VISA', entryMode: Object.keys(req.TransactionBehavior?.EntryMode || {}).find((k) => (req.TransactionBehavior?.EntryMode as any)[k])?.toUpperCase() || 'MANUAL' },
        amountInformation: { approvedAmount: req.amountInformation?.transactionAmount || '0' },
      });
    },
    doGift: async (jsonStr: string): Promise<string> => PaxTerminalModule.doCredit(jsonStr),
    batchClose: async (_jsonStr: string): Promise<string> => JSON.stringify({ ResponseCode: '000000', ResponseMessage: 'OK' }),
    cancel: async (): Promise<void> => { },
    remove: async (): Promise<void> => { },
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface TransactionEntryModeBitmap {
  manual?: boolean;
  swipe?: boolean;
  chip?: boolean;
  contactless?: boolean;
  scan?: boolean;
}
export interface AmountInformation {
  transactionAmount: string;
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

// ─── Entry Mode Presets ───────────────────────────────────────────────────────
export const EntryModePresets: Record<PaymentMethod, TransactionEntryModeBitmap> = {
  qr: { manual: false, swipe: false, chip: false, contactless: false, scan: true },
  nfc: { manual: false, swipe: false, chip: false, contactless: true, scan: false },
  swipe: { manual: false, swipe: true, chip: true, contactless: false, scan: false },
  all: { manual: true, swipe: true, chip: true, contactless: true, scan: true },
};

// ─── TCP Connection ───────────────────────────────────────────────────────────
export async function setTcpSetting(ip: string, port = 10009, timeout = 30): Promise<boolean> {
  try {
    console.log(`[PAX] setTcpSetting → ip=${ip}, port=${port}, timeout=${timeout}`);
    if (!ip || ip.trim() === '') {
      console.error('[PAX] setTcpSetting: IP address is empty or undefined');
      return false;
    }
    const result = await PaxTerminalModule.setTcpSetting(ip, port, timeout);
    console.log(`[PAX] setTcpSetting result: ${result}`);
    return result;
  } catch (e) {
    console.error('[PAX] setTcpSetting error:', e);
    throw e; // Re-throw so callers can see the actual error
  }
}

export async function handshake(): Promise<boolean> {
  try {
    return await PaxTerminalModule.handshake();
  } catch (e) {
    console.error('[PAX] handshake error:', e);
    return false;
  }
}

/**
 * init() — matches the Kotlin native exactly:
 *   Step 1: setTcpSetting(ip, port, timeout) — creates the Terminal object
 *   Step 2: native init() — calls t.manage.init() with NO arguments
 *
 * Used by Settings screen "Init" button:
 *   await PaxBridgeService.init(ip, port, timeout)
 */
export async function init(ip: string, port = 10009, timeout = 30): Promise<boolean> {
  try {
    console.log(`[PAX] init → ${ip}:${port}`);
    // Step 1: configure TCP (creates Terminal object in Kotlin)
    const tcpOk = await PaxTerminalModule.setTcpSetting(ip, port, timeout);
    if (!tcpOk) {
      console.error('[PAX] init: setTcpSetting failed');
      return false;
    }
    // Step 2: call native init() — no args, Kotlin calls t.manage.init()
    const respStr: string = await PaxTerminalModule.init();
    const resp = JSON.parse(respStr);
    const ok = String(resp?.ResponseCode) === '000000';
    console.log('[PAX] init result:', ok ? 'OK' : resp?.ResponseMessage);
    return ok;
  } catch (e) {
    console.error('[PAX] init error:', e);
    return false;
  }
}

export const connect = init;

// ─── Low-level requests ───────────────────────────────────────────────────────
export async function doCreditRequest(req: DoCreditRequest): Promise<POSLinkResponse> {
  try {
    const respStr: string = await PaxTerminalModule.doCredit(JSON.stringify(req));
    return parseResponse(JSON.parse(respStr));
  } catch (e) { return errorResponse(e); }
}

export async function doGiftRequest(req: DoCreditRequest): Promise<POSLinkResponse> {
  try {
    const respStr: string = await PaxTerminalModule.doGift(JSON.stringify(req));
    return parseResponse(JSON.parse(respStr));
  } catch (e) { return errorResponse(e); }
}

// ─── High-level wrappers ──────────────────────────────────────────────────────

/**
 * doCredit — send directly to PAX terminal.
 * method='all' → PAX terminal lets customer choose QR/NFC/swipe on its screen.
 * method='qr'  → PAX terminal shows QR only.
 * NO phone camera is used. The PAX terminal handles everything.
 */
export async function doCredit({
  TransType = 'SALE', amount, method = 'all', ecrRef, tenderType = 'CREDIT',
}: {
  TransType?: string; amount: number; method?: PaymentMethod; ecrRef?: string; tenderType?: string;
}): Promise<POSLinkResponse> {
  const amountCents = Math.round(amount * 100).toString();
  const entryMode = EntryModePresets[method] ?? EntryModePresets.all;
  console.log(`[PAX] doCredit method=${method} $${amount}`);
  return doCreditRequest({
    transactionType: TransType,
    tenderType,
    amountInformation: { transactionAmount: amountCents },
    traceInformation: { ecrReferenceNumber: ecrRef ?? `ECR${Date.now()}` },
    TransactionBehavior: { EntryMode: entryMode },
  });
}

export async function doGift({
  TransType = 'SALE', amount, method = 'all', ecrRef,
}: {
  TransType?: string; amount: number; method?: PaymentMethod; ecrRef?: string;
}): Promise<POSLinkResponse> {
  const amountCents = Math.round(amount * 100).toString();
  const entryMode = EntryModePresets[method] ?? EntryModePresets.all;
  console.log(`[PAX] doGift method=${method} $${amount}`);
  return doGiftRequest({
    transactionType: TransType,
    amountInformation: { transactionAmount: amountCents },
    traceInformation: { ecrReferenceNumber: ecrRef ?? `ECR${Date.now()}` },
    TransactionBehavior: { EntryMode: entryMode },
  });
}

// ─── batchClose — Kotlin requires a JSON string arg ──────────────────────────
export async function batchClose(): Promise<POSLinkResponse> {
  try {
    // Kotlin: AsyncFunction("batchClose") { jsonStr: String -> ... }
    // Must pass a JSON string even if empty
    const respStr: string = await PaxTerminalModule.batchClose('{}');
    return parseResponse(JSON.parse(respStr));
  } catch (e) { return errorResponse(e); }
}

export async function cancel(): Promise<void> {
  try { await PaxTerminalModule.cancel(); }
  catch (e) { console.error('[PAX] cancel error:', e); }
}

export async function remove(): Promise<void> {
  try { await PaxTerminalModule.remove(); }
  catch (e) { console.error('[PAX] remove error:', e); }
}

// ─── Response Parser ──────────────────────────────────────────────────────────
export function parseResponse(json: Record<string, any>): POSLinkResponse {
  let code = json.ResponseCode ?? json.responseCode ?? 'ERROR';
  let msg = json.ResponseMessage ?? json.responseMessage ?? 'Unknown Error';
  if (code === 'ERROR' && msg === 'Unknown Error') {
    const host = json.hostInformation ?? json.HostInformation;
    if (host) {
      const hMsg = host.hostResponseMessage ?? host.HostResponseMessage;
      const hCode = host.hostResponseCode ?? host.HostResponseCode;
      if (hMsg) msg = String(hMsg);
      if (hCode) code = String(hCode);
      else if (hMsg) code = 'DECLINED';
    }
  }
  return { responseCode: String(code), responseMessage: String(msg), rawData: json, isSuccess: String(code) === '000000' };
}

function errorResponse(e: unknown): POSLinkResponse {
  return { responseCode: 'ERROR', responseMessage: e instanceof Error ? e.message : String(e), rawData: {}, isSuccess: false };
}

// ─── Class wrapper ────────────────────────────────────────────────────────────
export const PaxBridgeService = {
  init,           // Settings "Init" button: PaxBridgeService.init(ip, port, timeout)
  connect,
  setTcpSetting,
  handshake,
  doCredit,
  doGift,
  batchClose,
  cancel,
  remove,
  parseResponse,
};