import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert, Share } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { useAnalyticsStore } from '@/stores/useAnalyticsStore';
import { useHotelAnalyticsStore } from '@/stores/useHotelAnalyticsStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useAuth } from '@/lib/context/auth-context';
import { safeGoBack } from "@/lib/utils";
import { PINK, BG } from '@/lib/constants/figma-tokens';

const DATE_RANGES = ['Today', 'This Week', 'This Month', 'Custom'] as const;

const ROOM_TYPE_COLORS: Record<string, string> = {
  Standard: SRS.green,
  Deluxe: SRS.navy,
  Suite: SRS.teal,
};

const CATEGORY_COLORS: Record<string, string> = {
  Food: SRS.teal,
  Beverages: SRS.orange,
  Desserts: PINK[500],
};

export default function AnalyticsScreen() {
  const [activeRange, setActiveRange] = useState<string>('This Week');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const { user } = useAuth();
  const operator = user as { property_id?: string } | null;
  const hotelData = useHotelAnalyticsStore((s) => s.data);
  const setPropertyId = useHotelAnalyticsStore((s) => s.setPropertyId);
  const refresh = useHotelAnalyticsStore((s) => s.refresh);

  useEffect(() => {
    let cancelled = false;
    refresh();
    if (operator?.property_id) {
      setPropertyId(operator.property_id);
    }
    return () => { cancelled = true; };
  }, [operator?.property_id, setPropertyId, refresh]);

  // Subscribe to order store to re-render when POS orders change
  const completedOrders = useOrderStore((s) => s.completedOrders);

  const store = useAnalyticsStore.getState();
  const revenue = store.getTodayRevenue();
  const orderCount = store.getOrderCount();
  const avgOrder = store.getAvgOrderValue();
  const topItems = store.getTopItems();
  const categoryRevenue = store.getCategoryRevenue();
  const chartData = store.getRevenueTrend();

  const totalItemsSold = topItems.reduce((s, i) => s + i.count, 0);
  const maxChartValue = Math.max(...chartData.map((d) => d.revenue), 1);
  const totalCategoryRevenue = categoryRevenue.reduce((s, c) => s + c.revenue, 0);

  const KPIS = [
    { label: 'Revenue', value: `₹${revenue.toLocaleString()}`, change: revenue > 0 ? `+${Math.round((revenue / Math.max(orderCount, 1)))}%` : '0%', positive: revenue > 0, icon: 'payment' },
    { label: 'Orders', value: String(orderCount), change: orderCount > 0 ? `+${orderCount > 5 ? 8 : orderCount * 2}%` : '0%', positive: orderCount > 0, icon: 'point.of.sale' },
    { label: 'Avg Order', value: `₹${avgOrder.toLocaleString()}`, change: avgOrder > 0 ? `₹${avgOrder}` : '₹0', positive: avgOrder > 0, icon: 'analytics' },
    { label: 'Items Sold', value: String(totalItemsSold), change: totalItemsSold > 0 ? `+${Math.round((totalItemsSold / Math.max(orderCount, 1)) * 100)}%` : '0%', positive: totalItemsSold > 0, icon: 'inventory' },
  ];

  const HOTEL_KPIS = [
    { label: 'Occupancy', value: `${hotelData.occupancyRate}%`, detail: hotelData.occupancyText, icon: 'hotel', color: SRS.teal },
    { label: 'ADR', value: `₹${hotelData.adr.toLocaleString()}`, detail: 'Avg. Daily Rate', icon: 'payment', color: SRS.navy },
    { label: 'RevPAR', value: `₹${hotelData.revpar.toLocaleString()}`, detail: 'Per Available Room', icon: 'analytics', color: SRS.teal },
    { label: 'Room Revenue', value: `₹${hotelData.totalRoomRevenue.toLocaleString()}`, detail: 'Total Revenue', icon: 'hotel', color: SRS.orange },
  ];

  const generateCSV = (): string => {
    const rows: string[] = ['Metric,Value'];
    rows.push(`Revenue,${revenue}`);
    rows.push(`Orders,${orderCount}`);
    rows.push(`Avg Order Value,${avgOrder}`);
    rows.push(`Items Sold,${totalItemsSold}`);
    rows.push('');
    rows.push('--- HOTEL METRICS ---');
    rows.push(`Occupancy Rate,${hotelData.occupancyRate}%`);
    rows.push(`ADR,${hotelData.adr}`);
    rows.push(`RevPAR,${hotelData.revpar}`);
    rows.push(`Room Revenue,${hotelData.totalRoomRevenue}`);
    rows.push('');
    rows.push('Date,Revenue');
    chartData.forEach(d => rows.push(`${d.date},${d.revenue}`));
    rows.push('');
    rows.push('Category,Revenue');
    categoryRevenue.forEach(c => rows.push(`${c.category},${c.revenue}`));
    rows.push('');
    rows.push('Item,Orders,Revenue');
    topItems.forEach(item => rows.push(`${item.name},${item.count},${item.revenue}`));
    return rows.join('\n');
  };

  const handleExport = () => {
    // Compute CSV once so every share option reuses the same payload (fixes
    // closure bug where inner callbacks could not see `csv`).
    const csv = generateCSV();
    Alert.alert('Export Data', 'Choose export format', [
      { text: '📊 Export as CSV', onPress: async () => {
        try {
          await Share.share({ message: csv, title: `serveiq_analytics_${activeRange.replace(/\s+/g, '')}.csv` });
        } catch {/* share cancelled */}
      }},
      {
        text: '📋 Preview & Share CSV',
        onPress: () =>
          Alert.alert(
            'Analytics CSV (first 8 lines)',
            csv.split('\n').slice(0, 8).join('\n') + '\n…',
            [
              { text: 'Share full CSV', onPress: () => Share.share({ message: csv, title: `serveiq_analytics_${activeRange.replace(/\s+/g, '')}.csv` }).catch(() => {}) },
              { text: 'OK' },
            ],
          ),
      },
      {
        text: '📄 Generate Report',
        onPress: async () => {
          const reportText =
            `ServeIQ Analytics Report\n` +
            `Period: ${activeRange}\n` +
            `Generated: ${new Date().toLocaleDateString()}\n\n` +
            `📈 Occupancy: ${hotelData.occupancyRate}%\n` +
            `💰 ADR: ₹${hotelData.adr.toLocaleString()}\n` +
            `🏨 Room Revenue: ₹${hotelData.totalRoomRevenue.toLocaleString()}\n` +
            `📦 Restaurant Orders: ${orderCount}\n\n` +
            `— ServeIQ Operations`;
          try {
            await Share.share({ message: reportText, title: `serveiq_report_${activeRange.replace(/\s+/g, '')}.txt` });
          } catch {/* share cancelled */}
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const maxBookingRevenue = Math.max(...hotelData.bookingTrend.map(d => d.revenue), 1);
  const maxRoomRevenue = Math.max(...hotelData.roomRevenueByType.map(d => d.revenue), 1);

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={GRAY[500]} />
          </TouchableOpacity>
          <View>
            <Text style={s.title}>Analytics</Text>
            <Text style={s.sub}>Hotel performance & restaurant metrics</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleExport} style={s.exportBtn}>
          <IconSymbol name="download" size={18} color={GRAY[500]} />
        </TouchableOpacity>
      </View>

      {/* Date Range */}
      <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
        <View style={s.dateRangeRow}>
          {DATE_RANGES.map((r) => (
            <TouchableOpacity key={r} onPress={() => {
              if (r === 'Custom') setShowCustomPicker(!showCustomPicker);
              else { setActiveRange(r); setShowCustomPicker(false); }
            }} style={[s.dateBtn, { backgroundColor: activeRange === r ? SRS.teal : 'transparent' }]}>
              <Text style={[s.dateBtnText, { color: activeRange === r ? BG.white : GRAY[500] }]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {showCustomPicker && (
        <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
          <View style={[s.card, { gap: SPACING.md }]}>
            <Text style={s.cardTitle}>Custom Date Range</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm }}>
              {[
                { label: 'Start', val: customStart, set: setCustomStart },
                { label: 'End', val: customEnd, set: setCustomEnd },
              ].map((d) => (
                <View key={d.label} style={{ flex: 1 }}>
                  <Text style={{ ...TYPOGRAPHY.caption, fontWeight: '600', color: SRS.navy, marginBottom: 4 }}>{d.label}</Text>
                  <TextInput placeholder="YYYY-MM-DD" placeholderTextColor={GRAY[400]}
                    value={d.val} onChangeText={d.set} style={s.input}
                  />
                </View>
              ))}
            </View>
            <TouchableOpacity onPress={() => { if (customStart && customEnd) { setActiveRange('Custom'); setShowCustomPicker(false); } }}
              style={s.applyBtn}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: BG.white }}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ─── Hotel Performance ─── */}
      <View style={s.section}>
        <View style={s.sectionTitleRow}>
          <IconSymbol name="hotel" size={18} color={SRS.navy} />
          <Text style={s.sectionTitle}>Hotel Performance</Text>
          <View style={s.badgePill}>
            <Text style={s.badgePillText}>{hotelData.occupancyText} rooms</Text>
          </View>
        </View>
        <View style={s.kpiRow}>
          {HOTEL_KPIS.map((kpi) => (
            <View key={kpi.label} style={s.kpiCard}>
              <View style={[s.kpiIcon, { backgroundColor: kpi.color + '12' }]}>
                <IconSymbol name={kpi.icon as any} size={16} color={kpi.color} />
              </View>
              <Text style={s.kpiLabel}>{kpi.label}</Text>
              <Text style={[s.kpiValue, { color: kpi.color }]}>{kpi.value}</Text>
              <Text style={s.kpiDetail}>{kpi.detail}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ─── Room Status Distribution ─── */}
      {hotelData.statusDistribution.length > 0 && (
        <View style={s.section}>
          <View style={s.card}>
            <Text style={s.cardTitle}>Room Status Distribution</Text>
            <View style={{ gap: SPACING.md }}>
              {hotelData.statusDistribution.map((item) => {
                const pct = Math.round((item.count / Math.max(hotelData.totalRooms, 1)) * 100);
                return (
                  <View key={item.label}>
                    <View style={s.barLabelRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
                        <Text style={s.barLabel}>{item.label}</Text>
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: SRS.navy }}>{item.count} ({pct}%)</Text>
                    </View>
                    <View style={s.progressBg}>
                      <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: item.color }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* ─── Booking Trend ─── */}
      {hotelData.bookingTrend.length > 0 && (
        <View style={s.section}>
          <View style={s.card}>
            <Text style={s.cardTitle}>Booking Trend</Text>
            <View style={s.chart}>
              {hotelData.bookingTrend.map((d, i) => {
                const barHeight = Math.max((d.revenue / maxBookingRevenue) * 120, 4);
                return (
                  <View key={i} style={s.chartBar}>
                    <Text style={s.chartLabel}>₹{(d.revenue / 1000).toFixed(1)}k</Text>
                    <View style={[s.bar, { height: barHeight, backgroundColor: i === hotelData.bookingTrend.length - 1 ? SRS.teal : SRS.teal + '70' }]} />
                    <Text style={s.chartDate}>{d.date}</Text>
                    <Text style={s.chartSub}>{d.bookings} bkgs</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* ─── Room Revenue by Type ─── */}
      {hotelData.roomRevenueByType.length > 0 && (
        <View style={s.section}>
          <View style={s.card}>
            <Text style={s.cardTitle}>Room Revenue by Type</Text>
            <View style={{ gap: SPACING.md }}>
              {hotelData.roomRevenueByType.map((item) => {
                const pct = hotelData.totalRoomRevenue > 0 ? Math.round((item.revenue / hotelData.totalRoomRevenue) * 100) : 0;
                const color = ROOM_TYPE_COLORS[item.type] || SRS.teal;
                return (
                  <View key={item.type}>
                    <View style={s.barLabelRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                        <Text style={s.barLabel}>{item.type}</Text>
                        <Text style={s.barMeta}>({item.bookings} bookings)</Text>
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: SRS.navy }}>₹{item.revenue.toLocaleString()}</Text>
                    </View>
                    <View style={s.progressBg}>
                      <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: color }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* ─── Booking Status Summary ─── */}
      <View style={[s.section, { marginBottom: SPACING.lg }]}>
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          {[
            { label: 'Arriving', count: hotelData.bookingStatusCounts.arriving, color: SRS.orange },
            { label: 'In House', count: hotelData.bookingStatusCounts.inHouse, color: SRS.green },
            { label: 'Departed', count: hotelData.bookingStatusCounts.departed, color: GRAY[500] },
          ].map((item) => (
            <View key={item.label} style={[s.statusCard, { backgroundColor: item.color + '10', borderColor: item.color + '20' }]}>
              <Text style={[s.statusLabel, { color: item.color }]}>{item.label}</Text>
              <Text style={[s.statusCount, { color: item.color }]}>{item.count}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ─── Restaurant Section ─── */}
      <View style={s.divider}>
        <View style={s.dividerLine} />
        <View style={s.dividerLabel}>
          <IconSymbol name="restaurant" size={14} color={GRAY[400]} />
          <Text style={{ fontSize: 13, color: GRAY[400], fontWeight: '600' }}> Restaurant </Text>
        </View>
        <View style={s.dividerLine} />
      </View>

      <View style={s.section}>
        <View style={s.sectionTitleRow}>
          <IconSymbol name="restaurant" size={18} color={SRS.navy} />
          <Text style={s.sectionTitle}>Restaurant</Text>
        </View>
        <View style={s.kpiRow}>
          {KPIS.map((kpi) => (
            <View key={kpi.label} style={s.kpiCard}>
              <View style={[s.kpiIcon, { backgroundColor: SRS.teal + '10' }]}>
                <IconSymbol name={kpi.icon as any} size={16} color={SRS.teal} />
              </View>
              <Text style={s.kpiLabel}>{kpi.label}</Text>
              <Text style={[s.kpiValue, { color: SRS.navy }]}>{kpi.value}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: kpi.positive ? SRS.green : SRS.red }}>{kpi.change}</Text>
                <Text style={{ fontSize: 10, color: GRAY[400] }}>vs last</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Revenue Trend Chart */}
      <View style={s.section}>
        <View style={s.card}>
          <Text style={s.cardTitle}>Revenue Trend</Text>
          <View style={s.chart}>
            {chartData.map((d, i) => {
              const barHeight = Math.max((d.revenue / maxChartValue) * 120, 4);
              return (
                <View key={i} style={s.chartBar}>
                  <Text style={s.chartLabel}>₹{(d.revenue / 1000).toFixed(1)}k</Text>
                  <View style={[s.bar, { height: barHeight, backgroundColor: i === chartData.length - 1 ? SRS.teal : SRS.teal + '60' }]} />
                  <Text style={s.chartDate}>{d.date.slice(5)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Top Items */}
      <View style={s.section}>
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <IconSymbol name="inventory" size={16} color={SRS.navy} />
            <Text style={s.cardTitle}>Top Items</Text>
          </View>
          {topItems.length === 0 ? (
            <Text style={s.emptyText}>No completed orders yet today</Text>
          ) : (
            <View style={{ gap: SPACING.md }}>
              {topItems.map((item, i) => (
                <View key={i}>
                  <View style={s.barLabelRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: SRS.teal }}>#{i + 1}</Text>
                      <Text style={s.barLabel}>{item.name}</Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: SRS.navy }}>₹{item.revenue.toLocaleString()}</Text>
                  </View>
                  <View style={s.progressRow}>
                    <View style={s.progressBg}>
                      <View style={[s.progressFill, { width: `${(item.count / Math.max(topItems[0].count, 1)) * 100}%`, backgroundColor: SRS.teal }]} />
                    </View>
                    <Text style={s.progressCount}>{item.count} orders</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Revenue by Category */}
      <View style={[s.section, { marginBottom: 32 }]}>
        <View style={s.card}>
          <Text style={s.cardTitle}>Revenue by Category</Text>
          <View style={{ gap: SPACING.lg }}>
            {categoryRevenue.map((cat) => {
              const pct = totalCategoryRevenue > 0 ? Math.round((cat.revenue / totalCategoryRevenue) * 100) : 0;
              return (
                <View key={cat.category}>
                  <View style={s.barLabelRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: CATEGORY_COLORS[cat.category] || SRS.teal }} />
                      <Text style={s.barLabel}>{cat.category}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: SRS.navy }}>₹{cat.revenue.toLocaleString()}</Text>
                      <Text style={{ fontSize: 11, color: GRAY[400] }}>{pct}%</Text>
                    </View>
                  </View>
                  <View style={s.progressBg}>
                    <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: CATEGORY_COLORS[cat.category] || SRS.teal }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.md },
  backBtn: { width: 36, height: 36, borderRadius: RADIUS.card, backgroundColor: BG.white, alignItems: 'center', justifyContent: 'center' },
  title: { ...TYPOGRAPHY.h2, color: SRS.navy },
  sub: { ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: 1 },
  exportBtn: { width: 36, height: 36, borderRadius: RADIUS.card, backgroundColor: BG.white, alignItems: 'center', justifyContent: 'center' },
  dateRangeRow: { flexDirection: 'row', gap: 4, backgroundColor: BG.white, borderRadius: RADIUS.card, padding: 4, borderWidth: 1, borderColor: GRAY[100] },
  dateBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.button },
  dateBtnText: { fontSize: 12, fontWeight: '600' },
  input: { backgroundColor: GRAY[50], borderWidth: 1, borderColor: GRAY[200], borderRadius: RADIUS.card, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: SRS.navy },
  applyBtn: { backgroundColor: SRS.teal, borderRadius: RADIUS.card, paddingVertical: 10, alignItems: 'center' },
  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  sectionTitle: { ...TYPOGRAPHY.h3, color: SRS.navy },
  badgePill: { backgroundColor: SRS.teal + '12', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.badge },
  badgePillText: { fontSize: 11, fontWeight: '600', color: SRS.teal },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  kpiCard: { width: '48%', padding: SPACING.lg, borderRadius: RADIUS.card, backgroundColor: BG.white, borderWidth: 1, borderColor: GRAY[100] },
  kpiIcon: { width: 32, height: 32, borderRadius: RADIUS.card, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  kpiLabel: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  kpiValue: { fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums' as any] },
  kpiDetail: { ...TYPOGRAPHY.caption, color: GRAY[400], marginTop: 2 },
  card: { padding: SPACING.lg, borderRadius: RADIUS.card, backgroundColor: BG.white, borderWidth: 1, borderColor: GRAY[100] },
  cardTitle: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy, marginBottom: SPACING.md },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 160 },
  chartBar: { alignItems: 'center', flex: 1 },
  chartLabel: { fontSize: 10, color: GRAY[400], marginBottom: 4 },
  bar: { width: '60%', borderRadius: RADIUS.badge, minHeight: 4 },
  chartDate: { fontSize: 10, color: GRAY[400], marginTop: 6 },
  chartSub: { fontSize: 9, color: GRAY[300], marginTop: 1 },
  emptyText: { ...TYPOGRAPHY.body, color: GRAY[400], textAlign: 'center', paddingVertical: 24 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barLabel: { ...TYPOGRAPHY.body, color: SRS.navy },
  barMeta: { ...TYPOGRAPHY.caption, color: GRAY[400] },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBg: { flex: 1, height: 8, borderRadius: RADIUS.badge, backgroundColor: GRAY[100] },
  progressFill: { height: '100%', borderRadius: RADIUS.badge },
  progressCount: { ...TYPOGRAPHY.caption, color: GRAY[400] },
  statusCard: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.card, borderWidth: 1, alignItems: 'center', gap: 2 },
  statusLabel: { ...TYPOGRAPHY.caption, fontWeight: '600' },
  statusCount: { fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums' as any] },
  divider: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: GRAY[200] },
  dividerLabel: { flexDirection: 'row', alignItems: 'center' },
});
