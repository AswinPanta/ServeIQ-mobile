import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { useAuth } from '@/lib/context/auth-context';

const SUPERADMIN = '#8E44AD';

export default function SuperAdminLoginScreen() {
  const { login, demoLogin, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Min 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    try {
      await login(email, password, 'superadmin');
      router.replace('/(superadmin)');
    } catch (error) {
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleDemoLogin = async () => {
    await demoLogin('superadmin');
    router.replace('/(superadmin)');
  };

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.headerSection}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={20} color={SUPERADMIN} />
          </TouchableOpacity>
          <View style={s.brandRow}>
            <View style={s.brandIcon}>
              <IconSymbol name="manager" size={24} color="#FFF" />
            </View>
            <Text style={s.brandName}>StayEasy</Text>
          </View>
          <Text style={s.title}>Admin Login</Text>
          <Text style={s.subtitle}>Platform administration panel</Text>
        </View>

        {/* Email */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>Email</Text>
          <View style={[s.inputWrap, errors.email && s.inputError]}>
            <IconSymbol name="email" size={16} color={GRAY[400]} />
            <TextInput
              placeholder="admin@stayeasy.com"
              placeholderTextColor={GRAY[400]}
              value={email}
              onChangeText={(t) => { setEmail(t); if (errors.email) setErrors({ ...errors, email: '' }); }}
              editable={!isLoading}
              keyboardType="email-address"
              autoCapitalize="none"
              style={s.input}
            />
          </View>
          {errors.email && <Text style={s.errorText}>{errors.email}</Text>}
        </View>

        {/* Password */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>Password</Text>
          <View style={[s.inputWrap, errors.password && s.inputError]}>
            <IconSymbol name="key" size={16} color={GRAY[400]} />
            <TextInput
              placeholder="••••••••"
              placeholderTextColor={GRAY[400]}
              value={password}
              onChangeText={(t) => { setPassword(t); if (errors.password) setErrors({ ...errors, password: '' }); }}
              editable={!isLoading}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              style={s.input}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={isLoading}>
              <Text style={s.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={s.errorText}>{errors.password}</Text>}
        </View>

        {/* Sign In Button */}
        <TouchableOpacity onPress={handleLogin} disabled={isLoading} style={[s.primaryBtn, isLoading && { opacity: 0.7 }]} activeOpacity={0.85}>
          {isLoading ? <ActivityIndicator color="#FFF" /> : (
            <>
              <IconSymbol name="check" size={18} color="#FFF" />
              <Text style={s.primaryBtnText}>Sign In</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Demo Login */}
        <TouchableOpacity onPress={handleDemoLogin} disabled={isLoading} style={s.secondaryBtn} activeOpacity={0.85}>
          <IconSymbol name="person.fill" size={18} color={SUPERADMIN} />
          <Text style={s.secondaryBtnText}>Continue as Demo Admin</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  scroll: { padding: SPACING.xl, gap: SPACING.lg, paddingTop: 60 },
  headerSection: { gap: SPACING.md, marginBottom: SPACING.sm },
  backBtn: { width: 36, height: 36, borderRadius: RADIUS.card, backgroundColor: GRAY[100], alignItems: 'center', justifyContent: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  brandIcon: { width: 40, height: 40, borderRadius: RADIUS.modal, backgroundColor: SUPERADMIN, alignItems: 'center', justifyContent: 'center' },
  brandName: { ...TYPOGRAPHY.h2, color: SRS.navy },
  title: { ...TYPOGRAPHY.h1, color: SRS.navy },
  subtitle: { ...TYPOGRAPHY.body, color: GRAY[500] },
  fieldGroup: { gap: SPACING.xs },
  fieldLabel: { ...TYPOGRAPHY.small, fontWeight: '600', color: SRS.navy },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: 14, borderRadius: RADIUS.modal, borderWidth: 1, borderColor: GRAY[200], backgroundColor: '#FFF' },
  inputError: { borderColor: SRS.red, backgroundColor: SRS.red + '05' },
  input: { flex: 1, fontSize: 15, color: SRS.navy, padding: 0 },
  toggleText: { fontSize: 13, fontWeight: '600', color: SUPERADMIN },
  errorText: { ...TYPOGRAPHY.caption, color: SRS.red },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 16, borderRadius: RADIUS.modal, backgroundColor: SUPERADMIN, ...SHADOWS.card },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 14, borderRadius: RADIUS.modal, borderWidth: 1.5, borderColor: SUPERADMIN + '40', backgroundColor: '#FFF' },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', color: SUPERADMIN },
});
