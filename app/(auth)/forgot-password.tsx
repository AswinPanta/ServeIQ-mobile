import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { FONTS, SRS, RADIUS, GRAY } from '@/constants/portal-theme';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!email.trim()) return;
    setSent(true);
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.inner}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/')} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#000" />
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

            <TouchableOpacity style={s.sendBtn} onPress={handleSend} activeOpacity={0.8}>
              <Text style={s.sendBtnText}>{t('auth.forgot.send')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={s.successBox}>
            <View style={s.successIcon}>
              <Ionicons name="mail-open-outline" size={40} color={SRS.teal} />
            </View>
            <Text style={s.successTitle}>Check your email</Text>
            <Text style={s.successText}>
              We've sent a password reset link to{'\n'}
              <Text style={{ fontWeight: '600', color: '#1A1C1E' }}>{email}</Text>
            </Text>
            <TouchableOpacity style={s.sendBtn} onPress={() => router.replace('/(auth)/login')} activeOpacity={0.8}>
              <Text style={s.sendBtnText}>{t('auth.forgot.backToLogin')}</Text>
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
  successBox: { alignItems: 'center', paddingTop: 40 },
  successIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: SRS.teal + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  successTitle: { fontSize: 22, fontFamily: FONTS.playfairDisplay.bold, color: '#000', marginBottom: 12 },
  successText: { fontSize: 14, fontFamily: FONTS.inter.regular, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
});
