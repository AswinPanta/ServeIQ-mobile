import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';
import { FONTS } from '@/constants/portal-theme';
import { CORAL as CORALTokens, BRAND, NEUTRAL, BG, SLATE } from '@/lib/constants/figma-tokens';

const CORAL = CORALTokens[500];
const NAVY = BRAND.navyLight;

export default function ProfileSecurityScreen() {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <IconSymbol name="chevron.left" size={20} color={NAVY} />
        </TouchableOpacity>
        <Text style={s.title}>Security</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.body}>
        <ChangePasswordForm accent={CORAL} onSuccess={() => router.back()} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEUTRAL[50] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: BG.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: SLATE[100],
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: NAVY,
    letterSpacing: -0.5,
    fontFamily: FONTS.sora,
  },
  body: { paddingHorizontal: 16, paddingBottom: 60 },
});
