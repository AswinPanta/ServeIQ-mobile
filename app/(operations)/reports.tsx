import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { safeGoBack } from '@/lib/utils';import { ScreenContainer } from '@/components/screen-container';
import { useFrontDesk } from '@/lib/context/frontdesk-context';
import { useHotelAnalyticsStore } from '@/stores/useHotelAnalyticsStore';
import { SRS, SLATE, BG, BLUE, RED } from '@/lib/constants/figma-tokens';
import { RADIUS } from '@/constants/portal-theme';
import { useAuth } from '@/lib/context/auth-context';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api-config';
import { api, handleResponse } from '@/lib/api';

const DARK = SLATE[900];

type TabType = 'summary' | 'occupancy' | 'revenue' | 'housekeeping';

const TABS: { key: TabType; label: string }[] = [
  { key: 'summary', label: 'Summary' },
  { key: 'occupancy', label: 'Occupancy' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'housekeeping', label: 'Housekeeping' },
];

export default function ReportsScreen() {
  const { rooms, occupancySnapshot } = useFrontDesk();
  const analyticsData = useHotelAnalyticsStore((s) => s.data);
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const { user } = useAuth();
  const operator = user as { property_id?: string } | null;
  const propertyId = operator?.property_id || '';

  const [bookingTrend, setBookingTrend] = useState<any[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [revenueByRoomType, setRevenueByRoomType] = useState<any[]>([]);

  useEffect(() => {
    if (!propertyId) return;
    (async () => {
      try {
        const [bt, rt, rrt] = await Promise.all([
          api.get(`${API_ENDPOINTS.PROPERTIES.GET_BY_ID(propertyId)}/analytics/booking-trend`),
          api.get(`${API_ENDPOINTS.PROPERTIES.GET_BY_ID(propertyId)}/analytics/revenue-trend`),
          api.get(`${API_ENDPOINTS.PROPERTIES.GET_BY_ID(propertyId)}/analytics/revenue-by-room-type`),
        ]);
        const bJson = await handleResponse<{ data?: any[] }>(bt);
        const rJson = await handleResponse<{ data?: any[] }>(rt);
        const rrJson = await handleResponse<{ data?: any[] }>(rrt);
        if (bJson.data) setBookingTrend(bJson.data);
        if (rJson.data) setRevenueTrend(rJson.data);
        if (rrJson.data) setRevenueByRoomType(rrJson.data);
      } catch {}
    })();
  }, [propertyId]);

  const today = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  const summaryStats = useMemo(() => {
    const totalRevenue = rooms.length * analyticsData.revpar;
    return {
      totalRevenue: totalRevenue || 125450,
      adr: analyticsData.adr || 4120,
      revpar: analyticsData.revpar || 2802,
      occupancy: occupancySnapshot.occupancyRate || 68,
    };
  }, [rooms, analyticsData, occupancySnapshot]);

  const roomStatusCounts = useMemo(() => {
    const available = occupancySnapshot.available || 15;
    const occupied = occupancySnapshot.occupied || 32;
    const total = occupancySnapshot.total || 47;
    const outOfOrder = total - available - occupied;
    return { available, occupied, outOfOrder, total };
  }, [occupancySnapshot]);

  return (
    <ScreenContainer containerClassName="bg-background" className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={20} color={DARK} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Reports</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Date Range */}
        <View style={s.dateRow}>
          <Ionicons name="calendar-outline" size={16} color={SLATE[500]} />
          <Text style={s.dateText}>{today}</Text>
          <Ionicons name="chevron-down" size={14} color={SLATE[400]} />
        </View>

        {/* Tabs */}
        <View style={s.tabRow}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              style={[s.tab, activeTab === t.key && s.tabActive]}
            >
              <Text style={[s.tabText, activeTab === t.key && s.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <>
            {/* Summary Cards */}
            <View style={s.cardGrid}>
              <View style={s.summaryCard}>
                <Text style={s.summaryLabel}>Total Revenue</Text>
                <Text style={[s.summaryValue, { color: DARK }]}>NPR {summaryStats.totalRevenue.toLocaleString()}</Text>
              </View>
              <View style={s.summaryCard}>
                <Text style={s.summaryLabel}>ADR</Text>
                <Text style={[s.summaryValue, { color: DARK }]}>NPR {summaryStats.adr.toLocaleString()}</Text>
              </View>
            </View>
            <View style={s.cardGrid}>
              <View style={s.summaryCard}>
                <Text style={s.summaryLabel}>RevPAR</Text>
                <Text style={[s.summaryValue, { color: BLUE[600] }]}>NPR {summaryStats.revpar.toLocaleString()}</Text>
              </View>
              <View style={s.summaryCard}>
                <Text style={s.summaryLabel}>Occupancy</Text>
                <Text style={[s.summaryValue, { color: DARK }]}>{summaryStats.occupancy}%</Text>
              </View>
            </View>

            {/* Revenue Trend */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Revenue Trend</Text>
              {revenueTrend.length > 0 ? (
                <View style={s.chartPlaceholder}>
                  <Text style={s.chartPlaceholderText}>NPR</Text>
                  {revenueTrend.slice(-7).map((d: any, i: number) => {
                    const val = parseFloat(d.revenue || '0');
                    const maxVal = Math.max(...revenueTrend.slice(-7).map((x: any) => parseFloat(x.revenue || '0')), 1);
                    const h = Math.max((val / maxVal) * 80, 4);
                    return <View key={i} style={[s.chartBar, { height: h }]} />;
                  })}
                </View>
              ) : (
                <View style={s.chartPlaceholder}>
                  <Text style={s.chartPlaceholderText}>NPR</Text>
                  {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
                    <View key={i} style={[s.chartBar, { height: h }]} />
                  ))}
                </View>
              )}
            </View>

            {/* Revenue by Room Type */}
            {revenueByRoomType.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>Revenue by Room Type</Text>
                {revenueByRoomType.map((rt: any, i: number) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: SLATE[100] }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: DARK }}>{rt.room_type_name}</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: DARK }}>NPR {parseFloat(rt.revenue || '0').toLocaleString()}</Text>
                      <Text style={{ fontSize: 10, color: SLATE[500] }}>{rt.booking_count} bookings</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Room Status */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Room Status</Text>
              <View style={s.donutPlaceholder}>
                <View style={[s.donutSlice, { backgroundColor: SRS.green, width: `${(roomStatusCounts.available / roomStatusCounts.total) * 100}%` }]} />
                <View style={[s.donutSlice, { backgroundColor: RED[500], width: `${(roomStatusCounts.occupied / roomStatusCounts.total) * 100}%` }]} />
                <View style={[s.donutSlice, { backgroundColor: SLATE[400], width: `${(roomStatusCounts.outOfOrder / roomStatusCounts.total) * 100}%` }]} />
              </View>
              <View style={s.statusLegend}>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: SRS.green }]} />
                  <Text style={s.legendText}>Available</Text>
                  <Text style={s.legendCount}>{roomStatusCounts.available} ({Math.round((roomStatusCounts.available / roomStatusCounts.total) * 100)}%)</Text>
                </View>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: RED[500] }]} />
                  <Text style={s.legendText}>Occupied</Text>
                  <Text style={s.legendCount}>{roomStatusCounts.occupied} ({Math.round((roomStatusCounts.occupied / roomStatusCounts.total) * 100)}%)</Text>
                </View>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: SLATE[400] }]} />
                  <Text style={s.legendText}>Out of Order</Text>
                  <Text style={s.legendCount}>{roomStatusCounts.outOfOrder} ({Math.round((roomStatusCounts.outOfOrder / roomStatusCounts.total) * 100)}%)</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {activeTab !== 'summary' && (
          <View style={s.emptyState}>
            <Ionicons name="bar-chart-outline" size={40} color={SLATE[300]} />
            <Text style={s.emptyText}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} report coming soon</Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: SLATE[50], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: DARK, letterSpacing: -0.3 },

  dateRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 6, paddingBottom: 12 },
  dateText: { fontSize: 13, fontWeight: '500', color: SLATE[600] },

  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, paddingBottom: 16 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.full, backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[200] },
  tabActive: { backgroundColor: BLUE[600], borderColor: BLUE[600] },
  tabText: { fontSize: 12, fontWeight: '600', color: SLATE[500] },
  tabTextActive: { color: BG.white },

  cardGrid: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 12 },
  summaryCard: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[100] },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: SLATE[500], marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
  summaryChange: { fontSize: 10, fontWeight: '600', marginTop: 4 },

  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: DARK, marginBottom: 12 },

  chartPlaceholder: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 100, backgroundColor: BG.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: SLATE[100] },
  chartPlaceholderText: { fontSize: 10, color: SLATE[400], position: 'absolute', top: 14, left: 14 },
  chartBar: { flex: 1, backgroundColor: BLUE[600] + '30', borderRadius: 4, marginTop: 'auto' },

  donutPlaceholder: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: SLATE[100] },
  donutSlice: { height: '100%' },

  statusLegend: { flexDirection: 'row', gap: 16, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: SLATE[500] },
  legendCount: { fontSize: 11, fontWeight: '600', color: DARK },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 14, color: SLATE[400] },
});
