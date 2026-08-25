import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useFrontDesk } from '@/lib/context/frontdesk-context';
import { useFolioStore } from '@/stores/useFolioStore';
import { SRS, SLATE, BG, BLUE, EMERALD, RED, AMBER, PURPLE, PINK } from '@/lib/constants/figma-tokens';
import { RADIUS, GRAY, SHADOWS } from '@/constants/portal-theme';
import { safeGoBack } from "@/lib/utils";

const DARK = SLATE[900];

type FolioTab = 'charges' | 'payments' | 'summary' | 'notes';

const CATEGORY_ICONS: Record<string, string> = {
  room: 'bed-outline', restaurant: 'restaurant-outline', minibar: 'wine-outline',
  laundry: 'shirt-outline', service: 'construct-outline', other: 'folder-outline',
};
const CATEGORY_LABELS: Record<string, string> = {
  room: 'Room', restaurant: 'Restaurant', minibar: 'Minibar',
  laundry: 'Laundry', service: 'Service', other: 'Other',
};

const QUICK_ACTIONS = [
  { label: 'Add Charge', icon: 'add-circle-outline', color: SRS.teal },
  { label: 'Minibar', icon: 'wine-outline', color: AMBER[500] },
  { label: 'Laundry', icon: 'shirt-outline', color: BLUE[600] },
  { label: 'Room Service', icon: 'restaurant-outline', color: EMERALD[500] },
  { label: 'More', icon: 'ellipsis-horizontal', color: SLATE[500] },
];

