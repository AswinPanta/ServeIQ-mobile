import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/context/auth-context';

const NAVY = '#1A3C5E';
const TEAL = '#2E86AB';

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const pathname = usePathname();
  const isHostRoute = pathname.includes('/host');
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
        {/* Navy header area */}
        <View style={s.headerArea}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={s.logo}>
            <Text style={{ color: '#FFF' }}>Stay</Text>
            <Text style={{ color: TEAL }}>Easy</Text>
          </Text>
          <View style={s.buildingRow}>
            <Text style={{ fontSize: 48 }}>🏛️</Text>
            <Text style={{ fontSize: 40 }}>🏨</Text>
            <Text style={{ fontSize: 44 }}>🏪</Text>
            <Text style={{ fontSize: 36 }}>🏢</Text>
          </View>
        </View>

        {/* White form card */}
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
              placeholderTextColor="#bbb"
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
                placeholderTextColor="#bbb"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={s.eyeBtn}>
                <Ionicons name={showPw ? 'eye-off' : 'eye'} size={18} color="#bbb" />
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

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[s.loginBtn, isLoading && { opacity: 0.7 }]}
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
  container: { flex: 1, backgroundColor: '#E8E8E8' },
  scroll: { flexGrow: 1, paddingBottom: 40 },

  headerArea: {
    backgroundColor: NAVY,
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 54,
    left: 20,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  logo: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, marginBottom: 12, marginTop: 4 },
  buildingRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 6, opacity: 0.6,
  },

  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: -24,
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },

  tabRow: { flexDirection: 'row', gap: 24, marginBottom: 20 },
  tab: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
    textTransform: 'uppercase', color: '#ccc',
  },
  tabActive: { color: '#111' },
  tabLine: { height: 2, backgroundColor: '#111', marginTop: 3, borderRadius: 1 },

  heading: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 3 },
  subtitle: { fontSize: 12, color: '#999', marginBottom: 24 },

  field: { marginBottom: 16 },
  label: {
    fontSize: 11, color: '#666', marginBottom: 4,
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  input: { flex: 1, fontSize: 14, color: '#111', paddingVertical: 8, paddingRight: 8 },
  pwRow: { flexDirection: 'row', alignItems: 'center' },
  inputLine: { height: 1.5, backgroundColor: '#ddd' },
  eyeBtn: { padding: 4 },

  optionsRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 16,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkbox: {
    width: 16, height: 16, borderRadius: 3,
    borderWidth: 1.5, borderColor: '#ddd',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#111', borderColor: '#111' },
  rememberText: { fontSize: 11, color: '#999' },
  forgotText: { fontSize: 11, color: '#bbb' },

  error: { color: '#e94560', fontSize: 12, marginBottom: 12 },

  loginBtn: {
    paddingVertical: 12, backgroundColor: '#111',
    borderRadius: 8, alignItems: 'center',
    justifyContent: 'center', marginBottom: 16,
  },
  loginBtnText: { fontSize: 14, fontWeight: '600', color: '#FFF' },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 12, color: '#aaa' },
  footerLink: { fontSize: 12, color: '#111', fontWeight: '600' },
});
