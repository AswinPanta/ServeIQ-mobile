import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BRAND, CORAL, SLATE, BG, NEUTRAL, GRAY } from '@/lib/constants/figma-tokens';

const NAVY = BRAND.navyLight;
const ACCENT = CORAL[500];

/**
 * Route fallback for any unmatched path (Expo Router's `*` handler).
 * Mirror of the reference web app's NotFoundPage.
 */
export default function NotFoundPage() {
  return (
    <View style={s.container}>
      <View style={s.iconWrap}>
        <Ionicons name="compass-outline" size={44} color={ACCENT} />
      </View>
      <Text style={s.code}>404</Text>
      <Text style={s.title}>Page not found</Text>
      <Text style={s.subtitle}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </Text>

      <View style={s.actions}>
        <Link href="/" asChild>
          <TouchableOpacity style={[s.btn, s.btnPrimary]} activeOpacity={0.85}>
            <Ionicons name="home-outline" size={16} color={BG.white} />
            <Text style={s.btnPrimaryText}>Go Home</Text>
          </TouchableOpacity>
        </Link>
        <TouchableOpacity
          style={[s.btn, s.btnSecondary]}
          activeOpacity={0.85}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back-outline" size={16} color={NAVY} />
          <Text style={s.btnSecondaryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NEUTRAL[50],
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: BG.white,
    borderWidth: 1,
    borderColor: SLATE[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  code: { fontSize: 64, fontWeight: '800', color: NAVY, letterSpacing: -2 },
  title: { fontSize: 20, fontWeight: '700', color: GRAY[900], marginTop: 4 },
  subtitle: {
    fontSize: 14,
    color: SLATE[500],
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 8,
    maxWidth: 280,
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 32 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnPrimary: { backgroundColor: NAVY },
  btnPrimaryText: { fontSize: 14, fontWeight: '700', color: BG.white },
  btnSecondary: {
    backgroundColor: BG.white,
    borderWidth: 1.5,
    borderColor: SLATE[200],
  },
  btnSecondaryText: { fontSize: 14, fontWeight: '700', color: NAVY },
});
