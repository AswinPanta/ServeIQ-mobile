import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/context/auth-context';

const NAVY = '#1A3C5E';
const TEAL = '#2E86AB';

export default function RegisterScreen() {
  const { register, verifyOTP, resendOTP, isLoading } = useAuth();
  const pathname = usePathname();
  const isHostRoute = pathname.includes('/host');
  const portal = isHostRoute ? 'host' : 'guest';
  const { t } = useTranslation();

  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const heading = t('auth.register.title');
  const subtitle = t('auth.register.subtitle');

  const handleRegister = async () => {
    setError('');
    if (!form.fullName.trim()) { setError('Full name is required.'); return; }
    if (!form.phone.trim()) { setError('Phone number is required.'); return; }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Valid email required.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    try {
      await register(form.email, form.phone, form.fullName, form.password, portal);
      setShowOtp(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed.');
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    if (otp.length < 4) { setError('Please enter the verification code.'); return; }
    setOtpLoading(true);
    try {
      await verifyOTP(form.email, otp, portal);
      setVerified(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid verification code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResendLoading(true);
    try {
      await resendOTP(form.email, portal);
      setResendTimer(30);
    } catch {
      setError('Failed to resend code.');
    } finally {
      setResendLoading(false);
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
          <Text style={s.tagline}>Your journey starts here</Text>
        </View>

        <View style={s.card}>
          <View style={s.tabRow}>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={s.tab}>{t('auth.register.login')}</Text>
            </TouchableOpacity>
            <View>
              <Text style={[s.tab, s.tabActive]}>{t('auth.register.title')}</Text>
              <View style={s.tabLine} />
            </View>
          </View>

          {!showOtp ? (
            <>
              <Text style={s.heading}>{heading}</Text>
              <Text style={s.subtitle}>{subtitle}</Text>

              {['fullName', 'phone', 'email', 'password'].map((field) => (
                <View key={field} style={s.field}>
                  <Text style={s.label}>
                    {field === 'fullName' ? t('auth.register.name') : field === 'phone' ? t('auth.register.phone') : field === 'email' ? t('auth.register.email') : t('auth.register.password')}
                  </Text>
                  <View style={s.inputRow}>
                    <TextInput
                      style={s.input}
                      placeholder={
                        field === 'fullName' ? t('auth.register.namePlaceholder') :
                        field === 'phone' ? t('auth.register.phonePlaceholder') :
                        field === 'email' ? t('auth.register.emailPlaceholder') : t('auth.register.passwordPlaceholder')
                      }
                      placeholderTextColor="#bbb"
                      value={(form as any)[field]}
                      onChangeText={(t) => updateField(field, t)}
                      secureTextEntry={field === 'password' && !showPw}
                      keyboardType={field === 'email' ? 'email-address' : field === 'phone' ? 'phone-pad' : 'default'}
                      autoCapitalize={field === 'email' || field === 'password' ? 'none' : 'words'}
                      autoCorrect={false}
                    />
                    {field === 'password' && (
                      <TouchableOpacity onPress={() => setShowPw(!showPw)} style={s.eyeBtn}>
                        <Ionicons name={showPw ? 'eye-off' : 'eye'} size={18} color="#bbb" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={s.inputLine} />
                </View>
              ))}

              <View style={{ marginBottom: 16 }}>
                <Text style={s.hint}>{t('auth.register.passwordHint')}</Text>
              </View>

              {error ? <Text style={s.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[s.btn, isLoading && { opacity: 0.7 }]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={s.btnText}>{t('auth.register.button')}</Text>
                )}
              </TouchableOpacity>

              <View style={s.footer}>
                <Text style={s.footerText}>{t('auth.register.hasAccount')} </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                  <Text style={s.footerLink}>{t('auth.register.login')}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : !verified ? (
            <>
              <Text style={s.heading}>{t('auth.otp.title')}</Text>
              <Text style={s.subtitle}>{t('auth.otp.subtitle')}</Text>

              <View style={s.field}>
                <Text style={s.label}>{t('auth.otp.code')}</Text>
                <TextInput
                  style={[s.input, { letterSpacing: 8, fontWeight: '600', fontSize: 18 }]}
                  placeholder="000000"
                  placeholderTextColor="#ddd"
                  value={otp}
                  onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  autoFocus
                />
                <View style={s.inputLine} />
              </View>

              {error ? <Text style={s.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[s.btn, (otpLoading || otp.length < 4) && { opacity: 0.7 }]}
                onPress={handleVerifyOtp}
                disabled={otpLoading || otp.length < 4}
                activeOpacity={0.85}
              >
                {otpLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={s.btnText}>{t('auth.otp.verify')}</Text>
                )}
              </TouchableOpacity>

              <View style={s.footer}>
                <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0 || resendLoading}>
                  <Text style={[s.footerLink, (resendTimer > 0 || resendLoading) && { color: '#ccc' }]}>
                    {resendLoading ? t('common.loading') : resendTimer > 0 ? `Resend in ${resendTimer}s` : t('auth.otp.resend')}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <View style={s.checkIcon}>
                  <Ionicons name="checkmark" size={32} color="#FFF" />
                </View>
                <Text style={[s.heading, { textAlign: 'center', marginTop: 12 }]}>{t('auth.otp.success')}</Text>
                <Text style={[s.subtitle, { textAlign: 'center' }]}>{t('auth.otp.successMessage')}</Text>
              </View>

              <TouchableOpacity
                style={s.btn}
                onPress={() => router.push('/(auth)/login')}
                activeOpacity={0.85}
              >
                <Text style={s.btnText}>{t('auth.otp.next')}</Text>
              </TouchableOpacity>
            </>
          )}
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
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
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
    backgroundColor: 'rgba(26, 60, 94, 0.75)',
  },
  backBtn: {
    position: 'absolute', top: 54, left: 20,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  landmarksImg: { width: 160, height: 80, marginBottom: 8, zIndex: 2 },
  logo: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4, marginTop: 4, zIndex: 2 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.7)', zIndex: 2, letterSpacing: 0.5 },

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
  subtitle: { fontSize: 12, color: '#999', marginBottom: 20 },

  field: { marginBottom: 12 },
  label: {
    fontSize: 11, color: '#666', marginBottom: 4,
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, fontSize: 14, color: '#111', paddingVertical: 8, paddingRight: 8 },
  inputLine: { height: 1.5, backgroundColor: '#ddd' },
  eyeBtn: { padding: 4 },
  hint: { fontSize: 11, color: '#bbb' },

  error: { color: '#e94560', fontSize: 12, marginBottom: 12 },

  btn: {
    paddingVertical: 12, backgroundColor: '#111',
    borderRadius: 8, alignItems: 'center',
    justifyContent: 'center', marginBottom: 16,
  },
  btnText: { fontSize: 14, fontWeight: '600', color: '#FFF' },

  checkIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#1E8449', alignItems: 'center', justifyContent: 'center',
  },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  footerText: { fontSize: 12, color: '#aaa' },
  footerLink: { fontSize: 12, color: '#111', fontWeight: '600' },
});
