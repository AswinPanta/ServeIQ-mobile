import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import type { Property } from '@/types/api';
import { useHost } from '@/lib/context/host-context';
import { useBookings } from '@/lib/context/booking-context';
import { GRAY, TYPOGRAPHY, RADIUS } from '@/constants/portal-theme';
import { STATUS, BLUE, BG, BRAND } from '@/lib/constants/figma-tokens';

interface Props { property: Property }

const screenWidth = Dimensions.get('window').width - 64;

export function PropertyReports({ property }: Props) {
  const { getFilteredBookings } = useHost();
  const { bookings: guestBookings } = useBookings();
  const hostBookings = getFilteredBookings(property.id);

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
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().slice(0, 10);
    });
    const revByDay = last7.map(date =>
      revenue
        .filter(b => b.check_in <= date && b.check_out >= date)
        .reduce((sum, b) => sum + b.total, 0)
    );
    const bookingsByDay = last7.map(date =>
      bookings.filter(b => b.check_in <= date && b.check_out >= date).length
    );
    return {
      labels: last7.map(d => d.slice(5)),
      revenue: revByDay,
      occupancy: bookingsByDay,
    };
  }, [bookings, revenue]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <View style={[styles.kpiCard, { borderLeftColor: STATUS.activeGreen }]}>
          <Ionicons name="cash-outline" size={20} color={STATUS.activeGreen} />
          <Text style={styles.kpiValue}>NPR {totalRev.toLocaleString()}</Text>
          <Text style={styles.kpiLabel}>Total Revenue</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: BLUE[500] }]}>
          <Ionicons name="receipt-outline" size={20} color={BLUE[500]} />
          <Text style={styles.kpiValue}>{bookings.length}</Text>
          <Text style={styles.kpiLabel}>Total Bookings</Text>
        </View>
      </View>

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
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: BG.white, borderRadius: RADIUS.modal, padding: 14, marginBottom: 8 },
  guest: { ...TYPOGRAPHY.body, fontWeight: '600', color: GRAY[900] },
  dates: { fontSize: 11, color: GRAY[400], marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '800', color: GRAY[900] },
  emptyState: { alignItems: 'center', padding: 40, gap: 8 },
  emptyText: { fontSize: 13, color: GRAY[400] },
});
