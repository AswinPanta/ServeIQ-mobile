import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';
import { safeGoBack } from '@/lib/utils';
import { SRS, TYPOGRAPHY } from '@/constants/portal-theme';
import { SLATE } from '@/lib/constants/figma-tokens';

const ACCENT = SRS.teal;

export default function HostChangePasswordScreen() {
  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} contentInsetAdjustmentBehavior="automatic">
        <View style={s.header}>
          <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={ACCENT} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Change Password</Text>
            <Text style={s.headerSub}>Keep your host account secure</Text>
          </View>
        </View>

        <ChangePasswordForm accent={ACCENT} onSuccess={() => safeGoBack()} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: SLATE[50] },
  scroll: { padding: 20, paddingTop: 8, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: SLATE[900] },
  headerSub: { ...TYPOGRAPHY.small, color: SLATE[400], marginTop: 2 },
});
