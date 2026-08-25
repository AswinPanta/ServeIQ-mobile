import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';
import { useAuth } from '@/lib/context/auth-context';
import { clearStaffMustChange } from '@/lib/context/host-utils';
import { SRS, TYPOGRAPHY } from '@/constants/portal-theme';
import { SLATE, AMBER, GRAY } from '@/lib/constants/figma-tokens';

const ACCENT = SRS.teal;

export default function OpsChangePasswordScreen() {
  const { user } = useAuth();

  const handleSuccess = async () => {
    if (user?.email) {
      await clearStaffMustChange(user.email);
    }
    router.replace('/(operations)');
  };

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} contentInsetAdjustmentBehavior="automatic">
        <View style={s.header}>
          <View style={s.headerIcon}>
            <IconSymbol name="lock" size={20} color={ACCENT} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Set a New Password</Text>
            <Text style={s.headerSub}>First-time sign-in requires a password change</Text>
          </View>
        </View>

        <View style={s.tempNote}>
          <IconSymbol name="info" size={16} color={AMBER[800]} />
          <Text style={s.tempNoteText}>
            You signed in with the temporary password from your invitation email. Choose a personal password to continue.
          </Text>
        </View>

        <ChangePasswordForm accent={ACCENT} onSuccess={handleSuccess} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: SLATE[50] },
  scroll: { padding: 20, paddingTop: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: SLATE[900] },
  headerSub: { ...TYPOGRAPHY.small, color: GRAY[400], marginTop: 2 },
  tempNote: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: AMBER[50], borderWidth: 1, borderColor: AMBER[200],
    borderRadius: 12, padding: 12, marginBottom: 8,
  },
  tempNoteText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: AMBER[800] },
});
