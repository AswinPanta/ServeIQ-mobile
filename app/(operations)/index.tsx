import React, { useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/context/auth-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AnimatedPressable } from '@/components/ui/motion';
import { useHotelAnalyticsStore } from '@/stores/useHotelAnalyticsStore';
import { useActivityStore } from '@/stores/useActivityStore';
import type { OperatorProfile } from '@/types/api';

const ACCENT = '#0D9488';
const DARK = '#0F172A';

const MODULES = [
  { id: 'front-desk', label: 'Front Desk', icon: 'front.desk' as const, desc: 'Check-in, check-out', color: '#2563EB' },
  { id: 'housekeeping', label: 'Housekeeping', icon: 'cleaning' as const, desc: 'Room cleaning', color: '#16A085' },
  { id: 'pos', label: 'POS', icon: 'pos' as const, desc: 'Restaurant orders', color: '#D35400' },
  { id: 'kds', label: 'KDS', icon: 'kds' as const, desc: 'Kitchen display', color: '#7C3AED' },
  { id: 'analytics', label: 'Analytics', icon: 'analytics' as const, desc: 'Reports', color: '#2E86AB' },
  { id: 'admin/staff', label: 'Staff', icon: 'person.add' as const, desc: 'Team management', color: '#0D9488' },
  { id: 'admin/approvals', label: 'Approvals', icon: 'approval' as const, desc: 'Discounts & refunds', color: '#DC2626' },
  { id: 'admin/shifts', label: 'Shifts', icon: 'shift' as const, desc: 'Schedule & coverage', color: '#7C3AED' },
];

export default function OperationsDashboard() {
  const { user } = useAuth();
  const operator = user as OperatorProfile | null;

  const setAnalyticsPropertyId = useHotelAnalyticsStore((s) => s.setPropertyId);
  const analyticsData = useHotelAnalyticsStore((s) => s.data);
  const allActivities = useActivityStore((s) => s.activities);
  const setActivityPropertyId = useActivityStore((s) => s.setPropertyId);

  useEffect(() => {
    const pid = operator?.property_id || 'prop-1';
    setAnalyticsPropertyId(pid);
    setActivityPropertyId(pid);
  }, [operator?.property_id, setAnalyticsPropertyId, setActivityPropertyId]);

  const todayStats = useMemo(() => {
    const { bookingStatusCounts, occupancyRate } = analyticsData;
    return [
      { label: 'Arriving', value: bookingStatusCounts.arriving, color: '#2563EB' },
      { label: 'In House', value: bookingStatusCounts.inHouse, color: '#16A085' },
      { label: 'Departing', value: bookingStatusCounts.departed, color: '#D35400' },
      { label: 'Occupancy', value: `${occupancyRate}%`, color: '#7C3AED' },
    ];
  }, [analyticsData]);

  // Animations
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  return (
    <ScreenContainer containerClassName="bg-background" className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Header */}
          <View style={s.header}>
            <View>
              <Text style={s.propertyName}>{operator?.property_name || 'Dashboard'}</Text>
              <Text style={s.staffName}>{operator?.name || 'Staff'} · {operator?.role || 'front_desk'}</Text>
            </View>
            <TouchableOpacity onPress={() => router.replace('/')} style={s.switchBtn}>
              <IconSymbol name="arrow.back" size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Status row */}
          <View style={s.statusRow}>
            {analyticsData.statusDistribution.map((s: any) => (
              <View key={s.label} style={[s.statusCard, { backgroundColor: s.color + '12' }]}>
                <Text style={[s.statusCount, { color: s.color }]}>{s.count}</Text>
                <Text style={s.statusLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Today's stats */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Today</Text>
            <View style={s.statsGrid}>
              {todayStats.map((stat) => (
                <View key={stat.label} style={[s.statCard, { backgroundColor: '#FFF' }]}>
                  <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={s.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Quick Access */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Modules</Text>
            <View style={s.modulesGrid}>
              {MODULES.map((mod) => (
                <AnimatedPressable
                  key={mod.id}
                  portal="operations"
                  haptic="medium"
                  scaleTo={0.94}
                  onPress={() => router.push(`/(operations)/${mod.id}` as any)}
                  style={[s.moduleCard, { borderColor: '#F1F5F9' }]}
                >
                  <View style={[s.moduleIcon, { backgroundColor: mod.color + '12' }]}>
                    <IconSymbol name={mod.icon} size={20} color={mod.color} />
                  </View>
                  <Text style={s.moduleLabel}>{mod.label}</Text>
                </AnimatedPressable>
              ))}
            </View>
          </View>

          {/* Recent Activity */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Activity</Text>
            <View style={s.activityCard}>
              <Text style={s.activityEmpty}>No recent activity</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 },
  propertyName: { fontSize: 20, fontWeight: '700', color: DARK, letterSpacing: -0.3 },
  staffName: { fontSize: 12, color: '#94A3B8', marginTop: 2, textTransform: 'capitalize' },
  switchBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  statusRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 20 },
  statusCard: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  statusCount: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums' as any] },
  statusLabel: { fontSize: 9, fontWeight: '600', color: '#64748B', marginTop: 4, letterSpacing: 0.5, textTransform: 'uppercase' },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: DARK, marginBottom: 12, letterSpacing: -0.2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard: { width: '48%', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  statValue: { fontSize: 24, fontWeight: '800', fontVariant: ['tabular-nums' as any] },
  statLabel: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  modulesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moduleCard: { width: '31%', padding: 16, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, alignItems: 'center', gap: 8 },
  moduleIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  moduleLabel: { fontSize: 11, fontWeight: '600', color: DARK, textAlign: 'center' },
  activityCard: { padding: 20, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' },
  activityEmpty: { fontSize: 12, color: '#94A3B8' },
});
