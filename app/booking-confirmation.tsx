import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Share, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';

export default function BookingConfirmationScreen() {
  const params = useLocalSearchParams();
  const bookingId = (params.bookingId as string) || 'BK' + Date.now();
  const hotelName = (params.hotelName as string) || 'Hotel';
  const checkIn = (params.checkIn as string) || 'N/A';
  const checkOut = (params.checkOut as string) || 'N/A';
  const nights = parseInt((params.nights as string) || '1', 10);
  const guests = parseInt((params.guests as string) || '1', 10);
  const rooms = (params.rooms as string) || 'Standard Room';
  const subtotal = parseInt((params.subtotal as string) || '0', 10);
  const tax = parseInt((params.tax as string) || '0', 10);
  const discount = parseInt((params.discount as string) || '0', 10);
  const total = parseInt((params.total as string) || '0', 10);

  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleSendEmail = useCallback(async () => {
    setSendingEmail(true);
    await new Promise(r => setTimeout(r, 1200));
    setEmailSent(true);
    setSendingEmail(false);
  }, []);

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Success Header */}
      <View style={s.successSection}>
        <View style={s.successCircle}>
          <IconSymbol name="check" size={36} color={SRS.green} />
        </View>
        <Text style={s.successTitle}>Booking Confirmed!</Text>
        <Text style={s.successSub}>Your reservation has been confirmed</Text>
      </View>

      <View style={s.body}>
        {/* Booking Code */}
        <View style={s.codeCard}>
          <Text style={s.codeLabel}>Confirmation Code</Text>
          <Text style={s.codeValue}>{bookingId}</Text>
          <Text style={s.codeHint}>Save this code for your records</Text>
        </View>

        {/* Hotel Details */}
        <View style={s.infoCard}>
          <Text style={s.sectionTitle}>Hotel Details</Text>
          <View style={s.infoRow}>
            <IconSymbol name="hotel" size={16} color={SRS.teal} />
            <Text style={s.infoText}>{hotelName}</Text>
            <View style={s.confirmedBadge}>
              <IconSymbol name="check" size={10} color={SRS.green} />
              <Text style={s.confirmedText}>Confirmed</Text>
            </View>
          </View>
        </View>

        {/* Stay Details */}
        <View style={s.infoCard}>
          <Text style={s.sectionTitle}>Stay Details</Text>
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            {[
              { label: 'Check-in', value: checkIn },
              { label: 'Check-out', value: checkOut },
              { label: 'Nights', value: `${nights}` },
              { label: 'Guests', value: `${guests}` },
            ].map(item => (
              <View key={item.label} style={s.stayBox}>
                <Text style={s.stayLabel}>{item.label}</Text>
                <Text style={s.stayValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={s.priceCard}>
          <Text style={s.sectionTitle}>Price Breakdown</Text>
          <View style={s.priceRow}><Text style={s.priceLabel}>Subtotal</Text><Text style={s.priceVal}>NPR {subtotal.toLocaleString()}</Text></View>
          <View style={s.priceRow}><Text style={s.priceLabel}>Tax (13%)</Text><Text style={s.priceVal}>NPR {tax.toLocaleString()}</Text></View>
          {discount > 0 && <View style={s.priceRow}><Text style={[s.priceLabel, { color: SRS.green }]}>Discount</Text><Text style={[s.priceVal, { color: SRS.green }]}>-NPR {discount.toLocaleString()}</Text></View>}
          <View style={[s.priceRow, s.totalRow]}><Text style={s.totalLabel}>Total</Text><Text style={s.totalVal}>NPR {total.toLocaleString()}</Text></View>
        </View>

        {/* Send Confirmation */}
        <TouchableOpacity onPress={handleSendEmail} disabled={emailSent || sendingEmail}
          style={[s.emailCard, { borderColor: emailSent ? SRS.green : GRAY[200], backgroundColor: emailSent ? SRS.green + '08' : '#FFF' }]}
        >
          <View style={[s.emailIcon, { backgroundColor: emailSent ? SRS.green + '18' : SRS.teal + '12' }]}>
            {sendingEmail ? <ActivityIndicator size="small" color={SRS.teal} /> : <IconSymbol name="email" size={18} color={emailSent ? SRS.green : SRS.teal} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.emailTitle}>{emailSent ? 'Confirmation Email Sent' : 'Send Confirmation Email'}</Text>
            <Text style={s.emailSub}>{emailSent ? 'Check your inbox' : 'Get details delivered to your email'}</Text>
          </View>
          {emailSent && <Text style={{ fontSize: 12, fontWeight: '600', color: SRS.green }}>Sent!</Text>}
        </TouchableOpacity>

        {/* QR Code */}
        <View style={s.qrCard}>
          <Text style={s.sectionTitle}>Booking QR Code</Text>
          <View style={s.qrBox}>
            <Image source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${bookingId}` }}
              style={{ width: 120, height: 120 }} />
          </View>
          <Text style={s.qrHint}>Show this QR code at check-in</Text>
        </View>

        {/* Actions */}
        <View style={{ gap: SPACING.md, marginTop: SPACING.lg }}>
          <TouchableOpacity onPress={() => router.push('/(tabs)')} style={s.primaryBtn} activeOpacity={0.85}>
            <IconSymbol name="hotel" size={16} color="#FFF" />
            <Text style={s.primaryBtnText}>Back to Home</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={async () => {
            try { await Share.share({ message: `Booking at ${hotelName}: ${bookingId}`, title: 'Booking Confirmation' }); } catch {}
          }} style={s.secondaryBtn}>
            <IconSymbol name="share" size={16} color={SRS.teal} />
            <Text style={s.secondaryBtnText}>Share Booking</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  successSection: { alignItems: 'center', paddingVertical: SPACING.xl, paddingHorizontal: SPACING.lg, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: GRAY[100], gap: SPACING.sm },
  successCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: SRS.green + '18', alignItems: 'center', justifyContent: 'center' },
  successTitle: { ...TYPOGRAPHY.h2, color: SRS.navy },
  successSub: { ...TYPOGRAPHY.body, color: GRAY[500] },
  body: { padding: SPACING.lg, gap: SPACING.lg },
  sectionTitle: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy, marginBottom: SPACING.sm },
  codeCard: { alignItems: 'center', padding: SPACING.lg, borderRadius: RADIUS.card, backgroundColor: SRS.navy + '08', borderWidth: 1, borderColor: SRS.navy + '18', gap: 4 },
  codeLabel: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  codeValue: { ...TYPOGRAPHY.h2, fontWeight: '700', color: SRS.navy, letterSpacing: 2 },
  codeHint: { ...TYPOGRAPHY.caption, color: GRAY[400] },
  infoCard: { padding: SPACING.lg, borderRadius: RADIUS.card, backgroundColor: '#FFF', borderWidth: 1, borderColor: GRAY[100] },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  infoText: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy, flex: 1 },
  confirmedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.badge, backgroundColor: SRS.green + '12' },
  confirmedText: { fontSize: 11, fontWeight: '600', color: SRS.green },
  stayBox: { flex: 1, padding: SPACING.sm, borderRadius: RADIUS.button, backgroundColor: GRAY[50], alignItems: 'center', gap: 2 },
  stayLabel: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  stayValue: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy },
  priceCard: { padding: SPACING.lg, borderRadius: RADIUS.card, backgroundColor: SRS.teal + '06', borderWidth: 1, borderColor: SRS.teal + '16', gap: SPACING.xs },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceLabel: { ...TYPOGRAPHY.body, color: GRAY[600] },
  priceVal: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy },
  totalRow: { borderTopWidth: 1, borderTopColor: SRS.teal + '20', paddingTop: SPACING.sm, marginTop: SPACING.xs },
  totalLabel: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy },
  totalVal: { ...TYPOGRAPHY.h3, fontWeight: '700', color: SRS.teal },
  emailCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.card, borderWidth: 1.5 },
  emailIcon: { width: 40, height: 40, borderRadius: RADIUS.card, alignItems: 'center', justifyContent: 'center' },
  emailTitle: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy },
  emailSub: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  qrCard: { alignItems: 'center', padding: SPACING.lg, borderRadius: RADIUS.card, backgroundColor: '#FFF', borderWidth: 1, borderColor: GRAY[100], gap: SPACING.md },
  qrBox: { width: 140, height: 140, borderRadius: RADIUS.card, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: GRAY[100] },
  qrHint: { ...TYPOGRAPHY.caption, color: GRAY[400] },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 16, borderRadius: RADIUS.card, backgroundColor: SRS.navy },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 14, borderRadius: RADIUS.card, borderWidth: 1.5, borderColor: SRS.teal },
  secondaryBtnText: { fontSize: 14, fontWeight: '700', color: SRS.teal },
});
