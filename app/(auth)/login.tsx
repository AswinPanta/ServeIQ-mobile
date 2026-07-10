/**
 * Login Screen — SRS Design System
 * Email/phone login with OTP verification option
 */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { useAuth } from '@/lib/context/auth-context';

export default function LoginScreen() {
  const { login, demoLogin, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Please enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'An error occurred');
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <View style={s.body}>
        {/* Header */}
        <View style={s.headerSection}>
          <View style={s.logoCircle}>
            <IconSymbol name="hotel" size={36} color={SRS.teal} />
          </View>
          <Text style={s.title}>Welcome Back</Text>
          <Text style={s.sub}>Sign in to your account to continue</Text>
        </View>

        {/* Form */}
        <View style={{ gap: SPACING.lg }}>
          {[
            { label: 'Email Address', val: email, set: setEmail, placeholder: 'your@email.com', key: 'email', secure: false, keyboard: 'email-address' as const },
            { label: 'Password', val: password, set: setPassword, placeholder: '••••••••', key: 'password', secure: !showPassword },
          ].map((f) => (
            <View key={f.key}>
              <Text style={s.fieldLabel}>{f.label}</Text>
              <View style={[s.inputRow, { borderColor: errors[f.key] ? SRS.red : GRAY[200] }]}>
                <IconSymbol name={f.key === 'email' ? 'email' : 'key'} size={18} color={GRAY[400]} style={{ marginRight: SPACING.sm }} />
                <TextInput
                  placeholder={f.placeholder} placeholderTextColor={GRAY[400]}
                  value={f.val} onChangeText={(t) => { f.set(t); if (errors[f.key]) setErrors({ ...errors, [f.key]: '' }); }}
                  editable={!isLoading} secureTextEntry={f.secure}
                  keyboardType={f.keyboard || 'default'} autoCapitalize="none"
                  style={s.input}
                />
                {f.key === 'password' && (
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={isLoading} style={s.toggleBtn}>
                    <Text style={s.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                )}
              </View>
              {errors[f.key] && <Text style={s.errorText}>{errors[f.key]}</Text>}
            </View>
          ))}

          <TouchableOpacity disabled={isLoading} onPress={() => Alert.alert('Coming Soon', 'Password reset will be available soon')}>
            <Text style={s.forgotLink}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogin} disabled={isLoading}
            style={[s.primaryBtn, { opacity: isLoading ? 0.7 : 1 }]} activeOpacity={0.85}>
            {isLoading ? <ActivityIndicator color="#FFF" /> : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                <IconSymbol name="checkin" size={18} color="#FFF" />
                <Text style={s.primaryBtnText}>Sign In</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={s.dividerRow}>
            <View style={s.divider} />
            <Text style={s.dividerText}>or</Text>
            <View style={s.divider} />
          </View>

          <TouchableOpacity onPress={() => demoLogin()} disabled={isLoading}
            style={[s.secondaryBtn, { opacity: isLoading ? 0.7 : 1 }]} activeOpacity={0.85}>
            <IconSymbol name="person.fill" size={18} color={SRS.teal} />
            <Text style={s.secondaryBtnText}>Continue as Demo User</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={s.footerRow}>
          <Text style={s.footerText}>Don't have an account?</Text>
          <TouchableOpacity disabled={isLoading} onPress={() => router.push('/(auth)/register')}>
            <Text style={s.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  body: { paddingHorizontal: SPACING.xl, gap: SPACING.xl },
  headerSection: { alignItems: 'center', gap: SPACING.sm },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: SRS.teal + '12', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  title: { ...TYPOGRAPHY.h2, color: SRS.navy },
  sub: { ...TYPOGRAPHY.body, color: GRAY[500] },
  fieldLabel: { ...TYPOGRAPHY.small, fontWeight: '600', color: SRS.navy, marginBottom: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderRadius: RADIUS.card, paddingHorizontal: 14, paddingVertical: 2 },
  input: { flex: 1, fontSize: 14, color: SRS.navy, paddingVertical: 10 },
  toggleBtn: { paddingHorizontal: 8, paddingVertical: 12 },
  toggleText: { fontSize: 12, fontWeight: '600', color: SRS.teal },
  errorText: { ...TYPOGRAPHY.caption, color: SRS.red, marginTop: 2 },
  forgotLink: { ...TYPOGRAPHY.small, fontWeight: '600', color: SRS.teal, textAlign: 'right' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: RADIUS.card, backgroundColor: SRS.navy },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  divider: { flex: 1, height: 1, backgroundColor: GRAY[200] },
  dividerText: { ...TYPOGRAPHY.small, color: GRAY[400] },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 16, borderRadius: RADIUS.card, borderWidth: 1.5, borderColor: SRS.teal, backgroundColor: SRS.teal + '08' },
  secondaryBtnText: { fontSize: 15, fontWeight: '700', color: SRS.teal },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  footerText: { ...TYPOGRAPHY.body, color: GRAY[500] },
  footerLink: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.teal },
});
