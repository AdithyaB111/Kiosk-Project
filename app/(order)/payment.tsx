/**
 * PaymentScreen.tsx
 * - Card payment: tapping "Card" goes DIRECTLY to PAX terminal (method='all')
 *   PAX terminal itself shows the payment options (QR/NFC/swipe) on its screen
 * - Gift card: QR scan uses doCredit with scan entry mode (NO phone camera)
 *   Gift card manual entry also supported
 */

import { useRouter } from "expo-router";
import React, { useCallback, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GiftCardService } from "@/src/services/giftCardService";
import { PaxBridgeService } from "@/src/services/paxBridgeService";
import { StorageService } from "@/src/services/storageService";
import { RuntimeConfig } from "@/src/config/apiConfig";
import { useKiosk } from "@/src/store/kioskStore";
import { formatCurrency } from "@/src/utils/cartUtils";

type PaymentStep =
  | "select"
  | "card_processing"
  | "gift_card_method_select"
  | "gift_card_entry"
  | "gift_card_processing";

export default function PaymentScreen() {
  const router = useRouter();
  const { state, subtotal, taxTotal, grandTotal, submitOrder, cartItemCount } = useKiosk();

  const [paymentStep,     setPaymentStep]     = useState<PaymentStep>("select");
  const [giftCardNumber,  setGiftCardNumber]  = useState("");
  const [giftCardBalance, setGiftCardBalance] = useState<number | null>(null);
  const [isProcessing,    setIsProcessing]    = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [paxInitialized,  setPaxInitialized]  = useState(false);

  // Auto-initialize PAX terminal on mount
  useEffect(() => {
    const initPax = async () => {
      try {
        const settings = await StorageService.loadSettings();
        const ip = settings.paxIpAddress || RuntimeConfig.paxIpAddress;
        const port = settings.paxPort || RuntimeConfig.paxPort;
        
        if (ip && ip !== '10.0.0.1') { // Only init if IP is configured
          console.log(`[Payment] Auto-initializing PAX at ${ip}:${port}`);
          const ok = await PaxBridgeService.init(ip, port, 30);
          setPaxInitialized(ok);
          if (ok) {
            console.log('[Payment] PAX initialized successfully');
          } else {
            console.warn('[Payment] PAX initialization failed');
          }
        }
      } catch (e) {
        console.error('[Payment] PAX auto-init error:', e);
      }
    };
    initPax();
  }, []);

  // ── Card Payment — goes DIRECTLY to PAX terminal, method='all'
  // PAX terminal displays its own UI for QR / NFC / swipe selection
  const handleCardPayment = useCallback(async () => {
    setPaymentStep("card_processing");
    setIsProcessing(true);
    setError(null);
    try {
      const ecrRef = `REF${Date.now()}`;
      console.log(`[Payment] Direct card → PAX terminal, $${grandTotal}`);

      const result = await PaxBridgeService.doCredit({
        TransType: "SALE",
        amount:    grandTotal,
        method:    "all",   // PAX terminal handles QR/NFC/swipe selection itself
        ecrRef,
      });

      if (!result.isSuccess) throw new Error(result.responseMessage || "Payment Declined");

      const hostInfo = result.rawData?.hostInformation    ?? {};
      const acctInfo = result.rawData?.accountInformation ?? {};
      const amtInfo  = result.rawData?.amountInformation  ?? {};

      const success = await submitOrder("card", {
        cardNumber:      acctInfo.account    ?? "****0000",
        cardType:        acctInfo.cardType   ?? "CARD",
        cardHolder:      "CUSTOMER",
        retref:          hostInfo.hostReferenceNumber ?? ecrRef,
        entryMethod:     acctInfo.entryMode  ?? "UNKNOWN",
        accountType:     "CREDIT",
        hostRefNum:      hostInfo.authCode   ?? "",
        deviceOrgRefNum: `D${Date.now()}`,
        approvedAmount:  parseFloat(amtInfo.approvedAmount ?? "0") / 100 || grandTotal,
      });

      if (success) router.replace("/(order)/order-complete");
      else {
        setError("Order submission failed. Please try again.");
        setPaymentStep("select");
      }
    } catch (e) {
      console.error("[Payment] Card error:", e);
      setError(e instanceof Error ? e.message : "Payment failed. Please try again.");
      setPaymentStep("select");
    } finally {
      setIsProcessing(false);
    }
  }, [grandTotal, submitOrder, router]);

  // ── Gift Card: QR Scan via PAX terminal (NOT phone camera)
  // Sends scan=true entry mode → PAX terminal shows QR on its screen
  const handleGiftCardQR = useCallback(async () => {
    setPaymentStep("gift_card_processing");
    setIsProcessing(true);
    setError(null);
    try {
      const ecrRef = `REF${Date.now()}`;
      console.log("[Payment] Gift card QR → PAX terminal scan mode");

      const result = await PaxBridgeService.doGift({
        TransType: "SALE",
        amount:    grandTotal,
        method:    "qr",   // PAX terminal scans the gift card QR
        ecrRef,
      });

      if (!result.isSuccess) throw new Error(result.responseMessage ?? "QR scan failed");

      const cardNum = result.rawData?.accountInformation?.account ?? "";
      if (!cardNum) throw new Error("No gift card data returned");

      setGiftCardNumber(cardNum);
      setPaymentStep("gift_card_entry");
    } catch (e) {
      console.error("[Payment] Gift card QR error:", e);
      setError(e instanceof Error ? e.message : "Gift card QR scan failed.");
      setPaymentStep("gift_card_method_select");
    } finally {
      setIsProcessing(false);
    }
  }, [grandTotal]);

  // ── Gift Card: Swipe via PAX terminal
  const handleGiftCardSwipe = useCallback(async () => {
    setPaymentStep("gift_card_processing");
    setIsProcessing(true);
    setError(null);
    try {
      const ecrRef = `REF${Date.now()}`;
      const result = await PaxBridgeService.doGift({
        TransType: "SALE",
        amount:    grandTotal,
        method:    "swipe",
        ecrRef,
      });
      if (!result.isSuccess) throw new Error(result.responseMessage ?? "Swipe failed");
      const cardNum = result.rawData?.accountInformation?.account ?? "";
      if (!cardNum) throw new Error("No gift card data returned");
      setGiftCardNumber(cardNum);
      setPaymentStep("gift_card_entry");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gift card swipe failed.");
      setPaymentStep("gift_card_method_select");
    } finally {
      setIsProcessing(false);
    }
  }, [grandTotal]);

  // ── Gift Card: Check Balance
  const handleGiftCardBalanceCheck = useCallback(async () => {
    if (!giftCardNumber || giftCardNumber.length < 4) {
      setError("Please enter a valid gift card number");
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const result = await GiftCardService.checkBalance(giftCardNumber);
      if (result?.status) {
        setGiftCardBalance(result.balance);
        if (result.balance < grandTotal) {
          setError(`Insufficient balance: $${result.balance.toFixed(2)} available, ${formatCurrency(grandTotal)} required`);
        }
      } else {
        setError("Unable to verify gift card.");
      }
    } catch {
      setError("Failed to check gift card balance.");
    } finally {
      setIsProcessing(false);
    }
  }, [giftCardNumber, grandTotal]);

  // ── Gift Card: Redeem
  const handleGiftCardRedeem = useCallback(async () => {
    if (giftCardBalance === null || giftCardBalance < grandTotal) {
      setError("Insufficient gift card balance.");
      return;
    }
    setPaymentStep("gift_card_processing");
    setIsProcessing(true);
    setError(null);
    try {
      const result = await GiftCardService.redeem({ cardToken: giftCardNumber, amount: grandTotal });
      if (result?.status) {
        const success = await submitOrder("gift_card", {
          giftCardNumber:  GiftCardService.maskCardNumber(giftCardNumber),
          hostRefNum:      result.hostRef,
          approvedAmount:  result.approvedBalance,
          newBalance:      result.newBalance,
        });
        if (success) router.replace("/(order)/order-complete");
        else { setError("Order submission failed."); setPaymentStep("select"); }
      } else {
        setError(result?.description ?? "Gift card redemption failed.");
        setPaymentStep("gift_card_entry");
      }
    } catch {
      setError("Gift card payment failed.");
      setPaymentStep("gift_card_entry");
    } finally {
      setIsProcessing(false);
    }
  }, [giftCardNumber, giftCardBalance, grandTotal, submitOrder, router]);

  // ── Cancel
  const handleCancel = useCallback(() => {
    if (isProcessing) {
      Alert.alert("Cancel Payment?", "Are you sure?", [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel", style: "destructive",
          onPress: async () => {
            try { await PaxBridgeService.cancel(); } catch {}
            setIsProcessing(false);
            setPaymentStep("select");
            setError(null);
          },
        },
      ]);
    } else {
      if (paymentStep !== "select") { setPaymentStep("select"); setError(null); }
      else router.back();
    }
  }, [isProcessing, paymentStep, router]);

  // ─── Render Helpers ──────────────────────────────────────────────────────────

  const renderSelect = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Choose Payment Method</Text>

      {/* CARD: one tap → directly to PAX terminal */}
      <TouchableOpacity
        style={styles.methodCard}
        onPress={handleCardPayment}
        activeOpacity={0.8}
      >
        <Text style={styles.methodIcon}>💳</Text>
        <View style={styles.methodText}>
          <Text style={styles.methodTitle}>Credit / Debit Card</Text>
          <Text style={styles.methodSubtitle}>
            Terminal will show QR, NFC & swipe options
          </Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      {/* GIFT CARD */}
      <TouchableOpacity
        style={styles.methodCard}
        onPress={() => setPaymentStep("gift_card_method_select")}
        activeOpacity={0.8}
      >
        <Text style={styles.methodIcon}>🎁</Text>
        <View style={styles.methodText}>
          <Text style={styles.methodTitle}>Gift Card</Text>
          <Text style={styles.methodSubtitle}>Scan QR, swipe, or enter manually</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProcessing = (msg: string) => (
    <View style={styles.processingBox}>
      <ActivityIndicator size="large" color="#ff3b30" style={{ marginBottom: 24 }} />
      <Text style={styles.processingTitle}>Processing…</Text>
      <Text style={styles.processingMsg}>{msg}</Text>
      <Text style={styles.processingAmount}>{formatCurrency(grandTotal)}</Text>
      <Text style={styles.processingHint}>Follow instructions on the terminal</Text>
    </View>
  );

  const renderGiftCardMethodSelect = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Gift Card Method</Text>

      <TouchableOpacity style={styles.methodCard} onPress={handleGiftCardQR} activeOpacity={0.8}>
        <Text style={styles.methodIcon}>📱</Text>
        <View style={styles.methodText}>
          <Text style={styles.methodTitle}>Scan Gift Card QR</Text>
          <Text style={styles.methodSubtitle}>PAX terminal scans the QR on your gift card</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.methodCard} onPress={handleGiftCardSwipe} activeOpacity={0.8}>
        <Text style={styles.methodIcon}>💳</Text>
        <View style={styles.methodText}>
          <Text style={styles.methodTitle}>Swipe Gift Card</Text>
          <Text style={styles.methodSubtitle}>Swipe your gift card on the terminal</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.methodCard, { borderColor: "#3a3a4a" }]}
        onPress={() => setPaymentStep("gift_card_entry")}
        activeOpacity={0.8}
      >
        <Text style={styles.methodIcon}>⌨️</Text>
        <View style={styles.methodText}>
          <Text style={styles.methodTitle}>Enter Manually</Text>
          <Text style={styles.methodSubtitle}>Type the gift card number</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGiftCardEntry = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Gift Card Details</Text>
      <TextInput
        style={styles.input}
        placeholder="Gift card number"
        placeholderTextColor="#555"
        value={giftCardNumber}
        onChangeText={(t) => { setGiftCardNumber(t); setGiftCardBalance(null); setError(null); }}
        keyboardType="numeric"
        maxLength={20}
        autoFocus
      />
      {giftCardBalance !== null && giftCardBalance >= grandTotal && (
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceValue}>{formatCurrency(giftCardBalance)}</Text>
        </View>
      )}
      <TouchableOpacity
        style={[styles.primaryBtn, isProcessing && { opacity: 0.5 }]}
        onPress={giftCardBalance !== null && giftCardBalance >= grandTotal ? handleGiftCardRedeem : handleGiftCardBalanceCheck}
        disabled={isProcessing}
        activeOpacity={0.8}
      >
        {isProcessing
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.primaryBtnText}>
              {giftCardBalance !== null && giftCardBalance >= grandTotal ? `Pay ${formatCurrency(grandTotal)}` : "Check Balance"}
            </Text>
        }
      </TouchableOpacity>
    </View>
  );

  // ─── Main Render ──────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleCancel}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{cartItemCount} item{cartItemCount !== 1 ? "s" : ""}</Text>
            <Text style={styles.rowValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Tax</Text>
            <Text style={styles.rowValue}>{formatCurrency(taxTotal)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(grandTotal)}</Text>
          </View>
          {state.customerName ? (
            <View style={[styles.row, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#2e2e3a" }]}>
              <Text style={styles.rowLabel}>Name</Text>
              <Text style={styles.rowValue}>{state.customerName}</Text>
            </View>
          ) : null}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {paymentStep === "select"                 && renderSelect()}
        {paymentStep === "card_processing"        && renderProcessing("Please follow instructions on the PAX terminal")}
        {paymentStep === "gift_card_method_select" && renderGiftCardMethodSelect()}
        {paymentStep === "gift_card_entry"        && renderGiftCardEntry()}
        {paymentStep === "gift_card_processing"   && renderProcessing("Reading gift card from terminal…")}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: "#0f0f13" },
  header:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 },
  backBtn:         { width: 44, height: 44, borderRadius: 14, backgroundColor: "#1a1a24", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#2e2e3a" },
  backBtnText:     { color: "#fff", fontSize: 22, fontWeight: "600" },
  headerTitle:     { fontSize: 22, fontWeight: "800", color: "#fff" },

  scroll:          { flex: 1 },
  scrollContent:   { padding: 24, paddingBottom: 60 },

  summaryCard:     { backgroundColor: "#1a1a24", borderRadius: 20, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: "#2e2e3a" },
  summaryTitle:    { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 16 },
  row:             { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  rowLabel:        { fontSize: 15, color: "#8e8e93", fontWeight: "500" },
  rowValue:        { fontSize: 15, color: "#fff", fontWeight: "600" },
  divider:         { height: 1, backgroundColor: "#2e2e3a", marginVertical: 12 },
  totalLabel:      { fontSize: 19, fontWeight: "800", color: "#fff" },
  totalValue:      { fontSize: 22, fontWeight: "800", color: "#ff3b30" },

  errorBox:        { backgroundColor: "rgba(255,59,48,0.1)", borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: "rgba(255,59,48,0.2)" },
  errorText:       { color: "#ff6b5e", fontSize: 14, fontWeight: "500", textAlign: "center", lineHeight: 20 },

  section:         { marginBottom: 24 },
  sectionTitle:    { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 16 },

  methodCard:      { flexDirection: "row", alignItems: "center", backgroundColor: "#1a1a24", borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: "#2e2e3a" },
  methodIcon:      { fontSize: 28, marginRight: 16 },
  methodText:      { flex: 1 },
  methodTitle:     { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 4 },
  methodSubtitle:  { fontSize: 13, color: "#8e8e93" },
  arrow:           { fontSize: 22, color: "#8e8e93", marginLeft: 8 },

  processingBox:   { alignItems: "center", paddingVertical: 48 },
  processingTitle: { fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 12 },
  processingMsg:   { fontSize: 15, color: "#8e8e93", textAlign: "center", paddingHorizontal: 24, marginBottom: 16 },
  processingAmount:{ fontSize: 36, fontWeight: "800", color: "#ff3b30", marginBottom: 8 },
  processingHint:  { fontSize: 13, color: "#555", textAlign: "center" },

  input:           { backgroundColor: "#1a1a24", borderRadius: 14, padding: 16, color: "#fff", fontSize: 16, borderWidth: 1, borderColor: "#2e2e3a", marginBottom: 16 },
  balanceRow:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#0d1f0d", borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#1a4a1a" },
  balanceLabel:    { fontSize: 15, color: "#8e8e93" },
  balanceValue:    { fontSize: 18, fontWeight: "700", color: "#30d158" },

  primaryBtn:      { backgroundColor: "#ff3b30", borderRadius: 16, padding: 18, alignItems: "center" },
  primaryBtnText:  { color: "#fff", fontSize: 17, fontWeight: "700" },
});
