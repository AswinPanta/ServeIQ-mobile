import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';

const SUPERADMIN = '#8E44AD';

const INITIAL_FLAGS = [
  { id: '1', name: 'Multi-Language', description: 'Enable multi-language support across all tenant dashboards', enabled: true, environments: ['Production', 'Staging'], rollout: 100 },
  { id: '2', name: 'Dynamic Pricing', description: 'AI-driven dynamic pricing based on occupancy and demand', enabled: true, environments: ['Staging'], rollout: 25 },
  { id: '3', name: 'Early Check-in', description: 'Allow guests to request early check-in for an additional fee', enabled: true, environments: ['Production', 'Staging'], rollout: 80 },
  { id: '4', name: 'Loyalty Program', description: 'Points-based loyalty program for returning guests', enabled: false, environments: ['Staging'], rollout: 10 },
  { id: '5', name: 'Coupon System', description: 'Discount coupons and promotional codes for bookings', enabled: true, environments: ['Production', 'Staging'], rollout: 60 },
  { id: '6', name: 'OTA Sync', description: 'Sync inventory and pricing with OTAs like Booking.com and Expedia', enabled: false, environments: [], rollout: 0 },
];

export default function FeatureFlagsScreen() {
  const [flags, setFlags] = useState(INITIAL_FLAGS);
  const [search, setSearch] = useState('');

  const toggleFlag = (id: string) => setFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  const setRollout = (id: string, val: number) => setFlags(prev => prev.map(f => f.id === id ? { ...f, rollout: Math.max(0, Math.min(100, val)) } : f));
  const filtered = flags.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={SUPERADMIN} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Feature Flags</Text>
        </View>

        <View style={s.searchBox}>
          <IconSymbol name="search" size={16} color={GRAY[400]} />
          <TextInput placeholder="Search flags..." placeholderTextColor={GRAY[400]} value={search} onChangeText={setSearch} style={s.searchInput} />
        </View>

        {filtered.map(flag => (
          <View key={flag.id} style={[s.flagCard, { borderLeftColor: flag.enabled ? '#10B981' : '#6B7280' }]}>
            <View style={s.flagTop}>
              <Text style={s.flagName}>{flag.name}</Text>
              <Switch value={flag.enabled} onValueChange={() => toggleFlag(flag.id)}
                trackColor={{ false: GRAY[200], true: SUPERADMIN + '60' }} thumbColor={flag.enabled ? SUPERADMIN : '#9CA3AF'} />
            </View>
            <Text style={s.flagDesc}>{flag.description}</Text>
            <View style={s.envRow}>
              {flag.environments.map(env => (
                <View key={env} style={[s.envBadge, { backgroundColor: env === 'Production' ? '#10B98115' : '#F59E0B15' }]}>
                  <Text style={[s.envText, { color: env === 'Production' ? '#10B981' : '#F59E0B' }]}>{env}</Text>
                </View>
              ))}
            </View>
            <View style={s.rolloutRow}>
              <Text style={s.rolloutLabel}>Rollout: {flag.rollout}%</Text>
              <View style={s.rolloutBarBg}>
                <View style={[s.rolloutBar, { width: `${flag.rollout}%`, backgroundColor: flag.enabled ? '#10B981' : '#9CA3AF' }]} />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  scroll: { padding: SPACING.xl, paddingTop: 60, gap: SPACING.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 44, height: 44, borderRadius: RADIUS.modal, backgroundColor: SUPERADMIN + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TYPOGRAPHY.h2, color: SRS.navy, flex: 1 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: GRAY[100], borderRadius: 14, paddingHorizontal: 14, height: 46 },
  searchInput: { flex: 1, fontSize: 15, color: SRS.navy, padding: 0 },
  flagCard: { padding: SPACING.lg, borderRadius: 20, backgroundColor: '#FFF', borderLeftWidth: 4, ...SHADOWS.card },
  flagTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  flagName: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy, flex: 1 },
  flagDesc: { ...TYPOGRAPHY.small, color: GRAY[500], marginBottom: 12 },
  envRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  envBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  envText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  rolloutRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rolloutLabel: { ...TYPOGRAPHY.caption, color: GRAY[500], width: 80 },
  rolloutBarBg: { flex: 1, height: 8, borderRadius: 4, backgroundColor: GRAY[100], overflow: 'hidden' },
  rolloutBar: { height: '100%', borderRadius: 4 },
});
