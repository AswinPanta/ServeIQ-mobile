import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';

const SUPERADMIN = '#8E44AD';
const DATE_RANGES = ['Today', 'Week', 'Month', 'Custom'] as const;

const KPIS = [
  { label: 'Total Revenue', value: 'NPR 4.8M', change: '+15.2%', up: true, color: '#10B981' },
  { label: 'Active Tenants', value: '24', change: '+3', up: true, color: '#3B82F6' },
  { label: 'Total Bookings', value: '1,892', change: '+8.7%', up: true, color: '#F59E0B' },
  { label: 'Avg Occupancy', value: '72%', change: '-2.1%', up: false, color: '#EF4444' },
];

const MONTHLY_DATA = [
  { month: 'Jan', revenue: 3.2, bookings: 120 },
  { month: 'Feb', revenue: 2.8, bookings: 98 },
  { month: 'Mar', revenue: 3.9, bookings: 145 },
  { month: 'Apr', revenue: 4.1, bookings: 162 },
  { month: 'May', revenue: 4.5, bookings: 180 },
  { month: 'Jun', revenue: 4.8, bookings: 195 },
];

const TOP_PROPERTIES = [
  { name: 'Himalayan Deluxe Suite', revenue: 320000, bookings: 48, owner: 'Himalayan Heights Hotels' },
  { name: 'Pokhara Lake View Room', revenue: 245000, bookings: 36, owner: 'Pokhara Lake Resort' },
  { name: 'Everest Panorama Suite', revenue: 198000, bookings: 29, owner: 'Everest Base Camp Lodges' },
  { name: 'Lumbini Garden Villa', revenue: 156000, bookings: 24, owner: 'Lumbini Garden Hotel' },
  { name: 'Thamel Boutique Room', revenue: 132000, bookings: 21, owner: 'Himalayan Heights Hotels' },
];

export default function AnalyticsScreen() {
  const [range, setRange] = useState<string>('Month');
  const maxRevenue = Math.max(...MONTHLY_DATA.map(d => d.revenue));
  const maxBookings = Math.max(...MONTHLY_DATA.map(d => d.bookings));

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={SUPERADMIN} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Platform Analytics</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={s.filterRow}>
            {DATE_RANGES.map(r => (
              <TouchableOpacity key={r} onPress={() => setRange(r)}
                style={[s.filterChip, { backgroundColor: range === r ? SUPERADMIN : GRAY[100] }]}>
                <Text style={[s.filterText, { color: range === r ? '#FFF' : GRAY[500] }]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={s.kpiRow}>
          {KPIS.map(kpi => (
            <View key={kpi.label} style={[s.kpiCard, { borderLeftColor: kpi.color }]}>
              <Text style={s.kpiValue}>{kpi.value}</Text>
              <View style={s.kpiChangeRow}>
                <Text style={[s.kpiChange, { color: kpi.up ? '#10B981' : '#EF4444' }]}>{kpi.change}</Text>
                <Text style={{ fontSize: 12, color: kpi.up ? '#10B981' : '#EF4444' }}>{kpi.up ? '↑' : '↓'}</Text>
              </View>
              <Text style={s.kpiLabel}>{kpi.label}</Text>
            </View>
          ))}
        </View>

        <View style={s.chartCard}>
          <Text style={s.chartTitle}>Revenue (NPR Lakhs)</Text>
          <View style={s.chartRow}>
            {MONTHLY_DATA.map(d => (
              <View key={d.month} style={s.chartCol}>
                <Text style={s.chartVal}>{d.revenue.toFixed(1)}</Text>
                <View style={[s.chartBar, { height: (d.revenue / maxRevenue) * 100, backgroundColor: SUPERADMIN }]} />
                <Text style={s.chartLabel}>{d.month}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.chartCard}>
          <Text style={s.chartTitle}>Bookings</Text>
          <View style={s.chartRow}>
            {MONTHLY_DATA.map(d => (
              <View key={d.month} style={s.chartCol}>
                <Text style={s.chartVal}>{d.bookings}</Text>
                <View style={[s.chartBar, { height: (d.bookings / maxBookings) * 100, backgroundColor: '#3B82F6' }]} />
                <Text style={s.chartLabel}>{d.month}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.listCard}>
          <Text style={s.chartTitle}>Top 5 Properties</Text>
          {TOP_PROPERTIES.map((p, i) => (
            <View key={p.name} style={[s.propertyRow, i < TOP_PROPERTIES.length - 1 && { borderBottomWidth: 1, borderBottomColor: GRAY[100] }]}>
              <View style={[s.rankBadge, { backgroundColor: SUPERADMIN + '18' }]}>
                <Text style={[s.rankText, { color: SUPERADMIN }]}>{i + 1}</Text>
              </View>
              <View style={s.propertyInfo}>
                <Text style={s.propertyName}>{p.name}</Text>
                <Text style={s.propertyOwner}>{p.owner}</Text>
              </View>
              <View style={s.propertyStats}>
                <Text style={s.propertyRevenue}>NPR {p.revenue.toLocaleString()}</Text>
                <Text style={s.propertyBookings}>{p.bookings} bookings</Text>
              </View>
            </View>
          ))}
        </View>
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
  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 18, paddingVertical: 14, borderRadius: 20 },
  filterText: { ...TYPOGRAPHY.body, fontWeight: '600' },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpiCard: { width: '47%', padding: SPACING.lg, borderRadius: 16, backgroundColor: '#FFF', borderLeftWidth: 4, ...SHADOWS.card },
  kpiValue: { ...TYPOGRAPHY.h3, fontWeight: '700', color: SRS.navy },
  kpiChangeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  kpiChange: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  kpiLabel: { ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: 4 },
  chartCard: { padding: 20, borderRadius: 20, backgroundColor: '#FFF', ...SHADOWS.card },
  chartTitle: { ...TYPOGRAPHY.h3, fontWeight: '700', color: SRS.navy, marginBottom: SPACING.lg },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 140, paddingTop: 10 },
  chartCol: { alignItems: 'center', flex: 1 },
  chartVal: { ...TYPOGRAPHY.caption, color: GRAY[500], marginBottom: 4 },
  chartBar: { width: '60%', borderRadius: 6 },
  chartLabel: { ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: 4 },
  listCard: { padding: 20, borderRadius: 20, backgroundColor: '#FFF', ...SHADOWS.card },
  propertyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  rankBadge: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rankText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  propertyInfo: { flex: 1 },
  propertyName: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy },
  propertyOwner: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  propertyStats: { alignItems: 'flex-end' },
  propertyRevenue: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy },
  propertyBookings: { ...TYPOGRAPHY.caption, color: GRAY[500] },
});
