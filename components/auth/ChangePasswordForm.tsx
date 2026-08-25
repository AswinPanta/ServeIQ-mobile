import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useAuth } from '@/lib/context/auth-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FONTS, SHADOWS } from '@/constants/portal-theme';
import { BRAND, CORAL, SLATE, STATUS, RED, BG } from '@/lib/constants/figma-tokens';

const NAVY = BRAND.navyLight;

const REQUIREMENTS = (newPassword: string, confirmPassword: string) => [
  { label: 'At least 8 characters', met: newPassword.length >= 8 },
  { label: 'Contains a number', met: /\d/.test(newPassword) },
  { label: 'Contains uppercase & lowercase', met: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) },
  { label: 'Passwords match', met: newPassword === confirmPassword && newPassword.length > 0 },
];

/**
 * Shared change-password form used by the guest profile (Security) and the
 * host portal. Calls auth-context.changePassword, which POSTs
 * { current_password, new_password } to the AUTH-gated backend endpoint
 * matching the signed-in portal (guest vs user).
 */
export function ChangePasswordForm({
  accent = CORAL[500],
  onSuccess,
}: {
  accent?: string;
  onSuccess?: () => void;
}) {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChangePassword = async () => {
    setError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    setSaving(true);
    try {
      const reAuthenticated = await changePassword(currentPassword, newPassword);
      if (reAuthenticated) {
        Alert.alert('Password Changed', 'Your password has been updated successfully. You\'re still signed in.', [
          { text: 'OK', onPress: () => { if (onSuccess) onSuccess(); } },
        ]);
      } else {
        Alert.alert(
          'Password Changed',
          'Your password has been updated, but we couldn\'t keep your session alive. Please sign in again with your new password.',
          [{ text: 'OK', onPress: () => { if (onSuccess) onSuccess(); } }],
        );
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to change password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const passwordField = (
    key: string,
    label: string,
    value: string,
    setter: (v: string) => void,
    placeholder: string,
    show: boolean,
    setShow: (v: boolean) => void,
  ) => (
    <View key={key} style={s.field}>
      <Text style={s.label}>{label}</Text>
      <View style={s.inputWrap}>
        <TextInput
          value={value}
          onChangeText={setter}
          placeholder={placeholder}
          placeholderTextColor={SLATE[400]}
          secureTextEntry={!show}
          autoCapitalize="none"
          style={s.input}
        />
        <TouchableOpacity onPress={() => setShow(!show)} hitSlop={8} style={s.eyeBtn}>
          <IconSymbol name={show ? 'visibility' : 'visibility.off'} size={20} color={SLATE[400]} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View>
      <View style={[s.infoCard, { backgroundColor: accent + '0A', borderColor: accent + '1F' }]}>
        <View style={s.infoIcon}>
          <IconSymbol name="lock" size={22} color={accent} />
        </View>
        <Text style={s.infoText}>
          Update your password to keep your account secure. You&apos;ll use the new password the next time you sign in.
        </Text>
      </View>

      <View style={s.formCard}>
        {passwordField('current', 'Current Password', currentPassword, setCurrentPassword, 'Enter current password', showCurrent, setShowCurrent)}
        {passwordField('new', 'New Password', newPassword, setNewPassword, 'Enter new password', showNew, setShowNew)}
        {passwordField('confirm', 'Confirm New Password', confirmPassword, setConfirmPassword, 'Confirm new password', showConfirm, setShowConfirm)}

        {newPassword.length > 0 && (
          <View style={s.requirements}>
            <Text style={s.requirementsTitle}>Password Requirements</Text>
            {REQUIREMENTS(newPassword, confirmPassword).map((req) => (
              <View key={req.label} style={s.requirementRow}>
                <Text style={[s.requirementMark, { color: req.met ? STATUS.activeGreen : SLATE[300] }]}>
                  {req.met ? '✓' : '○'}
                </Text>
                <Text style={[s.requirementText, { color: req.met ? SLATE[800] : SLATE[400] }]}>
                  {req.label}
                </Text>
              </View>
            ))}
          </View>
        )}

        {error ? (
          <View style={s.errorBox}>
            <IconSymbol name="error" size={16} color={RED[500]} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[s.updateBtn, { backgroundColor: accent }, saving && s.updateBtnDisabled]}
          onPress={handleChangePassword}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={BG.white} />
          ) : (
            <Text style={s.updateBtnText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: BG.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: SLATE[600],
    fontFamily: FONTS.inter.regular,
  },

  formCard: {
    borderRadius: 16,
    backgroundColor: BG.white,
    borderWidth: 1,
    borderColor: SLATE[100],
    padding: 16,
    ...SHADOWS.card,
  },
  field: { marginBottom: 14 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: SLATE[800],
    marginBottom: 6,
    fontFamily: FONTS.inter.semiBold,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SLATE[200],
    borderRadius: 12,
    backgroundColor: SLATE[50],
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: NAVY,
    fontFamily: FONTS.inter.regular,
  },
  eyeBtn: { paddingLeft: 8 },

  requirements: {
    borderRadius: 12,
    backgroundColor: SLATE[50],
    padding: 14,
    marginBottom: 16,
    gap: 7,
  },
  requirementsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: SLATE[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  requirementRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  requirementMark: { fontSize: 13, fontWeight: '700', width: 14 },
  requirementText: { fontSize: 12, fontFamily: FONTS.inter.regular },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: RED[50],
    borderWidth: 1,
    borderColor: RED[200],
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 12.5, color: RED[700], fontFamily: FONTS.inter.regular },

  updateBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  updateBtnDisabled: { opacity: 0.6 },
  updateBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: BG.white,
    fontFamily: FONTS.inter.semiBold,
  },
});
