# POS Self-Service Kiosk — React Native Migration

## Overview

This React Native (Expo) project implements the **Self-Service Kiosk** functionality described in the Kiosk Project Guide. It was migrated from the Flutter-based POS_Lite application, extracting only the features relevant to kiosk operation.

---

## What Was Migrated

### Screens (User Flow)
| Step | Screen | Source (Flutter) | Destination (React Native) |
|------|--------|-----------------|---------------------------|
| 1 | Welcome / Idle | `splash_screen.dart` | `app/index.tsx` |
| 2 | Menu Browsing | `pos_main_screen.dart` (partial) | `app/(order)/menu.tsx` |
| 3 | Item Detail + Modifiers | `item_details_modal.dart` | `app/(order)/item-detail.tsx` |
| 4 | Cart Review | `pos_main_screen.dart` (cart panel) | `app/(order)/cart.tsx` |
| 5 | Customer Type | *New for kiosk* | `app/(order)/customer-type.tsx` |
| 6 | Name Entry | *New for kiosk* | `app/(order)/enter-name.tsx` |
| 7 | Payment | `payment_screen.dart` | `app/(order)/payment.tsx` |
| 8 | Order Complete | *New for kiosk* | `app/(order)/order-complete.tsx` |
| - | Closed Screen | *New for kiosk* | `app/closed.tsx` |
| - | Out of Order | *New for kiosk* | `app/out-of-order.tsx` |
| - | Settings Auth | `login_screen.dart` (PIN pattern) | `app/settings-auth.tsx` |
| - | Settings | `settings_screen.dart` (partial) | `app/settings.tsx` |

### Models / Types
| Model | Source (Flutter) | Destination (React Native) |
|-------|-----------------|---------------------------|
| Item | `models/item.dart` | `src/types/index.ts` |
| Department | `models/department.dart` | `src/types/index.ts` |
| CartItem | `models/cart_item.dart` | `src/types/index.ts` |
| ModifierGroup | `models/modifier_group.dart` | `src/types/index.ts` |
| ModifiersOfItem | `models/modifier_item_link.dart` | `src/types/index.ts` |
| TransMain/TransItem | `models/trans_main.dart` | `src/types/index.ts` |
| POSLinkResponse | `models/poslink_models.dart` | `src/types/index.ts` |
| GiftCard | `models/gift_card.dart` | `src/types/index.ts` |
| BusinessInfo | `models/business_info.dart` | `src/types/index.ts` |

### Services
| Service | Source (Flutter) | Destination (React Native) |
|---------|-----------------|---------------------------|
| API Service | `services/api_service.dart` | `src/services/apiService.ts` |
| Gift Card Service | `services/gift_card_service.dart` | `src/services/giftCardService.ts` |
| Connectivity | `services/connectivity_service.dart` | `src/services/connectivityService.ts` |
| Storage | `services/database_service.dart` (partial) | `src/services/storageService.ts` |

### Business Logic
| Logic | Source (Flutter) | Destination (React Native) |
|-------|-----------------|---------------------------|
| Cart calculations | `models/cart_item.dart` | `src/utils/cartUtils.ts` |
| Tax calculation (truncation) | `providers/pos_provider.dart` | `src/utils/cartUtils.ts` |
| State management | `providers/pos_provider.dart`, `settings_provider.dart` | `src/store/kioskStore.tsx` |
| API config | `config/api_config.dart` | `src/config/apiConfig.ts` |

---

## What Was Intentionally Excluded

| Feature/Module | Reason |
|---------------|--------|
| `login_screen.dart` / `store_login_screen.dart` | Full POS login not needed for kiosk — replaced with PIN auth |
| `recall_screen.dart` | Bill recall is a cashier function, not kiosk |
| `return_screen.dart` / `return_confirm_screen.dart` | Returns handled by staff only |
| `void_screen.dart` | Void operations are cashier-only |
| `discount_screen.dart` | Discounts applied by staff |
| `customer_registration_screen.dart` | Registration done separately |
| `smtp_credentials_screen.dart` | Email config is admin-only |
| `save_bill_service.dart` | Complex bill parking — kiosk submits immediately |
| `receipt_service.dart` | Implemented `modules/esc-pos-printer` (Network/USB, with Serial placeholder) |
| `pax_card_device.dart` / `pax_bridge_service.dart` | PAX SDK requires native module (placeholder added) |
| `cloud_sync_service.dart` | Full cloud sync replaced with simpler offline queue |
| `image_sync_service.dart` | Kiosk uses online images directly |
| `encryption_service.dart` | AES encryption would need `react-native-crypto` (TODO) |
| `signalr_service.dart` | Real-time sync not needed for kiosk |
| `database_service.dart` | Full SQLite replaced with AsyncStorage for kiosk settings |
| Loyalty Plans / Mix-Match / Bulk Info models | Complex pricing not needed for kiosk |
| All settings sub-screens (tax, profile, etc.) | Simplified into single settings screen |

