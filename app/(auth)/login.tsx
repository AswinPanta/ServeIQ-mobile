import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { router, usePathname, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/context/auth-context';
import { BRAND, SRS, BG, CLOUD, RED, SOCIAL, TEXT, NEUTRAL, SLATE } from '@/lib/constants/figma-tokens';
import { loginSchema } from '@/lib/validation/schemas';

const NAVY = BRAND.navyLight;
const TEAL = SRS.teal;

export default function LoginScreen() {
  const { login, mustChangePassword } = useAuth();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ portal?: string; redirect?: string }>();
  const isHostRoute = pathname.includes('/host') || params.portal === 'host';
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  // Only the "Become a Host" login offers an identity choice: the same email
  // can be a Host/Staff account AND a Guest (separate DB tables). The normal
  // guest login is always guest-only (no toggle).
  const [loginMode, setLoginMode] = useState<'host' | 'staff'>('host');
  // True when a host/staff-mode login matched the guest account — we show an
  // explainer instead of silently routing to the guest portal.
  const [guestFallback, setGuestFallback] = useState(false);
  // Track whether a login just completed so the mustChangePassword effect
  // can redirect after the context updates.
  const [loginCompleted, setLoginCompleted] = useState(false);

  // After a successful login, if mustChangePassword becomes true (set
  // asynchronously inside login()), redirect to the password change screen.
  useEffect(() => {
    if (loginCompleted && mustChangePassword) {
      setLoginCompleted(false);
      router.replace('/(auth)/create-new-password?mode=temp');
    }
  }, [loginCompleted, mustChangePassword]);

  const heading = isHostRoute ? t('auth.login.hostTitle') : t('auth.login.title');
  const subtitle = isHostRoute ? t('auth.login.hostSubtitle') : t('auth.login.subtitle');
  const signupHref = isHostRoute
    ? '/(auth)/register?portal=host'
    : params.redirect
      ? `/(auth)/register?redirect=${encodeURIComponent(params.redirect)}`
      : '/(auth)/register';

  const handleLogin = async () => {
    setError('');
    setGuestFallback(false);
    if (loginLoading) return;
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setLoginLoading(true);
    try {
      const portal = await login(email, password);
      // Host/Staff login: a guest-role result means the credentials matched the
      // guest account, not a host/staff one. Explain instead of silently
      // sending a would-be staff member into the guest portal — they need the
      // password from their host/staff account (invited staff: the password
      // from their invitation email).
      if (isHostRoute && portal === 'guest') {
        setGuestFallback(true);
        return;
      }
      // Temp password: the user forgot their password and logged in with the
      // temporary one. Force them to set a new password before anything else.
      // Note: mustChangePassword is set asynchronously inside login() and may
      // not be reflected yet. Mark login completed and let the useEffect above
      // handle the redirect when the context updates.
      if (mustChangePassword) {
        router.replace('/(auth)/create-new-password?mode=temp');
        return;
      }
      // Also set the flag so the useEffect catches it if mustChangePassword
      // updates after this synchronous check.
      setLoginCompleted(true);
      if (params.redirect) {
        router.replace(params.redirect as any);
      } else if (portal === 'host') router.replace('/(host)');
      else if (portal === 'guest') router.replace('/(tabs)');
      else if (portal === 'operations') router.replace('/(operations)');
      else if (portal === 'superadmin') router.replace('/(superadmin)');
      else router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid email or password.');
    } finally {
      setLoginLoading(false);
    }
  };

  const switchMode = (mode: 'host' | 'staff') => {
    setLoginMode(mode);
    setError('');
    setGuestFallback(false);
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
            <View>
              <Text style={[s.tab, s.tabActive]}>{t('auth.login.button')}</Text>
              <View style={s.tabLine} />
            </View>
            <TouchableOpacity onPress={() => router.push(signupHref as any)}>
              <Text style={s.tab}>{t('auth.login.signup')}</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.heading}>{heading}</Text>
          <Text style={s.subtitle}>{subtitle}</Text>

          {/* Identity toggle — only on the "Become a Host" login. The same
              email can be a Guest AND a Host/Staff account (separate DB
              tables), so hosts/staff pick their identity here. The normal
              guest login is always guest-only and shows no toggle. */}
          {isHostRoute ? (
            <>
              <View style={s.modeRow}>
                {(['host', 'staff'] as const).map(mode => {
                  const active = loginMode === mode;
                  return (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => switchMode(mode)}
                      style={[s.modeBtn, active && s.modeBtnActive]}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.modeText, active && s.modeTextActive]}>{mode === 'host' ? 'Host' : 'Staff'}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={s.modeHint}>
                {loginMode === 'host'
                  ? 'Hotel owners & managers — manage your properties'
                  : 'Front desk & hotel staff — use the password from your invitation email'}
              </Text>
            </>
          ) : null}

          <View style={s.field}>
            <Text style={s.label}>{t('auth.login.email')}</Text>
            <TextInput
              style={s.input}
              placeholder={t('auth.login.emailPlaceholder')}
              placeholderTextColor={CLOUD.silver}
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
                placeholderTextColor={CLOUD.silver}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={s.eyeBtn}>
                <Ionicons name={showPw ? 'eye-off' : 'eye'} size={18} color={CLOUD.steel} />
              </TouchableOpacity>
            </View>
            <View style={s.inputLine} />
          </View>

          <View style={s.optionsRow}>
            <TouchableOpacity style={s.rememberRow} onPress={() => setRemember(!remember)}>
              <View style={[s.checkbox, remember && s.checkboxChecked]}>
                {remember && <Ionicons name="checkmark" size={10} color={BG.white} />}
              </View>
              <Text style={s.rememberText}>{t('auth.login.remember')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={s.forgotText}>{t('auth.login.forgot')}</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle" size={14} color={RED[600]} />
              <Text style={s.error}>{error}</Text>
            </View>
          ) : null}

          {guestFallback ? (
            <View style={s.fallbackBox}>
              <Ionicons name="person-circle-outline" size={18} color={TEAL} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={s.fallbackTitle}>That email signed in as a Guest</Text>
                <Text style={s.fallbackText}>
                  This email is registered as a guest account.
                  {loginMode === 'host'
                    ? ' Sign in with the password of your host account to manage properties'
                    : ' Sign in with the password from your staff invitation email to open the staff dashboard'}
                  {' — or continue to the guest portal.'}
                </Text>
                <TouchableOpacity onPress={() => router.replace(params.redirect ? (params.redirect as any) : '/(tabs)')}>
                  <Text style={s.fallbackLink}>Continue as Guest →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          <TouchableOpacity
            style={[s.loginBtn, loginLoading && s.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loginLoading}
            activeOpacity={0.85}
          >
            {loginLoading ? (
              <ActivityIndicator color={BG.white} />
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
              <Ionicons name="logo-google" size={18} color={SOCIAL.googleRed} />
              <Text style={s.socialBtnText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.socialBtn}>
              <Ionicons name="logo-apple" size={18} color={TEXT.black} />
              <Text style={s.socialBtnText}>Apple</Text>
            </TouchableOpacity>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>{t('auth.login.noAccount')} </Text>
            <TouchableOpacity onPress={() => router.push(signupHref as any)}>
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
  subtitle: { fontSize: 13, color: CLOUD.steel, marginBottom: 20 },

  modeRow: { flexDirection: 'row', backgroundColor: SLATE[100], borderRadius: 10, padding: 3, gap: 3, marginBottom: 8 },
  modeBtn: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  modeBtnActive: { backgroundColor: NAVY, shadowColor: NAVY, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 2 },
  modeText: { fontSize: 12, fontWeight: '700', color: SLATE[500] },
  modeTextActive: { color: BG.white },
  modeHint: { fontSize: 11, color: SLATE[400], marginBottom: 22, textAlign: 'center' },

  fallbackBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: TEAL + '12', borderWidth: 1, borderColor: TEAL + '35',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16,
  },
  fallbackTitle: { fontSize: 13, fontWeight: '700', color: SLATE[800] },
  fallbackText: { fontSize: 12, color: SLATE[500], lineHeight: 18 },
  fallbackLink: { fontSize: 12, fontWeight: '700', color: TEAL, marginTop: 2 },

  field: { marginBottom: 18 },
  label: {
    fontSize: 11, color: SLATE[500], marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '600',
  },
  input: { flex: 1, fontSize: 15, color: SLATE[900], paddingVertical: 10, paddingRight: 8 },
  pwRow: { flexDirection: 'row', alignItems: 'center' },
  inputLine: { height: 1.5, backgroundColor: SLATE[200], borderRadius: 1 },
  eyeBtn: { padding: 6 },

  optionsRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 18, height: 18, borderRadius: 4,
    borderWidth: 1.5, borderColor: CLOUD.haze,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: NAVY, borderColor: NAVY },
  rememberText: { fontSize: 12, color: SLATE[500] },
  forgotText: { fontSize: 12, color: TEAL, fontWeight: '600' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: RED[50], borderWidth: 1, borderColor: RED[200],
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16,
  },
  error: { color: RED[600], fontSize: 12, flex: 1 },

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
  loginBtnText: { fontSize: 15, fontWeight: '700', color: BG.white, letterSpacing: 0.3 },

  dividerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: SLATE[200] },
  dividerText: { fontSize: 11, color: SLATE[400], textTransform: 'uppercase', letterSpacing: 0.5 },

  socialRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 12,
    borderWidth: 1.5, borderColor: SLATE[200], backgroundColor: BG.white,
  },
  socialBtnText: { fontSize: 13, fontWeight: '600', color: SLATE[700] },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 13, color: SLATE[400] },
  footerLink: { fontSize: 13, color: NAVY, fontWeight: '700' },
});
