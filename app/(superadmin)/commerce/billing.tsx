import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';

const SUPERADMIN = '#8E44AD';
const FILTERS = ['All', 'Paid', 'Pending', 'Overdue'] as const;

const INVOICES = [
  { id: '1', tenant: 'Himalayan Heights Hotels', invoice: 'INV-2025-001', date: '2025-06-01', amount: 120000, status: 'Paid' },
  { id: '2', tenant: 'Pokhara Lake Resort', invoice: 'INV-2025-002', date: '2025-06-01', amount: 75000, status: 'Paid' },
  { id: '3', tenant: 'Buddha B&B Chain', invoice: 'INV-2025-003', date: '2025-06-01', amount: 25000, status: 'Pending' },
  { id: '4', tenant: 'Chitwan Safari Lodge', invoice: 'INV-2025-004', date: '2025-05-01', amount: 25000, status: 'Overdue' },
  { id: '5', tenant: 'Lumbini Garden Hotel', invoice: 'INV-2025-005', date: '2025-06-01', amount: 75000, status: 'Paid' },
  { id: '6', tenant: 'Everest Base Camp Lodges', invoice: 'INV-2025-006', date: '2025-06-01', amount: 120000, status: 'Pending' },
  { id: '7', tenant: 'Himalayan Heights Hotels', invoice: 'INV-2025-007', date: '2025-05-01', amount: 120000, status: 'Paid' },
  { id: '8', tenant: 'Garden Retreat', invoice: 'INV-2025-008', date: '2025-06-15', amount: 0, status: 'Pending' },
  { id: '9', tenant: 'Mountain View Inn', invoice: 'INV-2025-009', date: '2025-06-15', amount: 0, status: 'Pending' },
];

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Paid: { bg: '#10B98115', text: '#10B981' }, Pending: { bg: '#F59E0B15', text: '#F59E0B' }, Overdue: { bg: '#EF444415', text: '#EF4444' },
};

export default function BillingScreen() {
  const [filter, setFilter] = useState<string>('All');
  const totalRevenue = INVOICES.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0);
  const pendingAmount = INVOICES.filter(i => i.status === 'Pending' || i.status === 'Overdue').reduce((s, i) => s + i.amount, 0);
  const overdueAmount = INVOICES.filter(i => i.status === 'Overdue').reduce((s, i) => s + i.amount, 0);
  const filtered = filter === 'All' ? INVOICES : INVOICES.filter(i => i.status === filter);

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={SUPERADMIN} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Billing</Text>
        </View>

        <View style={s.summaryRow}>
          {[
            { label: 'Total Revenue', value: `NPR ${(totalRevenue / 1000).toFixed(1)}K`, color: '#10B981' },
            { label: 'Pending', value: `NPR ${(pendingAmount / 1000).toFixed(1)}K`, color: '#F59E0B' },
            { label: 'Overdue', value: `NPR ${(overdueAmount / 1000).toFixed(1)}K`, color: '#EF4444' },
          ].map((sum) => (
            <View key={sum.label} style={[s.summaryCard, { borderLeftColor: sum.color }]}>
              <Text style={s.summaryValue}>{sum.value}</Text>
              <Text style={s.summaryLabel}>{sum.label}</Text>
            </View>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={s.filterRow}>
            {FILTERS.map(f => (
              <TouchableOpacity key={f} onPress={() => setFilter(f)}
                style={[s.filterChip, { backgroundColor: filter === f ? SUPERADMIN : GRAY[100] }]}>
                <Text style={[s.filterText, { color: filter === f ? '#FFF' : GRAY[500] }]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {filtered.map(inv => {
          const st = STATUS_STYLES[inv.status];
          return (
            <View key={inv.id} style={s.invoiceCard}>
              <View style={s.invoiceTop}>
                <Text style={s.invoiceTenant}>{inv.tenant}</Text>
                <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
                  <Text style={[s.statusText, { color: st.text }]}>{inv.status}</Text>
                </View>
              </View>
              <View style={s.invoiceBottom}>
                <Text style={s.invoiceMeta}>{inv.invoice} • {inv.date}</Text>
                <Text style={s.invoiceAmount}>NPR {inv.amount.toLocaleString()}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  scroll: { padding: SPACING.xl, paddingTop: 60, gap: SPACING.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 44, height: 44, borderRadius: RADIUS.modal, backgroundColor: SUPERADMIN + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TYPOGRAPHY.h2, color: SRS.navy },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryCard: { flex: 1, minWidth: '30%', padding: SPACING.lg, borderRadius: 16, backgroundColor: '#FFF', borderLeftWidth: 4, ...SHADOWS.card },
  summaryValue: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy },
  summaryLabel: { ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: 4 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  filterChip: { paddingHorizontal: 18, paddingVertical: 14, borderRadius: 20 },
  filterText: { ...TYPOGRAPHY.body, fontWeight: '600' },
  invoiceCard: { padding: SPACING.lg, borderRadius: 16, backgroundColor: '#FFF', ...SHADOWS.card },
  invoiceTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  invoiceTenant: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  invoiceBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  invoiceMeta: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  invoiceAmount: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy },
});
