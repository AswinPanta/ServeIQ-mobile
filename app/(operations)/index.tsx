import React, { useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/context/auth-context';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useHotelAnalyticsStore } from '@/stores/useHotelAnalyticsStore';
import { useActivityStore } from '@/stores/useActivityStore';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/constants/portal-theme';
import type { OperatorProfile } from '@/types/api';

/** Quick-access module cards */
const MODULES = [
  { id: 'front-desk', label: 'Front Desk', icon: 'front.desk' as const, desc: 'Check-in, check-out, bookings', color: '#2980B9' },
  { id: 'housekeeping', label: 'Housekeeping', icon: 'cleaning' as const, desc: 'Room cleaning tasks', color: '#16A085' },
  { id: 'pos', label: 'POS', icon: 'pos' as const, desc: 'Restaurant & orders', color: '#D35400' },
  { id: 'kds', label: 'KDS', icon: 'kds' as const, desc: 'Kitchen display system', color: '#8E44AD' },
  { id: 'analytics', label: 'Analytics', icon: 'analytics' as const, desc: 'Performance reports', color: '#2E86AB' },
];

const ACTIVITY_ICONS: Record<string, string> = {
  checkin: 'checkin',
  checkout: 'checkout',
  booking: 'booking',
  payment: 'payment',
  hk: 'cleaning',
  order: 'order',
  maintenance: 'room.maintenance',
  note: 'edit',
  email: 'email',
};

export default function OperationsDashboard() {
  const colors = useColors();
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
      { label: 'Arriving', value: bookingStatusCounts.arriving, icon: 'checkin' as const, color: '#2980B9' },
      { label: 'In House', value: bookingStatusCounts.inHouse, icon: 'hotel' as const, color: '#1E8449' },
      { label: 'Departing', value: bookingStatusCounts.departed, icon: 'checkout' as const, color: '#D35400' },
      { label: 'Occupancy', value: `${occupancyRate}%`, icon: 'occupancy' as const, color: '#8E44AD' },
    ];
  }, [analyticsData]);

  const recentActivity = useMemo(() => {
    const pid = operator?.property_id || 'prop-1';
    const today = new Date().toDateString();
    const todayActs = allActivities.filter(
      (a) => a.property_id === pid && new Date(a.createdAt).toDateString() === today
    );
    if (todayActs.length === 0) {
      return [
        { action: 'hk' as const, title: 'Housekeeping summary', subtitle: `${analyticsData.statusDistribution.find(s => s.label === 'Dirty')?.count || 0} dirty rooms need attention`, time: 'Today' },
        { action: 'booking' as const, title: `${analyticsData.bookingStatusCounts.arriving} arrivals today`, subtitle: `${analyticsData.bookingStatusCounts.inHouse} guests in house`, time: 'Today' },
      ];
    }
    return todayActs.slice(0, 6).map((a) => ({
      action: a.type as keyof typeof ACTIVITY_ICONS,
      title: a.title,
      subtitle: a.description || '',
      time: new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  }, [allActivities, analyticsData, operator?.property_id]);

  return (
    <ScreenContainer containerClassName="bg-background" className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACING.xxxl }}>
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={[styles.avatar, { backgroundColor: SRS.teal + '18' }]}>
              <IconSymbol name="person.fill" size={20} color={SRS.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.propertyName}>{operator?.property_name || 'Operations'}</Text>
              <Text style={styles.staffName}>{operator?.name || 'Staff'} · {operator?.role || 'front_desk'}</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.replace('/')}
              style={[styles.switchBtn, { backgroundColor: colors.border }]}
            >
              <Text style={styles.switchBtnText}>Switch</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Room Status ─── */}
        <View style={styles.section}>
          <View style={styles.statusRow}>
            {analyticsData.statusDistribution.map((s) => (
              <View key={s.label} style={[styles.statusCard, { backgroundColor: s.color + '12' }]}>
                <Text style={[styles.statusCount, { color: s.color }]}>{s.count}</Text>
                <Text style={styles.statusLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─── Today's Stats ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.statsGrid}>
            {todayStats.map((stat) => (
              <View key={stat.label} style={[styles.statCard, SHADOWS.card, { backgroundColor: colors.surface }]}>
                <View style={styles.statHeader}>
                  <View style={[styles.statIconWrap, { backgroundColor: stat.color + '14' }]}>
                    <IconSymbol name={stat.icon} size={16} color={stat.color} />
                  </View>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─── Quick Access ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.modulesGrid}>
            {MODULES.map((mod) => (
              <TouchableOpacity
                key={mod.id}
                onPress={() => router.push(`/(operations)/${mod.id}` as any)}
                style={[styles.moduleCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.card]}
                activeOpacity={0.8}
              >
                <View style={[styles.moduleIconWrap, { backgroundColor: mod.color + '14' }]}>
                  <IconSymbol name={mod.icon} size={24} color={mod.color} />
                </View>
                <Text style={styles.moduleLabel}>{mod.label}</Text>
                <Text style={styles.moduleDesc}>{mod.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ─── Recent Activity ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentActivity.map((item, i) => {
            const iconName = ACTIVITY_ICONS[item.action] || 'info';
            return (
              <View key={i} style={[styles.activityRow, { backgroundColor: colors.surface }, i < recentActivity.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : null]}>
                <View style={[styles.activityIcon, { backgroundColor: SRS.teal + '12' }]}>
                  <IconSymbol name={iconName as any} size={16} color={SRS.teal} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  {item.subtitle ? <Text style={styles.activitySub}>{item.subtitle}</Text> : null}
                </View>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyName: {
    ...TYPOGRAPHY.h2,
    color: SRS.navy,
  },
  staffName: {
    ...TYPOGRAPHY.small,
    color: '#6B7280',
    marginTop: 2,
    textTransform: 'capitalize' as const,
  },
  switchBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.button,
  },
  switchBtnText: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
    color: '#6B7280',
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: SRS.navy,
    marginBottom: SPACING.md,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statusCard: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.card,
    alignItems: 'center',
  },
  statusCount: {
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums' as any],
  },
  statusLabel: {
    ...TYPOGRAPHY.caption,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statCard: {
    width: '47%',
    padding: SPACING.lg,
    borderRadius: RADIUS.card,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    ...TYPOGRAPHY.small,
    color: '#6B7280',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums' as any],
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  moduleCard: {
    width: '47%',
    padding: SPACING.lg,
    borderRadius: RADIUS.card,
    borderWidth: 1,
  },
  moduleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  moduleLabel: {
    ...TYPOGRAPHY.subtitle,
    fontWeight: '700',
    color: SRS.navy,
  },
  moduleDesc: {
    ...TYPOGRAPHY.caption,
    color: '#6B7280',
    marginTop: 2,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  activityIcon: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: SRS.navy,
  },
  activitySub: {
    ...TYPOGRAPHY.small,
    color: '#6B7280',
    marginTop: 1,
  },
  activityTime: {
    ...TYPOGRAPHY.caption,
    color: '#9CA3AF',
  },
});
