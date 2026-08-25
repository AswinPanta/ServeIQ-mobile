import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { useFrontDesk } from '@/lib/context/frontdesk-context';
import { useAuth } from '@/lib/context/auth-context';
import { useFolioStore } from '@/stores/useFolioStore';
import { useActivityStore } from '@/stores/useActivityStore';
import { useShiftStore } from '@/stores/useShiftStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useGuestStore } from '@/stores/useGuestStore';
import { useHousekeepingStore } from '@/stores/useHousekeepingStore';
import { Stepper } from '@/components/ui/Stepper';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { safeGoBack } from "@/lib/utils";
import { BLUE, PURPLE, STATUS_COLORS, PINK, BG, FLAT } from '@/lib/constants/figma-tokens';
;
;

const STEPS = [
  { label: 'Search', description: 'Find guest' },
  { label: 'Folio', description: 'Review charges' },
  { label: 'Payment', description: 'Choose method' },
  { label: 'Done', description: 'Complete' },
];

const CATEGORY_ICONS: Record<string, string> = { room: 'room', restaurant: 'food', minibar: 'drink', laundry: 'laundry', service: 'room.maintenance', other: 'folder' };
const CATEGORY_LABELS: Record<string, string> = { room: 'Room', restaurant: 'Restaurant', minibar: 'Minibar', laundry: 'Laundry', service: 'Service', other: 'Other' };

