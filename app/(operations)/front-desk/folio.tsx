import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SRS, SLATE, BG, BLUE, RED, EMERALD } from '@/lib/constants/figma-tokens';
import { RADIUS, GRAY, SPACING, TYPOGRAPHY } from '@/constants/portal-theme';
import { useAuth } from '@/lib/context/auth-context';
import { staffApi } from '@/lib/api/host-api';
import { safeGoBack } from '@/lib/utils';
import type { BackendFolioDetail } from '@/types/api';

const CATEGORIES = [
  { key: 'ROOM_CHARGE', label: 'Room', color: BLUE[500] },
  { key: 'DINING', label: 'Dining', color: SRS.green },
  { key: 'MINIBAR', label: 'Minibar', color: SRS.orange },
  { key: 'LAUNDRY', label: 'Laundry', color: SLATE[500] },
  { key: 'SERVICE', label: 'Service', color: '#8B5CF6' },
  { key: 'OTHER', label: 'Other', color: GRAY[500] },
] as const;

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

export default function FolioScreen() {
  const { folioId, bookingRef, guestName } = useLocalSearchParams<{ folioId: string; bookingRef: string; guestName: string }>();
  const { user } = useAuth();
  const [folio, setFolio] = useState<BackendFolioDetail | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState('ROOM_CHARGE');

  const fetchFolio = useCallback(() => {
    if (!folioId) return;
    staffApi.getFolio(folioId, () => null as any)
      .then((f: BackendFolioDetail | null) => { if (f) setFolio(f); })
      .catch(() => {});
  }, [folioId]);

  useEffect(() => { fetchFolio(); }, [fetchFolio]);

  const settled = folio?.status === 'SETTLED';
  const waiveed = folio?.status === 'WAIVED';
  const isDone = settled || waiveed;

  const handleAdd = () => {
    if (!desc.trim() || !amount.trim()) return;
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;
    staffApi.addFolioCharge(folioId!, { description: desc.trim(), amount: num, category: cat }, () => null)
      .then(() => { setDesc(''); setAmount(''); setShowAdd(false); fetchFolio(); })
      .catch(() => {});
  };

  const handleSettle = () => {
    Alert.alert('Settle Folio', 'Settle all charges on this folio?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Settle', onPress: () => staffApi.settleFolio(folioId!, () => null).then(() => fetchFolio()).catch(() => {}) },
    ]);
  };

  const handleWaive = () => {
    Alert.alert('Waive All', 'Waive all charges on this folio?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Waive', style: 'destructive', onPress: () => staffApi.waiveFolio(folioId!, () => null).then(() => fetchFolio()).catch(() => {}) },
    ]);
  };

  const charges = folio?.charges || [];
  const subtotal = parseFloat(folio?.subtotal || '0');
  const tax = parseFloat(folio?.tax || '0');
  const discount = parseFloat(folio?.discount || '0');
  const total = parseFloat(folio?.total || '0');

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}><Ionicons name="arrow-back" size={18} color={GRAY[500]} /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{guestName || 'Guest'}</Text>
          <Text style={s.sub}>{bookingRef || ''}</Text>
        </View>
        {isDone && (
          <View style={[s.badge, { backgroundColor: settled ? EMERALD[500] + '18' : RED[500] + '18' }]}>
            <Text style={[s.badgeText, { color: settled ? EMERALD[500] : RED[500] }]}>{settled ? 'SETTLED' : 'WAIVED'}</Text>
          </View>
        )}
      </View>

      <View style={s.body}>
        <View style={s.card}>
          <Text style={s.cardTitle}>Charges</Text>
          {charges.length === 0 ? (
            <View style={{ padding: SPACING.lg, alignItems: 'center' }}><Text style={{ ...TYPOGRAPHY.body, color: GRAY[400] }}>No charges yet</Text></View>
          ) : (
            charges.map((c) => {
              const catInfo = CAT_MAP[c.category] || CAT_MAP.OTHER;
              return (
                <View key={c.id} style={s.chargeRow}>
                  <View style={[s.catDot, { backgroundColor: catInfo.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.chargeDesc}>{c.description}</Text>
                    <Text style={s.chargeMeta}>{c.posted_by_name || c.posted_by || ''}</Text>
                  </View>
                  <Text style={s.chargeAmount}>₹{parseFloat(c.amount).toLocaleString()}</Text>
                </View>
              );
            })
          )}
        </View>

        <TouchableOpacity onPress={() => setShowAdd(!showAdd)} style={s.addToggle}>
          <Ionicons name={showAdd ? 'remove-circle' : 'add-circle'} size={18} color={SRS.teal} />
          <Text style={s.addToggleText}>{showAdd ? 'Cancel' : 'Add Charge'}</Text>
        </TouchableOpacity>

        {showAdd && (
          <View style={s.card}>
            <Text style={s.cardTitle}>New Charge</Text>
            <TextInput placeholder="Description" placeholderTextColor={GRAY[400]} value={desc} onChangeText={setDesc} style={s.input} />
            <TextInput placeholder="Amount" placeholderTextColor={GRAY[400]} value={amount} onChangeText={setAmount} keyboardType="numeric" style={s.input} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: SPACING.sm }}>
              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity key={c.key} onPress={() => setCat(c.key)}
                    style={[s.catChip, { backgroundColor: cat === c.key ? c.color + '18' : GRAY[50], borderColor: cat === c.key ? c.color : GRAY[200] }]}>
                    <Text style={[s.catChipText, { color: cat === c.key ? c.color : GRAY[600] }]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity onPress={handleAdd} style={[s.addBtn, { opacity: desc.trim() && amount.trim() ? 1 : 0.5 }]}>
              <Ionicons name="add-circle" size={16} color={BG.white} />
              <Text style={s.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        )}

        {folio && (
          <View style={s.card}>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Subtotal</Text><Text style={s.summaryValue}>₹{subtotal.toLocaleString()}</Text></View>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Tax (12%)</Text><Text style={s.summaryValue}>₹{tax.toLocaleString()}</Text></View>
            {discount > 0 && <View style={s.summaryRow}><Text style={s.summaryLabel}>Discount</Text><Text style={[s.summaryValue, { color: SRS.green }]}>-₹{discount.toLocaleString()}</Text></View>}
            <View style={[s.summaryRow, { borderTopWidth: 1, borderTopColor: GRAY[100], paddingTop: SPACING.sm, marginTop: SPACING.xs }]}>
              <Text style={{ ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy }}>Total</Text>
              <Text style={{ ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.teal }}>₹{total.toLocaleString()}</Text>
            </View>
          </View>
        )}

        {!isDone && charges.length > 0 && (
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <TouchableOpacity onPress={handleSettle} style={s.settleBtn}><Ionicons name="checkmark-circle" size={16} color={BG.white} /><Text style={s.settleBtnText}>Settle</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleWaive} style={s.waiveBtn}><Text style={s.waiveBtnText}>Waive All</Text></TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.xs, gap: SPACING.md },
  backBtn: { width: 36, height: 36, borderRadius: RADIUS.card, backgroundColor: BG.white, alignItems: 'center', justifyContent: 'center' },
  title: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy },
  sub: { ...TYPOGRAPHY.small, color: GRAY[500] },
  badge: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: RADIUS.badge },
  badgeText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  body: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, gap: SPACING.md },
  card: { backgroundColor: BG.white, borderRadius: RADIUS.card, padding: SPACING.lg, borderWidth: 1, borderColor: GRAY[100] },
  cardTitle: { ...TYPOGRAPHY.small, fontWeight: '700', color: SRS.navy, marginBottom: SPACING.md },
  chargeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, gap: SPACING.md },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  chargeDesc: { ...TYPOGRAPHY.body, color: SRS.navy },
  chargeMeta: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  chargeAmount: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy },
  addToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SPACING.sm, gap: SPACING.xs },
  addToggleText: { ...TYPOGRAPHY.small, color: SRS.teal, fontWeight: '600' },
  input: { backgroundColor: GRAY[50], borderWidth: 1, borderColor: GRAY[200], borderRadius: RADIUS.card, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: SRS.navy, marginBottom: SPACING.sm },
  catChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.card, borderWidth: 1 },
  catChipText: { fontSize: 11, fontWeight: '600' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: 12, borderRadius: RADIUS.card, backgroundColor: SRS.teal, marginTop: SPACING.sm },
  addBtnText: { fontSize: 14, fontWeight: '700', color: BG.white },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  summaryLabel: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  summaryValue: { ...TYPOGRAPHY.caption, color: SRS.navy },
  settleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: 14, borderRadius: RADIUS.card, backgroundColor: EMERALD[500] },
  settleBtnText: { fontSize: 14, fontWeight: '700', color: BG.white },
  waiveBtn: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.card, alignItems: 'center', borderWidth: 1.5, borderColor: RED[500] },
  waiveBtnText: { fontSize: 14, fontWeight: '700', color: RED[500] },
});
