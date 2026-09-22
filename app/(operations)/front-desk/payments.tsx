import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, GRAY } from '@/constants/portal-theme';
import { useFrontDesk } from '@/lib/context/frontdesk-context';
import { safeGoBack } from '@/lib/utils';
import { BG, SRS as SRSTokens, AMBER, EMERALD, RED, BLUE, FLAT, SLATE } from '@/lib/constants/figma-tokens';
import type { FrontDeskBookingResponse } from '@/types/api';

/** NPR-style amount with at most 2 decimals (parity with web usePropertyCurrency fix). */
function formatAmount(amount: number): string {
  return `NPR ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

interface Transaction {
  id: string;
  ref: string;
  guest_name: string;
  room_number: string;
  method: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  isRefund: boolean;
  status: string;
  created_at: string;
}

const STATUS_STYLES: Record<string, { color: string; label: string }> = {
  PAID: { color: SRSTokens.green, label: 'Paid' },
  PARTIAL: { color: SRSTokens.orange, label: 'Partial' },
  UNPAID: { color: RED[500], label: 'Unpaid' },
  REFUNDED: { color: BLUE[500], label: 'Refunded' },
  PENDING: { color: SRSTokens.orange, label: 'Pending' },
  FAILED: { color: RED[500], label: 'Failed' },
};

const STATUS_FILTERS = ['PAID', 'PARTIAL', 'UNPAID', 'REFUNDED'] as const;

export default function PaymentsScreen() {
  const { bookingGuestsData, bookings } = useFrontDesk();
  const [tab, setTab] = useState<'all' | 'refunds'>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const transactions = useMemo<Transaction[]>(() => {
    // bookingGuestsData is authoritative for payment fields; context bookings fill gaps.
    const ctxByRef = new Map(bookings.map(b => [b.ref, b]));
    const fromGuests: Transaction[] = bookingGuestsData.map((b: FrontDeskBookingResponse) => ({
      id: b.booking_id,
      ref: b.ref_number,
      guest_name: b.guest?.full_name || 'Guest',
      room_number: b.rooms?.[0]?.room_name || '—',
      method: b.payment_method || b.payment_gateway || '—',
      amount: b.total_amount || 0,
      amount_paid: b.amount_paid || 0,
      amount_due: b.amount_due || 0,
      isRefund: (b.payment_status || '').toUpperCase() === 'REFUNDED',
      status: (b.payment_status || 'PENDING').toUpperCase(),
      created_at: b.created_at,
    }));
    const seen = new Set(fromGuests.map(t => t.ref));
    const fromCtx: Transaction[] = bookings
      .filter(b => b.ref && !seen.has(b.ref))
      .map(b => ({
        id: b.id,
        ref: b.ref,
        guest_name: b.guest_name,
        room_number: b.room_number || '—',
        method: '—',
        amount: b.balance || 0,
        amount_paid: 0,
        amount_due: b.balance || 0,
        isRefund: false,
        status: 'PENDING',
        created_at: ctxByRef.get(b.ref) ? '' : '',
      }));
    return [...fromGuests, ...fromCtx].sort(
      (a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0),
    );
  }, [bookingGuestsData, bookings]);

  const filtered = useMemo(() => {
    let list = transactions;
    if (tab === 'refunds') list = list.filter(t => t.isRefund);
    if (statusFilter) list = list.filter(t => t.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        t => t.guest_name.toLowerCase().includes(q) || t.ref.toLowerCase().includes(q),
      );
    }
    return list;
  }, [transactions, tab, statusFilter, search]);

  const totalAmount = useMemo(() => filtered.reduce((sum, t) => sum + t.amount_paid, 0), [filtered]);

  const showDetails = (t: Transaction) => {
    Alert.alert(
      t.ref,
      `Guest: ${t.guest_name}\nRoom: ${t.room_number}\nMethod: ${t.method}\nTotal: ${formatAmount(t.amount)}\nPaid: ${formatAmount(t.amount_paid)}\nDue: ${formatAmount(t.amount_due)}\nStatus: ${STATUS_STYLES[t.status]?.label || t.status}`,
    );
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
          <IconSymbol name="arrow.back" size={18} color={GRAY[500]} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Payment History</Text>
          <Text style={s.sub}>Track guest payments, refunds, and receipts</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {([
          { key: 'all' as const, label: `All Transactions (${transactions.length})` },
          { key: 'refunds' as const, label: `Refunds (${transactions.filter(t => t.isRefund).length})` },
        ]).map(t => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[s.tabBtn, tab === t.key && s.tabBtnActive]}
          >
            <Text style={[s.tabLabel, tab === t.key && { color: BG.white }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={s.searchRow}>
        <IconSymbol name="search" size={16} color={GRAY[400]} />
        <TextInput
          placeholder="Search guest, booking or reference"
          placeholderTextColor={GRAY[400]}
          value={search}
          onChangeText={setSearch}
          style={s.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <IconSymbol name="close" size={16} color={GRAY[400]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll} contentContainerStyle={{ gap: SPACING.sm }}>
        {STATUS_FILTERS.map(status => {
          const active = statusFilter === status;
          const color = STATUS_STYLES[status]?.color || GRAY[400];
          return (
            <TouchableOpacity
              key={status}
              onPress={() => setStatusFilter(active ? null : status)}
              style={[s.chip, { backgroundColor: active ? color : color + '15' }]}
            >
              <Text style={[s.chipText, { color: active ? BG.white : color }]}>
                {STATUS_STYLES[status]?.label || status}
              </Text>
            </TouchableOpacity>
          );
        })}
        {statusFilter && (
          <TouchableOpacity onPress={() => setStatusFilter(null)} style={[s.chip, { backgroundColor: GRAY[200] }]}>
            <Text style={[s.chipText, { color: GRAY[600] }]}>Clear</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Summary */}
      <View style={s.summaryRow}>
        <Text style={s.summaryText}>
          {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
        </Text>
        <Text style={s.summaryAmount}>{formatAmount(totalAmount)} collected</Text>
      </View>

      {/* Transactions */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {filtered.length === 0 ? (
          <View style={s.emptyState}>
            <IconSymbol name="payment" size={40} color={GRAY[300]} />
            <Text style={s.emptyText}>
              {search || statusFilter ? 'No matching transactions' : 'No transactions yet'}
            </Text>
          </View>
        ) : (
          filtered.map(t => {
            const status = STATUS_STYLES[t.status] || { color: GRAY[500], label: t.status };
            return (
              <TouchableOpacity key={t.id + t.ref} onPress={() => showDetails(t)} style={s.txnCard} activeOpacity={0.7}>
                <View style={[s.txnIcon, { backgroundColor: t.isRefund ? BLUE[500] + '15' : FLAT.green + '15' }]}>
                  <IconSymbol name={t.isRefund ? 'checkout' : 'payment'} size={18} color={t.isRefund ? BLUE[500] : SRSTokens.green} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={s.txnRef}>{t.ref}</Text>
                    <View style={[s.statusDot, { backgroundColor: status.color }]} />
                    <Text style={[s.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                  <Text style={s.txnGuest}>{t.guest_name} · Room {t.room_number}</Text>
                  <Text style={s.txnMeta}>
                    {t.created_at ? `${formatDate(t.created_at)}, ${formatTime(t.created_at)}` : ''}{t.method !== '—' ? ` · ${t.method}` : ''}
                  </Text>
                </View>
                <Text style={[s.txnAmount, { color: t.isRefund ? BLUE[500] : SRS.navy }]}>
                  {t.isRefund ? '-' : '+'} {formatAmount(t.amount)}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.md, flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  backBtn: { width: 36, height: 36, borderRadius: RADIUS.card, backgroundColor: BG.white, alignItems: 'center', justifyContent: 'center' },
  title: { ...TYPOGRAPHY.h2, color: SRS.navy },
  sub: { ...TYPOGRAPHY.small, color: GRAY[500], marginTop: 2 },

  tabRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.md },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: BG.white, borderWidth: 1, borderColor: GRAY[200] },
  tabBtnActive: { backgroundColor: SRS.navy, borderColor: SRS.navy },
  tabLabel: { ...TYPOGRAPHY.caption, fontWeight: '600', color: GRAY[600] },

  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: BG.white, borderRadius: RADIUS.card, borderWidth: 1, borderColor: GRAY[200], gap: 8, paddingHorizontal: 12, marginHorizontal: SPACING.lg },
  searchInput: { flex: 1, fontSize: 14, color: SRS.navy, paddingVertical: 11 },

  chipScroll: { paddingHorizontal: SPACING.lg, marginTop: SPACING.md },
  chip: { paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.full },
  chipText: { fontSize: 12, fontWeight: '700' },

  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, marginTop: SPACING.md, marginBottom: SPACING.sm },
  summaryText: { ...TYPOGRAPHY.small, color: GRAY[500] },
  summaryAmount: { ...TYPOGRAPHY.small, fontWeight: '700', color: SRS.navy },

  txnCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: BG.white, borderRadius: RADIUS.card, borderWidth: 1, borderColor: GRAY[100], padding: SPACING.md, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, gap: SPACING.md },
  txnIcon: { width: 38, height: 38, borderRadius: RADIUS.card, alignItems: 'center', justifyContent: 'center' },
  txnRef: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy },
  txnGuest: { ...TYPOGRAPHY.small, color: GRAY[600], marginTop: 1 },
  txnMeta: { ...TYPOGRAPHY.caption, color: GRAY[400], marginTop: 1 },
  txnAmount: { fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl * 2, gap: SPACING.md },
  emptyText: { ...TYPOGRAPHY.body, color: GRAY[400] },
});