export default function CheckOutScreen() {
  const { rooms, bookings, updateRoomStatus, checkOut: frontDeskCheckOut } = useFrontDesk();
  const { user } = useAuth();
  const operator = user as { property_id?: string } | null;
  const checkedInGuests = useMemo(() => bookings.filter((b) => b.status === 'checked_in'), [bookings]);

  const [step, setStep] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<typeof checkedInGuests[0] | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');

  const filtered = search ? checkedInGuests.filter((g) => { const q = search.toLowerCase(); return g.guest_name.toLowerCase().includes(q) || g.email.toLowerCase().includes(q) || g.ref.toLowerCase().includes(q) || (g.phone && g.phone.toLowerCase().includes(q)) || g.checkin.toLowerCase().includes(q) || (g.room_number && g.room_number.toLowerCase().includes(q)); }) : [];
  const folio = selectedBooking ? useFolioStore.getState().getFolio(selectedBooking.ref) : undefined;

  const categoryGroups: Record<string, { description: string; amount: number }[]> = {};
  if (folio) folio.charges.forEach((c) => { if (!categoryGroups[c.category]) categoryGroups[c.category] = []; categoryGroups[c.category].push({ description: c.description, amount: c.amount }); });

  const handleSelectGuest = (g: typeof checkedInGuests[0]) => { setSelectedBooking(g); setSearch(g.guest_name); setStep(1); };

  const handleComplete = () => {
    if (!selectedBooking || !paymentMethod) return;
    const room = rooms.find((r) => r.room_number === selectedBooking.room_number);
    // Use the front desk context's checkOut method to properly transition booking to checked_out
    // (also marks room as dirty, updates booking status to checked_out, and calls the API)
    frontDeskCheckOut(selectedBooking.id, selectedBooking.room_number!);
    useFolioStore.getState().settleFolio(selectedBooking.ref);
    useActivityStore.getState().addActivity({ type: 'checkout', title: `${selectedBooking.guest_name} checked out`, description: `Room ${selectedBooking.room_number} - ${paymentMethod.toUpperCase()}`, icon: '🚪', color: BLUE[500], property_id: operator?.property_id || 'prop-1' });
    useShiftStore.getState().incrementCheckOuts();
    useShiftStore.getState().addRevenue(folio?.total || 0);
    const guestFound = useGuestStore.getState().findGuest(selectedBooking.guest_name);
    if (guestFound.length > 0) useGuestStore.getState().recordStay(guestFound[0].id, folio?.total || 0);
    useHousekeepingStore.getState().createTask({ room: selectedBooking.room_number || '', floor: room?.floor || 1, status: 'Dirty', priority: 'High', cleaner: 'Unassigned', lastCleaned: 'Today', taskType: 'turnover', property_id: operator?.property_id || 'prop-1' });
    useNotificationStore.getState().addNotification({ type: 'hk_alert', title: 'Room ready for cleaning', message: `Room ${selectedBooking.room_number} needs cleaning after checkout`, data: { roomNumber: selectedBooking.room_number || '' } });
    useActivityStore.getState().addActivity({ type: 'email', title: `Post-stay review requested — Email queued for ${selectedBooking.guest_name}`, icon: '✉️', color: PURPLE[500], property_id: operator?.property_id || 'prop-1' });
    useNotificationStore.getState().addNotification({ type: 'system', title: 'Review Request', message: `Post-stay review email queued for ${selectedBooking.guest_name}` });
    Alert.alert('Review Request', 'Check-out complete! Review request will be sent to guest.');
    setStep(3);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}><IconSymbol name="arrow.back" size={18} color={GRAY[500]} /></TouchableOpacity>
        <Text style={s.title}>Check-out</Text>
        <Text style={s.sub}>Process guest departure</Text>
      </View>
      <Stepper steps={STEPS} currentStep={step} onStepPress={(i) => i < step && setStep(i)} />
      <View style={s.body}>
        {step === 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Search Checked-in Guest</Text>
            <TextInput placeholder="Search by name or room number..." placeholderTextColor={GRAY[400]} value={search} onChangeText={setSearch} autoFocus style={s.input} />
            {filtered.length === 0 && search.length > 0 && <Text style={s.empty}>No checked-in guests found</Text>}
            {filtered.map((g) => (
              <TouchableOpacity key={g.ref} onPress={() => handleSelectGuest(g)} style={s.guestRow}>
                <View style={s.guestRoom}><Text style={{ fontSize: 14, fontWeight: '700', color: STATUS_COLORS.occupied }}>{g.room_number || '-'}</Text></View>
                <View style={{ flex: 1 }}><Text style={s.guestName}>{g.guest_name}</Text><Text style={s.guestMeta}>{g.ref} · {g.checkin} → {g.checkout}</Text></View>
                <StatusBadge label="In House" color={SRS.green} size="sm" />
              </TouchableOpacity>
            ))}
          </View>
        )}
        {step === 1 && selectedBooking && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Guest Folio</Text>
            <Text style={{ ...TYPOGRAPHY.small, color: GRAY[500], marginBottom: SPACING.md }}>{selectedBooking.guest_name} · Room {selectedBooking.room_number} · {selectedBooking.ref}</Text>
            {Object.keys(categoryGroups).length === 0 ? (
              <View style={{ padding: SPACING.lg, alignItems: 'center' }}><Text style={{ ...TYPOGRAPHY.body, color: GRAY[400] }}>No charges on this folio</Text></View>
            ) : (
              Object.entries(categoryGroups).map(([category, charges]) => (
                <View key={category} style={{ marginBottom: SPACING.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs }}>
                    <IconSymbol name={(CATEGORY_ICONS[category] || 'folder') as any} size={14} color={SRS.teal} />
                    <Text style={{ ...TYPOGRAPHY.small, fontWeight: '700', color: SRS.navy }}>{CATEGORY_LABELS[category] || category}</Text>
                  </View>
                  {charges.map((c, i) => (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 24, paddingVertical: 2 }}>
                      <Text style={{ ...TYPOGRAPHY.caption, color: GRAY[500] }}>{c.description}</Text>
                      <Text style={{ ...TYPOGRAPHY.caption, fontWeight: '600', color: SRS.navy }}>₹{c.amount.toLocaleString()}</Text>
                    </View>
                  ))}
                </View>
              ))
            )}
            {folio && (
              <View style={{ borderTopWidth: 1, borderTopColor: GRAY[100], paddingTop: SPACING.md, gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ ...TYPOGRAPHY.caption, color: GRAY[500] }}>Subtotal</Text><Text style={{ ...TYPOGRAPHY.caption, color: SRS.navy }}>₹{folio.subtotal.toLocaleString()}</Text></View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ ...TYPOGRAPHY.caption, color: GRAY[500] }}>Tax (12%)</Text><Text style={{ ...TYPOGRAPHY.caption, color: SRS.navy }}>₹{folio.tax.toLocaleString()}</Text></View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: GRAY[100], paddingTop: SPACING.sm }}>
                  <Text style={{ ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy }}>Total</Text>
                  <Text style={{ ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.teal }}>₹{folio.total.toLocaleString()}</Text>
                </View>
              </View>
            )}
            {/* Quick Charges */}
            <View style={{ borderTopWidth: 1, borderTopColor: GRAY[200], marginTop: SPACING.lg, paddingTop: SPACING.lg }}>
              <Text style={{ ...TYPOGRAPHY.small, fontWeight: '700', color: SRS.navy, marginBottom: SPACING.sm }}>Quick Charge</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
                {[{ label: 'Minibar', amount: 500, category: 'minibar' as const, color: SRS.orange }, { label: 'Laundry', amount: 300, category: 'laundry' as const, color: STATUS_COLORS.occupied }, { label: 'Breakfast', amount: 400, category: 'restaurant' as const, color: SRS.green }, { label: 'Dinner', amount: 800, category: 'restaurant' as const, color: STATUS_COLORS.inspected }, { label: 'Spa', amount: 1500, category: 'service' as const, color: PINK[500] }, { label: 'Extra Bed', amount: 1000, category: 'other' as const, color: GRAY[500] }].map((item) => (
                  <TouchableOpacity key={item.label} onPress={() => { useFolioStore.getState().addCharge(selectedBooking.ref, { description: item.label, amount: item.amount, category: item.category }); Alert.alert('Charge Added', `${item.label} (₹${item.amount}) posted to folio`); }}
                    style={{ paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.card, backgroundColor: item.color + '12', borderWidth: 1, borderColor: item.color + '25' }}
                  ><Text style={{ fontSize: 11, fontWeight: '600', color: item.color }}>{item.label} ₹{item.amount}</Text></TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
        {step === 2 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Payment Method</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md }}>
              {[{ id: 'card', label: 'Card', icon: 'payment', color: SRS.teal }, { id: 'cash', label: 'Cash', icon: 'wallet', color: SRS.green }, { id: 'upi', label: 'UPI', icon: 'qr.code', color: STATUS_COLORS.inspected }, { id: 'wallet', label: 'Wallet', icon: 'wallet', color: SRS.orange }].map((pm) => (
                <TouchableOpacity key={pm.id} onPress={() => setPaymentMethod(pm.id)}
                  style={[s.paymentOption, { backgroundColor: paymentMethod === pm.id ? pm.color + '12' : GRAY[50], borderColor: paymentMethod === pm.id ? pm.color : GRAY[200] }]}
                >
                  <IconSymbol name={pm.icon as any} size={28} color={paymentMethod === pm.id ? pm.color : GRAY[500]} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: paymentMethod === pm.id ? pm.color : GRAY[600], marginTop: 4 }}>{pm.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        {step === 3 && selectedBooking && (
          <View style={doneStyles.container}>
            <View style={doneStyles.iconWrap}><IconSymbol name="check" size={36} color={SRS.green} /></View>
            <Text style={doneStyles.title}>✓ Checked Out Successfully</Text>
            <View style={doneStyles.receipt}>
              <Text style={doneStyles.receiptTitle}>ServeIQ Hotel</Text>
              <View style={{ gap: 6, marginBottom: SPACING.md }}>
                <View style={doneStyles.receiptRow}><Text style={doneStyles.receiptLabel}>Guest</Text><Text style={doneStyles.receiptValue}>{selectedBooking.guest_name}</Text></View>
                <View style={doneStyles.receiptRow}><Text style={doneStyles.receiptLabel}>Room</Text><Text style={[doneStyles.receiptValue, { color: SRS.teal }]}>{selectedBooking.room_number}</Text></View>
                <View style={doneStyles.receiptRow}><Text style={doneStyles.receiptLabel}>Ref</Text><Text style={{ ...TYPOGRAPHY.caption, color: GRAY[500] }}>{selectedBooking.ref}</Text></View>
              </View>
              <View style={{ borderTopWidth: 1, borderTopColor: GRAY[100], paddingTop: SPACING.md }}>
                {Object.entries(categoryGroups).length > 0 ? (
                  Object.entries(categoryGroups).map(([cat, charges]) => (
                    <View key={cat} style={{ marginBottom: 6 }}>
                      <Text style={{ ...TYPOGRAPHY.caption, fontWeight: '600', color: SRS.navy, marginBottom: 2 }}>{CATEGORY_LABELS[cat] || cat}</Text>
                      {charges.map((c, i) => <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 16, paddingVertical: 1 }}><Text style={{ ...TYPOGRAPHY.caption, color: GRAY[500] }}>{c.description}</Text><Text style={{ ...TYPOGRAPHY.caption, fontWeight: '600', color: SRS.navy }}>₹{c.amount.toLocaleString()}</Text></View>)}
                    </View>
                  ))
                ) : <Text style={{ ...TYPOGRAPHY.small, color: GRAY[400], textAlign: 'center', paddingVertical: SPACING.sm }}>No charges on folio</Text>}
                {folio && (
                  <View style={{ borderTopWidth: 1, borderTopColor: GRAY[100], marginTop: 6, paddingTop: 6, gap: 2 }}>
                    <View style={doneStyles.receiptRow}><Text style={{ ...TYPOGRAPHY.caption, color: GRAY[500] }}>Subtotal</Text><Text style={{ ...TYPOGRAPHY.caption, color: SRS.navy }}>₹{folio.subtotal.toLocaleString()}</Text></View>
                    <View style={doneStyles.receiptRow}><Text style={{ ...TYPOGRAPHY.caption, color: GRAY[500] }}>Tax (12%)</Text><Text style={{ ...TYPOGRAPHY.caption, color: SRS.navy }}>₹{folio.tax.toLocaleString()}</Text></View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: GRAY[100], paddingTop: 4, marginTop: 4 }}>
                      <Text style={{ ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy }}>Total</Text>
                      <Text style={{ ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.teal }}>₹{folio.total.toLocaleString()}</Text>
                    </View>
                  </View>
                )}
              </View>
              <View style={{ borderTopWidth: 1, borderTopColor: GRAY[100], paddingTop: SPACING.md, marginTop: SPACING.md, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ ...TYPOGRAPHY.caption, color: GRAY[500] }}>Payment</Text>
                <Text style={{ ...TYPOGRAPHY.small, fontWeight: '600', color: SRS.navy }}>{paymentMethod.toUpperCase()}</Text>
              </View>
            </View>
            <View style={doneStyles.hkBanner}>
              <IconSymbol name="cleaning" size={18} color={SRS.orange} />
              <View style={{ flex: 1 }}><Text style={{ ...TYPOGRAPHY.small, fontWeight: '600', color: SRS.navy }}>Housekeeping Notified</Text><Text style={{ ...TYPOGRAPHY.caption, color: GRAY[500] }}>Room {selectedBooking.room_number} marked for cleaning</Text></View>
            </View>
            <TouchableOpacity onPress={() => safeGoBack()} style={doneStyles.doneBtn}><Text style={doneStyles.doneBtnText}>Done</Text></TouchableOpacity>
          </View>
        )}
        {step > 0 && step < 3 && (
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <TouchableOpacity onPress={() => setStep(step - 1)} style={navStyles.back}><Text style={navStyles.backText}>Back</Text></TouchableOpacity>
            {step === 1 && <TouchableOpacity onPress={() => setStep(2)} style={navStyles.next}><Text style={navStyles.nextText}>Continue</Text></TouchableOpacity>}
            {step === 2 && <TouchableOpacity onPress={() => paymentMethod ? handleComplete() : Alert.alert('Select Payment', 'Please choose a payment method')} style={[navStyles.next, { backgroundColor: paymentMethod ? SRS.teal : GRAY[300] }]}><Text style={navStyles.nextText}>Process Check-out</Text></TouchableOpacity>}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.xs },
  backBtn: { width: 36, height: 36, borderRadius: RADIUS.card, backgroundColor: BG.white, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  title: { ...TYPOGRAPHY.h2, color: SRS.navy },
  sub: { ...TYPOGRAPHY.small, color: GRAY[500], marginTop: 2 },
  body: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xs, gap: SPACING.lg },
  card: { backgroundColor: BG.white, borderRadius: RADIUS.card, padding: SPACING.lg, borderWidth: 1, borderColor: GRAY[100] },
  cardTitle: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy, marginBottom: SPACING.md },
  input: { backgroundColor: GRAY[50], borderWidth: 1, borderColor: GRAY[200], borderRadius: RADIUS.card, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: SRS.navy },
  empty: { ...TYPOGRAPHY.small, color: GRAY[400], textAlign: 'center', paddingVertical: SPACING.lg },
  guestRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, marginTop: SPACING.sm, borderRadius: RADIUS.card, backgroundColor: SRS.teal + '08', borderWidth: 1, borderColor: SRS.teal + '18' },
  guestRoom: { width: 40, height: 40, borderRadius: RADIUS.card, backgroundColor: FLAT.blue + '12', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  guestName: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy },
  guestMeta: { ...TYPOGRAPHY.small, color: GRAY[500] },
  paymentOption: { width: '47%', padding: SPACING.lg, borderRadius: RADIUS.card, alignItems: 'center', borderWidth: 2 },
});

