import { useEffect, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BRAND, PAYMENT, SLATE } from '@/lib/constants/figma-tokens';

const NAVY = BRAND.navyLight;
const BLUE = PAYMENT.bookingBlue;

export interface SdkStripeOptions {
  /** Stripe publishable key (EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY). */
  publishableKey: string;
  /** client_secret from the backend's payment-intent response. */
  clientSecret: string;
  /** payment_intent_id from the backend's payment-intent response. */
  paymentIntentId?: string;
  merchantDisplayName?: string;
}

export interface SdkRazorpayOptions {
  /** Razorpay key ID (EXPO_PUBLIC_RAZORPAY_KEY_ID). */
  keyId: string;
  /** order_id from the backend's payment-intent response. */
  orderId: string;
  /** Amount in major units (e.g. NPR 5000) — converted to paise by the SDK call. */
  amount: number;
  currency?: string;
  description?: string;
  prefillName?: string;
  email?: string;
  phone?: string;
}

export interface SdkKhaltiOptions {
  /** Khalti public key (EXPO_PUBLIC_KHALTI_PUBLIC_KEY). */
  publicKey: string;
  /** pidx from the backend's payment-intent response (Khalti ePayment v2). */
  pidx: string;
  /** Khalti environment — 'TEST' (default) or 'PROD'. */
  environment?: 'TEST' | 'PROD';
}

export interface SdkPaymentCheckoutProps {
  visible: boolean;
  gateway: 'stripe' | 'razorpay' | 'khalti';
  options: SdkStripeOptions | SdkRazorpayOptions | SdkKhaltiOptions;
  onComplete: (params: Record<string, string>) => void;
  onCancel: (message?: string) => void;
}

type Report =
  | { ok: true; params: Record<string, string> }
  | { ok: false; message?: string };

// Khalti's native SDK ships as a default-exported singleton with a promise-based
// startPayment and event listeners. The package may or may not publish its own
// types, so we describe the surface we use locally.
// Mirrors the installed SDK's actual payloads (build/KhaltiPaymentSdk.types.d.ts)
// — success carries pidx + status, error carries `error`/`details`.
interface KhaltiSuccessPayload {
  pidx?: string;
  status?: string;
  paymentResult?: string;
  message?: string;
  timestamp?: number;
}
interface KhaltiErrorPayload {
  error?: string;
  details?: string;
  status?: string;
  timestamp?: number;
}
interface KhaltiModule {
  default: {
    startPayment: (opts: {
      publicKey: string;
      pidx: string;
      environment?: 'TEST' | 'PROD';
    }) => Promise<{ pidx?: string; status?: string } | undefined>;
    onPaymentSuccess?: (cb: (payload: KhaltiSuccessPayload) => void) => { remove(): void };
    onPaymentError?: (cb: (payload: KhaltiErrorPayload) => void) => { remove(): void };
    onPaymentCancel?: (cb: (payload?: unknown) => void) => { remove(): void };
  };
}

// Lazy requires: the native SDKs must never execute on web or in Expo Go at
// import time. Metro still bundles them (they only ever run in a development
// build), but execution is deferred until a Stripe/Razorpay/Khalti payment is
// actually attempted — and every failure path reports back so the caller can
// show a graceful in-app note instead of a dead spinner.
function getStripeModule() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('@stripe/stripe-react-native') as typeof import('@stripe/stripe-react-native');
}

function getKhaltiModule(): KhaltiModule['default'] {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('@bishaldahal/react-native-khalti-checkout') as KhaltiModule;
  return mod.default || (mod as unknown as KhaltiModule['default']);
}

/**
 * Native-SDK payment checkout for the gateways that run outside a WebView
 * (verified against anilghatan6/Stay-Easy booking/payment/*):
 *  - Stripe   → PaymentSheet presented with the intent's client_secret.
 *  - Razorpay → checkout sheet opened with the backend's order_id + key.
 *  - Khalti   → native wallet checkout with the backend's pidx (preferred
 *    over the hosted payment_url; booking-flow falls back to the WebView when
 *    this SDK can't run here).
 *
 * These are native modules: they only run in a development build (not Expo
 * Go) and never on web. Every failure — missing module, init error, or user
 * cancellation — is reported through onCancel so the caller can show a
 * graceful note and offer alternatives. A booking is never confirmed without
 * a real payment.
 */
