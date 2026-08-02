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

  const pwStrength = form.password.length === 0 ? 0 : form.password.length < 4 ? 1 : form.password.length < 8 ? 2 : 3;
  const pwColors = ['#E2E8F0', '#EF4444', '#F59E0B', '#10B981'];
  const pwLabels = ['', 'Weak', 'Fair', 'Strong'];

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
          <Text style={s.tagline}>Your journey starts here</Text>
        </View>

        {/* Form card */}
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
                      placeholderTextColor="#B0B8C4"
                      value={(form as any)[field]}
                      onChangeText={(t) => updateField(field, t)}
                      secureTextEntry={field === 'password' && !showPw}
                      keyboardType={field === 'email' ? 'email-address' : field === 'phone' ? 'phone-pad' : 'default'}
                      autoCapitalize={field === 'email' || field === 'password' ? 'none' : 'words'}
                      autoCorrect={false}
                    />
                    {field === 'password' && (
                      <TouchableOpacity onPress={() => setShowPw(!showPw)} style={s.eyeBtn}>
                        <Ionicons name={showPw ? 'eye-off' : 'eye'} size={18} color="#8896A6" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={s.inputLine} />
                  {field === 'password' && form.password.length > 0 && (
                    <View style={s.pwStrengthRow}>
                      <View style={s.pwStrengthBars}>
                        {[1, 2, 3].map(i => (
                          <View key={i} style={[s.pwStrengthBar, { backgroundColor: pwColors[pwStrength >= i ? pwStrength : 0] }]} />
                        ))}
                      </View>
                      <Text style={[s.pwStrengthText, { color: pwColors[pwStrength] }]}>{pwLabels[pwStrength]}</Text>
                    </View>
                  )}
                </View>
              ))}

              <Text style={s.hint}>{t('auth.register.passwordHint')}</Text>

              {error ? (
                <View style={s.errorBox}>
                  <Ionicons name="alert-circle" size={14} color="#DC2626" />
                  <Text style={s.error}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[s.btn, isLoading && s.btnDisabled]}
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
            </>
          ) : !verified ? (
            <>
              <Text style={s.heading}>{t('auth.otp.title')}</Text>
              <Text style={s.subtitle}>{t('auth.otp.subtitle')}</Text>

              <View style={s.otpIcon}>
                <Ionicons name="mail-open-outline" size={28} color={NAVY} />
              </View>

              <View style={s.field}>
                <Text style={s.label}>{t('auth.otp.code')}</Text>
                <TextInput
                  style={[s.input, s.otpInput]}
                  placeholder="000000"
                  placeholderTextColor="#D1D9E6"
                  value={otp}
                  onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  autoFocus
                />
                <View style={s.inputLine} />
              </View>

              {error ? (
                <View style={s.errorBox}>
                  <Ionicons name="alert-circle" size={14} color="#DC2626" />
                  <Text style={s.error}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[s.btn, (otpLoading || otp.length < 4) && s.btnDisabled]}
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
                  <Text style={[s.footerLink, (resendTimer > 0 || resendLoading) && { color: '#C0C8D4' }]}>
                    {resendLoading ? t('common.loading') : resendTimer > 0 ? `Resend in ${resendTimer}s` : t('auth.otp.resend')}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={s.successContainer}>
                <View style={s.checkIcon}>
                  <Ionicons name="checkmark" size={36} color="#FFF" />
                </View>
                <Text style={s.successTitle}>{t('auth.otp.success')}</Text>
                <Text style={s.successSubtitle}>{t('auth.otp.successMessage')}</Text>
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

  field: { marginBottom: 16 },
  label: {
    fontSize: 11, color: '#64748B', marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '600',
  },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, fontSize: 15, color: '#0F172A', paddingVertical: 10, paddingRight: 8 },
  inputLine: { height: 1.5, backgroundColor: '#E2E8F0', borderRadius: 1 },
  eyeBtn: { padding: 6 },
  otpInput: { letterSpacing: 10, fontWeight: '700', fontSize: 20, textAlign: 'center' },

  pwStrengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  pwStrengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
  pwStrengthBar: { flex: 1, height: 3, borderRadius: 2 },
  pwStrengthText: { fontSize: 11, fontWeight: '600' },

  hint: { fontSize: 11, color: '#94A3B8', marginBottom: 20, lineHeight: 16 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16,
  },
  error: { color: '#DC2626', fontSize: 12, flex: 1 },

  btn: {
    paddingVertical: 15, backgroundColor: NAVY,
    borderRadius: 12, alignItems: 'center',
    justifyContent: 'center', marginBottom: 20,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 15, fontWeight: '700', color: '#FFF', letterSpacing: 0.3 },

  otpIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#DBEAFE',
  },

  successContainer: { alignItems: 'center', paddingVertical: 16, marginBottom: 8 },
  checkIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  successTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 6, textAlign: 'center' },
  successSubtitle: { fontSize: 13, color: '#8896A6', textAlign: 'center', lineHeight: 20 },

  footer: { alignItems: 'center', marginTop: 8 },
  footerLink: { fontSize: 13, color: NAVY, fontWeight: '700' },
});
