import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { router, usePathname, useLocalSearchParams, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/context/auth-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BRAND, SRS, SLATE, RED, AMBER, STATUS, BG, CLOUD, NEUTRAL, TEXT, BLUE } from '@/lib/constants/figma-tokens';
import { registerSchema } from '@/lib/validation/schemas';
import { STORAGE_KEYS } from '@/constants/api-config';

const NAVY = BRAND.navyLight;
const TEAL = SRS.teal;

export default function RegisterScreen() {
  const { register, verifyOTP, resendOTP, login } = useAuth();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ portal?: string; redirect?: string }>();
  const isHostRoute = pathname.includes('/host') || params.portal === 'host';
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
  const [registerLoading, setRegisterLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const heading = isHostRoute ? t('auth.register.hostTitle') : t('auth.register.title');
  const subtitle = isHostRoute ? t('auth.register.hostSubtitle') : t('auth.register.subtitle');
  const loginHref = isHostRoute
    ? '/(auth)/login?portal=host'
    : params.redirect
      ? `/(auth)/login?redirect=${encodeURIComponent(params.redirect)}`
      : '/(auth)/login';

  const handleRegister = async () => {
    setError('');
    if (registerLoading) return;
    if (!agreeTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }
    const result = registerSchema.safeParse({ ...form, confirmPassword: form.password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    const digitsOnly = form.phone.replace(/\D/g, '');
    setRegisterLoading(true);
    try {
      await register(form.email, digitsOnly, form.fullName, form.password, portal);
      setShowOtp(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    if (otp.length < 4) { setError('Please enter the verification code.'); return; }
    setOtpLoading(true);
    try {
      await verifyOTP(form.email, otp, portal);
      setVerified(true);
      // Save newsletter preference if opted in
      if (subscribeNewsletter) {
        await AsyncStorage.setItem(STORAGE_KEYS.NEWSLETTER_SUBSCRIBED, 'true');
      }
      // OTP verified — now auto-login with the password the user just set
      try {
        const { portal: loginPortal } = await login(form.email, form.password);
        setTimeout(() => {
          if (params.redirect) {
            router.replace(params.redirect as Href);
          } else {
            router.replace(loginPortal === 'host' ? '/(host)' : '/(tabs)');
          }
        }, 1000);
      } catch {
        // Auto-login failed — redirect to login screen
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 1500);
      }
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

  // Strength mirrors the backend's actual policy: length + digit + special char.
  // (Case is not enforced server-side, so don't score it here.)
  const pwRulesMet =
    (form.password.length >= 8 ? 1 : 0) +
    (/\d/.test(form.password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(form.password) ? 1 : 0);
  const pwStrength = form.password.length === 0 ? 0 : pwRulesMet === 0 ? 1 : pwRulesMet === 1 ? 1 : pwRulesMet === 2 ? 2 : 3;
  const pwColors = [SLATE[200], RED[500], AMBER[500], STATUS.activeGreen];
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
            source={require('@/assets/images/auth/serveiq_login_background.png')}
            style={s.headerBg}
            resizeMode="cover"
          />
          <View style={s.headerOverlay} />
          <Image
            source={require('@/assets/images/auth/serveiq_landmarks_white.png')}
            style={s.landmarksImg}
            resizeMode="contain"
          />
          <Text style={s.logo}>
            <Text style={{ color: BG.white }}>Serve</Text>
            <Text style={{ color: TEAL }}>IQ</Text>
          </Text>
          <Text style={s.tagline}>Service with Intelligence and Quality</Text>
        </View>

        {/* Form card */}
        <View style={s.card}>
          <View style={s.tabRow}>
            <TouchableOpacity onPress={() => router.push(loginHref as Href)}>
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
                    {field === 'fullName' ? t('auth.register.name') : field === 'phone' ? t('auth.register.phone') + ' (optional)' : field === 'email' ? t('auth.register.email') : t('auth.register.password')}
                  </Text>
                  <View style={s.inputRow}>
                    <TextInput
                      style={s.input}
                      placeholder={
                        field === 'fullName' ? t('auth.register.namePlaceholder') :
                        field === 'phone' ? t('auth.register.phonePlaceholder') :
                        field === 'email' ? t('auth.register.emailPlaceholder') : t('auth.register.passwordPlaceholder')
                      }
                      placeholderTextColor={CLOUD.silver}
                      value={(form as Record<string, string>)[field]}
                      onChangeText={(t) => updateField(field, t)}
                      secureTextEntry={field === 'password' && !showPw}
                      keyboardType={field === 'email' ? 'email-address' : field === 'phone' ? 'phone-pad' : 'default'}
                      autoCapitalize={field === 'email' || field === 'password' ? 'none' : 'words'}
                      autoCorrect={false}
                    />
                    {field === 'password' && (
                      <TouchableOpacity onPress={() => setShowPw(!showPw)} style={s.eyeBtn}>
                        <Ionicons name={showPw ? 'eye-off' : 'eye'} size={18} color={CLOUD.steel} />
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

              <Text style={s.hint}>Min 8 characters with at least one number and one special character (e.g. #, !, @) — your password will be used to sign in later.</Text>

              <View style={s.checkboxSection}>
                <TouchableOpacity style={s.termsRow} onPress={() => setAgreeTerms(!agreeTerms)}>
                  <View style={[s.checkbox, agreeTerms && s.checkboxChecked]}>
                    {agreeTerms && <Ionicons name="checkmark" size={10} color={BG.white} />}
                  </View>
                  <Text style={s.termsText}>
                    I agree to the <Text style={s.termsLink}>Terms of Service</Text> and <Text style={s.termsLink}>Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.termsRow} onPress={() => setSubscribeNewsletter(!subscribeNewsletter)}>
                  <View style={[s.checkbox, subscribeNewsletter && s.checkboxChecked]}>
                    {subscribeNewsletter && <Ionicons name="checkmark" size={10} color={BG.white} />}
                  </View>
                  <Text style={s.termsText}>Subscribe to our newsletter for updates and exclusive offers</Text>
                </TouchableOpacity>
              </View>

              {error ? (
                <View style={s.errorBox}>
                  <Ionicons name="alert-circle" size={14} color={RED[600]} />
                  <Text style={s.error}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[s.btn, registerLoading && s.btnDisabled]}
                onPress={handleRegister}
                disabled={registerLoading}
                activeOpacity={0.85}
              >
                {registerLoading ? (
                  <ActivityIndicator color={BG.white} />
                ) : (
                  <Text style={s.btnText}>{t('auth.register.button')}</Text>
                )}
              </TouchableOpacity>

              <View style={s.footer}>
                <Text style={s.footerText}>{t('auth.register.hasAccount')} </Text>
                <TouchableOpacity onPress={() => router.push(loginHref as Href)}>
                  <Text style={s.footerLink}>{t('auth.register.login')}</Text>
                </TouchableOpacity>
              </View>
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
                  placeholderTextColor={CLOUD.haze}
                  value={otp}
                  onChangeText={(t) => setOtp(t.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6))}
                  keyboardType="default"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  autoFocus
                />
                <View style={s.inputLine} />
              </View>

              {error ? (
                <View style={s.errorBox}>
                  <Ionicons name="alert-circle" size={14} color={RED[600]} />
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
                  <ActivityIndicator color={BG.white} />
                ) : (
                  <Text style={s.btnText}>{t('auth.otp.verify')}</Text>
                )}
              </TouchableOpacity>

              <View style={s.footer}>
                <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0 || resendLoading}>
                  <Text style={[s.footerLink, (resendTimer > 0 || resendLoading) && { color: CLOUD.fog }]}>
                    {resendLoading ? t('common.loading') : resendTimer > 0 ? `Resend in ${resendTimer}s` : t('auth.otp.resend')}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={s.successContainer}>
                <View style={s.checkIcon}>
                  <Ionicons name="checkmark" size={36} color={BG.white} />
                </View>
                <Text style={s.successTitle}>{t('auth.otp.success')}</Text>
                <Text style={s.successSubtitle}>Account verified! Taking you to your dashboard...</Text>
              </View>

              <TouchableOpacity
                style={s.btn}
                onPress={() => router.replace(portal === 'host' ? '/(host)' : '/(tabs)')}
                activeOpacity={0.85}
              >
                <Text style={s.btnText}>Continue to Dashboard</Text>
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
  container: { flex: 1, backgroundColor: NEUTRAL[400] },
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
    backgroundColor: BG.white,
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 24,
    padding: 28,
    shadowColor: TEXT.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },

  tabRow: { flexDirection: 'row', gap: 28, marginBottom: 24 },
  tab: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1,
    textTransform: 'uppercase', color: CLOUD.fog,
  },
  tabActive: { color: NAVY },
  tabLine: { height: 2.5, backgroundColor: NAVY, marginTop: 4, borderRadius: 2 },

  heading: { fontSize: 22, fontWeight: '800', color: SLATE[900], marginBottom: 4, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: CLOUD.steel, marginBottom: 28 },

  field: { marginBottom: 16 },
  label: {
    fontSize: 11, color: SLATE[500], marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '600',
  },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, fontSize: 15, color: SLATE[900], paddingVertical: 10, paddingRight: 8 },
  inputLine: { height: 1.5, backgroundColor: SLATE[200], borderRadius: 1 },
  eyeBtn: { padding: 6 },
  otpInput: { letterSpacing: 10, fontWeight: '700', fontSize: 20, textAlign: 'center' },

  pwStrengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  pwStrengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
  pwStrengthBar: { flex: 1, height: 3, borderRadius: 2 },
  pwStrengthText: { fontSize: 11, fontWeight: '600' },

  hint: { fontSize: 11, color: SLATE[400], marginBottom: 20, lineHeight: 16 },

  checkboxSection: { gap: 10, marginBottom: 20 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  termsText: { fontSize: 12, color: SLATE[500], flex: 1, lineHeight: 18 },
  termsLink: { color: TEAL, fontWeight: '600' },
  checkbox: {
    width: 18, height: 18, borderRadius: 4,
    borderWidth: 1.5, borderColor: CLOUD.haze,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: NAVY, borderColor: NAVY },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: RED[50], borderWidth: 1, borderColor: RED[200],
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16,
  },
  error: { color: RED[600], fontSize: 12, flex: 1 },

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
  btnText: { fontSize: 15, fontWeight: '700', color: BG.white, letterSpacing: 0.3 },

  otpIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: BLUE[50], alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 24, borderWidth: 1, borderColor: BLUE[100],
  },

  successContainer: { alignItems: 'center', paddingVertical: 16, marginBottom: 8 },
  checkIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: STATUS.activeGreen, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, shadowColor: STATUS.activeGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  successTitle: { fontSize: 20, fontWeight: '800', color: SLATE[900], marginBottom: 6, textAlign: 'center' },
  successSubtitle: { fontSize: 13, color: CLOUD.steel, textAlign: 'center', lineHeight: 20 },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  footerText: { fontSize: 13, color: SLATE[400] },
  footerLink: { fontSize: 13, color: NAVY, fontWeight: '700' },
});
