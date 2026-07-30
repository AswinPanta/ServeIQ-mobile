import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/context/auth-context';

const NAVY = '#1A3C5E';
const TEAL = '#2E86AB';

export default function OTPVerifyScreen() {
  const { t } = useTranslation();
  const { verifyOTP, resendOTP, isLoading } = useAuth();
  const { email, portal: portalParam } = useLocalSearchParams<{ email: string; portal?: string }>();
  const portal = (portalParam as 'guest' | 'host' | undefined) || 'guest';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputs = useRef<(TextInput | null)[]>([]);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) text = text.slice(-1);
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    if (text && index < 5) inputs.current[index + 1]?.focus();
    if (error) setError('');
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otp = code.join('');
    if (otp.length < 6) { setError('Enter the 6-digit code'); return; }
    try {
      await verifyOTP(email || '', otp, portal);
      router.replace('/(auth)/account-created');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    }
  };

  const handleResend = async () => {
    if (!email || resendTimer > 0) return;
    setError('');
    setResendLoading(true);
    try {
      await resendOTP(email, portal);
      setResendTimer(30);
    } catch {
      setError('Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.container}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/')} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>

        <View style={s.card}>
          <Text style={s.title}>{t('auth.otp.code')}</Text>
          <Text style={s.subtitle}>{t('auth.otp.subtitle')}</Text>

          <View style={s.codeRow}>
            {code.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => { inputs.current[i] = ref; }}
                style={[s.codeInput, digit ? s.codeInputFilled : null]}
                value={digit}
                onChangeText={(t) => handleChange(t, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[s.verifyBtn, (isLoading || code.join('').length < 6) && { opacity: 0.7 }]}
            onPress={handleVerify}
            disabled={isLoading || code.join('').length < 6}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={s.verifyBtnText}>{t('auth.otp.verify')}</Text>
            )}
          </TouchableOpacity>

          <View style={s.resendRow}>
            <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0 || resendLoading}>
              <Text style={[s.resendLink, (resendTimer > 0 || resendLoading) && { color: '#ccc' }]}>
                {resendLoading ? t('common.loading') : resendTimer > 0 ? `Resend in ${resendTimer}s` : t('auth.otp.resend')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1 },
  container: {
    flex: 1, backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  backBtn: {
    position: 'absolute', top: 60, left: 20,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#999', textAlign: 'center', marginBottom: 28, lineHeight: 20 },

  codeRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  codeInput: {
    width: 44, height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ddd',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
  codeInputFilled: { borderColor: '#111', backgroundColor: '#F8F8F8' },

  error: { color: '#e94560', fontSize: 12, marginBottom: 12 },

  verifyBtn: {
    width: '100%', paddingVertical: 12,
    backgroundColor: '#111', borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  verifyBtnText: { fontSize: 14, fontWeight: '600', color: '#FFF' },

  resendRow: { flexDirection: 'row', alignItems: 'center' },
  resendText: { fontSize: 12, color: '#aaa' },
  resendLink: { fontSize: 12, color: '#111', fontWeight: '600' },
});
