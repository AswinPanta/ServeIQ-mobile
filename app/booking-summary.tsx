import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FolioBreakdown, type FolioItem } from '@/components/feature/folio-breakdown';
import { safeGoBack } from '@/lib/utils';

const ACCENT = '#2E86AB';

export default function BookingSummaryScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();

  const hotelName = (params.hotelName as string) || 'Hotel';
  const hotelPhone = (params.hotelPhone as string) || '';
  const hotelEmail = (params.hotelEmail as string) || '';
  const roomType = (params.roomType as string) || 'Room';
  const nights = parseInt((params.nights as string) || '1', 10);
  const perNight = parseInt((params.perNight as string) || '0', 10);
  const roomTotal = parseInt((params.roomTotal as string) || '0', 10);
  const cleaningFee = parseInt((params.cleaningFee as string) || '0', 10);
  const serviceFee = parseInt((params.serviceFee as string) || '0', 10);
  const grandTotal = parseInt((params.grandTotal as string) || '0', 10);
  const roomId = params.roomId as string | undefined;

  const handleBookNow = () => {
    router.push({
      pathname: '/booking-flow',
      params: {
        hotelName,
        checkIn: params.checkIn || '',
        checkOut: params.checkOut || '',
        guests: params.guests || '1',
        roomId: roomId || '',
        roomName: roomType,
        roomPrice: String(perNight),
      },
    });
  };

  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Back */}
        <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
          <IconSymbol name="arrow.back" size={18} color="#1A3C5E" />
        </TouchableOpacity>

        {/* Main Card */}
        <View style={s.card}>
          {/* Header */}
          <View style={s.cardHeader}>
            <Text style={s.hotelName}>{hotelName}</Text>
            <View style={s.confirmedBadge}>
              <IconSymbol name="check" size={12} color="#16A085" />
              <Text style={s.confirmedText}>{t('confirmation.statusConfirmed')}</Text>
            </View>
          </View>

          {/* Contact */}
          {(hotelPhone || hotelEmail) && (
            <View style={s.contactRow}>
              {hotelPhone ? (
                <View style={s.contactItem}>
                  <IconSymbol name="phone" size={14} color="#94A3B8" />
                  <Text style={s.contactText}>{hotelPhone}</Text>
                </View>
              ) : null}
              {hotelEmail ? (
                <View style={s.contactItem}>
                  <IconSymbol name="email" size={14} color="#94A3B8" />
                  <Text style={s.contactText}>{hotelEmail}</Text>
                </View>
              ) : null}
            </View>
          )}

          <View style={s.divider} />

          {/* Booking Summary */}
          <Text style={s.sectionTitle}>Booking Summary</Text>

          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>{roomType}</Text>
            <Text style={s.summaryVal}>NPR {perNight.toLocaleString()}{t('booking.perNight')}</Text>
          </View>
          <Text style={s.nightsText}>{t('confirmation.nights', { count: nights })}</Text>

          <View style={s.divider} />

          {/* BK-006 — explicit itemized rate breakdown using the shared
              FolioBreakdown component so booking-summary and confirmation
              share the same accounting UI. */}
          <FolioBreakdown
            items={
              [
                {
                  label: `${roomType} — NPR ${perNight.toLocaleString()} / night`,
                  quantity: nights,
                  unitPrice: perNight,
                  total: roomTotal,
                },
              ]
            }
            subtotal={roomTotal}
            tax={cleaningFee + serviceFee}
            total={grandTotal}
            taxLabel="Cleaning & service fees"
          />
        </View>

        {/* Terms */}
        <Text style={s.terms}>
          {'By tapping "Book Now", you agree to our cancellation and refund policies.'}
        </Text>
      </ScrollView>

      {/* Bottom bar */}
      <View style={s.bottomBar}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={s.bottomTotalLabel}>{t('booking.total')}</Text>
          <Text style={s.bottomTotalVal}>NPR {grandTotal.toLocaleString()}</Text>
        </View>
        <TouchableOpacity onPress={handleBookNow} style={s.bookBtn} activeOpacity={0.9}>
          <IconSymbol name="booking" size={16} color="#FFF" />
          <Text style={s.bookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginTop: 56, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  card: { marginHorizontal: 16, borderRadius: 20, backgroundColor: '#FFF', padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  hotelName: { fontSize: 18, fontWeight: '700', color: '#1A3C5E', flex: 1 },
  confirmedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(22, 160, 133, 0.1)' },
  confirmedText: { fontSize: 11, fontWeight: '600', color: '#16A085' },
  contactRow: { gap: 6, marginBottom: 12 },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contactText: { fontSize: 12, color: '#64748B' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1A3C5E', marginBottom: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  summaryVal: { fontSize: 14, fontWeight: '700', color: ACCENT },
  nightsText: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { fontSize: 13, color: '#64748B' },
  priceVal: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#1A3C5E' },
  totalVal: { fontSize: 18, fontWeight: '700', color: ACCENT },
  terms: { marginHorizontal: 16, marginTop: 16, fontSize: 11, color: '#94A3B8', textAlign: 'center', lineHeight: 16 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 40, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  bottomTotalLabel: { fontSize: 13, color: '#64748B' },
  bottomTotalVal: { fontSize: 18, fontWeight: '700', color: ACCENT },
  bookBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 12, backgroundColor: ACCENT, shadowColor: ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  bookBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
