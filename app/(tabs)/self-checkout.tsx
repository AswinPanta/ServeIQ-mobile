import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { useAuth } from '@/lib/context/auth-context';
import { useBookings } from '@/lib/context/booking-context';
import { useCRM } from '@/lib/context/crm-context';
import type { GuestProfile } from '@/types/api';

const STEPS = [
  { key: 'select' as const, label: 'Stay' },
  { key: 'review' as const, label: 'Review' },
  { key: 'complete' as const, label: 'Done' },
];

export default function SelfCheckoutScreen() {
  const { user } = useAuth();
  const { bookings, updateBooking } = useBookings();
  const { earnPoints } = useCRM();
  const guest = user as GuestProfile | null;

  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'review' | 'complete'>('select');

  const checkedInBookings = bookings.filter(b => b.status === 'upcoming' && new Date(b.checkIn) <= new Date());
  const selectedBooking = selectedBookingId ? bookings.find(b => b.id === selectedBookingId) : null;
  const currentIdx = STEPS.findIndex(s => s.key === step);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const handleCompleteCheckout = () => {
    if (!selectedBooking) return;
    if (guest?.id) earnPoints(guest.id, 30);
    updateBooking(selectedBooking.id, { status: 'completed' } as any);
    setStep('complete');
  };

  const totalCharges = (b: typeof selectedBooking) => {
    if (!b) return 0;
    return b.totalPrice + (b.folio || []).reduce((s, c) => s + c.amount, 0);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <IconSymbol name="arrow.back" size={18} color={SRS.navy} />
        </TouchableOpacity>
        <View>
          <Text style={s.title}>Self Check-out</Text>
          <Text style={s.sub}>Check out quickly from your phone</Text>
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
            <Text style={s.sectionTitle}>Select Your Current Stay</Text>
            {checkedInBookings.length === 0 ? (
              <View style={s.emptyState}>
                <IconSymbol name="hotel" size={40} color={GRAY[300]} />
                <Text style={s.emptyTitle}>No active stays found</Text>
                <Text style={s.emptyDesc}>Check-in first to see your stay here</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/self-checkin')} style={s.browseBtn}>
                  <Text style={s.browseBtnText}>Go to Check-in</Text>
                </TouchableOpacity>
              </View>
            ) : (
              checkedInBookings.map(b => {
                const nights = Math.max(1, Math.ceil((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86400000));
                return (
                  <TouchableOpacity key={b.id} onPress={() => { setSelectedBookingId(b.id); setStep('review'); }}
                    style={[s.bookingCard, { borderColor: selectedBookingId === b.id ? SRS.teal : GRAY[200] }]}
                  >
                    <View style={s.bookingIcon}>
                      <IconSymbol name="hotel" size={24} color={SRS.teal} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.bookingHotel}>{b.hotelName}</Text>
                      <Text style={s.bookingMeta}>{b.hotelCity}, {b.hotelCountry}</Text>
                      <Text style={s.bookingMeta}>{formatDate(b.checkIn)} — {formatDate(b.checkOut)}</Text>
                      <Text style={s.bookingMeta}>{b.roomTypeName} · {nights} night{nights > 1 ? 's' : ''}</Text>
                      {(b.folio || []).length > 0 && <Text style={s.folioBadge}>+{b.folio!.length} folio charge{b.folio!.length > 1 ? 's' : ''}</Text>}
                    </View>
                    <IconSymbol name="chevron.right" size={16} color={GRAY[400]} />
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {step === 'review' && selectedBooking && (
          <View>
            <Text style={s.sectionTitle}>Review Your Bill</Text>

            <View style={s.detailCard}>
              <Text style={{ ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy, marginBottom: SPACING.sm }}>Stay Details</Text>
              {[
                { label: 'Hotel', value: selectedBooking.hotelName },
                { label: 'Room', value: selectedBooking.roomTypeName },
                { label: 'Check-in', value: formatDate(selectedBooking.checkIn) },
                { label: 'Check-out', value: formatDate(selectedBooking.checkOut) },
              ].map(r => (
                <View key={r.label} style={s.detailRow}>
                  <Text style={s.detailLabel}>{r.label}</Text>
                  <Text style={s.detailVal}>{r.value}</Text>
                </View>
              ))}
            </View>

            <View style={s.detailCard}>
              <Text style={{ ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy, marginBottom: SPACING.sm }}>Folio Breakdown</Text>
              <View style={s.priceRow}><Text style={s.priceLabel}>Room Charges</Text><Text style={s.priceVal}>NPR {selectedBooking.totalPrice.toLocaleString()}</Text></View>
              {(selectedBooking.folio || []).length === 0 ? (
                <Text style={{ ...TYPOGRAPHY.caption, color: GRAY[400], fontStyle: 'italic' }}>No extra charges</Text>
              ) : (
                selectedBooking.folio!.map(c => (
                  <View key={c.id} style={s.priceRow}><Text style={s.priceLabel}>{c.description}</Text><Text style={s.priceVal}>NPR {c.amount.toLocaleString()}</Text></View>
                ))
              )}
              <View style={[s.priceRow, s.totalRow]}><Text style={s.totalLabel}>Total</Text><Text style={s.totalVal}>NPR {totalCharges(selectedBooking).toLocaleString()}</Text></View>
            </View>

            <TouchableOpacity onPress={handleCompleteCheckout} style={s.ctaBtn} activeOpacity={0.85}>
              <IconSymbol name="checkout" size={16} color="#FFF" />
              <Text style={s.ctaText}>Confirm Check-out</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'complete' && selectedBooking && (
          <View style={s.doneSection}>
            <View style={s.doneIcon}><IconSymbol name="check" size={36} color={SRS.green} /></View>
            <Text style={s.doneTitle}>Check-out Complete!</Text>
            <Text style={s.doneSub}>Thank you for staying at {selectedBooking.hotelName}.</Text>

            <View style={s.doneCard}>
              {[
                { icon: 'star', text: 'Rate your stay — leave a review' },
                { icon: 'email', text: 'Receipt sent to your email' },
                { icon: 'star', text: '+30 loyalty points earned' },
              ].map((item, i) => (
                <View key={i} style={s.doneRow}>
                  <View style={s.doneRowIcon}><IconSymbol name={item.icon as any} size={16} color={SRS.teal} /></View>
                  <Text style={{ ...TYPOGRAPHY.body, color: SRS.navy, flex: 1 }}>{item.text}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity onPress={() => router.push('/(tabs)')} style={s.doneBtn} activeOpacity={0.85}>
              <IconSymbol name="hotel" size={16} color="#FFF" />
              <Text style={s.doneBtnText}>Back to Home</Text>
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
  bookingCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.card, backgroundColor: '#FFF', borderWidth: 1.5, marginBottom: SPACING.md },
  bookingIcon: { width: 48, height: 48, borderRadius: RADIUS.card, backgroundColor: SRS.teal + '12', alignItems: 'center', justifyContent: 'center' },
  bookingHotel: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy },
  bookingMeta: { ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: 1 },
  folioBadge: { ...TYPOGRAPHY.caption, color: SRS.orange, fontWeight: '600', marginTop: 2 },
  detailCard: { padding: SPACING.lg, borderRadius: RADIUS.card, backgroundColor: '#FFF', borderWidth: 1, borderColor: GRAY[100], gap: SPACING.sm, marginBottom: SPACING.lg },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { ...TYPOGRAPHY.body, color: GRAY[500] },
  detailVal: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceLabel: { ...TYPOGRAPHY.body, color: GRAY[500] },
  priceVal: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy },
  totalRow: { borderTopWidth: 1, borderTopColor: GRAY[100], paddingTop: SPACING.sm, marginTop: SPACING.xs },
  totalLabel: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy },
  totalVal: { ...TYPOGRAPHY.h3, fontWeight: '700', color: SRS.teal },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 16, borderRadius: RADIUS.card, backgroundColor: SRS.teal },
  ctaText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  doneSection: { alignItems: 'center', gap: SPACING.md },
  doneIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: SRS.green + '18', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  doneTitle: { ...TYPOGRAPHY.h2, color: SRS.navy, textAlign: 'center' },
  doneSub: { ...TYPOGRAPHY.body, color: GRAY[500], textAlign: 'center' },
  doneCard: { width: '100%', padding: SPACING.lg, borderRadius: RADIUS.card, backgroundColor: '#FFF', borderWidth: 1, borderColor: GRAY[100], gap: SPACING.md, marginTop: SPACING.md },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  doneRowIcon: { width: 32, height: 32, borderRadius: RADIUS.card, backgroundColor: SRS.teal + '10', alignItems: 'center', justifyContent: 'center' },
  doneBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 16, borderRadius: RADIUS.card, backgroundColor: SRS.teal, width: '100%', marginTop: SPACING.md },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
