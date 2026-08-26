import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Port of the reference web app's /payment/esewa/mock page (Thadaw/StayEasy).
// The live backend has no real eSewa integration yet — it returns no
// payment_url for gateway "esewa" — so like the web app we render a local
// sandbox checkout that simulates the eSewa wallet flow and hands back
// { oid, refId, status: 'Completed' } on success. The booking confirm then
// verifies against the payment intent server-side.

const ESEWA_GREEN = '#60BB46';

interface EsewaMockCheckoutProps {
  visible: boolean;
  amount: number;
  currency: string;
  onComplete: (params: Record<string, string>) => void;
  onCancel: () => void;
}

export function EsewaMockCheckout({ visible, amount, currency, onComplete, onCancel }: EsewaMockCheckoutProps) {
  const [esewaId, setEsewaId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [robotChecked, setRobotChecked] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!visible) return null;

  const canPay = !!esewaId.trim() && !!password.trim() && robotChecked && !processing && !success;

  const handlePay = () => {
    if (!canPay) return;
    setProcessing(true);
    // Simulate the eSewa round-trip: process → success screen → redirect
    // back with transaction params (same contract as the web mock page).
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      setTimeout(() => {
        const oid = `ESW${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const refId = `REF${Date.now()}`;
        onComplete({ oid, refId, amt: String(amount), status: 'Completed' });
      }, 2500);
    }, 1500);
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onCancel}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.backdrop}>
          <View style={s.sheet}>
            {/* Header */}
            <View style={s.header}>
              <View style={s.brandRow}>
                <View style={s.brandBadge}>
                  <Text style={s.brandBadgeText}>eS</Text>
                </View>
                <Text style={s.brandName}>eSewa</Text>
              </View>
              {!success && !processing && (
                <TouchableOpacity onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={22} color="#6b7280" />
                </TouchableOpacity>
              )}
            </View>

            {success ? (
              <View style={s.successWrap}>
                <View style={s.successIcon}>
                  <Ionicons name="checkmark" size={40} color="#fff" />
                </View>
                <Text style={s.successTitle}>Payment Success!</Text>
                <Text style={s.successText}>Your payment process has been completed successfully.</Text>
                <View style={s.amountBox}>
                  <Text style={[s.amountText, { color: ESEWA_GREEN }]}>
                    {currency}. {amount.toLocaleString('en-NP', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                <Text style={s.redirectNote}>Redirecting back to ServeIQ…</Text>
              </View>
            ) : (
              <>
                {/* Amount summary */}
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Total Amount</Text>
                  <Text style={s.summaryAmount}>
                    {currency}. {amount.toLocaleString('en-NP', { minimumFractionDigits: 2 })}
                  </Text>
                </View>

                {/* Login form */}
                <Text style={s.sectionTitle}>Sign in to your account</Text>

                <View style={s.inputWrap}>
                  <Ionicons name="person-outline" size={16} color="#9ca3af" style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="eSewa ID"
                    placeholderTextColor="#9ca3af"
                    value={esewaId}
                    onChangeText={setEsewaId}
                    autoCapitalize="none"
                    editable={!processing}
                  />
                </View>

                <View style={s.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={16} color="#9ca3af" style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="Password/MPIN"
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!processing}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9ca3af" />
                  </TouchableOpacity>
                </View>

                {/* Robot check */}
                <TouchableOpacity style={s.robotBox} onPress={() => setRobotChecked(!robotChecked)} disabled={processing}>
                  <View style={[s.checkbox, robotChecked && { backgroundColor: ESEWA_GREEN, borderColor: ESEWA_GREEN }]}>
                    {robotChecked && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <Text style={s.robotText}>I&apos;m not a robot</Text>
                </TouchableOpacity>

                {/* Login button */}
                <TouchableOpacity
                  style={[s.payBtn, (!canPay) && s.payBtnDisabled]}
                  onPress={handlePay}
                  disabled={!canPay}
                  activeOpacity={0.8}
                >
                  {processing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={s.payBtnText}>LOGIN</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={onCancel} disabled={processing} style={s.cancelBtn}>
                  <Text style={s.cancelText}>CANCEL PAYMENT</Text>
                </TouchableOpacity>

                <Text style={s.sandboxNote}>Sandbox — simulates the eSewa wallet flow for testing.</Text>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandBadge: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: ESEWA_GREEN,
    alignItems: 'center', justifyContent: 'center',
  },
  brandBadgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  brandName: { marginLeft: 8, fontSize: 17, fontWeight: '700', color: ESEWA_GREEN },

  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14,
  },
  summaryLabel: { fontSize: 13, color: '#6b7280' },
  summaryAmount: { fontSize: 18, fontWeight: '700', color: ESEWA_GREEN },

  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 10 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db',
    borderRadius: 8, paddingHorizontal: 10, marginBottom: 10,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: '#111827', paddingVertical: 10 },
  eyeBtn: { padding: 4 },

  robotBox: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#f9fafb',
    marginBottom: 14,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: '#9ca3af',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  robotText: { fontSize: 13, color: '#374151' },

  payBtn: {
    backgroundColor: ESEWA_GREEN, borderRadius: 8, paddingVertical: 13,
    alignItems: 'center',
  },
  payBtnDisabled: { backgroundColor: '#d1d5db' },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 1 },

  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelText: { fontSize: 12, color: '#9ca3af', letterSpacing: 1 },

  sandboxNote: { fontSize: 11, color: '#bbb', textAlign: 'center' },

  successWrap: { alignItems: 'center', paddingVertical: 24 },
  successIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#a8d86e',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  successTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 6 },
  successText: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 16 },
  amountBox: {
    backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12,
    minWidth: 200, alignItems: 'center',
  },
  amountText: { fontSize: 19, fontWeight: '700' },
  redirectNote: { marginTop: 14, fontSize: 12, color: '#e6a817' },
});
