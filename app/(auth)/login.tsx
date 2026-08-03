import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { router, usePathname, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/context/auth-context';

const NAVY = '#1A3C5E';
const TEAL = '#2E86AB';

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ portal?: string }>();
  const isHostRoute = pathname.includes('/host') || params.portal === 'host';
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');

  const heading = t('auth.login.title');
  const subtitle = t('auth.login.subtitle');

  const handleLogin = async () => {
    setError('');
    if (!email.trim()) { setError('Email is required.'); return; }
    if (!password.trim()) { setError('Password is required.'); return; }
    try {
      const portal = await login(email, password);
      if (portal === 'host') router.replace('/(host)');
      else if (portal === 'guest') router.replace('/(tabs)');
      else if (portal === 'operations') router.replace('/(operations)');
      else if (portal === 'superadmin') router.replace('/(superadmin)');
      else router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid email or password.');
    }
  };

  return (
    <KeyboardAvoidingView style={s.wrap} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={s.container}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header area */}
        <View style={s.headerArea}>
          <Image
            source={require('@/assets/images/auth/stayeasy_login_background.png')}
            style={s.headerBg}
            resizeMode="cover"
          />
          <View style={s.headerOverlay} />
          <Image
            source={require('@/assets/images/auth/stayeasy_landmarks_white.png')}
            style={s.landmarksImg}
            resizeMode="contain"
          />
          <Text style={s.logo}>
            <Text style={{ color: '#FFF' }}>Stay</Text>
            <Text style={{ color: TEAL }}>Easy</Text>
          </Text>
          <Text style={s.tagline}>Find your perfect stay</Text>
        </View>

        {/* Form card */}
        <View style={s.card}>
          <View style={s.tabRow}>
            <View>
              <Text style={[s.tab, s.tabActive]}>{t('auth.login.button')}</Text>
              <View style={s.tabLine} />
            </View>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={s.tab}>{t('auth.login.signup')}</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.heading}>{heading}</Text>
          <Text style={s.subtitle}>{subtitle}</Text>

          <View style={s.field}>
            <Text style={s.label}>{t('auth.login.email')}</Text>
            <TextInput
              style={s.input}
              placeholder={t('auth.login.emailPlaceholder')}
              placeholderTextColor="#B0B8C4"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
            <View style={s.inputLine} />
          </View>

          <View style={s.field}>
            <Text style={s.label}>{t('auth.login.password')}</Text>
            <View style={s.pwRow}>
              <TextInput
                style={s.input}
                placeholder={t('auth.login.passwordPlaceholder')}
                placeholderTextColor="#B0B8C4"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={s.eyeBtn}>
                <Ionicons name={showPw ? 'eye-off' : 'eye'} size={18} color="#8896A6" />
              </TouchableOpacity>
            </View>
            <View style={s.inputLine} />
          </View>

          <View style={s.optionsRow}>
            <TouchableOpacity style={s.rememberRow} onPress={() => setRemember(!remember)}>
              <View style={[s.checkbox, remember && s.checkboxChecked]}>
                {remember && <Ionicons name="checkmark" size={10} color="#FFF" />}
              </View>
              <Text style={s.rememberText}>{t('auth.login.remember')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={s.forgotText}>{t('auth.login.forgot')}</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle" size={14} color="#DC2626" />
              <Text style={s.error}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[s.loginBtn, isLoading && s.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={s.loginBtnText}>{t('auth.login.button')}</Text>
            )}
          </TouchableOpacity>

          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or continue with</Text>
            <View style={s.dividerLine} />
          </View>

          <View style={s.socialRow}>
            <TouchableOpacity style={s.socialBtn}>
              <Ionicons name="logo-google" size={18} color="#EA4335" />
              <Text style={s.socialBtnText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.socialBtn}>
              <Ionicons name="logo-apple" size={18} color="#000" />
              <Text style={s.socialBtnText}>Apple</Text>
            </TouchableOpacity>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>{t('auth.login.noAccount')} </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={s.footerLink}>{t('auth.login.signup')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1 },
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  scroll: { flexGrow: 1, paddingBottom: 40 },

  headerArea: {
    backgroundColor: NAVY,
    paddingTop: 56,
    paddingBottom: 44,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  headerBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(26, 60, 94, 0.8)',
  },
  landmarksImg: { width: 140, height: 70, marginBottom: 6, zIndex: 2 },
  logo: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4, zIndex: 2 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.65)', zIndex: 2, letterSpacing: 0.5 },

  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },

  tabRow: { flexDirection: 'row', gap: 28, marginBottom: 24 },
  tab: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1,
    textTransform: 'uppercase', color: '#C0C8D4',
  },
  tabActive: { color: NAVY },
  tabLine: { height: 2.5, backgroundColor: NAVY, marginTop: 4, borderRadius: 2 },

  heading: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 4, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: '#8896A6', marginBottom: 28 },

  field: { marginBottom: 18 },
  label: {
    fontSize: 11, color: '#64748B', marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '600',
  },
  input: { flex: 1, fontSize: 15, color: '#0F172A', paddingVertical: 10, paddingRight: 8 },
  pwRow: { flexDirection: 'row', alignItems: 'center' },
  inputLine: { height: 1.5, backgroundColor: '#E2E8F0', borderRadius: 1 },
  eyeBtn: { padding: 6 },

  optionsRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 18, height: 18, borderRadius: 4,
    borderWidth: 1.5, borderColor: '#D1D9E6',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: NAVY, borderColor: NAVY },
  rememberText: { fontSize: 12, color: '#64748B' },
  forgotText: { fontSize: 12, color: TEAL, fontWeight: '600' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16,
  },
  error: { color: '#DC2626', fontSize: 12, flex: 1 },

  loginBtn: {
    paddingVertical: 15, backgroundColor: NAVY,
    borderRadius: 12, alignItems: 'center',
    justifyContent: 'center', marginBottom: 20,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF', letterSpacing: 0.3 },

  dividerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },

  socialRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#FFF',
  },
  socialBtnText: { fontSize: 13, fontWeight: '600', color: '#334155' },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 13, color: '#94A3B8' },
  footerLink: { fontSize: 13, color: NAVY, fontWeight: '700' },
});
