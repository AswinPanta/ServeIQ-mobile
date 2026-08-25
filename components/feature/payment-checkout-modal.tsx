import { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ActivityIndicator, Platform, StyleSheet,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { BRAND, PAYMENT, SLATE, BG } from '@/lib/constants/figma-tokens';

const NAVY = BRAND.navyLight;
const BLUE = PAYMENT.bookingBlue;

/**
 * Hosted payment checkout — opens the gateway's payment_url (Khalti's page;
 * Stripe/Razorpay have no hosted URL on the backend and go through their
 * native SDKs via SdkPaymentCheckout) in an in-app
 * WebView so the user actually enters credentials and pays. The booking is
 * ONLY confirmed after this flow completes — never before.
 *
 * Completion detection:
 *  - Native: the gateway redirects to return_url (deep link). We intercept the
 *    navigation in onShouldStartLoadWithRequest / onNavigationStateChange and
 *    call onComplete with any query params the gateway appended.
 *  - Web: opens the URL in a new tab. The booking is confirmed only when the
 *    gateway redirects back to a return URL the app can detect; there is no
 *    manual "skip" button because a manual confirm without the gateway's pidx
 *    always fails backend validation ("Payment Not Verified").
 */
export function PaymentCheckoutModal({
  visible,
  paymentUrl,
  returnUrlPrefix,
  gatewayName,
  onComplete,
  onCancel,
}: {
  visible: boolean;
  paymentUrl: string;
  returnUrlPrefix: string;
  gatewayName: string;
  onComplete: (params: Record<string, string>) => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  const isReturnUrl = (url: string): boolean => {
    if (!url) return false;
    if (returnUrlPrefix && url.startsWith(returnUrlPrefix)) return true;
    return url.includes('booking-confirmation');
  };

  const extractParams = (url: string): Record<string, string> => {
    try {
      const q = url.split('?')[1] || '';
      const params: Record<string, string> = {};
      for (const pair of q.split('&')) {
        const [k, v] = pair.split('=');
        if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
      }
      return params;
    } catch {
      return {};
    }
  };

  const finish = (url: string) => {
    if (completed) return;
    setCompleted(true);
    onComplete(extractParams(url));
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.closeBtn} hitSlop={8}>
            <Ionicons name="close" size={22} color={NAVY} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Pay with {gatewayName}</Text>
            <Text style={styles.headerSub}>Complete your payment to confirm the booking</Text>
          </View>
        </View>

        {Platform.OS === 'web' ? (
          <View style={styles.webWrap}>
            <Ionicons name="card-outline" size={48} color={SLATE[400]} />
            <Text style={styles.webTitle}>Open the secure checkout</Text>
            <Text style={styles.webDesc}>
              You&apos;ll be taken to {gatewayName} to enter your payment details.
            </Text>
            <TouchableOpacity
              style={styles.webBtn}
              onPress={() => {
                window.open(paymentUrl, '_blank');
              }}
            >
              <Text style={styles.webBtnText}>Open {gatewayName} checkout</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {loading && (
              <View style={styles.loadingOverlay} pointerEvents="none">
                <ActivityIndicator size="large" color={BLUE} />
                <Text style={styles.loadingText}>Loading secure checkout…</Text>
              </View>
            )}
            <WebView
              source={{ uri: paymentUrl }}
              startInLoadingState
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onShouldStartLoadWithRequest={(request) => {
                if (isReturnUrl(request.url)) {
                  finish(request.url);
                  return false;
                }
                return true;
              }}
              onNavigationStateChange={(nav) => {
                if (nav.url && isReturnUrl(nav.url)) {
                  finish(nav.url);
                }
              }}
              style={styles.webview}
            />
          </>
        )}

        {/* Cancel — the booking stays held until payment is confirmed */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelBtnText}>Cancel — keep booking saved</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SLATE[50] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 12,
    backgroundColor: BG.white,
    borderBottomWidth: 1,
    borderBottomColor: SLATE[200],
  },
  closeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: SLATE[100], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: NAVY },
  headerSub: { fontSize: 12, color: SLATE[400], marginTop: 2 },
  webview: { flex: 1 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: SLATE[50] },
  loadingText: { fontSize: 13, color: SLATE[500] },
  webWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  webTitle: { fontSize: 17, fontWeight: '700', color: NAVY, marginTop: 6 },
  webDesc: { fontSize: 13, color: SLATE[500], textAlign: 'center', lineHeight: 20 },
  webBtn: { marginTop: 16, backgroundColor: BLUE, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  webBtnText: { fontSize: 15, fontWeight: '700', color: BG.white },
  footer: { padding: 16, paddingBottom: Platform.OS === 'ios' ? 36 : 16, backgroundColor: BG.white, borderTopWidth: 1, borderTopColor: SLATE[200] },
  cancelBtn: { paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 13, color: SLATE[500], fontWeight: '600' },
});