export default function FolioScreen() {
  const { bookingRef } = useLocalSearchParams<{ bookingRef: string }>();
  const { bookings } = useFrontDesk();
  const folio = useFolioStore.getState().getFolio(bookingRef || '');
  const addCharge = useFolioStore((s) => s.addCharge);

  const [activeTab, setActiveTab] = useState<FolioTab>('charges');

  const booking = useMemo(() => bookings.find(b => b.ref === bookingRef), [bookings, bookingRef]);

  const categoryGroups: Record<string, { description: string; amount: number }[]> = {};
  if (folio) {
    folio.charges.forEach(c => {
      if (!categoryGroups[c.category]) categoryGroups[c.category] = [];
      categoryGroups[c.category].push({ description: c.description, amount: c.amount });
    });
  }

  const handleQuickCharge = (label: string, amount: number, category: string) => {
    if (!bookingRef) return;
    addCharge(bookingRef, { description: label, amount, category: category as any });
    Alert.alert('Charge Added', `${label} (NPR ${amount}) posted to folio`);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={DARK} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Folio</Text>
          <Text style={s.headerSub}>Room {folio?.room_number || '—'}</Text>
        </View>
        <TouchableOpacity style={s.printBtn}>
          <Ionicons name="print-outline" size={20} color={DARK} />
        </TouchableOpacity>
      </View>

      {/* Guest Info */}
      <View style={s.guestCard}>
        <View style={s.guestAvatar}>
          <Text style={s.guestInitial}>{booking?.guest_name?.charAt(0) || 'G'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.guestName}>{booking?.guest_name || 'Guest'}</Text>
          <Text style={s.guestMeta}>{folio?.room_number || '—'} · {bookingRef}</Text>
          <Text style={s.guestMeta}>{booking?.checkin} → {booking?.checkout}</Text>
        </View>
        <View style={s.inHouseBadge}>
          <Text style={s.inHouseText}>In House</Text>
        </View>
      </View>

      {/* Outstanding Balance */}
      {folio && (
        <View style={s.balanceCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={s.balanceLabel}>Outstanding Balance</Text>
              <Text style={s.balanceAmount}>NPR {folio.total.toLocaleString()}</Text>
            </View>
            <TouchableOpacity style={s.settleBtn}>
              <Text style={s.settleBtnText}>Settle</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={s.tabRow}>
        {(['charges', 'payments', 'summary', 'notes'] as FolioTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[s.tabBtn, activeTab === tab && s.tabBtnActive]}
          >
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={s.tabContent}>
        {activeTab === 'charges' && (
          <>
            {Object.keys(categoryGroups).length === 0 ? (
              <View style={s.emptyTab}>
                <Ionicons name="receipt-outline" size={32} color={SLATE[300]} />
                <Text style={s.emptyTabText}>No charges on this folio</Text>
              </View>
            ) : (
              Object.entries(categoryGroups).map(([category, charges]) => (
                <View key={category} style={s.categorySection}>
                  <View style={s.categoryHeader}>
                    <Ionicons name={(CATEGORY_ICONS[category] || 'folder-outline') as any} size={16} color={SRS.teal} />
                    <Text style={s.categoryTitle}>{CATEGORY_LABELS[category] || category}</Text>
                  </View>
                  {charges.map((c, i) => (
                    <View key={i} style={s.chargeRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.chargeDesc}>{c.description}</Text>
                      </View>
                      <Text style={s.chargeAmount}>NPR {c.amount.toLocaleString()}</Text>
                    </View>
                  ))}
                </View>
              ))
            )}

            {/* Total */}
            {folio && (
              <View style={s.totalSection}>
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Subtotal</Text>
                  <Text style={s.totalValue}>NPR {folio.subtotal.toLocaleString()}</Text>
                </View>
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Tax (13%)</Text>
                  <Text style={s.totalValue}>NPR {folio.tax.toLocaleString()}</Text>
                </View>
                <View style={[s.totalRow, { borderTopWidth: 1, borderTopColor: SLATE[100], paddingTop: 8, marginTop: 4 }]}>
                  <Text style={s.grandTotalLabel}>Total</Text>
                  <Text style={s.grandTotalValue}>NPR {folio.total.toLocaleString()}</Text>
                </View>
              </View>
            )}
          </>
        )}

        {activeTab === 'payments' && (
          <View style={s.emptyTab}>
            <Ionicons name="card-outline" size={32} color={SLATE[300]} />
            <Text style={s.emptyTabText}>No payments recorded yet</Text>
          </View>
        )}

        {activeTab === 'summary' && folio && (
          <View style={s.summarySection}>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Room Charges</Text><Text style={s.summaryValue}>NPR {folio.subtotal.toLocaleString()}</Text></View>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Tax (13%)</Text><Text style={s.summaryValue}>NPR {folio.tax.toLocaleString()}</Text></View>
            {folio.discount > 0 && <View style={s.summaryRow}><Text style={s.summaryLabel}>Discount</Text><Text style={[s.summaryValue, { color: SRS.green }]}>-NPR {folio.discount.toLocaleString()}</Text></View>}
            <View style={[s.summaryRow, { borderTopWidth: 1, borderTopColor: SLATE[100], paddingTop: 8, marginTop: 4 }]}>
              <Text style={s.grandTotalLabel}>Total</Text>
              <Text style={s.grandTotalValue}>NPR {folio.total.toLocaleString()}</Text>
            </View>
          </View>
        )}

        {activeTab === 'notes' && (
          <View style={s.notesSection}>
            <TextInput
              placeholder="Add a note..."
              placeholderTextColor={SLATE[400]}
              style={s.noteInput}
              multiline
            />
            <TouchableOpacity style={s.addNoteBtn}>
              <Text style={s.addNoteBtnText}>Add Note</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.actionsRow}>
          {QUICK_ACTIONS.map((action, i) => (
            <TouchableOpacity
              key={action.label}
              onPress={() => {
                if (action.label === 'Add Charge') return;
                const amounts: Record<string, number> = { Minibar: 500, Laundry: 300, 'Room Service': 400 };
                handleQuickCharge(action.label, amounts[action.label] || 500, action.label.toLowerCase().replace(' ', '_'));
              }}
              style={s.actionCard}
            >
              <View style={[s.actionIcon, { backgroundColor: action.color + '15' }]}>
                <Ionicons name={action.icon as any} size={20} color={action.color} />
              </View>
              <Text style={s.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: SLATE[50] },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: SLATE[50], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: DARK, letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: SLATE[400] },
  printBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: SLATE[50], alignItems: 'center', justifyContent: 'center' },

  guestCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14, marginHorizontal: 16, marginBottom: 8,
    backgroundColor: BG.white, borderRadius: 12, borderWidth: 1, borderColor: SLATE[100], gap: 12,
  },
  guestAvatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: SRS.teal + '15', alignItems: 'center', justifyContent: 'center' },
  guestInitial: { fontSize: 18, fontWeight: '700', color: SRS.teal },
  guestName: { fontSize: 14, fontWeight: '700', color: DARK },
  guestMeta: { fontSize: 12, color: SLATE[400], marginTop: 1 },
  inHouseBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: EMERALD[50] },
  inHouseText: { fontSize: 10, fontWeight: '600', color: SRS.green },

  balanceCard: {
    marginHorizontal: 16, marginBottom: 12, padding: 16,
    backgroundColor: BG.white, borderRadius: 12, borderWidth: 1, borderColor: SLATE[100], ...SHADOWS.card,
  },
  balanceLabel: { fontSize: 12, fontWeight: '600', color: SLATE[500] },
  balanceAmount: { fontSize: 24, fontWeight: '800', color: SRS.teal, marginTop: 4, fontVariant: ['tabular-nums' as any] },
  settleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: SRS.teal },
  settleBtnText: { fontSize: 12, fontWeight: '700', color: BG.white },

  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 4, marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: SLATE[100] },
  tabBtnActive: { backgroundColor: SRS.navy },
  tabText: { fontSize: 12, fontWeight: '600', color: SLATE[500] },
  tabTextActive: { color: BG.white },

  tabContent: { paddingHorizontal: 16, marginBottom: 16 },

  categorySection: { marginBottom: 16 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  categoryTitle: { fontSize: 13, fontWeight: '700', color: DARK },
  chargeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, paddingLeft: 24 },
  chargeDesc: { fontSize: 13, color: SLATE[500] },
  chargeAmount: { fontSize: 13, fontWeight: '600', color: DARK },

  totalSection: { backgroundColor: BG.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: SLATE[100] },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel: { fontSize: 13, color: SLATE[500] },
  totalValue: { fontSize: 13, fontWeight: '600', color: DARK },
  grandTotalLabel: { fontSize: 14, fontWeight: '700', color: DARK },
  grandTotalValue: { fontSize: 14, fontWeight: '800', color: SRS.teal },

  summarySection: { backgroundColor: BG.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: SLATE[100] },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { fontSize: 13, color: SLATE[500] },
  summaryValue: { fontSize: 13, fontWeight: '600', color: DARK },

  notesSection: { gap: 10 },
  noteInput: { backgroundColor: BG.white, borderRadius: 12, borderWidth: 1, borderColor: SLATE[200], padding: 12, fontSize: 13, color: DARK, minHeight: 80, textAlignVertical: 'top' },
  addNoteBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: SRS.teal },
  addNoteBtnText: { fontSize: 13, fontWeight: '700', color: BG.white },

  emptyTab: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyTabText: { fontSize: 13, color: SLATE[400] },

  section: { paddingHorizontal: 16, marginTop: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: DARK, marginBottom: 10 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionCard: { alignItems: 'center', flex: 1, padding: 12, backgroundColor: BG.white, borderRadius: 12, borderWidth: 1, borderColor: SLATE[100] },
  actionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  actionLabel: { fontSize: 10, fontWeight: '600', color: DARK, textAlign: 'center' },
});
