import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { useAuth } from '@/lib/context/auth-context';
import { useBookings } from '@/lib/context/booking-context';
import { useCRM } from '@/lib/context/crm-context';
import * as ImagePicker from 'expo-image-picker';
import type { GuestProfile } from '@/types/api';
import { safeGoBack } from "@/lib/utils";

const STEPS = [
  { key: 'select' as const, label: 'Booking' },
  { key: 'verify' as const, label: 'Verify' },
  { key: 'complete' as const, label: 'Done' },
];

export default function SelfCheckinScreen() {
  const { user } = useAuth();
  const { bookings } = useBookings();
  const { earnPoints } = useCRM();
  const guest = user as GuestProfile | null;

  const [step, setStep] = useState<'select' | 'verify' | 'complete'>('select');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [idUploaded, setIdUploaded] = useState(false);
  const [confirmedDetails, setConfirmedDetails] = useState(false);

  const upcomingBookings = bookings.filter(b => b.status === 'upcoming');
  const selectedBooking = selectedBookingId ? bookings.find(b => b.id === selectedBookingId) : null;
  const currentIdx = STEPS.findIndex(s => s.key === step);
  // eslint-disable-next-line react-hooks/purity
  const nowTimestamp = useMemo(() => Date.now(), []);

  const handleUploadID = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed', 'Please grant gallery access'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.7 });
    if (!result.canceled && result.assets[0]) { setIdUploaded(true); Alert.alert('ID Uploaded', 'Identification uploaded successfully.'); }
  };

  const handleCompleteCheckin = () => {
    if (!idUploaded || !confirmedDetails) { Alert.alert('Incomplete', 'Please upload your ID and confirm your details'); return; }
    if (guest?.id) earnPoints(guest.id, 50);
    Alert.alert('Self Check-in Complete!', `You have been checked in successfully.\n\n50 bonus loyalty points awarded!\n\nYour digital key has been sent to your registered email.`, [{ text: 'Done', onPress: () => safeGoBack() }]);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 120 }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
          <IconSymbol name="arrow.back" size={18} color={SRS.navy} />
        </TouchableOpacity>
        <View>
          <Text style={s.title}>Self Check-in</Text>
          <Text style={s.sub}>Skip the queue — check in from your phone</Text>
        </View>
      </View>

      {/* Steps */}
      <View style={s.stepRow}>
        {STEPS.map((step, i) => (
          <React.Fragment key={step.key}>
            <View style={[s.stepDot, { backgroundColor: i <= currentIdx ? SRS.teal : GRAY[200] }]}>
              <IconSymbol name="check" size={12} color="#FFF" />
            </View>
            {i < STEPS.length - 1 && <View style={[s.stepLine, { backgroundColor: i < currentIdx ? SRS.teal : GRAY[200] }]} />}
          </React.Fragment>
        ))}
      </View>        <Text style={s.stepLabel}>Step {currentIdx + 1}: {STEPS[currentIdx].label}</Text>

      <View style={s.body}>
        {step === 'select' && (
          <View>
            <Text style={s.sectionTitle}>Select Your Booking</Text>
            {upcomingBookings.length === 0 ? (
              <View style={s.emptyState}>
                <IconSymbol name="booking" size={40} color={GRAY[300]} />
                <Text style={s.emptyTitle}>No upcoming bookings</Text>
                <Text style={s.emptyDesc}>Self check-in is available 48h before check-in</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)')} style={s.browseBtn}>
                  <Text style={s.browseBtnText}>Browse Hotels</Text>
                </TouchableOpacity>
              </View>
            ) : (
              upcomingBookings.map(b => {
                const isWithin48h = (new Date(b.checkIn).getTime() - nowTimestamp) < 48 * 60 * 60 * 1000;
                return (
                  <TouchableOpacity key={b.id} onPress={() => { setSelectedBookingId(b.id); setStep('verify'); }}
                    style={[s.bookingCard, { borderColor: selectedBookingId === b.id ? SRS.teal : GRAY[200], opacity: isWithin48h ? 1 : 0.5 }]}
                  >
                    <Image source={{ uri: b.hotelImage }} style={s.bookingImg} resizeMode="cover" />
                    <View style={{ flex: 1 }}>
                      <Text style={s.bookingHotel}>{b.hotelName}</Text>
                      <Text style={s.bookingMeta}>{b.hotelCity}, {b.hotelCountry}</Text>
                      <Text style={s.bookingMeta}>{formatDate(b.checkIn)} — {formatDate(b.checkOut)}</Text>
                      <Text style={s.bookingMeta}>{b.roomTypeName} · {b.guests} guest{b.guests > 1 ? 's' : ''}</Text>
                      {!isWithin48h && <Text style={s.timerText}>⏳ Available 48h before check-in</Text>}
                    </View>
                    <IconSymbol name="chevron.right" size={16} color={GRAY[400]} />
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {step === 'verify' && selectedBooking && (
          <View>
            <Text style={s.sectionTitle}>Verify Your Details</Text>

            <View style={s.detailCard}>
              {[
                { label: 'Hotel', value: selectedBooking.hotelName },
                { label: 'Room', value: selectedBooking.roomTypeName },
                { label: 'Check-in', value: formatDate(selectedBooking.checkIn) },
                { label: 'Check-out', value: formatDate(selectedBooking.checkOut) },
                { label: 'Guests', value: String(selectedBooking.guests) },
              ].map(r => (
                <View key={r.label} style={s.detailRow}>
                  <Text style={s.detailLabel}>{r.label}</Text>
                  <Text style={s.detailVal}>{r.value}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity onPress={handleUploadID} style={[s.uploadBox, { borderColor: idUploaded ? SRS.green : GRAY[200], backgroundColor: idUploaded ? SRS.green + '06' : 'transparent' }]}>
              <IconSymbol name="photo" size={28} color={idUploaded ? SRS.green : GRAY[400]} />
              <Text style={{ ...TYPOGRAPHY.body, fontWeight: '600', color: idUploaded ? SRS.green : SRS.navy, marginTop: 4 }}>{idUploaded ? 'ID Uploaded' : 'Tap to Upload ID'}</Text>
              <Text style={{ ...TYPOGRAPHY.caption, color: GRAY[400] }}>{'Passport, driver\u2019s license, or national ID'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setConfirmedDetails(!confirmedDetails)} style={[s.confirmRow, { borderColor: confirmedDetails ? SRS.green : GRAY[200], backgroundColor: confirmedDetails ? SRS.green + '06' : '#FFF' }]}>
              <View style={[s.checkbox, { backgroundColor: confirmedDetails ? SRS.green : 'transparent', borderColor: confirmedDetails ? SRS.green : GRAY[300] }]}>
                {confirmedDetails && <IconSymbol name="check" size={12} color="#FFF" />}
              </View>
              <Text style={{ ...TYPOGRAPHY.body, color: SRS.navy, flex: 1 }}>I confirm the details are correct</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleCompleteCheckin} disabled={!idUploaded || !confirmedDetails}
              style={[s.ctaBtn, { backgroundColor: idUploaded && confirmedDetails ? SRS.teal : GRAY[200] }]}
            >
              <Text style={[s.ctaText, { color: idUploaded && confirmedDetails ? '#FFF' : GRAY[400] }]}>Complete Check-in</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.sm },
  backBtn: { width: 36, height: 36, borderRadius: RADIUS.card, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  title: { ...TYPOGRAPHY.h2, color: SRS.navy },
  sub: { ...TYPOGRAPHY.small, color: GRAY[500] },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepLine: { flex: 1, height: 3, borderRadius: 2 },
  stepLabel: { ...TYPOGRAPHY.caption, fontWeight: '600', color: SRS.teal, textAlign: 'center', marginBottom: SPACING.md },
  body: { paddingHorizontal: SPACING.lg, gap: SPACING.lg },
  sectionTitle: { ...TYPOGRAPHY.h3, color: SRS.navy, marginBottom: SPACING.md },
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl * 2, gap: SPACING.sm },
  emptyTitle: { ...TYPOGRAPHY.body, fontWeight: '600', color: GRAY[500] },
  emptyDesc: { ...TYPOGRAPHY.caption, color: GRAY[400], textAlign: 'center' },
  browseBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: RADIUS.card, backgroundColor: SRS.teal },
  browseBtnText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  bookingCard: { flexDirection: 'row', gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.card, backgroundColor: '#FFF', borderWidth: 1.5, marginBottom: SPACING.md },
  bookingImg: { width: 56, height: 56, borderRadius: RADIUS.button },
  bookingHotel: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy },
  bookingMeta: { ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: 1 },
  timerText: { ...TYPOGRAPHY.caption, color: SRS.orange, marginTop: 2, fontWeight: '600' },
  detailCard: { padding: SPACING.lg, borderRadius: RADIUS.card, backgroundColor: '#FFF', borderWidth: 1, borderColor: GRAY[100], gap: SPACING.sm, marginBottom: SPACING.lg },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { ...TYPOGRAPHY.body, color: GRAY[500] },
  detailVal: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy },
  uploadBox: { alignItems: 'center', paddingVertical: SPACING.xl, borderRadius: RADIUS.card, borderWidth: 2, borderStyle: 'dashed', gap: 2, marginBottom: SPACING.lg },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.card, borderWidth: 1.5, marginBottom: SPACING.lg },
  checkbox: { width: 22, height: 22, borderRadius: RADIUS.button, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  ctaBtn: { paddingVertical: 16, borderRadius: RADIUS.card, alignItems: 'center' },
  ctaText: { fontSize: 15, fontWeight: '700' },
});
