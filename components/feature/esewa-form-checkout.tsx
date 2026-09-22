import { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ActivityIndicator, Platform, StyleSheet,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { BRAND, PAYMENT, SLATE, BG } from '@/lib/constants/figma-tokens';

const NAVY = BRAND.navyLight;
const BLUE = PAYMENT.bookingBlue;
const ESEWA_GREEN = '#60BB46';

/**
 * Live eSewa checkout — the backend returns an HMAC-signed { form_url,
 * form_fields } (eSewa main/v2/form). We auto-POST the hidden form in a
 * WebView; eSewa's success redirect back to the return URL carries `data`
 * (base64 JSON of the transaction), which onComplete hands to the booking
 * confirm for server-side verification. No manual confirm is possible — a
 * booking only confirms after the redirect is actually seen.
 */
export function EsewaFormCheckout({
  visible,
  formUrl,
  formFields,
  returnUrlPrefix,
  onComplete,
  onCancel,
}: {
  visible: boolean;
  formUrl: string;
  formFields: Record<string, string>;
  returnUrlPrefix: string;
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

  const openForm = () => {
    if (typeof window === 'undefined') return;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = formUrl;
    form.target = '_blank';
    for (const [k, v] of Object.entries(formFields || {})) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = k;
      input.value = v;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const formHtml = () => {
    const inputs = Object.entries(formFields || {})
      .map(([k, v]) => `<input type="hidden" name="${k.replace(/"/g, '&quot;')}" value="${String(v).replace(/"/g, '&quot;')}">`)
      .join('');
    return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><form method="POST" action="${formUrl}" id="epay">${inputs}</form><script>document.getElementById('epay').submit()<\/script></body></html>`;
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
            <Text style={styles.headerTitle}>Pay with eSewa</Text>
            <Text style={styles.headerSub}>Complete your payment to confirm the booking</Text>
          </View>
          <View style={[styles.brandBadge]}>
            <Text style={styles.brandBadgeText}>eS</Text>
          </View>
        </View>

        {Platform.OS === 'web' ? (
          <View style={styles.webWrap}>
            <Ionicons name="card-outline" size={48} color={SLATE[400]} />
            <Text style={styles.webTitle}>Open the secure eSewa checkout</Text>
            <Text style={styles.webDesc}>You'll be taken to eSewa to enter your wallet credentials.</Text>
            <TouchableOpacity style={[styles.webBtn, { backgroundColor: ESEWA_GREEN }]} onPress={openForm}>
              <Text style={styles.webBtnText}>Open eSewa checkout</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {loading && (
              <View style={styles.loadingOverlay} pointerEvents="none">
                <ActivityIndicator size="large" color={ESEWA_GREEN} />
                <Text style={styles.loadingText}>Opening eSewa…</Text>
              </View>
            )}
            <WebView
              source={{ html: formHtml() }}
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
  brandBadge: { width: 32, height: 32, borderRadius: 8, backgroundColor: ESEWA_GREEN, alignItems: 'center', justifyContent: 'center' },
  brandBadgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
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