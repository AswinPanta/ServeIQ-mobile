/**
 * Register Screen — SRS Design System
 * New user registration form
 */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { useAuth } from '@/lib/context/auth-context';

export default function RegisterScreen() {
  const { register, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email';
    if (!phone.trim()) e.phone = 'Phone is required';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'At least 8 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!agreedToTerms) e.terms = 'You must agree to the terms';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    try {
      await register(email, phone, name, password);
      router.push({ pathname: '/(auth)/otp-verify', params: { email, mode: 'register' } });
    } catch (error) {
      Alert.alert('Registration Failed', error instanceof Error ? error.message : 'An error occurred');
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={s.body}>
        {/* Header */}
        <View style={s.headerSection}>
          <View style={s.logoCircle}>
            <IconSymbol name="hotel" size={36} color={SRS.teal} />
          </View>
          <Text style={s.title}>Create Account</Text>
          <Text style={s.sub}>Join us to start booking your stay</Text>
        </View>

        {/* Form */}
        <View style={{ gap: SPACING.md }}>
          {[
            { label: 'Full Name', val: name, set: setName, key: 'name', placeholder: 'John Doe', icon: 'person.fill' as const },
            { label: 'Email Address', val: email, set: setEmail, key: 'email', placeholder: 'your@email.com', icon: 'email' as const, keyboard: 'email-address' as const },
            { label: 'Phone Number', val: phone, set: setPhone, key: 'phone', placeholder: '+1 234 567 890', icon: 'phone' as const, keyboard: 'phone-pad' as const },
          ].map((f) => (
            <View key={f.key}>
              <Text style={s.fieldLabel}>{f.label} <Text style={{ color: SRS.red }}>*</Text></Text>
              <View style={[s.inputRow, { borderColor: errors[f.key] ? SRS.red : GRAY[200] }]}>
                <IconSymbol name={f.icon} size={18} color={GRAY[400]} style={{ marginRight: SPACING.sm }} />
                <TextInput
                  placeholder={f.placeholder} placeholderTextColor={GRAY[400]}
                  value={f.val} onChangeText={(t) => { f.set(t); if (errors[f.key]) setErrors({ ...errors, [f.key]: '' }); }}
                  editable={!isLoading} keyboardType={f.keyboard || 'default'} autoCapitalize="none"
                  style={s.input}
                />
              </View>
              {errors[f.key] && <Text style={s.errorText}>{errors[f.key]}</Text>}
            </View>
          ))}

          {/* Password Fields */}
          {[
            { label: 'Password', val: password, set: setPassword, key: 'password', show: showPassword, toggle: setShowPassword },
            { label: 'Confirm Password', val: confirmPassword, set: setConfirmPassword, key: 'confirmPassword', show: showConfirm, toggle: setShowConfirm },
          ].map((f) => (
            <View key={f.key}>
              <Text style={s.fieldLabel}>{f.label} <Text style={{ color: SRS.red }}>*</Text></Text>
              <View style={[s.inputRow, { borderColor: errors[f.key] ? SRS.red : GRAY[200] }]}>
                <IconSymbol name="key" size={18} color={GRAY[400]} style={{ marginRight: SPACING.sm }} />
                <TextInput
                  placeholder="••••••••" placeholderTextColor={GRAY[400]}
                  value={f.val} onChangeText={(t) => { f.set(t); if (errors[f.key]) setErrors({ ...errors, [f.key]: '' }); }}
                  editable={!isLoading} secureTextEntry={!f.show} autoCapitalize="none"
                  style={s.input}
                />
                <TouchableOpacity onPress={() => f.toggle(!f.show)} disabled={isLoading} style={s.toggleBtn}>
                  <Text style={s.toggleText}>{f.show ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
              {errors[f.key] && <Text style={s.errorText}>{errors[f.key]}</Text>}
            </View>
          ))}

          {/* Terms */}
          <TouchableOpacity onPress={() => setAgreedToTerms(!agreedToTerms)} disabled={isLoading} style={s.termsRow}>
            <View style={[s.checkbox, { backgroundColor: agreedToTerms ? SRS.teal : 'transparent', borderColor: agreedToTerms ? SRS.teal : GRAY[300] }]}>
              {agreedToTerms && <IconSymbol name="check" size={12} color="#FFF" />}
            </View>
            <Text style={s.termsText}>
              I agree to the <Text style={{ color: SRS.teal, fontWeight: '700' }}>Terms and Conditions</Text>
            </Text>
          </TouchableOpacity>
          {errors.terms && <Text style={s.errorText}>{errors.terms}</Text>}

          {/* Submit */}
          <TouchableOpacity onPress={handleRegister} disabled={isLoading}
            style={[s.primaryBtn, { opacity: isLoading ? 0.7 : 1 }]} activeOpacity={0.85}>
            {isLoading ? <ActivityIndicator color="#FFF" /> : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                <IconSymbol name="person.add" size={18} color="#FFF" />
                <Text style={s.primaryBtnText}>Create Account</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={s.footerRow}>
          <Text style={s.footerText}>Already have an account?</Text>
          <TouchableOpacity disabled={isLoading} onPress={() => router.push('/(auth)/login')}>
            <Text style={s.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  body: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl, gap: SPACING.lg, paddingBottom: 40 },
  headerSection: { alignItems: 'center', gap: SPACING.xs },
  logoCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: SRS.teal + '12', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  title: { ...TYPOGRAPHY.h2, color: SRS.navy },
  sub: { ...TYPOGRAPHY.body, color: GRAY[500] },
  fieldLabel: { ...TYPOGRAPHY.small, fontWeight: '600', color: SRS.navy, marginBottom: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderRadius: RADIUS.card, paddingHorizontal: 14, paddingVertical: 2 },
  input: { flex: 1, fontSize: 14, color: SRS.navy, paddingVertical: 10 },
  toggleBtn: { paddingHorizontal: 8, paddingVertical: 12 },
  toggleText: { fontSize: 12, fontWeight: '600', color: SRS.teal },
  errorText: { ...TYPOGRAPHY.caption, color: SRS.red, marginTop: 2 },
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  checkbox: { width: 22, height: 22, borderRadius: RADIUS.button, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  termsText: { ...TYPOGRAPHY.body, color: GRAY[600], flex: 1 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: RADIUS.card, backgroundColor: SRS.navy, marginTop: SPACING.sm },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  footerText: { ...TYPOGRAPHY.body, color: GRAY[500] },
  footerLink: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.teal },
});
