import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { StatCard } from '@/components/superadmin/StatCard';
import { FilterChips } from '@/components/superadmin/FilterChips';
import { StatusBadge } from '@/components/superadmin/StatusBadge';
import { EmptyState } from '@/components/superadmin/EmptyState';
import { PURPLE, STATUS, AMBER, RED, SLATE, BG, TEXT } from '@/lib/constants/figma-tokens';

const ACCENT = PURPLE[700];
const FILTERS = ['All', 'Paid', 'Pending', 'Overdue'] as const;

const INVOICES = [
  { id: '1', tenant: 'Himalayan Heights Hotels', invoice: 'INV-2025-001', date: '2025-06-01', amount: 120000, status: 'Paid', avatar: 'HH' },
  { id: '2', tenant: 'Pokhara Lake Resort', invoice: 'INV-2025-002', date: '2025-06-01', amount: 75000, status: 'Paid', avatar: 'PL' },
  { id: '3', tenant: 'Buddha B&B Chain', invoice: 'INV-2025-003', date: '2025-06-01', amount: 25000, status: 'Pending', avatar: 'BB' },
  { id: '4', tenant: 'Chitwan Safari Lodge', invoice: 'INV-2025-004', date: '2025-05-01', amount: 25000, status: 'Overdue', avatar: 'CS' },
  { id: '5', tenant: 'Lumbini Garden Hotel', invoice: 'INV-2025-005', date: '2025-06-01', amount: 75000, status: 'Paid', avatar: 'LG' },
  { id: '6', tenant: 'Everest Base Camp Lodges', invoice: 'INV-2025-006', date: '2025-06-01', amount: 120000, status: 'Pending', avatar: 'EB' },
  { id: '7', tenant: 'Himalayan Heights Hotels', invoice: 'INV-2025-007', date: '2025-05-01', amount: 120000, status: 'Paid', avatar: 'HH' },
  { id: '8', tenant: 'Garden Retreat', invoice: 'INV-2025-008', date: '2025-06-15', amount: 0, status: 'Pending', avatar: 'GR' },
  { id: '9', tenant: 'Mountain View Inn', invoice: 'INV-2025-009', date: '2025-06-15', amount: 0, status: 'Pending', avatar: 'MV' },
];

export default function BillingScreen() {
  const [filter, setFilter] = useState<string>('All');
  const totalRevenue = INVOICES.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0);
  const pendingAmount = INVOICES.filter(i => i.status === 'Pending').reduce((s, i) => s + i.amount, 0);
  const overdueAmount = INVOICES.filter(i => i.status === 'Overdue').reduce((s, i) => s + i.amount, 0);
  const filtered = filter === 'All' ? INVOICES : INVOICES.filter(i => i.status === filter);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 120 }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="arrow.back" size={18} color={ACCENT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Billing</Text>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Revenue" value={`NPR ${(totalRevenue / 1000).toFixed(1)}K`} color={STATUS.activeGreen} icon="payment" change="12.5%" positive />
        <StatCard label="Pending" value={`NPR ${(pendingAmount / 1000).toFixed(1)}K`} color={AMBER[500]} icon="clock" />
        <StatCard label="Overdue" value={`NPR ${(overdueAmount / 1000).toFixed(1)}K`} color={RED[500]} icon="warning" />
      </View>

      {/* Filters */}
      <View style={styles.filterWrap}>
        <FilterChips filters={FILTERS} active={filter} onChange={setFilter} />
      </View>

      {/* Invoice List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="document"
          title="No invoices"
          message="No invoices match the selected filter."
        />
      ) : (
        filtered.map(inv => (
          <TouchableOpacity key={inv.id} style={styles.invoiceCard} activeOpacity={0.7}>
            <View style={styles.invoiceTop}>
              <View style={styles.invoiceLeft}>
                <View style={[styles.avatar, { backgroundColor: ACCENT + '12' }]}>
                  <Text style={[styles.avatarText, { color: ACCENT }]}>{inv.avatar}</Text>
                </View>
                <View>
                  <Text style={styles.invoiceTenant}>{inv.tenant}</Text>
                  <Text style={styles.invoiceMeta}>{inv.invoice}</Text>
                </View>
              </View>
              <StatusBadge status={inv.status} />
            </View>
            <View style={styles.invoiceBottom}>
              <Text style={styles.invoiceDate}>{inv.date}</Text>
              <Text style={[styles.invoiceAmount, { color: inv.status === 'Overdue' ? RED[500] : SLATE[900] }]}>
                NPR {inv.amount.toLocaleString()}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SLATE[50] },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: SLATE[900], flex: 1 },
  statsRow: { paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  filterWrap: { paddingHorizontal: 16, marginBottom: 16 },
  invoiceCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    borderRadius: 14,
    backgroundColor: BG.white,
    borderWidth: 1,
    borderColor: SLATE[100],
    shadowColor: TEXT.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  invoiceTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  invoiceLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '700' },
  invoiceTenant: { fontSize: 15, fontWeight: '700', color: SLATE[900] },
  invoiceMeta: { fontSize: 12, color: SLATE[400], marginTop: 2 },
  invoiceBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: SLATE[100] },
  invoiceDate: { fontSize: 13, color: SLATE[500] },
  invoiceAmount: { fontSize: 16, fontWeight: '700' },
});
