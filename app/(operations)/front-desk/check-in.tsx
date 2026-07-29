import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, STATUS_COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { useFrontDesk } from '@/lib/context/frontdesk-context';
import { useActivityStore } from '@/stores/useActivityStore';
import { useShiftStore } from '@/stores/useShiftStore';
import { Stepper } from '@/components/ui/Stepper';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { safeGoBack } from "@/lib/utils";

const STEPS = [
  { label: 'Search', description: 'Find guest' },
  { label: 'Details', description: 'Verify guest' },
  { label: 'Room', description: 'Assign room' },
  { label: 'Payment', description: 'Collect balance' },
  { label: 'Review', description: 'Confirm' },
  { label: 'Done', description: 'Complete' },
];

const ROOM_TYPE_COLORS: Record<string, string> = {
  suite: STATUS_COLORS.inspected,
  deluxe: SRS.orange,
};

export default function CheckInScreen() {
  const { rooms, bookings, checkIn: contextCheckIn } = useFrontDesk();
  const arrivingGuests = useMemo(() => bookings.filter((b) => b.status === 'confirmed'), [bookings]);

  const [step, setStep] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<typeof arrivingGuests[0] | null>(null);
  const [idVerified, setIdVerified] = useState(false);
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('');
  const [balanceCollected, setBalanceCollected] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  const filtered = search
    ? arrivingGuests.filter((g) => {
        const q = search.toLowerCase();
        return g.guest_name.toLowerCase().includes(q) || g.email.toLowerCase().includes(q) || g.ref.toLowerCase().includes(q) || (g.phone && g.phone.toLowerCase().includes(q)) || g.checkin.toLowerCase().includes(q);
      })
    : [];

  const availableRooms = rooms.filter((r) => r.status === 'available');
  const suggestedRooms = selectedBooking ? availableRooms.filter((r) => r.room_type === selectedBooking.room_type) : [];
  const otherRooms = availableRooms.filter((r) => !suggestedRooms.includes(r));

  const roomTypeColor = ROOM_TYPE_COLORS[selectedBooking?.room_type?.toLowerCase() || ''] || SRS.green;

  const handleSelectGuest = (g: typeof arrivingGuests[0]) => {
    setSelectedBooking(g);
    setSearch(g.guest_name);
    setStep(1);
  };

  const handleComplete = () => {
    if (!selectedBooking || !selectedRoomNumber) return;
    const room = rooms.find((r) => r.room_number === selectedRoomNumber);
    if (!room) return;
    contextCheckIn(selectedBooking, selectedRoomNumber);
    useActivityStore.getState().addActivity({ type: 'checkin', title: `${selectedBooking.guest_name} checked in`, description: `Room ${selectedRoomNumber} - ${selectedBooking.room_type}`, icon: '🔑', color: SRS.green });
    useShiftStore.getState().incrementCheckIns();
    setStep(5);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={styles.backBtn}>
          <IconSymbol name="arrow.back" size={18} color={GRAY[500]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Check-in</Text>
        <Text style={styles.headerSub}>Process guest arrival</Text>
      </View>

      <Stepper steps={STEPS} currentStep={step} onStepPress={(i) => i < step && setStep(i)} />

      <View style={styles.body}>
        {/* Step 0: Search */}
        {step === 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Search Guest or Booking</Text>
            <TextInput placeholder="Search by name, email, booking ref, phone..." placeholderTextColor={GRAY[400]} value={search} onChangeText={setSearch} autoFocus style={styles.input} />
            {filtered.length === 0 && search.length > 0 && <Text style={styles.emptyText}>No arriving guests found</Text>}
            {filtered.map((g) => (
              <TouchableOpacity key={g.ref} onPress={() => handleSelectGuest(g)} style={styles.guestRow}>
                <View style={styles.guestAvatar}><Text style={[styles.guestInitial, { color: SRS.teal }]}>{g.guest_name.charAt(0)}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.guestName}>{g.guest_name}</Text>
                  <Text style={styles.guestMeta}>{g.email} · {g.ref}</Text>
                </View>
                <StatusBadge label={g.room_type} color={roomTypeColor} size="sm" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 1: Details */}
        {step === 1 && selectedBooking && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Guest Details</Text>
            <View style={{ gap: 10 }}>
              {[
                { label: 'Name', value: selectedBooking.guest_name, bold: true },
                { label: 'Email', value: selectedBooking.email },
                { label: 'Phone', value: selectedBooking.phone || '—', accent: false },
                { label: 'Booking', value: selectedBooking.ref, accent: true },
              ].map((r) => (
                <View key={r.label} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{r.label}</Text>
                  <Text style={[styles.detailValue, r.bold && { fontWeight: '700' }, r.accent && { color: SRS.teal }]}>{r.value}</Text>
                </View>
              ))}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Room Type</Text>
                <StatusBadge label={selectedBooking.room_type} color={roomTypeColor} size="sm" />
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Dates</Text>
                <Text style={styles.detailValue}>{selectedBooking.checkin} → {selectedBooking.checkout}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setIdVerified(!idVerified)} style={[styles.checkRow, { borderColor: idVerified ? SRS.green : GRAY[200] }]}>
              <View style={[styles.checkbox, { backgroundColor: idVerified ? SRS.green : 'transparent', borderColor: idVerified ? SRS.green : GRAY[300] }]}>
                {idVerified && <IconSymbol name="check" size={14} color="#FFF" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.checkLabel}>ID Verified</Text>
                <Text style={styles.checkSub}>Guest identification confirmed</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Room Assignment */}
        {step === 2 && selectedBooking && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Assign Room</Text>
            <Text style={{ ...TYPOGRAPHY.small, color: GRAY[500], marginBottom: SPACING.md }}>
              Guest booked: <Text style={{ fontWeight: '600', color: SRS.navy }}>{selectedBooking.room_type}</Text>
            </Text>
            {suggestedRooms.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>✦ Suggested ({selectedBooking.room_type})</Text>
                <View style={styles.roomOptions}>
                  {suggestedRooms.map((r) => (
                    <TouchableOpacity key={r.id} onPress={() => setSelectedRoomNumber(r.room_number)}
                      style={[styles.roomChip, { backgroundColor: selectedRoomNumber === r.room_number ? roomTypeColor : roomTypeColor + '12', borderColor: selectedRoomNumber === r.room_number ? roomTypeColor : roomTypeColor + '25' }]}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '700', color: selectedRoomNumber === r.room_number ? '#FFF' : roomTypeColor }}>{r.room_number}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            {otherRooms.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: GRAY[500] }]}>Other Available Rooms</Text>
                <View style={styles.roomOptions}>
                  {otherRooms.map((r) => (
                    <TouchableOpacity key={r.id} onPress={() => setSelectedRoomNumber(r.room_number)}
                      style={[styles.roomChip, { backgroundColor: selectedRoomNumber === r.room_number ? SRS.teal : SRS.teal + '10', borderColor: selectedRoomNumber === r.room_number ? SRS.teal : GRAY[200] }]}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '700', color: selectedRoomNumber === r.room_number ? '#FFF' : SRS.teal }}>{r.room_number}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            {availableRooms.length === 0 && <Text style={styles.emptyText}>No available rooms</Text>}
          </View>
        )}

        {/* Step 3: Payment */}
        {step === 3 && selectedBooking && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Outstanding Balance</Text>
            {(selectedBooking.balance || 0) > 0 ? (
              <>
                <View style={styles.balanceBox}>
                  <Text style={styles.balanceLabel}>Amount Due</Text>
                  <Text style={styles.balanceAmount}>₹{selectedBooking.balance?.toLocaleString()}</Text>
                </View>
                <Text style={{ ...TYPOGRAPHY.small, fontWeight: '600', color: SRS.navy, marginBottom: SPACING.sm }}>Payment Method</Text>
                <View style={styles.paymentGrid}>
                  {[{ id: 'card', label: 'Card' }, { id: 'cash', label: 'Cash' }, { id: 'upi', label: 'UPI' }, { id: 'wallet', label: 'Wallet' }].map((pm) => (
                    <TouchableOpacity key={pm.id} onPress={() => setPaymentMethod(pm.id)}
                      style={[styles.paymentBtn, { backgroundColor: paymentMethod === pm.id ? '#2980B912' : GRAY[100], borderColor: paymentMethod === pm.id ? '#2980B9' : GRAY[200] }]}
                    >
                      <IconSymbol name={pm.id as any} size={24} color={paymentMethod === pm.id ? '#2980B9' : GRAY[500]} />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: paymentMethod === pm.id ? '#2980B9' : GRAY[600] }}>{pm.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {balanceCollected ? (
                  <View style={styles.collectedBox}>
                    <IconSymbol name="check" size={16} color={SRS.green} />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: SRS.green, marginLeft: SPACING.sm }}>Balance Collected</Text>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => { if (!paymentMethod) { Alert.alert('Select Payment', 'Please choose a payment method'); return; } setBalanceCollected(true); }} style={styles.collectBtn}>
                    <Text style={styles.collectBtnText}>Collect Payment</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={{ padding: SPACING.xl, alignItems: 'center' }}>
                <IconSymbol name="check" size={32} color={SRS.green} />
                <Text style={{ fontSize: 15, fontWeight: '700', color: SRS.green, marginTop: SPACING.sm }}>No Outstanding Balance</Text>
                <Text style={{ ...TYPOGRAPHY.small, color: GRAY[500] }}>Booking is fully paid</Text>
              </View>
            )}
          </View>
        )}

        {/* Step 4: Review */}
        {step === 4 && selectedBooking && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Review Summary</Text>
            <View style={{ gap: 10, marginBottom: SPACING.lg }}>
              {[
                { label: 'Guest', value: selectedBooking.guest_name, bold: true },
                { label: 'Room', value: selectedRoomNumber, accent: true },
                { label: 'Type', value: selectedBooking.room_type },
                { label: 'Check-in', value: selectedBooking.checkin },
                { label: 'Check-out', value: selectedBooking.checkout },
                { label: 'Balance', value: (selectedBooking.balance || 0) === 0 || balanceCollected ? '✓ Paid' : `₹${selectedBooking.balance?.toLocaleString()}`, paid: true },
                { label: 'ID Verified', value: idVerified ? 'Yes' : 'No', verified: idVerified },
              ].map((r) => (
                <View key={r.label} style={[styles.reviewRow, { borderBottomWidth: 1, borderBottomColor: GRAY[100] }]}>
                  <Text style={styles.reviewLabel}>{r.label}</Text>
                  <Text style={[styles.reviewValue, r.bold && { fontWeight: '700' }, r.accent && { color: SRS.teal }, r.paid && { color: (selectedBooking.balance || 0) === 0 || balanceCollected ? SRS.green : SRS.red }]}>
                    {r.value}
                  </Text>
                </View>
              ))}
            </View>
            <TouchableOpacity onPress={handleComplete} style={styles.confirmBtn} activeOpacity={0.85}>
              <Text style={styles.confirmBtnText}>Confirm Check-in</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 5: Done */}
        {step === 5 && selectedBooking && (
          <View style={styles.doneSection}>
            <View style={styles.doneIcon}>
              <IconSymbol name="check" size={36} color={SRS.green} />
            </View>
            <Text style={styles.doneTitle}>Check-in Complete</Text>
            <Text style={styles.doneDesc}>{selectedBooking.guest_name} → Room {selectedRoomNumber}</Text>
            <View style={styles.doneCard}>
              {[
                { label: 'Guest', value: selectedBooking.guest_name },
                { label: 'Room', value: selectedRoomNumber, accent: true },
                { label: 'Type', value: selectedBooking.room_type },
                { label: 'Ref', value: selectedBooking.ref, accent: true },
              ].map((r) => (
                <View key={r.label} style={styles.doneRow}>
                  <Text style={styles.doneRowLabel}>{r.label}</Text>
                  <Text style={[styles.doneRowValue, r.accent && { color: SRS.teal }]}>{r.value}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity onPress={() => safeGoBack()} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Navigation */}
        {step > 0 && step < 5 && (
          <View style={styles.navRow}>
            <TouchableOpacity onPress={() => setStep(step - 1)} style={styles.navBack}>
              <Text style={styles.navBackText}>Back</Text>
            </TouchableOpacity>
            {step === 1 && (
              <TouchableOpacity onPress={() => setStep(2)} style={styles.navNext}>
                <Text style={styles.navNextText}>Next</Text>
              </TouchableOpacity>
            )}
            {step === 2 && (
              <TouchableOpacity onPress={() => { if (!selectedRoomNumber) { Alert.alert('Select Room', 'Please assign a room'); return; } setStep((selectedBooking?.balance || 0) > 0 ? 3 : 4); }}
                style={[styles.navNext, { backgroundColor: selectedRoomNumber ? SRS.teal : GRAY[300] }]} disabled={!selectedRoomNumber}>
                <Text style={styles.navNextText}>Continue</Text>
              </TouchableOpacity>
            )}
            {step === 3 && (
              <TouchableOpacity onPress={() => { if ((selectedBooking?.balance || 0) > 0 && !balanceCollected) { Alert.alert('Collect Payment', 'Please collect the outstanding balance first'); return; } setStep(4); }}
                style={[styles.navNext, { backgroundColor: (balanceCollected || (selectedBooking?.balance || 0) === 0) ? SRS.teal : GRAY[300] }]}>
                <Text style={styles.navNextText}>Review</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.xs },
  backBtn: { width: 36, height: 36, borderRadius: RADIUS.card, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  headerTitle: { ...TYPOGRAPHY.h2, color: SRS.navy },
  headerSub: { ...TYPOGRAPHY.small, color: GRAY[500], marginTop: 2 },
  body: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xs, gap: SPACING.lg },
  card: { backgroundColor: '#FFF', borderRadius: RADIUS.card, padding: SPACING.lg, borderWidth: 1, borderColor: GRAY[100] },
  cardTitle: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy, marginBottom: SPACING.md },
  input: { backgroundColor: GRAY[50], borderWidth: 1, borderColor: GRAY[200], borderRadius: RADIUS.card, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: SRS.navy },
  emptyText: { ...TYPOGRAPHY.small, color: GRAY[400], textAlign: 'center', paddingVertical: SPACING.lg },
  guestRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, marginTop: SPACING.sm, borderRadius: RADIUS.card, backgroundColor: SRS.teal + '08', borderWidth: 1, borderColor: SRS.teal + '18' },
  guestAvatar: { width: 40, height: 40, borderRadius: RADIUS.card, backgroundColor: SRS.teal + '12', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  guestInitial: { fontSize: 15, fontWeight: '700' },
  guestName: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy },
  guestMeta: { ...TYPOGRAPHY.small, color: GRAY[500] },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  detailLabel: { ...TYPOGRAPHY.small, color: GRAY[500] },
  detailValue: { ...TYPOGRAPHY.body, color: SRS.navy },
  checkRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.card, marginTop: SPACING.md, borderWidth: 1.5, backgroundColor: GRAY[50] },
  checkbox: { width: 22, height: 22, borderRadius: RADIUS.button, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  checkLabel: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy },
  checkSub: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  sectionLabel: { ...TYPOGRAPHY.small, fontWeight: '600', color: SRS.green, marginBottom: SPACING.sm },
  roomOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  roomChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: RADIUS.card, borderWidth: 1.5 },
  balanceBox: { backgroundColor: '#FEF2F2', borderRadius: RADIUS.card, padding: 14, borderWidth: 1, borderColor: '#FCA5A5', marginBottom: SPACING.md },
  balanceLabel: { ...TYPOGRAPHY.caption, color: SRS.red },
  balanceAmount: { fontSize: 24, fontWeight: '700', color: SRS.red, marginTop: 2 },
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.md },
  paymentBtn: { width: '47%', padding: SPACING.lg, borderRadius: RADIUS.card, alignItems: 'center', borderWidth: 2, gap: 4 },
  collectedBox: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.card, backgroundColor: SRS.green + '10', borderWidth: 1, borderColor: SRS.green },
  collectBtn: { paddingVertical: 14, borderRadius: RADIUS.card, alignItems: 'center', backgroundColor: SRS.teal },
  collectBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm },
  reviewLabel: { ...TYPOGRAPHY.small, color: GRAY[500] },
  reviewValue: { ...TYPOGRAPHY.body, color: SRS.navy },
  confirmBtn: { paddingVertical: 14, borderRadius: RADIUS.card, alignItems: 'center', backgroundColor: SRS.teal },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  doneSection: { alignItems: 'center', paddingVertical: SPACING.xxl, paddingHorizontal: SPACING.lg },
  doneIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: SRS.green + '18', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  doneTitle: { ...TYPOGRAPHY.h3, color: SRS.navy, textAlign: 'center' },
  doneDesc: { ...TYPOGRAPHY.body, color: GRAY[500], textAlign: 'center', marginTop: 4, marginBottom: SPACING.xl },
  doneCard: { backgroundColor: '#FFF', borderRadius: RADIUS.card, padding: SPACING.lg, borderWidth: 1, borderColor: GRAY[100], width: '100%', gap: SPACING.sm },
  doneRow: { flexDirection: 'row', justifyContent: 'space-between' },
  doneRowLabel: { ...TYPOGRAPHY.small, color: GRAY[500] },
  doneRowValue: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy },
  doneBtn: { marginTop: SPACING.xl, paddingVertical: 14, paddingHorizontal: 48, borderRadius: RADIUS.card, backgroundColor: SRS.teal, alignItems: 'center' },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  navRow: { flexDirection: 'row', gap: SPACING.md },
  navBack: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.card, alignItems: 'center', backgroundColor: GRAY[100] },
  navBackText: { fontSize: 14, fontWeight: '600', color: GRAY[600] },
  navNext: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.card, alignItems: 'center' },
  navNextText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
