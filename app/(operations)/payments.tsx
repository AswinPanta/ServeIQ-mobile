import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useFrontDesk } from '@/lib/context/frontdesk-context';
import { SRS, SLATE, BG, BLUE, EMERALD, AMBER, RED } from '@/lib/constants/figma-tokens';
import { RADIUS, GRAY } from '@/constants/portal-theme';

const DARK = SLATE[900];

type PaymentTab = 'received' | 'outstanding';

const PAYMENT_STATUS: Record<string, { bg: string; text: string; label: string }> = {
  paid: { bg: EMERALD[50], text: SRS.green, label: 'Paid' },
  partial: { bg: AMBER[50], text: SRS.orange, label: 'Partial' },
  due: { bg: RED[50], text: RED[500], label: 'Due' },
};

const AVATAR_COLORS = [SRS.teal, BLUE[600], AMBER[500], SRS.green, RED[500], SLATE[500]];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function PaymentsScreen() {
  const { bookings } = useFrontDesk();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<PaymentTab>('received');

  const payments = useMemo(() => {
    const roomPrices: Record<string, number> = { Standard: 6000, Deluxe: 9000, Suite: 15000 };
    return bookings.map((b, i) => {
      const total = roomPrices[b.room_type] || 6000;
      const paid = b.balance != null ? total - b.balance : (i % 3 === 2 ? total * 0.6 : i % 3 === 1 ? total * 0.4 : total);
      const balance = total - paid;
      const status = balance <= 0 ? 'paid' : paid > 0 ? 'partial' : 'due';
      return {
        id: b.id,
        guestName: b.guest_name,
        invoice: `INV-${String(1001 + i).padStart(4, '0')}`,
        room: b.room_number || '—',
        total,
        paid,
        balance,
        status,
        date: b.checkin,
        roomType: b.room_type,
      };
    });
  }, [bookings]);

  const filteredPayments = useMemo(() => {
    let list = payments;
    if (activeTab === 'received') {
      list = list.filter(p => p.status === 'paid');
    } else {
      list = list.filter(p => p.status !== 'paid');
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.guestName.toLowerCase().includes(q) ||
        p.invoice.toLowerCase().includes(q)
      );
    }
    return list;
  }, [payments, activeTab, searchQuery]);

  const totalReceived = useMemo(() => payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.total, 0), [payments]);
  const totalOutstanding = useMemo(() => payments.filter(p => p.status !== 'paid').reduce((s, p) => s + p.balance, 0), [payments]);

  return (
    <ScreenContainer containerClassName="bg-background" className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={20} color={DARK} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Payments</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Summary Cards */}
        <View style={s.cardRow}>
          <View style={[s.summaryCard, { backgroundColor: EMERALD[50], borderColor: SRS.green + '30' }]}>
            <Text style={s.summaryLabel}>Received (Today)</Text>
            <Text style={[s.summaryValue, { color: SRS.green }]}>NPR {totalReceived.toLocaleString()}</Text>
          </View>
          <View style={[s.summaryCard, { backgroundColor: RED[50], borderColor: RED[300] + '30' }]}>
            <Text style={s.summaryLabel}>Outstanding</Text>
            <Text style={[s.summaryValue, { color: RED[500] }]}>NPR {totalOutstanding.toLocaleString()}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={s.tabRow}>
          {(['received', 'outstanding'] as PaymentTab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[s.tabBtn, activeTab === tab && s.tabBtnActive]}
            >
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                {tab === 'received' ? 'Received' : 'Outstanding'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search */}
        <View style={s.searchSection}>
          <View style={s.searchInputRow}>
            <Ionicons name="search" size={16} color={SLATE[400]} />
            <TextInput
              placeholder="Search by guest or invoice..."
              placeholderTextColor={SLATE[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={s.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={SLATE[400]} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Payment List */}
        <View style={s.section}>
          {filteredPayments.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="card-outline" size={40} color={SLATE[300]} />
              <Text style={s.emptyText}>No {activeTab} payments</Text>
            </View>
          ) : (
            filteredPayments.map(p => {
              const sc = PAYMENT_STATUS[p.status];
              const color = getAvatarColor(p.guestName);
              return (
                <TouchableOpacity key={p.id} style={s.paymentCard} activeOpacity={0.7}>
                  <View style={[s.paymentAvatar, { backgroundColor: color + '18' }]}>
                    <Text style={[s.paymentInitial, { color }]}>{p.guestName.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={s.paymentHeader}>
                      <Text style={s.guestName}>{p.guestName}</Text>
                      <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
                        <Text style={[s.statusText, { color: sc.text }]}>{sc.label}</Text>
                      </View>
                    </View>
                    <Text style={s.invoiceText}>{p.invoice} · Room {p.room}</Text>
                    <Text style={s.dateText}>{p.date}</Text>
                  </View>
                  <Text style={[s.amount, { color: sc.text }]}>
                    NPR {(activeTab === 'received' ? p.total : p.balance).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Record Payment Button */}
        <View style={s.section}>
          <TouchableOpacity style={s.recordBtn} activeOpacity={0.8}>
            <Ionicons name="add" size={18} color={BG.white} />
            <Text style={s.recordBtnText}>Record Payment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: SLATE[50], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: DARK, letterSpacing: -0.3 },

  cardRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, paddingBottom: 12 },
  summaryCard: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1 },
  summaryLabel: { fontSize: 10, fontWeight: '600', color: SLATE[500], textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums' as any] },

  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: SLATE[100] },
  tabBtnActive: { backgroundColor: SRS.navy },
  tabText: { fontSize: 13, fontWeight: '600', color: SLATE[500] },
  tabTextActive: { color: BG.white },

  searchSection: { paddingHorizontal: 16, paddingBottom: 12 },
  searchInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: BG.white, borderRadius: RADIUS.card, paddingHorizontal: 14, borderWidth: 1, borderColor: SLATE[200], gap: 8, height: 44 },
  searchInput: { flex: 1, fontSize: 14, color: DARK },

  section: { paddingHorizontal: 16, marginTop: 8 },

  paymentCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[100], marginBottom: 8, gap: 12 },
  paymentAvatar: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  paymentInitial: { fontSize: 16, fontWeight: '700' },
  paymentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  guestName: { fontSize: 14, fontWeight: '700', color: DARK },
  invoiceText: { fontSize: 11, color: SLATE[400], marginTop: 2 },
  dateText: { fontSize: 10, color: SLATE[400], marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '600' },
  amount: { fontSize: 14, fontWeight: '700' },

  recordBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: BLUE[600] },
  recordBtnText: { fontSize: 14, fontWeight: '700', color: BG.white },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 14, color: SLATE[400] },
});