export function SdkPaymentCheckout({
  visible, gateway, options, onComplete, onCancel,
}: SdkPaymentCheckoutProps) {
  const reportedRef = useRef(false);

  const report = (result: Report) => {
    if (reportedRef.current) return;
    reportedRef.current = true;
    if (result.ok) onComplete(result.params);
    else onCancel(result.message);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => report({ ok: false, message: 'Payment cancelled' })}>
      {gateway === 'stripe' ? (
        <StripeHost options={options as SdkStripeOptions} onReport={report} />
      ) : gateway === 'razorpay' ? (
        <RazorpayHost options={options as SdkRazorpayOptions} onReport={report} />
      ) : (
        <KhaltiHost options={options as SdkKhaltiOptions} onReport={report} />
      )}
    </Modal>
  );
}

function StripeHost({ options, onReport }: { options: SdkStripeOptions; onReport: (r: Report) => void }) {
  const { StripeProvider } = getStripeModule();
  return (
    <StripeProvider publishableKey={options.publishableKey}>
      <StripeSheetRunner options={options} onReport={onReport} />
    </StripeProvider>
  );
}

function StripeSheetRunner({ options, onReport }: { options: SdkStripeOptions; onReport: (r: Report) => void }) {
  const { useStripe } = getStripeModule();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const onReportRef = useRef(onReport);
  onReportRef.current = onReport;
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    (async () => {
      try {
        const init = await initPaymentSheet({
          paymentIntentClientSecret: options.clientSecret,
          merchantDisplayName: options.merchantDisplayName || 'ServeIQ',
        });
        if (init.error) {
          onReportRef.current({ ok: false, message: init.error.message || 'Could not start Stripe checkout.' });
          return;
        }
        const present = await presentPaymentSheet();
        if (present.didCancel) {
          onReportRef.current({ ok: false });
          return;
        }
        if (present.error) {
          onReportRef.current({ ok: false, message: present.error.message || 'Could not complete Stripe payment.' });
          return;
        }
        // This version's result carries no paymentIntent id — the caller
        // already has it from the backend's payment-intent response, and the
        // backend re-verifies the intent status server-side.
        onReportRef.current({ ok: true, params: { payment_intent_id: options.paymentIntentId || '' } });
      } catch (e: any) {
        onReportRef.current({
          ok: false,
          message: e?.message || 'The Stripe SDK is not available on this device. Run a development build to enable card payments.',
        });
      }
    })();
  }, []);

  return <StatusView gatewayName="Stripe" onCancel={() => onReportRef.current({ ok: false })} />;
}

function RazorpayHost({ options, onReport }: { options: SdkRazorpayOptions; onReport: (r: Report) => void }) {
  const onReportRef = useRef(onReport);
  onReportRef.current = onReport;
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const RazorpayCheckout = (require('react-native-razorpay') as typeof import('react-native-razorpay')).default;
        const data = await RazorpayCheckout.open({
          key: options.keyId,
          order_id: options.orderId,
          amount: String(Math.round(options.amount * 100)),
          currency: options.currency || 'INR',
          name: 'ServeIQ',
          description: options.description || 'ServeIQ booking',
          prefill: {
            email: options.email || '',
            contact: options.phone || '',
            name: options.prefillName || '',
          },
          theme: { color: BLUE },
        });
        onReportRef.current({
          ok: true,
          params: {
            order_id: data.razorpay_order_id || options.orderId || '',
            payment_id: data.razorpay_payment_id || '',
            signature: data.razorpay_signature || '',
          },
        });
      } catch (e: any) {
        // code 2 (and/or a "cancelled" description) = the guest closed the sheet.
        const isCancel = e?.code === 2 || /cancel/i.test(String(e?.description || e?.message || ''));
        const msg =
          e?.description ||
          e?.message ||
          'The Razorpay SDK is not available on this device. Run a development build to enable Razorpay payments.';
        onReportRef.current(isCancel ? { ok: false } : { ok: false, message: msg });
      }
    })();
  }, []);

  return <StatusView gatewayName="Razorpay" onCancel={() => onReportRef.current({ ok: false })} />;
}