---

## Assumptions Made

1. **Kiosk runs on a dedicated tablet/touch-screen device** — The UI is designed for touch-first interaction with large tap targets.

2. **PAX terminal integration will be done via native module** — Card payment currently uses a simulated flow. The real PAX BridgeComm SDK needs a native module wrapper.

3. **Receipt printing will be handled via a native module** — The order complete screen shows a "printing" indicator but actual printer communication requires native code.

4. **Gift card encryption is simplified** — The Flutter app uses AES-256 with PBKDF2 key derivation (matching C# `CLSencryption`). This needs `react-native-crypto` or similar for production.

5. **Orders are "Take Away" by default** — Since it's a kiosk, all orders are treated as take-away.

6. **No cash payment** — Kiosk only accepts card and gift card payments as specified in the project guide.

7. **Offline mode stores transactions locally** — When the network is unavailable, transactions are saved to AsyncStorage and auto-synced when connectivity is restored.

8. **Settings PIN defaults to "1234"** — Can be changed from the settings screen.

9. **Inactivity timeout returns to welcome** — The order complete screen auto-resets after 15 seconds.

---

## Project Structure

```
ReactNative/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout with KioskProvider
│   ├── index.tsx                 # Welcome / Idle screen
│   ├── closed.tsx                # Kiosk closed screen
│   ├── out-of-order.tsx          # Out of order screen
│   ├── settings-auth.tsx         # PIN entry for settings
│   ├── settings.tsx              # Admin settings panel
│   └── (order)/                  # Order flow group
│       ├── _layout.tsx           # Order flow layout
│       ├── menu.tsx              # Category + item browsing
│       ├── item-detail.tsx       # Item detail + modifiers
│       ├── cart.tsx              # Cart review + edit
│       ├── customer-type.tsx     # Member/Guest selection
│       ├── enter-name.tsx        # Name entry
│       ├── payment.tsx           # Card / Gift card payment
│       └── order-complete.tsx    # Success + receipt
├── src/
│   ├── config/
│   │   └── apiConfig.ts          # API URLs, auth, runtime config
│   ├── services/
│   │   ├── apiService.ts         # Cloud API communication
│   │   ├── giftCardService.ts    # Gift card balance + redeem
│   │   ├── connectivityService.ts # Network monitoring
│   │   └── storageService.ts     # AsyncStorage persistence
│   ├── store/
│   │   └── kioskStore.tsx        # Central state (Context + Reducer)
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   └── utils/
│       └── cartUtils.ts          # Cart math + formatting
├── tailwind.config.js            # NativeWind/Tailwind config
└── MIGRATION.md                  # This file
```

---

## Running the Project

```bash
cd ReactNative
npm install    # or bun install
npx expo start
```

Press `a` for Android, `i` for iOS, or `w` for web.

---

## TODO (Future Work)

- [x] **Auto-Sync Pending Transactions** — `ConnectivityService` now uploads pending offline transactions when network recovers
- [x] **Inactivity Timer** — `useInactivityTimer` hook auto-resets kiosk to welcome screen after 2 minutes of idle (configurable)
- [x] **Kiosk Mode Persistence** — Welcome screen now loads saved kiosk status (active/closed/out-of-order) from AsyncStorage on startup
- [x] **Typed Route Declarations** — All app routes registered in `.expo/types/router.d.ts`
- [x] **Connectivity Initialization** — `ConnectivityService` starts monitoring on app launch
- [x] **PAX Terminal Native Module** — Implemented `PaxBridgeService` using Expo Modules API (Kotlin/Swift) with placeholders for BridgeComm SDK
- [x] **Receipt Printing** — Implemented `ReceiptService` for customer receipts. Added `printKitchenTicket` for kitchen orders (backup mode when offline).
- [x] **Offline Sync** — `ConnectivityService` is updated to publicly expose `triggerSync` and processes pending transactions in FIFO order. `kioskStore` triggers this when online.
- [x] **Gift Card Encryption** — Ported AES-256 CBC encryption with PBKDF2 using `crypto-js` in `EncryptionService`
- [x] **QR Code Scanner** — Integrated `expo-camera` for loyalty membership QR scanning in `app/(order)/scan-qr.tsx`
- [ ] **Kitchen Display WebSocket** — Connect to SignalR hub for real-time kitchen notifications
- [ ] **Idle Animation** — Add promotional content/slideshow on the welcome screen
- [ ] **Multi-language Support** — i18n for different store locations
- [ ] **Accessibility** — Screen reader support and high-contrast mode

