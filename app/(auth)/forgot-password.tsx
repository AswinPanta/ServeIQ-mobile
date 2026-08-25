import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api-config';
import { setGuestMustChange } from '@/lib/context/host-utils';
import { FONTS, SRS, RADIUS, GRAY } from '@/constants/portal-theme';
import { TEXT, NEUTRAL, BG, GRAY as GRAYTokens, BORDER } from '@/lib/constants/figma-tokens';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.FORGOT_PASSWORD}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok || res.status === 202) {
        // Track this email so the next login forces a password change
        await setGuestMustChange(email.trim());
        setSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        Alert.alert('Error', data.detail || data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.inner}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={TEXT.heading} />
        </TouchableOpacity>

        <Text style={s.title}>{t('auth.forgot.title')}</Text>

        {!sent ? (
          <>
            <Text style={s.subtitle}>{t('auth.forgot.subtitle')}</Text>

            <View style={s.field}>
              <Text style={s.label}>{t('auth.forgot.email')}</Text>
              <View style={s.inputWrap}>
                <TextInput
                  style={s.input}
                  placeholder={t('auth.login.emailPlaceholder')}
                  placeholderTextColor={GRAY[400]}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity style={s.sendBtn} onPress={handleSend} activeOpacity={0.8} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={NEUTRAL.snow} />
              ) : (
                <Text style={s.sendBtnText}>{t('auth.forgot.send')}</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={s.successBox}>
            <View style={s.successIcon}>
              <Ionicons name="mail-open-outline" size={40} color={SRS.teal} />
            </View>
            <Text style={s.successTitle}>Check your email</Text>
            <Text style={s.successText}>
              We&apos;ve sent a temporary password to{'\n'}
              <Text style={{ fontWeight: '600', color: TEXT.heading }}>{email}</Text>
              {'\n\n'}Use it to sign in, then you&apos;ll be prompted to set a new password.
            </Text>
            <TouchableOpacity style={s.sendBtn} onPress={() => router.replace('/(auth)/login')} activeOpacity={0.8}>
              <Text style={s.sendBtnText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG.white },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
  backBtn: {
    width: 51, height: 51, borderRadius: 25.5, backgroundColor: GRAYTokens[100],
    alignItems: 'center', justifyContent: 'center', marginBottom: 32,
  },
  title: { fontSize: 28, fontFamily: FONTS.playfairDisplay.bold, color: TEXT.black, marginBottom: 12 },
  subtitle: { fontSize: 14, fontFamily: FONTS.inter.regular, color: GRAYTokens[500], lineHeight: 22, marginBottom: 32 },
  field: { marginBottom: 24 },
  label: { fontSize: 16, fontFamily: FONTS.inter.medium, color: TEXT.label, marginBottom: 10 },
  inputWrap: {
    borderWidth: 1.5, borderColor: BORDER.input, borderRadius: RADIUS.input,
    paddingHorizontal: 16, backgroundColor: BG.white,
  },
  input: { fontSize: 14, fontFamily: FONTS.inter.regular, color: TEXT.heading, paddingVertical: 14 },
  sendBtn: {
    backgroundColor: SRS.navy, borderRadius: RADIUS.button, paddingVertical: 16, alignItems: 'center',
  },
  sendBtnText: { fontSize: 20, fontFamily: FONTS.itim, color: NEUTRAL.snow },

  successBox: { alignItems: 'center', paddingTop: 40 },
  successIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: SRS.teal + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  successTitle: { fontSize: 22, fontFamily: FONTS.playfairDisplay.bold, color: TEXT.black, marginBottom: 12 },
  successText: { fontSize: 14, fontFamily: FONTS.inter.regular, color: GRAYTokens[500], textAlign: 'center', lineHeight: 22, marginBottom: 32 },
});