const doneStyles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: SPACING.xl, paddingHorizontal: SPACING.lg },
  iconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: SRS.green + '18', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  title: { fontSize: 16, fontWeight: '700', color: SRS.green, textAlign: 'center' },
  receipt: { backgroundColor: BG.white, borderRadius: RADIUS.card, padding: SPACING.lg, borderWidth: 1, borderColor: GRAY[100], width: '100%', marginTop: SPACING.lg, marginBottom: SPACING.md },
  receiptTitle: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy, textAlign: 'center', marginBottom: SPACING.md },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between' },
  receiptLabel: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  receiptValue: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy },
  hkBanner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: 14, borderRadius: RADIUS.card, backgroundColor: SRS.orange + '10', borderWidth: 1, borderColor: SRS.orange + '20', width: '100%', marginBottom: SPACING.lg },
  doneBtn: { paddingVertical: 14, paddingHorizontal: 48, borderRadius: RADIUS.card, backgroundColor: SRS.teal, alignItems: 'center' },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: BG.white },
});

const navStyles = StyleSheet.create({
  back: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.card, alignItems: 'center', backgroundColor: GRAY[100] },
  backText: { fontSize: 14, fontWeight: '600', color: GRAY[600] },
  next: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.card, alignItems: 'center', backgroundColor: SRS.teal },
  nextText: { fontSize: 14, fontWeight: '700', color: BG.white },
});