function KhaltiHost({ options, onReport }: { options: SdkKhaltiOptions; onReport: (r: Report) => void }) {
  const onReportRef = useRef(onReport);
  onReportRef.current = onReport;
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      // First event wins inside this host: the success/error/cancel listeners,
      // the startPayment resolution and errors all funnel through settle(), so
      // a late event can never override an earlier one (the parent dedupes on
      // top via reportedRef).
      let settled = false;
      const subs: { remove(): void }[] = [];
      const cleanup = () => subs.forEach(s => { try { s.remove(); } catch { /* noop */ } });
      const settle = (r: Report) => {
        if (settled) return;
        settled = true;
        cleanup();
        onReportRef.current(r);
      };

      try {
        const sdk = getKhaltiModule();

        if (sdk.onPaymentSuccess) {
          subs.push(sdk.onPaymentSuccess((payload) => {
            settle({ ok: true, params: { pidx: payload.pidx || options.pidx || '' } });
          }));
        }
        if (sdk.onPaymentError) {
          subs.push(sdk.onPaymentError((payload) => {
            settle({
              ok: false,
              message: payload.error || payload.details || 'Khalti payment failed. Please try again.',
            });
          }));
        }
        if (sdk.onPaymentCancel) {
          subs.push(sdk.onPaymentCancel(() => settle({ ok: false })));
        }

        const result = await sdk.startPayment({
          publicKey: options.publicKey,
          pidx: options.pidx,
          environment: options.environment || 'TEST',
        });

        // startPayment resolves with the SDK's result payload (some SDK builds
        // resolve instead of firing a listener). A cancelled/failed status must
        // NOT be reported as success — the backend re-verifies the pidx either
        // way, so passing it through is safe.
        if (result && (result.status === 'cancelled' || result.status === 'failed')) {
          settle({ ok: false });
        } else {
          settle({ ok: true, params: { pidx: result?.pidx || options.pidx || '' } });
        }
      } catch (e: any) {
        const msg = String(e?.message || e?.error || e?.description || '');
        const isCancel = /cancel/i.test(msg) || e?.code === 'ERR_PAYMENT_CANCELED';
        settle(
          isCancel
            ? { ok: false }
            : {
                ok: false,
                message:
                  msg ||
                  'The Khalti SDK is not available on this device. Run a development build to enable Khalti payments.',
              },
        );
      }
    })();
  }, []);

  return <StatusView gatewayName="Khalti" onCancel={() => onReportRef.current({ ok: false })} />;
}

function StatusView({ gatewayName, onCancel }: { gatewayName: string; onCancel: () => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={BLUE} />
        <Text style={styles.title}>Opening {gatewayName} checkout…</Text>
        <Text style={styles.desc}>
          Follow the {gatewayName} sheet to complete your payment. Your booking stays saved either way.
        </Text>
        <TouchableOpacity style={styles.cancelLink} onPress={onCancel} hitSlop={8}>
          <Ionicons name="close-circle-outline" size={15} color={BLUE} />
          <Text style={styles.cancelLinkText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SLATE[50],
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: { alignItems: 'center', gap: 12, maxWidth: 320 },
  title: { fontSize: 17, fontWeight: '700', color: NAVY, textAlign: 'center' },
  desc: { fontSize: 13, color: SLATE[500], textAlign: 'center', lineHeight: 20 },
  cancelLink: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 6 },
  cancelLinkText: { fontSize: 14, fontWeight: '600', color: BLUE },
});
