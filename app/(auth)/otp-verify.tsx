import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/context/auth-context';
import { BG, NEUTRAL, TEXT, CORAL, GRAY } from '@/lib/constants/figma-tokens';
;
;

export default function OTPVerifyScreen() {
  const { t } = useTranslation();
  const { verifyOTP, resendOTP } = useAuth();
  const { email, portal: portalParam } = useLocalSearchParams<{ email: string; portal?: string }>();
  const portal = (portalParam as 'guest' | 'host' | undefined) || 'guest';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputs = useRef<(TextInput | null)[]>([]);
  const [error, setError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
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
    if (verifyLoading) return;
    if (otp.length < 6) { setError('Enter the 6-digit code'); return; }
    setVerifyLoading(true);
    try {
      await verifyOTP(email || '', otp, portal);
      router.replace('/(auth)/account-created');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setVerifyLoading(false);
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
                keyboardType="default"
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[s.verifyBtn, (verifyLoading || code.join('').length < 6) && { opacity: 0.7 }]}
            onPress={handleVerify}
            disabled={verifyLoading || code.join('').length < 6}
            activeOpacity={0.85}
          >
            {verifyLoading ? (
              <ActivityIndicator color={BG.white} />
            ) : (
              <Text style={s.verifyBtnText}>{t('auth.otp.verify')}</Text>
            )}
          </TouchableOpacity>

          <View style={s.resendRow}>
            <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0 || resendLoading}>
              <Text style={[s.resendLink, (resendTimer > 0 || resendLoading) && { color: GRAY[300] }]}>
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
    flex: 1, backgroundColor: NEUTRAL[500],
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
    backgroundColor: BG.white,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: TEXT.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  title: { fontSize: 20, fontWeight: '700', color: GRAY[900], marginBottom: 6 },
  subtitle: { fontSize: 13, color: GRAY[400], textAlign: 'center', marginBottom: 28, lineHeight: 20 },

  codeRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  codeInput: {
    width: 44, height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: GRAY[200],
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: GRAY[900],
  },
  codeInputFilled: { borderColor: GRAY[900], backgroundColor: NEUTRAL[200] },

  error: { color: CORAL[400], fontSize: 12, marginBottom: 12 },

  verifyBtn: {
    width: '100%', paddingVertical: 12,
    backgroundColor: GRAY[900], borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  verifyBtnText: { fontSize: 14, fontWeight: '600', color: BG.white },

  resendRow: { flexDirection: 'row', alignItems: 'center' },
  resendText: { fontSize: 12, color: GRAY[400] },
  resendLink: { fontSize: 12, color: GRAY[900], fontWeight: '600' },
});