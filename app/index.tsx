import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { useAuth } from '@/lib/context/auth-context';

const PORTALS = [
  {
    id: 'guest', title: 'Guest', subtitle: 'Book hotels & stays',
    icon: 'hotel' as const, color: SRS.teal,
    description: 'Search, book, and review hotels worldwide',
  },
  {
    id: 'host', title: 'Host', subtitle: 'Manage your property',
    icon: 'store' as const, color: SRS.navy,
    description: 'List rooms, track bookings, grow revenue',
  },
  {
    id: 'operations', title: 'Operations', subtitle: 'Hotel operations dashboard',
    icon: 'kds' as const, color: SRS.green,
    description: 'Front desk, housekeeping, POS, KDS',
  },
  {
    id: 'superadmin', title: 'SuperAdmin', subtitle: 'Platform administration',
    icon: 'manager' as const, color: SRS.orange,
    description: 'Tenants, billing, feature flags, audit',
  },
];

export default function PortalPicker() {
  const { portal, isSignedIn, switchPortal } = useAuth();

  const handlePortalSelect = async (portalId: string) => {
    if (portalId === 'guest') {
      if (portal !== 'guest' || !isSignedIn) {
        await switchPortal('guest');
      }
      router.replace('/(tabs)');
    } else if (portal === portalId && isSignedIn) {
      router.replace(`/(${portalId})`);
    } else {
      await switchPortal(portalId as any);
      router.replace(`/(${portalId})/login`);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={s.hero}>
        <Image
          source={require('@/assets/images/logo1.png')}
          style={{ width: 72, height: 72, marginBottom: SPACING.md }}
          resizeMode="contain"
        />
        <Text style={s.brand}>StayEasy</Text>
        <Text style={s.tagline}>Choose your portal to get started</Text>
      </View>

      <View style={s.portalList}>
        {PORTALS.map((p) => (
          <TouchableOpacity key={p.id} onPress={() => handlePortalSelect(p.id)}
            style={[s.portalCard, { borderColor: p.color + '20' }]} activeOpacity={0.85}
          >
            <View style={[s.portalIcon, { backgroundColor: p.color + '12' }]}>
              <IconSymbol name={p.icon} size={28} color={p.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.portalTitle}>{p.title}</Text>
              <Text style={s.portalSub}>{p.subtitle}</Text>
            </View>
            <View style={[s.portalArrow, { backgroundColor: p.color + '12' }]}>
              <IconSymbol name="arrow.forward" size={16} color={p.color} />
            </View>
            <View style={[s.portalBar, { backgroundColor: p.color }]} />
            <Text style={s.portalDesc}>{p.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  hero: { alignItems: 'center', paddingTop: 60, paddingBottom: 32, paddingHorizontal: SPACING.lg },
  brand: { fontSize: 36, fontWeight: '700', color: SRS.navy, letterSpacing: -0.5 },
  tagline: { ...TYPOGRAPHY.body, color: GRAY[500], marginTop: 4 },
  portalList: { paddingHorizontal: SPACING.lg, gap: SPACING.lg },
  portalCard: { borderRadius: RADIUS.modal, backgroundColor: '#FFF', borderWidth: 1, overflow: 'hidden' },
  portalIcon: { width: 52, height: 52, borderRadius: RADIUS.card, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  portalTitle: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy },
  portalSub: { ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: 1 },
  portalArrow: { width: 32, height: 32, borderRadius: RADIUS.card, alignItems: 'center', justifyContent: 'center' },
  portalBar: { height: 3, marginTop: SPACING.md, marginBottom: SPACING.sm },
  portalDesc: { ...TYPOGRAPHY.small, color: GRAY[500], paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
});
