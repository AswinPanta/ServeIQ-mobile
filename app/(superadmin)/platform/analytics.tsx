import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { safeGoBack } from "@/lib/utils";

const ACCENT = '#7C3AED';
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} contentInsetAdjustmentBehavior="automatic">
        <View style={s.header}>
          <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={ACCENT} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Platform Analytics</Text>
        </View>

        {/* Date Range */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={s.filterRow}>
            {DATE_RANGES.map(r => (
              <TouchableOpacity key={r} onPress={() => setRange(r)}
                style={[s.filterChip, range === r && s.filterActive]}>
                <Text style={[s.filterText, range === r && s.filterTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* KPI Cards */}
        <View style={s.kpiRow}>
          {KPIS.map(kpi => (
            <View key={kpi.label} style={[s.kpiCard, { borderLeftColor: kpi.color }]}>
              <Text style={s.kpiValue}>{kpi.value}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Text style={[s.kpiChange, { color: kpi.up ? '#10B981' : '#EF4444' }]}>{kpi.change}</Text>
                <Text style={{ fontSize: 11, color: kpi.up ? '#10B981' : '#EF4444' }}>{kpi.up ? '↑' : '↓'}</Text>
              </View>
              <Text style={s.kpiLabel}>{kpi.label}</Text>
            </View>
          ))}
        </View>

        {/* Revenue Chart */}
        <View style={s.chartCard}>
          <Text style={s.chartTitle}>Revenue (NPR Lakhs)</Text>
          <View style={s.chartRow}>
            {MONTHLY_DATA.map(d => (
              <View key={d.month} style={s.chartCol}>
                <Text style={s.chartVal}>{d.revenue.toFixed(1)}</Text>
                <View style={[s.chartBar, { height: (d.revenue / maxRevenue) * 100, backgroundColor: ACCENT }]} />
                <Text style={s.chartLabel}>{d.month}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bookings Chart */}
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

        {/* Top Properties */}
        <View style={s.listCard}>
          <Text style={s.chartTitle}>Top 5 Properties</Text>
          {TOP_PROPERTIES.map((p, i) => (
            <View key={p.name} style={[s.propertyRow, i < TOP_PROPERTIES.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }]}>
              <View style={[s.rankBadge, { backgroundColor: ACCENT + '12' }]}>
                <Text style={[s.rankText, { color: ACCENT }]}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.propertyName}>{p.name}</Text>
                <Text style={s.propertyOwner}>{p.owner}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 20, paddingTop: 8, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A', flex: 1 },
  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F1F5F9' },
  filterActive: { backgroundColor: ACCENT },
  filterText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  filterTextActive: { color: '#FFF' },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: { width: '47%', padding: 14, borderRadius: 14, backgroundColor: '#FFF', borderLeftWidth: 4, borderWidth: 1, borderColor: '#F1F5F9' },
  kpiValue: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  kpiChange: { fontSize: 12, fontWeight: '700' },
  kpiLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  chartCard: { padding: 18, borderRadius: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9' },
  chartTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 16 },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 130, paddingTop: 8 },
  chartCol: { alignItems: 'center', flex: 1 },
  chartVal: { fontSize: 11, color: '#64748B', marginBottom: 4 },
  chartBar: { width: '55%', borderRadius: 6 },
  chartLabel: { fontSize: 11, color: '#64748B', marginTop: 4 },
  listCard: { padding: 18, borderRadius: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9' },
  propertyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  rankBadge: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 12, fontWeight: '700' },
  propertyName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  propertyOwner: { fontSize: 12, color: '#64748B', marginTop: 1 },
  propertyRevenue: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  propertyBookings: { fontSize: 12, color: '#64748B' },
});
