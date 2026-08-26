import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/context/auth-context';
import { clearGuestMustChange } from '@/lib/context/host-utils';
import { FONTS, SRS, RADIUS, GRAY } from '@/constants/portal-theme';
import { TEXT, NEUTRAL, BG, GRAY as GRAYTokens, BORDER, SRS as SRSTokens, RED } from '@/lib/constants/figma-tokens';

export default function CreateNewPasswordScreen() {
  const { t } = useTranslation();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isTempMode = mode === 'temp';
  const { user, changePassword, clearMustChangePassword, logout, tempPassword } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleConfirm = async () => {
    const newErrors: Record<string, string> = {};
    if (!isTempMode) {
      // The live backend has no /auth/reset-password endpoint (verified against
      // its OpenAPI spec) — password resets work by requesting a temporary
      // password via Forgot Password, then changing it here.
      Alert.alert(
        'Password Reset',
        'Reset links are not supported. Use “Forgot Password” on the login screen to receive a temporary password, then sign in with it and set a new password here.',
        [
          { text: 'Go to Forgot Password', onPress: () => router.replace('/(auth)/forgot-password') },
          { text: t('common.ok') },
        ],
      );
      return;
    }
    if (!newPassword.trim()) newErrors.newPassword = 'Password is required';
    else if (newPassword.length < 6) newErrors.newPassword = 'Min 6 characters';
    if (!confirmPassword.trim()) newErrors.confirmPassword = 'Please confirm';
    else if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      if (isTempMode) {
        // Temp password flow: user logged in with temp password, now setting a real one.
        // Use the changePassword endpoint with the stored temp password.
        if (!tempPassword) {
          Alert.alert('Error', 'Session expired. Please log in again with your temp password.');
          return;
        }
        try {
          await changePassword(tempPassword, newPassword);
          await clearGuestMustChange(user?.email || '');
          clearMustChangePassword();
          Alert.alert(t('auth.reset.success'), 'Your password has been updated. Please log in with your new password.', [
            { text: t('common.ok'), onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
          ]);
        } catch (e: any) {
          Alert.alert('Error', e?.message || 'Failed to update password. Please try again.');
        }
      } else {
        // Legacy token flow — backend does not have a reset-password endpoint,
        // so direct the user to log in with their current password instead.
        Alert.alert(
          'Not Available',
          'Token-based password reset is not supported. Please log in with your current password and change it from your profile settings.',
          [{ text: t('common.ok'), onPress: () => router.replace('/(auth)/login') }],
        );
      }
    } catch {
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.inner}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={TEXT.heading} />
        </TouchableOpacity>

        <Text style={s.title}>{isTempMode ? 'Set a New Password' : t('auth.reset.title')}</Text>

        {isTempMode ? (
          <View style={{ backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 12, padding: 12, marginBottom: 20 }}>
            <Text style={{ fontSize: 12.5, lineHeight: 18, color: '#92400E' }}>
              You signed in with a temporary password. Choose a new password to secure your account.
            </Text>
          </View>
        ) : (
          <View style={{ backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 12, padding: 12, marginBottom: 20 }}>
            <Text style={{ fontSize: 12.5, lineHeight: 18, color: '#1E40AF' }}>
              Reset links aren&apos;t supported by the current backend. Use “Forgot Password” to receive a temporary
              password, sign in with it, then set a new password here.
            </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/forgot-password')} activeOpacity={0.8}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#1D4ED8', marginTop: 8 }}>Go to Forgot Password →</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={s.field}>
          <Text style={s.label}>{t('auth.reset.password')}</Text>
          <View style={[s.inputWrap, errors.newPassword && s.inputError]}>
            <TextInput
              style={s.input}
              placeholder={t('auth.login.passwordPlaceholder')}
              placeholderTextColor={GRAY[400]}
              value={newPassword}
              onChangeText={(val) => { setNewPassword(val); if (errors.newPassword) setErrors({ ...errors, newPassword: '' }); }}
              secureTextEntry={!showNew}
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)} style={s.eyeBtn}>
              <Ionicons name={showNew ? 'eye-off' : 'eye'} size={20} color={GRAY[400]} />
            </TouchableOpacity>
          </View>
          {errors.newPassword && <Text style={s.error}>{errors.newPassword}</Text>}
        </View>

        <View style={s.field}>
          <Text style={s.label}>{t('auth.reset.confirmPassword')}</Text>
          <View style={[s.inputWrap, errors.confirmPassword && s.inputError]}>
            <TextInput
              style={s.input}
              placeholder={t('auth.reset.confirmPassword')}
              placeholderTextColor={GRAY[400]}
              value={confirmPassword}
              onChangeText={(val) => { setConfirmPassword(val); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' }); }}
              secureTextEntry={!showConfirm}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={s.eyeBtn}>
              <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={20} color={GRAY[400]} />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && <Text style={s.error}>{errors.confirmPassword}</Text>}
        </View>

        <TouchableOpacity style={s.confirmBtn} onPress={handleConfirm} activeOpacity={0.8} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={NEUTRAL.snow} />
          ) : (
            <Text style={s.confirmBtnText}>{t('auth.reset.button')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG.white },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
  backBtn: {
    width: 51, height: 51, borderRadius: 25.5, backgroundColor: GRAYTokens[100],
    alignItems: 'center', justifyContent: 'center', marginBottom: 32,
  },
  title: { fontSize: 28, fontFamily: FONTS.playfairDisplay.bold, color: TEXT.black, marginBottom: 32 },
  field: { marginBottom: 20 },
  label: { fontSize: 16, fontFamily: FONTS.inter.medium, color: TEXT.label, marginBottom: 10 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: BORDER.input,
    borderRadius: RADIUS.input, paddingHorizontal: 16,
  },
  inputError: { borderColor: SRSTokens.red, backgroundColor: RED[50] },
  input: { flex: 1, fontSize: 14, fontFamily: FONTS.inter.regular, color: TEXT.black, paddingVertical: 12 },
  eyeBtn: { padding: 8 },
  error: { fontSize: 12, fontFamily: FONTS.inter.regular, color: SRSTokens.red, marginTop: 4 },
  confirmBtn: {
    backgroundColor: SRS.navy, borderRadius: RADIUS.button, paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  confirmBtnText: { fontSize: 20, fontFamily: FONTS.itim, color: NEUTRAL.snow },
});
