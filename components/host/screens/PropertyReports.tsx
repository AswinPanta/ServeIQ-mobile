import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import type { Property } from '@/types/api';
import { useHost } from '@/lib/context/host-context';
import { useBookings } from '@/lib/context/booking-context';
import { hostApi } from '@/lib/api/host-api';
import { GRAY, TYPOGRAPHY, RADIUS } from '@/constants/portal-theme';
import { STATUS, BLUE, BG, BRAND, AMBER } from '@/lib/constants/figma-tokens';
import type {
  AnalyticsOverview, AnalyticsTrendPoint, AnalyticsBookingPoint, AnalyticsRoomTypeRevenue,
} from '@/types/api';

interface Props { property: Property }

const screenWidth = Dimensions.get('window').width - 64;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function PropertyReports({ property }: Props) {
  const { getFilteredBookings } = useHost();
  const { bookings: guestBookings } = useBookings();
  const hostBookings = getFilteredBookings(property.id);

  // Live analytics from GET /properties/{id}/analytics* — the client-side math
  // below stays as fallback for mock/seed properties (non-UUID ids) and API failures.
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [revTrend, setRevTrend] = useState<AnalyticsTrendPoint[]>([]);
  const [bookingTrend, setBookingTrend] = useState<AnalyticsBookingPoint[]>([]);
  const [roomTypeRevenue, setRoomTypeRevenue] = useState<AnalyticsRoomTypeRevenue[]>([]);

  useEffect(() => {
    if (!UUID_RE.test(property.id)) return;
    let cancelled = false;
    Promise.all([
      hostApi.getAnalyticsOverview(property.id),
      hostApi.getAnalyticsRevenueTrend(property.id, 7),
      hostApi.getAnalyticsBookingTrend(property.id, 7),
      hostApi.getAnalyticsRevenueByRoomType(property.id, 30),
    ])
      .then(([ov, rev, book, byType]) => {
        if (cancelled) return;
        if (ov) setOverview(ov);
        if (rev.length > 0) setRevTrend(rev);
        if (book.length > 0) setBookingTrend(book);
        if (byType.length > 0) setRoomTypeRevenue(byType);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [property.id]);

  // Merge every booking source that belongs to this property into one list.
  // Host bookings live in host-context; guest bookings live in booking-context
  // (keyed by hotelId). Without this merge the charts only ever show the static
  // seed data and never update when a real booking is made.
  const bookings = useMemo(() => {
    const list: { check_in: string; check_out: string; total: number; status: string }[] = [];
    for (const b of getFilteredBookings(property.id)) {
      list.push({
        check_in: (b.check_in || '').slice(0, 10),
        check_out: (b.check_out || '').slice(0, 10),
        total: b.total || 0,
        status: b.status,
      });
    }
    for (const b of guestBookings) {
      if (b.hotelId !== property.id) continue;
      list.push({
        check_in: (b.checkIn || '').slice(0, 10),
        check_out: (b.checkOut || '').slice(0, 10),
        total: b.totalPrice || 0,
        status: b.status,
      });
    }
    return list;
  }, [property.id, getFilteredBookings, guestBookings]);

  // Count all non-cancelled bookings as revenue sources.
  // Guest bookings use 'upcoming'/'completed', host mock uses 'checked_in'/'checked_out'.
  // The previous narrow filter missed guest bookings entirely.
  const revenue = bookings.filter(
    (b) => (b.status || '').toLowerCase() !== 'cancelled' && (b.status || '').toLowerCase() !== 'canceled',
  );
  const totalRev = revenue.reduce((sum, b) => sum + (b.total || 0), 0);

  const chartData = useMemo(() => {
    // Live revenue trend from the backend when available, else the local derivation.
    let revByDay: number[];
    let labels: string[];
    if (revTrend.length > 0) {
      revByDay = revTrend.map(p => parseFloat(p.revenue) || 0);
      labels = revTrend.map(p => (p.date || '').slice(5));
    } else {
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().slice(0, 10);
      });
      revByDay = last7.map(date =>
        revenue
          .filter(b => b.check_in <= date && b.check_out >= date)
          .reduce((sum, b) => sum + b.total, 0)
      );
      labels = last7.map(d => d.slice(5));
    }

    // Live booking-count trend drives the occupancy line; fall back to stay-coverage counts.
    let occByDay: number[];
    if (bookingTrend.length > 0) {
      occByDay = bookingTrend.map(p => p.booking_count);
    } else {
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().slice(0, 10);
      });
      occByDay = last7.map(date =>
        bookings.filter(b => b.check_in <= date && b.check_out >= date).length
      );
    }
    return {
      labels,
      revenue: revByDay,
      occupancy: occByDay,
    };
  }, [bookings, revenue, revTrend, bookingTrend]);

  // Live overview KPIs override the client-computed ones.
  const kpiRevenue = overview ? parseFloat(overview.total_revenue) || 0 : totalRev;
  const kpiBookings = overview ? overview.bookings_today : bookings.length;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <View style={[styles.kpiCard, { borderLeftColor: STATUS.activeGreen }]}>
          <Ionicons name="cash-outline" size={20} color={STATUS.activeGreen} />
          <Text style={styles.kpiValue}>NPR {kpiRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
          <Text style={styles.kpiLabel}>Total Revenue{overview ? '' : ' (est.)'}</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: BLUE[500] }]}>
          <Ionicons name="receipt-outline" size={20} color={BLUE[500]} />
          <Text style={styles.kpiValue}>{kpiBookings}</Text>
          <Text style={styles.kpiLabel}>{overview ? 'Bookings Today' : 'Total Bookings'}</Text>
        </View>
      </View>

      {overview && (
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <View style={[styles.kpiCard, { borderLeftColor: BRAND.teal }]}>
            <Ionicons name="bed-outline" size={20} color={BRAND.teal} />
            <Text style={styles.kpiValue}>{overview.occupancy_rate.toFixed(0)}%</Text>
            <Text style={styles.kpiLabel}>Occupancy Rate</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: AMBER[500] }]}>
            <Ionicons name="trending-up-outline" size={20} color={AMBER[500]} />
            <Text style={styles.kpiValue}>NPR {(parseFloat(overview.arr) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
            <Text style={styles.kpiLabel}>ADR (ARR)</Text>
          </View>
        </View>
      )}

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Revenue (Last 7 Days)</Text>
        <BarChart
          key={`rev-${chartData.revenue.join('-')}`}
          data={{
            labels: chartData.labels,
            datasets: [{ data: chartData.revenue.length > 0 ? chartData.revenue : [0] }],
          }}
          width={screenWidth}
          height={180}
          yAxisLabel="NPR "
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: BG.white,
            backgroundGradientFrom: BG.white,
            backgroundGradientTo: BG.white,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(26, 54, 93, ${opacity})`,
            labelColor: () => GRAY[500],
            barPercentage: 0.6,
          }}
          style={{ borderRadius: 12 }}
        />
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Occupancy (Last 7 Days)</Text>
        <LineChart
          key={`occ-${chartData.occupancy.join('-')}`}
          data={{
            labels: chartData.labels,
            datasets: [{ data: chartData.occupancy.length > 0 ? chartData.occupancy : [0] }],
          }}
          width={screenWidth}
          height={180}
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: BG.white,
            backgroundGradientFrom: BG.white,
            backgroundGradientTo: BG.white,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 168, 150, ${opacity})`,
            labelColor: () => GRAY[500],
            propsForDots: { r: '4', strokeWidth: '2', stroke: BRAND.teal },
          }}
          bezier
          style={{ borderRadius: 12 }}
        />
      </View>

      {roomTypeRevenue.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Revenue by Room Type (Last 30 Days)</Text>
          {roomTypeRevenue.map(rt => {
            const max = Math.max(...roomTypeRevenue.map(r => parseFloat(r.revenue) || 0), 1);
            const pct = Math.round(((parseFloat(rt.revenue) || 0) / max) * 100);
            return (
              <View key={rt.room_type_name} style={styles.roomTypeRow}>
                <Text style={styles.roomTypeName} numberOfLines={1}>{rt.room_type_name}</Text>
                <View style={styles.roomTypeBarTrack}>
                  <View style={[styles.roomTypeBar, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.roomTypeAmount}>
                  NPR {(parseFloat(rt.revenue) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {overview && overview.top_channels.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Top Booking Channels</Text>
          {overview.top_channels.map(ch => (
            <View key={ch.channel_name} style={styles.channelRow}>
              <Text style={styles.channelName} numberOfLines={1}>{ch.channel_name}</Text>
              <Text style={styles.channelMeta}>{ch.booking_count} bookings</Text>
              <Text style={styles.channelAmount}>
                NPR {(parseFloat(ch.revenue) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Recent Bookings</Text>
      {hostBookings.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={32} color={GRAY[300]} />
          <Text style={styles.emptyText}>No bookings yet</Text>
        </View>
      ) : (
        hostBookings.slice(0, 10).map(b => (
          <View key={b.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.guest}>{b.guest_name}</Text>
              <Text style={styles.dates}>{b.check_in} → {b.check_out}</Text>
            </View>
            <Text style={styles.amount}>NPR {b.total.toLocaleString()}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  kpiCard: { flex: 1, backgroundColor: BG.white, borderRadius: RADIUS.card + 6, padding: 16, borderLeftWidth: 3, gap: 6 },
  kpiValue: { fontSize: 20, fontWeight: '800', color: GRAY[900] },
  kpiLabel: { fontSize: 11, color: GRAY[400] },
  chartCard: {
    backgroundColor: BG.white, borderRadius: RADIUS.card + 6, padding: 16, marginBottom: 16,
  },
  chartTitle: { fontSize: 14, fontWeight: '700', color: GRAY[900], marginBottom: 12 },
  emptyChart: { height: 120, alignItems: 'center', justifyContent: 'center' },
  emptyChartText: { fontSize: 13, color: GRAY[400] },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: GRAY[900], marginBottom: 12 },
  roomTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  roomTypeName: { width: 90, fontSize: 12, fontWeight: '600', color: GRAY[900] },
  roomTypeBarTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: GRAY[100], overflow: 'hidden' },
  roomTypeBar: { height: '100%', borderRadius: 4, backgroundColor: BRAND.teal },
  roomTypeAmount: { width: 90, fontSize: 11, fontWeight: '700', color: GRAY[900], textAlign: 'right' },
  channelRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: GRAY[100], gap: 8 },
  channelName: { flex: 1, fontSize: 13, fontWeight: '600', color: GRAY[900] },
  channelMeta: { fontSize: 11, color: GRAY[400] },
  channelAmount: { fontSize: 12, fontWeight: '700', color: GRAY[900] },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: BG.white, borderRadius: RADIUS.modal, padding: 14, marginBottom: 8 },
  guest: { ...TYPOGRAPHY.body, fontWeight: '600', color: GRAY[900] },
  dates: { fontSize: 11, color: GRAY[400], marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '800', color: GRAY[900] },
  emptyState: { alignItems: 'center', padding: 40, gap: 8 },
  emptyText: { fontSize: 13, color: GRAY[400] },
});
