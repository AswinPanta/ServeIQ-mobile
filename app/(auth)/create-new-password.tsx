import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api-config';
import { FONTS, SRS, RADIUS, GRAY } from '@/constants/portal-theme';

export default function CreateNewPasswordScreen() {
  const { t } = useTranslation();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleConfirm = async () => {
    const newErrors: Record<string, string> = {};
    if (!token.trim()) newErrors.token = 'Reset token is required';
    if (!newPassword.trim()) newErrors.newPassword = 'Password is required';
    else if (newPassword.length < 6) newErrors.newPassword = 'Min 6 characters';
    if (!confirmPassword.trim()) newErrors.confirmPassword = 'Please confirm';
    else if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.RESET_PASSWORD}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), new_password: newPassword }),
      });
      if (res.ok) {
        Alert.alert(t('auth.reset.success'), 'Your password has been reset successfully.', [
          { text: t('common.ok'), onPress: () => router.replace('/(auth)/login') },
        ]);
      } else {
        const data = await res.json().catch(() => ({}));
        Alert.alert('Error', data.detail || data.message || 'Invalid or expired token. Please request a new one.');
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
          <Ionicons name="arrow-back" size={22} color="#1A1C1E" />
        </TouchableOpacity>

        <Text style={s.title}>{t('auth.reset.title')}</Text>

        <View style={s.field}>
          <Text style={s.label}>Reset Token</Text>
          <View style={[s.inputWrap, errors.token && s.inputError]}>
            <TextInput
              style={s.input}
              placeholder="Paste the token from your email"
              placeholderTextColor={GRAY[400]}
              value={token}
              onChangeText={(val) => { setToken(val); if (errors.token) setErrors({ ...errors, token: '' }); }}
              autoCapitalize="none"
            />
          </View>
          {errors.token && <Text style={s.error}>{errors.token}</Text>}
        </View>

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
            <ActivityIndicator color="#FFFAFA" />
          ) : (
            <Text style={s.confirmBtnText}>{t('auth.reset.button')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
  backBtn: {
    width: 51, height: 51, borderRadius: 25.5, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center', marginBottom: 32,
  },
  title: { fontSize: 28, fontFamily: FONTS.playfairDisplay.bold, color: '#000', marginBottom: 32 },
  field: { marginBottom: 20 },
  label: { fontSize: 16, fontFamily: FONTS.inter.medium, color: '#A7A4A4', marginBottom: 10 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#D9D9D9',
    borderRadius: RADIUS.input, paddingHorizontal: 16,
  },
  inputError: { borderColor: '#C0392B', backgroundColor: '#FEF2F2' },
  input: { flex: 1, fontSize: 14, fontFamily: FONTS.inter.regular, color: '#000', paddingVertical: 12 },
  eyeBtn: { padding: 8 },
  error: { fontSize: 12, fontFamily: FONTS.inter.regular, color: '#C0392B', marginTop: 4 },
  confirmBtn: {
    backgroundColor: SRS.navy, borderRadius: RADIUS.button, paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  confirmBtnText: { fontSize: 20, fontFamily: FONTS.itim, color: '#FFFAFA' },
});
