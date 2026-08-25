import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFrontDesk } from '@/lib/context/frontdesk-context';
import { useActivityStore } from '@/stores/useActivityStore';
import { useShiftStore } from '@/stores/useShiftStore';
import { SRS, BG, SLATE, BLUE, EMERALD, RED, AMBER } from '@/lib/constants/figma-tokens';
import { RADIUS, GRAY, SHADOWS } from '@/constants/portal-theme';
import { safeGoBack } from "@/lib/utils";

const DARK = SLATE[900];

const STEPS = [
  { label: 'Verify', description: 'Guest identity' },
  { label: 'Room', description: 'Assign room' },
  { label: 'Payment', description: 'Collect balance' },
  { label: 'Confirm', description: 'Complete' },
];

export default function CheckInScreen() {
  const { rooms, bookings, checkIn: contextCheckIn } = useFrontDesk();
  const arrivingGuests = useMemo(() => bookings.filter((b) => b.status === 'confirmed'), [bookings]);

  const [step, setStep] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<typeof arrivingGuests[0] | null>(null);
  const [idType, setIdType] = useState('Passport');
  const [idNumber, setIdNumber] = useState('');
  const [idVerified, setIdVerified] = useState(false);
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('');
  const [balanceCollected, setBalanceCollected] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [guestsCount, setGuestsCount] = useState(2);

  const filtered = search
    ? arrivingGuests.filter((g) => {
        const q = search.toLowerCase();
        return g.guest_name.toLowerCase().includes(q) || g.email.toLowerCase().includes(q) || g.ref.toLowerCase().includes(q) || (g.phone && g.phone.toLowerCase().includes(q));
      })
    : [];

  const availableRooms = rooms.filter((r) => r.status === 'available');
  const suggestedRooms = selectedBooking ? availableRooms.filter((r) => r.room_type === selectedBooking.room_type) : [];

  const handleSelectGuest = (g: typeof arrivingGuests[0]) => {
    setSelectedBooking(g);
    setSearch(g.guest_name);
    setStep(0);
  };

  const handleComplete = () => {
    if (!selectedBooking || !selectedRoomNumber) return;
    contextCheckIn(selectedBooking, selectedRoomNumber);
    useActivityStore.getState().addActivity({ type: 'checkin', title: `${selectedBooking.guest_name} checked in`, description: `Room ${selectedRoomNumber} - ${selectedBooking.room_type}`, icon: '🔑', color: SRS.green });
    useShiftStore.getState().incrementCheckIns();
    setStep(3);
  };

  const formatCheckTime = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · 2:30 PM';
    } catch { return date; }
  };

  const formatCheckOutTime = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · 11:00 AM';
    } catch { return date; }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={DARK} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Check-In</Text>
        </View>
        <View style={s.headerAvatar}>
          <Ionicons name="person" size={18} color={SLATE[400]} />
        </View>
      </View>

      {/* Stepper */}
      <View style={s.stepperContainer}>
        {STEPS.map((stepDef, i) => {
          const isActive = i === step;
          const isCompleted = i < step;
          return (
            <View key={i} style={s.stepItem}>
              <View style={[s.stepCircle, isCompleted && s.stepCircleCompleted, isActive && s.stepCircleActive]}>
                <Text style={[s.stepNumber, isCompleted && s.stepNumberCompleted, isActive && s.stepNumberActive]}>
                  {isCompleted ? '✓' : i + 1}
                </Text>
              </View>
              <Text style={[s.stepLabel, isActive && s.stepLabelActive]}>{stepDef.label}</Text>
              {i < STEPS.length - 1 && <View style={[s.stepLine, isCompleted && s.stepLineCompleted]} />}
            </View>
          );
        })}
      </View>

      {/* Selected Guest Summary */}
      {selectedBooking && (
        <View style={s.guestSummaryCard}>
          <View style={[s.guestAvatar, { backgroundColor: SRS.teal + '15' }]}>
            <Text style={[s.guestInitial, { color: SRS.teal }]}>{selectedBooking.guest_name.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={s.guestName}>{selectedBooking.guest_name}</Text>
              <View style={s.confirmedBadge}>
                <Text style={s.confirmedText}>Confirmed</Text>
              </View>
            </View>
            <Text style={s.guestRef}>REF {selectedBooking.ref} · {selectedBooking.checkin} → {selectedBooking.checkout} · {selectedBooking.room_type}</Text>
          </View>
        </View>
      )}

      <View style={s.body}>
        {/* Step 0: Search / Select Guest */}
        {step === 0 && !selectedBooking && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Search Guest or Booking</Text>
            <View style={s.searchRow}>
              <Ionicons name="search" size={16} color={SLATE[400]} />
              <TextInput
                placeholder="Search by name, email, phone, ref..."
                placeholderTextColor={SLATE[400]}
                value={search}
                onChangeText={setSearch}
                autoFocus
                style={s.searchInput}
              />
            </View>
            {filtered.length === 0 && search.length > 0 && (
              <Text style={s.emptyText}>No arriving guests found</Text>
            )}
            {filtered.map((g) => (
              <TouchableOpacity key={g.ref} onPress={() => handleSelectGuest(g)} style={s.guestRow}>
                <View style={[s.guestAvatarSmall, { backgroundColor: SRS.teal + '12' }]}>
                  <Text style={[s.guestInitialSmall, { color: SRS.teal }]}>{g.guest_name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.guestRowName}>{g.guest_name}</Text>
                  <Text style={s.guestRowMeta}>{g.room_type} · {g.ref}</Text>
                  <Text style={s.guestRowDates}>{g.checkin} → {g.checkout}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={SLATE[300]} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 0: Verify Identity */}
        {step === 0 && selectedBooking && (
          <View style={s.card}>
            <Text style={s.cardTitle}>1. Verify Guest Identity</Text>
            <View style={s.idFormRow}>
              <View style={s.idTypeWrap}>
                <Text style={s.fieldLabel}>ID Type</Text>
                <TouchableOpacity style={s.selectField}>
                  <Text style={s.selectText}>{idType}</Text>
                  <Ionicons name="chevron-down" size={16} color={SLATE[400]} />
                </TouchableOpacity>
              </View>
              <View style={s.idNumberWrap}>
                <Text style={s.fieldLabel}>{idType} Number</Text>
                <TextInput
                  placeholder="A81234567"
                  placeholderTextColor={SLATE[400]}
                  value={idNumber}
                  onChangeText={setIdNumber}
                  style={s.textInput}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                setIdVerified(true);
                if (!idNumber) setIdNumber('A81234567');
              }}
              style={[s.scanBtn, idVerified && s.scanBtnVerified]}
            >
              <Ionicons name="camera-outline" size={18} color={idVerified ? SRS.green : SRS.teal} />
              <Text style={[s.scanBtnText, { color: idVerified ? SRS.green : SRS.teal }]}>
                {idVerified ? '✓ Verified' : 'Scan Passport'}
              </Text>
            </TouchableOpacity>

            {/* Step 1: Room Assignment */}
            <View style={s.sectionDivider} />
            <Text style={s.cardTitle}>2. Room Assignment</Text>
            <View style={s.suggestedRoomCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={s.suggestedLabel}>Suggested Room</Text>
                <View style={s.availableBadge}>
                  <Text style={s.availableText}>Available</Text>
                </View>
              </View>
              <Text style={s.suggestedRoomNumber}>
                {suggestedRooms.length > 0 ? suggestedRooms[0].room_number : '—'}
              </Text>
            </View>

            {suggestedRooms.length > 0 && (
              <TouchableOpacity
                onPress={() => setSelectedRoomNumber(suggestedRooms[0].room_number)}
                style={[s.selectRoomBtn, selectedRoomNumber === suggestedRooms[0].room_number && s.selectRoomBtnActive]}
              >
                <Text style={s.selectRoomBtnText}>Choose Suggested Room {suggestedRooms[0].room_number}</Text>
                <Ionicons name="chevron-forward" size={18} color={SRS.teal} />
              </TouchableOpacity>
            )}

            <TouchableOpacity style={s.chooseDifferentBtn}>
              <Ionicons name="swap-horizontal-outline" size={18} color={SRS.teal} />
              <Text style={s.chooseDifferentText}>Choose Different Room</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 1: Continue to Payment */}
        {step === 1 && selectedBooking && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Payment</Text>
            {(selectedBooking.balance || 0) > 0 ? (
              <>
                <View style={s.balanceCard}>
                  <Text style={s.balanceLabel}>Outstanding Balance</Text>
                  <Text style={s.balanceAmount}>NPR {(selectedBooking.balance || 0).toLocaleString()}</Text>
                </View>
                <Text style={s.fieldLabel}>Payment Method</Text>
                <View style={s.paymentGrid}>
                  {[{ id: 'card', label: 'Card', icon: 'card-outline' }, { id: 'cash', label: 'Cash', icon: 'cash-outline' }, { id: 'upi', label: 'UPI', icon: 'qr-code-outline' }, { id: 'wallet', label: 'Wallet', icon: 'wallet-outline' }].map((pm) => (
                    <TouchableOpacity
                      key={pm.id}
                      onPress={() => setPaymentMethod(pm.id)}
                      style={[s.paymentOption, { backgroundColor: paymentMethod === pm.id ? BLUE[50] : SLATE[50], borderColor: paymentMethod === pm.id ? BLUE[600] : SLATE[200] }]}
                    >
                      <Ionicons name={pm.icon as any} size={22} color={paymentMethod === pm.id ? BLUE[600] : SLATE[400]} />
                      <Text style={[s.paymentLabel, { color: paymentMethod === pm.id ? BLUE[600] : SLATE[600] }]}>{pm.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {balanceCollected ? (
                  <View style={s.collectedRow}>
                    <Ionicons name="checkmark-circle" size={18} color={SRS.green} />
                    <Text style={s.collectedText}>Balance Collected</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      if (!paymentMethod) { Alert.alert('Select Payment', 'Please choose a payment method'); return; }
                      setBalanceCollected(true);
                    }}
                    style={[s.collectBtn, { backgroundColor: paymentMethod ? SRS.teal : SLATE[300] }]}
                  >
                    <Text style={s.collectBtnText}>Collect Payment</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Ionicons name="checkmark-circle" size={36} color={SRS.green} />
                <Text style={{ fontSize: 15, fontWeight: '700', color: SRS.green, marginTop: 10 }}>No Outstanding Balance</Text>
                <Text style={{ fontSize: 12, color: SLATE[400] }}>Booking is fully paid</Text>
              </View>
            )}
          </View>
        )}

        {/* Step 2: Review & Confirm */}
        {step === 2 && selectedBooking && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Review & Confirm</Text>
            <View style={s.reviewGrid}>
              {[
                { label: 'Guest', value: selectedBooking.guest_name },
                { label: 'Room', value: selectedRoomNumber, accent: true },
                { label: 'Type', value: selectedBooking.room_type },
                { label: 'Check-in', value: formatCheckTime(selectedBooking.checkin) },
                { label: 'Check-out', value: formatCheckOutTime(selectedBooking.checkout) },
                { label: 'Guests', value: `${guestsCount} Adults` },
                { label: 'ID Verified', value: idVerified ? 'Yes ✓' : 'No', color: idVerified ? SRS.green : SRS.orange },
                { label: 'Balance', value: (selectedBooking.balance || 0) === 0 || balanceCollected ? '✓ Paid' : `NPR ${(selectedBooking.balance || 0).toLocaleString()}`, color: (selectedBooking.balance || 0) === 0 || balanceCollected ? SRS.green : SRS.red },
              ].map((r) => (
                <View key={r.label} style={s.reviewRow}>
                  <Text style={s.reviewLabel}>{r.label}</Text>
                  <Text style={[s.reviewValue, r.accent && { color: SRS.teal }, r.color && { color: r.color }]}>{r.value}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity onPress={handleComplete} style={s.confirmBtn} activeOpacity={0.85}>
              <Text style={s.confirmBtnText}>Confirm Check-in</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Done */}
        {step === 3 && selectedBooking && (
          <View style={s.doneSection}>
            <View style={s.doneIcon}>
              <Ionicons name="checkmark-circle" size={48} color={SRS.green} />
            </View>
            <Text style={s.doneTitle}>Check-in Complete</Text>
            <Text style={s.doneDesc}>{selectedBooking.guest_name} → Room {selectedRoomNumber}</Text>
            <View style={s.doneCard}>
              {[
                { label: 'Guest', value: selectedBooking.guest_name },
                { label: 'Room', value: selectedRoomNumber, accent: true },
                { label: 'Type', value: selectedBooking.room_type },
                { label: 'Ref', value: selectedBooking.ref, accent: true },
              ].map((r) => (
                <View key={r.label} style={s.doneRow}>
                  <Text style={s.doneRowLabel}>{r.label}</Text>
                  <Text style={[s.doneRowValue, r.accent && { color: SRS.teal }]}>{r.value}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity onPress={() => safeGoBack()} style={s.doneBtn}>
              <Text style={s.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Navigation Buttons */}
        {step < 3 && selectedBooking && (
          <View style={s.navRow}>
            <TouchableOpacity
              onPress={() => step > 0 ? setStep(step - 1) : safeGoBack()}
              style={s.navBack}
            >
              <Text style={s.navBackText}>Back</Text>
            </TouchableOpacity>
            {step === 0 && (
              <TouchableOpacity
                onPress={() => setStep(1)}
                style={[s.navNext, { backgroundColor: idVerified ? SRS.teal : SLATE[300] }]}
                disabled={!idVerified}
              >
                <Text style={s.navNextText}>Continue to Payment</Text>
              </TouchableOpacity>
            )}
            {step === 1 && (
              <TouchableOpacity
                onPress={() => setStep(2)}
                style={[s.navNext, { backgroundColor: (balanceCollected || (selectedBooking.balance || 0) === 0) ? SRS.teal : SLATE[300] }]}
              >
                <Text style={s.navNextText}>Review</Text>
              </TouchableOpacity>
            )}
            {step === 2 && (
              <TouchableOpacity onPress={handleComplete} style={s.navNext}>
                <Text style={s.navNextText}>Confirm Check-in</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Nav when no guest selected */}
        {!selectedBooking && step === 0 && (
          <Text style={s.hintText}>Select an arriving guest to begin check-in</Text>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: SLATE[50] },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: SLATE[50], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: DARK, letterSpacing: -0.3 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: SLATE[100], alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: SRS.green },

  // Stepper
  stepperContainer: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  stepItem: { alignItems: 'center', flex: 1, position: 'relative' },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: SLATE[200], alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { backgroundColor: BG.white, borderWidth: 2.5, borderColor: SRS.teal },
  stepCircleCompleted: { backgroundColor: SRS.teal },
  stepNumber: { fontSize: 12, fontWeight: '700', color: SLATE[400] },
  stepNumberActive: { color: SRS.teal },
  stepNumberCompleted: { color: BG.white },
  stepLabel: { fontSize: 10, fontWeight: '500', color: SLATE[400], marginTop: 6 },
  stepLabelActive: { color: SRS.teal, fontWeight: '700' },
  stepLine: { position: 'absolute', top: 16, left: '60%', right: '-60%', height: 2, backgroundColor: SLATE[200], zIndex: -1 },
  stepLineCompleted: { backgroundColor: SRS.teal },

  // Guest Summary
  guestSummaryCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14, marginHorizontal: 16, marginBottom: 8,
    backgroundColor: BG.white, borderRadius: 12, borderWidth: 1, borderColor: SLATE[100], gap: 12,
  },
  guestAvatar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  guestInitial: { fontSize: 18, fontWeight: '700' },
  guestName: { fontSize: 14, fontWeight: '700', color: DARK },
  guestRef: { fontSize: 11, color: SLATE[400], marginTop: 2 },
  confirmedBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: EMERALD[50] },
  confirmedText: { fontSize: 10, fontWeight: '600', color: SRS.green },

  body: { paddingHorizontal: 16, gap: 12 },
  card: { backgroundColor: BG.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: SLATE[100], ...SHADOWS.card },
  cardTitle: { fontSize: 14, fontWeight: '700', color: DARK, marginBottom: 12 },

  // Search
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: SLATE[50], borderRadius: RADIUS.card, paddingHorizontal: 12, borderWidth: 1, borderColor: SLATE[200], gap: 8, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14, color: DARK, paddingVertical: 10 },
  emptyText: { fontSize: 13, color: SLATE[400], textAlign: 'center', paddingVertical: 20 },

  guestRow: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8, borderRadius: 12, backgroundColor: SRS.teal + '06', borderWidth: 1, borderColor: SRS.teal + '15', gap: 10 },
  guestAvatarSmall: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  guestInitialSmall: { fontSize: 14, fontWeight: '700' },
  guestRowName: { fontSize: 14, fontWeight: '700', color: DARK },
  guestRowMeta: { fontSize: 12, color: SLATE[500], marginTop: 1 },
  guestRowDates: { fontSize: 11, color: SLATE[400], marginTop: 1 },

  // ID Form
  idFormRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  idTypeWrap: { width: 120 },
  idNumberWrap: { flex: 1 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: SLATE[500], marginBottom: 6 },
  selectField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: SLATE[50], borderWidth: 1, borderColor: SLATE[200], borderRadius: RADIUS.card, paddingHorizontal: 12, paddingVertical: 10 },
  selectText: { fontSize: 13, color: DARK },
  textInput: { backgroundColor: SLATE[50], borderWidth: 1, borderColor: SLATE[200], borderRadius: RADIUS.card, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: DARK },

  scanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: RADIUS.card, borderWidth: 1.5, borderColor: SRS.teal + '30', backgroundColor: SRS.teal + '06', marginBottom: 12 },
  scanBtnVerified: { borderColor: SRS.green + '40', backgroundColor: SRS.green + '08' },
  scanBtnText: { fontSize: 13, fontWeight: '700' },

  sectionDivider: { height: 1, backgroundColor: SLATE[100], marginVertical: 16 },

  // Room Assignment
  suggestedRoomCard: { backgroundColor: SLATE[50], borderRadius: 12, padding: 14, marginBottom: 12 },
  suggestedLabel: { fontSize: 12, fontWeight: '600', color: SLATE[500] },
  availableBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: EMERALD[50] },
  availableText: { fontSize: 10, fontWeight: '600', color: SRS.green },
  suggestedRoomNumber: { fontSize: 28, fontWeight: '800', color: DARK, marginTop: 6, fontVariant: ['tabular-nums' as any] },

  selectRoomBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: SRS.teal + '30', backgroundColor: SRS.teal + '06', marginBottom: 8 },
  selectRoomBtnActive: { borderColor: SRS.teal, backgroundColor: SRS.teal + '12' },
  selectRoomBtnText: { fontSize: 13, fontWeight: '700', color: SRS.teal },

  chooseDifferentBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: SLATE[200] },
  chooseDifferentText: { fontSize: 13, fontWeight: '600', color: SRS.teal },

  // Payment
  balanceCard: { backgroundColor: RED[50], borderRadius: 12, padding: 14, borderWidth: 1, borderColor: RED[200], marginBottom: 16 },
  balanceLabel: { fontSize: 12, fontWeight: '600', color: RED[600] },
  balanceAmount: { fontSize: 24, fontWeight: '800', color: RED[500], marginTop: 4, fontVariant: ['tabular-nums' as any] },

  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  paymentOption: { width: '47%', padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 2, gap: 4 },
  paymentLabel: { fontSize: 12, fontWeight: '700' },

  collectedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 8, backgroundColor: SRS.green + '10', borderWidth: 1, borderColor: SRS.green },
  collectedText: { fontSize: 13, fontWeight: '600', color: SRS.green },

  collectBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  collectBtnText: { fontSize: 14, fontWeight: '700', color: BG.white },

  // Review
  reviewGrid: { marginBottom: 16 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: SLATE[100] },
  reviewLabel: { fontSize: 13, color: SLATE[500] },
  reviewValue: { fontSize: 13, fontWeight: '600', color: DARK },

  confirmBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: SRS.teal },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: BG.white },

  // Done
  doneSection: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16 },
  doneIcon: { marginBottom: 16 },
  doneTitle: { fontSize: 20, fontWeight: '700', color: DARK, textAlign: 'center' },
  doneDesc: { fontSize: 14, color: SLATE[400], textAlign: 'center', marginTop: 4, marginBottom: 24 },
  doneCard: { backgroundColor: BG.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: SLATE[100], width: '100%', gap: 8 },
  doneRow: { flexDirection: 'row', justifyContent: 'space-between' },
  doneRowLabel: { fontSize: 13, color: SLATE[500] },
  doneRowValue: { fontSize: 13, fontWeight: '600', color: DARK },
  doneBtn: { marginTop: 24, paddingVertical: 14, paddingHorizontal: 48, borderRadius: 12, backgroundColor: SRS.teal, alignItems: 'center' },
  doneBtnText: { fontSize: 14, fontWeight: '700', color: BG.white },

  // Nav
  navRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  navBack: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: SLATE[100] },
  navBackText: { fontSize: 14, fontWeight: '600', color: SLATE[600] },
  navNext: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: SRS.teal },
  navNextText: { fontSize: 14, fontWeight: '700', color: BG.white },

  hintText: { fontSize: 13, color: SLATE[400], textAlign: 'center', paddingVertical: 24 },
});
