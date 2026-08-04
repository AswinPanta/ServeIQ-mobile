import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api-config';
import { FONTS, SRS, RADIUS, GRAY } from '@/constants/portal-theme';

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
          <Ionicons name="arrow-back" size={22} color="#1A1C1E" />
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
                <ActivityIndicator color="#FFFAFA" />
              ) : (
                <Text style={s.sendBtnText}>{t('auth.forgot.send')}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={s.tokenLink} onPress={() => router.push('/(auth)/create-new-password')}>
              <Text style={s.tokenLinkText}>Already have a reset token? Enter it here</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={s.successBox}>
            <View style={s.successIcon}>
              <Ionicons name="mail-open-outline" size={40} color={SRS.teal} />
            </View>
            <Text style={s.successTitle}>Check your email</Text>
            <Text style={s.successText}>
              We&apos;ve sent a password reset link to{'\n'}
              <Text style={{ fontWeight: '600', color: '#1A1C1E' }}>{email}</Text>
            </Text>
            <TouchableOpacity style={s.sendBtn} onPress={() => router.push('/(auth)/create-new-password')} activeOpacity={0.8}>
              <Text style={s.sendBtnText}>Enter Reset Token</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.secondaryBtn} onPress={() => router.replace('/(auth)/login')}>
              <Text style={s.secondaryBtnText}>{t('auth.forgot.backToLogin')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
  backBtn: {
    width: 51, height: 51, borderRadius: 25.5, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center', marginBottom: 32,
  },
  title: { fontSize: 28, fontFamily: FONTS.playfairDisplay.bold, color: '#000', marginBottom: 12 },
  subtitle: { fontSize: 14, fontFamily: FONTS.inter.regular, color: '#6B7280', lineHeight: 22, marginBottom: 32 },
  field: { marginBottom: 24 },
  label: { fontSize: 16, fontFamily: FONTS.inter.medium, color: '#A7A4A4', marginBottom: 10 },
  inputWrap: {
    borderWidth: 1.5, borderColor: '#D9D9D9', borderRadius: RADIUS.input,
    paddingHorizontal: 16, backgroundColor: '#FFF',
  },
  input: { fontSize: 14, fontFamily: FONTS.inter.regular, color: '#1A1C1E', paddingVertical: 14 },
  sendBtn: {
    backgroundColor: SRS.navy, borderRadius: RADIUS.button, paddingVertical: 16, alignItems: 'center',
  },
  sendBtnText: { fontSize: 20, fontFamily: FONTS.itim, color: '#FFFAFA' },
  tokenLink: { marginTop: 16, alignItems: 'center' },
  tokenLinkText: { fontSize: 13, color: SRS.teal, textDecorationLine: 'underline' },
  secondaryBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 12 },
  secondaryBtnText: { fontSize: 14, color: '#6B7280', textDecorationLine: 'underline' },
  successBox: { alignItems: 'center', paddingTop: 40 },
  successIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: SRS.teal + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  successTitle: { fontSize: 22, fontFamily: FONTS.playfairDisplay.bold, color: '#000', marginBottom: 12 },
  successText: { fontSize: 14, fontFamily: FONTS.inter.regular, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
});
