import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SRS, RADIUS, GRAY } from '@/constants/portal-theme';

export default function CreateNewPasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleConfirm = () => {
    const newErrors: Record<string, string> = {};
    if (!newPassword.trim()) newErrors.newPassword = 'Password is required';
    else if (newPassword.length < 6) newErrors.newPassword = 'Min 6 characters';
    if (!confirmPassword.trim()) newErrors.confirmPassword = 'Please confirm';
    else if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    Alert.alert('Success', 'Your password has been reset', [
      { text: 'OK', onPress: () => router.replace('/(auth)/login') },
    ]);
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.inner}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={s.title}>Create new password</Text>

        <View style={s.field}>
          <Text style={s.label}>New Password</Text>
          <View style={[s.inputWrap, errors.newPassword && s.inputError]}>
            <TextInput
              style={s.input}
              placeholder="Enter your Password"
              placeholderTextColor={GRAY[400]}
              value={newPassword}
              onChangeText={(t) => { setNewPassword(t); if (errors.newPassword) setErrors({ ...errors, newPassword: '' }); }}
              secureTextEntry={!showNew}
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)} style={s.eyeBtn}>
              <Ionicons name={showNew ? 'eye-off' : 'eye'} size={20} color={GRAY[400]} />
            </TouchableOpacity>
          </View>
          {errors.newPassword && <Text style={s.error}>{errors.newPassword}</Text>}
        </View>

        <View style={s.field}>
          <Text style={s.label}>Confirm New Password</Text>
          <View style={[s.inputWrap, errors.confirmPassword && s.inputError]}>
            <TextInput
              style={s.input}
              placeholder="Re-enter your password"
              placeholderTextColor={GRAY[400]}
              value={confirmPassword}
              onChangeText={(t) => { setConfirmPassword(t); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' }); }}
              secureTextEntry={!showConfirm}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={s.eyeBtn}>
              <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={20} color={GRAY[400]} />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && <Text style={s.error}>{errors.confirmPassword}</Text>}
        </View>

        <TouchableOpacity style={s.confirmBtn} onPress={handleConfirm} activeOpacity={0.8}>
          <Text style={s.confirmBtnText}>Confirm</Text>
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
  title: { fontSize: 28, fontFamily: FONTS.playfairDisplay.bold, color: '#000', marginBottom: 48 },
  field: { marginBottom: 24 },
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
