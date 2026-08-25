import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { BRAND, PAYMENT } from '@/lib/constants/figma-tokens';

export function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 1;
  return Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
}

export function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Backend confirm returns PAYMENT_VERIFIED / PAYMENT_NOT_VERIFIED; the demo
// path returns 'confirmed'. Normalize all success forms into one boolean.
export function isPaymentVerified(status?: string): boolean {
  const s = (status || '').toUpperCase();
  if (s.includes('NOT')) return false;
  return s === 'CONFIRMED' || s.includes('VERIFIED') || s.includes('SUCCEEDED');
}

// Backend date fields require exact dates ("2026-08-10"), not ISO datetimes
// ("2026-08-10T14:00:00.000Z"). The latter is UTC, so slicing it shifts the

export const NAVY = BRAND.navyLight;
export const BLUE = PAYMENT.bookingBlue;
export const TEAL = PAYMENT.success;

export type PaymentGateway = 'dummy' | 'stripe' | 'khalti' | 'razorpay';

export const PAYMENT_METHODS: { key: PaymentGateway; name: string; desc: string }[] = [
  { key: 'khalti', name: 'Khalti', desc: 'Pay with Khalti wallet' },
  { key: 'stripe', name: 'Card (Stripe)', desc: 'Credit / debit card' },
  { key: 'razorpay', name: 'Razorpay', desc: 'UPI, cards & net banking' },
  { key: 'dummy', name: 'Test (Demo)', desc: 'No real charge — for testing' },
];

// Gateway checkout capability, from the LIVE backend's payment strategies
// (anilghatan6/Stay-Easy booking/payment/* — verified against source):
//  - Khalti   returns { pidx, payment_url }                → native Khalti SDK
//    preferred; hosted WebView checkout as the fallback (Expo Go / web /
//    missing public key).
//  - Stripe   returns { client_secret, payment_intent_id } → native Stripe PaymentSheet.
//  - Razorpay returns { order_id }                         → native Razorpay checkout sheet.
//  - Dummy    returns fake ids and always verifies         → no checkout at all.
// Stripe/Razorpay have NO hosted payment_url on the backend, so they run
// through their native SDKs (SdkPaymentCheckout) — which need a development
// build and the gateway's public key.
export const GATEWAYS_WITH_SDK: PaymentGateway[] = ['stripe', 'razorpay', 'khalti'];

// The SDK gateways need a dev build + public key; until both exist (or on web
// / Expo Go) they can't run HERE. gatewayUnavailableNote explains exactly what
// is missing, shown inline on the payment-method option so the guest knows
// before tapping "Complete booking".
export const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
export const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '';
export const KHALTI_PUBLIC_KEY = process.env.EXPO_PUBLIC_KHALTI_PUBLIC_KEY || '';
export const KHALTI_ENVIRONMENT: 'TEST' | 'PROD' =
  process.env.EXPO_PUBLIC_KHALTI_ENVIRONMENT === 'PROD' ? 'PROD' : 'TEST';

export const gatewayUnavailableNote = (key: PaymentGateway): string | null => {
  if (key === 'stripe') {
    if (Platform.OS === 'web') return 'Card payments use the Stripe SDK, which doesn\'t run on web — use Khalti or Test (Demo).';
    if (IS_EXPO_GO) return 'Card payments need the Stripe SDK — it only works in a development build, not Expo Go.';
    if (!STRIPE_PUBLISHABLE_KEY) return 'Card payments need the Stripe SDK and a publishable key. Set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env and rebuild.';
    return null;
  }
  if (key === 'razorpay') {
    if (Platform.OS === 'web') return 'Razorpay payments use its SDK, which doesn\'t run on web — use Khalti or Test (Demo).';
    if (IS_EXPO_GO) return 'Razorpay payments need its SDK — it only works in a development build, not Expo Go.';
    if (!RAZORPAY_KEY_ID) return 'Razorpay payments need its SDK and a key ID. Set EXPO_PUBLIC_RAZORPAY_KEY_ID in .env and rebuild.';
    return null;
  }
  return null;
};

export type Step = 0 | 1 | 2;

export interface SelectedRoom {
  id: string;
  name: string;
  roomType: string;
  bedType: string;
  price: number;
  maxAdults: number;
  maxChildren: number;
  image: string;
  cancellation: string;
  cancellationDesc: string;
  quantity: number;
}

export interface GuestInfo {
  firstName: string; lastName: string; email: string; phone: string; country: string; specialRequests: string;
}
