import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Property } from '@/types/api';
import { useHost } from '@/lib/context/host-context';

interface Props { property: Property }

export function PropertyReports({ property }: Props) {
  const { getFilteredBookings } = useHost();
  const bookings = getFilteredBookings(property.id);
  const revenue = bookings.filter(b => b.status === 'checked_in' || b.status === 'checked_out');
  const totalRev = revenue.reduce((sum, b) => sum + b.total, 0);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <View style={[styles.kpiCard, { borderLeftColor: '#10B981' }]}>
          <Ionicons name="cash-outline" size={20} color="#10B981" />
          <Text style={styles.kpiValue}>${totalRev.toLocaleString()}</Text>
          <Text style={styles.kpiLabel}>Total Revenue</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: '#3B82F6' }]}>
          <Ionicons name="receipt-outline" size={20} color="#3B82F6" />
          <Text style={styles.kpiValue}>{bookings.length}</Text>
          <Text style={styles.kpiLabel}>Total Bookings</Text>
        </View>
      </View>

      {bookings.map(b => (
        <View key={b.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.guest}>{b.guest_name}</Text>
            <Text style={styles.dates}>{b.check_in} → {b.check_out}</Text>
          </View>
          <Text style={styles.amount}>${b.total}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  kpiCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 16, borderLeftWidth: 3, gap: 6 },
  kpiValue: { fontSize: 20, fontWeight: '800', color: '#111' },
  kpiLabel: { fontSize: 11, color: '#94A3B8' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 8 },
  guest: { fontSize: 14, fontWeight: '600', color: '#111' },
  dates: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '800', color: '#111' },
});
