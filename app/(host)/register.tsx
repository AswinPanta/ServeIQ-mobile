import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { safeGoBack } from "@/lib/utils";
import { useAuth } from '@/lib/context/auth-context';

export default function HostRegisterScreen() {
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName) e.firstName = 'Required';
    if (!form.lastName) e.lastName = 'Required';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (!form.phone) e.phone = 'Required';
    if (!form.password || form.password.length < 6) e.password = 'Min 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords must match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const fullName = `${form.firstName} ${form.lastName}`.trim();
      await register(form.email, form.phone, fullName, form.password, 'host');
      Alert.alert('Success', 'Account created! Please check your email to verify.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.headerSection}>
          <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={20} color={SRS.navy} />
          </TouchableOpacity>
          <Text style={s.title}>Create Account</Text>
          <Text style={s.subtitle}>Join as a host and start earning</Text>
        </View>

        {/* Name Row */}
        <View style={s.row}>
          {['firstName', 'lastName'].map((field) => (
            <View key={field} style={s.halfField}>
              <Text style={s.fieldLabel}>{field === 'firstName' ? 'First' : 'Last'}</Text>
              <View style={[s.inputWrap, errors[field] && s.inputError]}>
                <IconSymbol name="person.fill" size={16} color={GRAY[400]} />
                <TextInput
                  placeholder={field === 'firstName' ? 'John' : 'Doe'}
                  placeholderTextColor={GRAY[400]}
                  value={(form as any)[field]}
                  onChangeText={(t) => updateField(field, t)}
                  style={s.input}
                />
              </View>
              {errors[field] && <Text style={s.errorText}>{errors[field]}</Text>}
            </View>
          ))}
        </View>

        {/* Email & Phone */}
        {['email', 'phone'].map((field) => (
          <View key={field} style={s.fieldGroup}>
            <Text style={s.fieldLabel}>{field === 'email' ? 'Email' : 'Phone'}</Text>
            <View style={[s.inputWrap, errors[field] && s.inputError]}>
              <IconSymbol name={field === 'email' ? 'email' : 'phone'} size={16} color={GRAY[400]} />
              <TextInput
                placeholder={field === 'email' ? 'your@email.com' : '+977-98xxxxxxxx'}
                placeholderTextColor={GRAY[400]}
                value={(form as any)[field]}
                onChangeText={(t) => updateField(field, t)}
                keyboardType={field === 'email' ? 'email-address' : 'phone-pad'}
                autoCapitalize="none"
                style={s.input}
              />
            </View>
            {errors[field] && <Text style={s.errorText}>{errors[field]}</Text>}
          </View>
        ))}

        {/* Password & Confirm */}
        {['password', 'confirmPassword'].map((field) => (
          <View key={field} style={s.fieldGroup}>
            <Text style={s.fieldLabel}>{field === 'confirmPassword' ? 'Confirm Password' : 'Password'}</Text>
            <View style={[s.inputWrap, errors[field] && s.inputError]}>
              <IconSymbol name="key" size={16} color={GRAY[400]} />
              <TextInput
                placeholder="••••••••"
                placeholderTextColor={GRAY[400]}
                value={(form as any)[field]}
                onChangeText={(t) => updateField(field, t)}
                secureTextEntry
                autoCapitalize="none"
                style={s.input}
              />
            </View>
            {errors[field] && <Text style={s.errorText}>{errors[field]}</Text>}
          </View>
        ))}

        {/* Create Account Button */}
        <TouchableOpacity onPress={handleRegister} disabled={isLoading} style={[s.primaryBtn, isLoading && { opacity: 0.7 }]} activeOpacity={0.85}>
          {isLoading ? <ActivityIndicator color="#FFF" /> : (
            <>
              <IconSymbol name="person.add" size={18} color="#FFF" />
              <Text style={s.primaryBtnText}>Create Account</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Sign In Link */}
        <View style={s.linkRow}>
          <Text style={s.linkLabel}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={s.linkAction}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  scroll: { padding: SPACING.xl, gap: SPACING.lg, paddingTop: 80 },
  headerSection: { gap: SPACING.sm },
  backBtn: { width: 36, height: 36, borderRadius: RADIUS.card, backgroundColor: GRAY[100], alignItems: 'center', justifyContent: 'center' },
  title: { ...TYPOGRAPHY.h1, color: SRS.navy },
  subtitle: { ...TYPOGRAPHY.body, color: GRAY[500] },
  row: { flexDirection: 'row', gap: SPACING.md },
  halfField: { flex: 1, gap: SPACING.xs },
  fieldGroup: { gap: SPACING.xs },
  fieldLabel: { ...TYPOGRAPHY.small, fontWeight: '600', color: SRS.navy },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: 14, borderRadius: RADIUS.modal, borderWidth: 1, borderColor: GRAY[200], backgroundColor: '#FFF' },
  inputError: { borderColor: SRS.red, backgroundColor: SRS.red + '05' },
  input: { flex: 1, fontSize: 15, color: SRS.navy, padding: 0 },
  errorText: { ...TYPOGRAPHY.caption, color: SRS.red },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 16, borderRadius: RADIUS.modal, backgroundColor: SRS.navy, ...SHADOWS.card },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.lg },
  linkLabel: { ...TYPOGRAPHY.body, color: GRAY[500] },
  linkAction: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.teal },
});
