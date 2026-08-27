import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Share, Alert, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useBookings, mapReservationToBooking, type Booking } from '@/lib/context/booking-context';
import { bookingApi } from '@/lib/api/booking-api';
import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { BookingQrCode } from '@/components/feature/booking-qr-code';
import { shareBookingReceipt } from '@/lib/utils/booking-receipt';
import { CORAL as CORALTokens, BRAND, RED, GREEN, STATUS, SLATE, BG, NEUTRAL, TEXT, GRAY } from '@/lib/constants/figma-tokens';

const CORAL = CORALTokens[500];
const NAVY = BRAND.navyLight;

const STATUS_COLORS = {
  upcoming: { bg: CORAL + '14', text: CORAL, label: 'Upcoming', icon: 'calendar' as const },
  completed: { bg: GREEN[50], text: STATUS.activeGreenDark, label: 'Completed', icon: 'confirm' as const },
  cancelled: { bg: RED[50], text: RED[600], label: 'Cancelled', icon: 'cancel' as const },
};

const PAYMENT_STATUS_COLORS = {
  paid: { bg: STATUS.activeGreenDark + '14', text: STATUS.activeGreenDark, label: 'Paid' },
  pending: { bg: CORAL + '14', text: CORAL, label: 'Pending' },
  refunded: { bg: RED[600] + '14', text: RED[600], label: 'Refunded' },
};

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bookings } = useBookings();
  const [remoteBooking, setRemoteBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  const localBooking = bookings.find(b => b.id === id || b.refNumber === id);
  const ref = localBooking?.refNumber || id;

  useEffect(() => {
    if (!ref) return;
    let active = true;
    bookingApi
      .getBookingByRef(ref, () => null)
      .then(res => {
        if (active && res) setRemoteBooking(mapReservationToBooking(res));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [ref]);

  const booking = (() => {
    if (!localBooking) return remoteBooking;
    if (!remoteBooking) return localBooking;
    return {
      ...remoteBooking,
      folio: localBooking.folio,
      refundAmount: localBooking.refundAmount,
      discountApplied: remoteBooking.discountApplied || localBooking.discountApplied,
    };
  })();

  if (!booking) {
    return (
      <View style={s.center}>
        <IconSymbol name="warning" size={48} color={SLATE[200]} />
        <Text style={s.errorText}>{loading ? 'Loading booking...' : 'Booking not found'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={s.retryBtn}>
          <Text style={s.retryBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const colors = STATUS_COLORS[booking.status];
  const nights = booking.nights || Math.max(1, Math.round((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86400000));
  const roomPrice = booking.subtotal ?? booking.totalPrice;
  const taxesAndFees = Math.max(0, booking.totalPrice - roomPrice);
  const isPaid = booking.status === 'upcoming' || booking.status === 'completed';
  const paymentStatus = isPaid ? 'paid' : booking.status === 'cancelled' ? 'refunded' : 'pending';
  const paymentStatusInfo = PAYMENT_STATUS_COLORS[paymentStatus];

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(booking.refNumber || booking.id);
    Alert.alert('Copied', 'Booking reference copied to clipboard');
  };

  const handleCopyTxn = async () => {
    if (booking.transactionId) {
      await Clipboard.setStringAsync(booking.transactionId);
      Alert.alert('Copied', 'Transaction ID copied to clipboard');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Booking Confirmed!\nHotel: ${booking.hotelName}\nRoom: ${booking.roomTypeName}\nCheck-in: ${formatDate(booking.checkIn)}\nCheck-out: ${formatDate(booking.checkOut)}\nConfirmation: ${booking.refNumber || booking.id}`,
      });
    } catch { /* cancelled */ }
  };

  const handleReceipt = () => {
    shareBookingReceipt({
      confirmationCode: booking.refNumber || booking.id,
      propertyName: booking.hotelName,
      propertyLocation: booking.hotelCity ? `${booking.hotelCity}, ${booking.hotelCountry}` : booking.hotelCountry,
      checkIn: formatDate(booking.checkIn),
      checkOut: formatDate(booking.checkOut),
      totalGuests: booking.guests,
      guestName: 'Guest',
      rooms: [{
        room_name: booking.roomTypeName,
        room_type: booking.roomTypeName,
        bed_type: '',
        base_rate: Math.round(roomPrice / nights),
        nights,
        subtotal: roomPrice,
      }],
      totalAmount: booking.totalPrice,
      currency: 'NPR',
      createdAt: new Date(booking.createdAt).toLocaleString(),
    });
  };

  const checkinDT = formatDateTime(booking.checkIn);
  const checkoutDT = formatDateTime(booking.checkOut);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBackBtn}>
          <IconSymbol name="chevron.left" size={20} color={NAVY} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Booking Details</Text>
        <View style={s.headerBackBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* ── Main Info Card ── */}
        <View style={s.infoCard}>
          <View style={s.infoRow}>
            {/* Left: Hotel image + details */}
            <View style={s.infoLeft}>
              <Image source={{ uri: booking.hotelImage }} style={s.hotelImage} />
              <View style={s.hotelInfo}>
                <View style={s.hotelNameRow}>
                  <Text style={s.hotelName} numberOfLines={1}>{booking.hotelName}</Text>
                  <View style={[s.statusBadge, { backgroundColor: colors.bg }]}>
                    <Text style={[s.statusText, { color: colors.text }]}>{colors.label}</Text>
                  </View>
                </View>
                <Text style={s.locationText} numberOfLines={2}>
                  {booking.hotelName}, {booking.hotelCity}{booking.hotelCity && booking.hotelCountry ? ', ' : ''}{booking.hotelCountry}
                </Text>
                {booking.propertyPhone && (
                  <View style={s.contactRow}>
                    <IconSymbol name="phone" size={12} color={SLATE[500]} />
                    <Text style={s.contactText}>{booking.propertyPhone}</Text>
                  </View>
                )}
                {booking.propertyEmail && (
                  <View style={s.contactRow}>
                    <IconSymbol name="email" size={12} color={SLATE[500]} />
                    <Text style={s.contactText}>{booking.propertyEmail}</Text>
                  </View>
                )}
                <TouchableOpacity style={s.mapLink}>
                  <IconSymbol name="location" size={12} color={CORAL} />
                  <Text style={s.mapLinkText}>View on Map</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Right: Booking meta */}
            <View style={s.infoRight}>
              <Text style={s.metaLabel}>BOOKING ID</Text>
              <View style={s.bookingIdRow}>
                <Text style={s.bookingIdValue}>{booking.refNumber || booking.id}</Text>
                <TouchableOpacity onPress={handleCopyCode} style={s.copyIconBtn}>
                  <IconSymbol name="checkmark" size={12} color={SLATE[500]} />
                </TouchableOpacity>
              </View>

              <Text style={s.metaLabel}>BOOKED ON</Text>
              <Text style={s.metaValue}>{formatDate(booking.createdAt)}, {formatTime(booking.createdAt)}</Text>

              <Text style={s.metaLabel}>PAYMENT STATUS</Text>
              <View style={[s.paymentBadge, { backgroundColor: paymentStatusInfo.bg }]}>
                <Text style={[s.paymentBadgeText, { color: paymentStatusInfo.text }]}>{paymentStatusInfo.label}</Text>
                {paymentStatus === 'paid' && <IconSymbol name="confirm" size={12} color={paymentStatusInfo.text} />}
              </View>

              <Text style={s.metaLabel}>TOTAL PAID</Text>
              <Text style={s.totalPaidValue}>NPR {booking.totalPrice.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* ── Payment Summary ── */}
        <View style={s.sectionCard}>
          <View style={s.sectionHeader}>
            <IconSymbol name="receipt" size={16} color={NAVY} />
            <Text style={s.sectionTitle}>Payment Summary</Text>
          </View>

          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Room Price</Text>
            <Text style={s.summaryValue}>NPR {roomPrice.toLocaleString()}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Taxes & Fees</Text>
            <Text style={s.summaryValue}>NPR {taxesAndFees.toLocaleString()}</Text>
          </View>
          <View style={[s.summaryRow, s.summaryRowTotal]}>
            <Text style={s.summaryLabelTotal}>Total Paid</Text>
            <Text style={s.summaryValueTotal}>NPR {booking.totalPrice.toLocaleString()}</Text>
          </View>

          {booking.paymentMethod && (
            <View style={s.txnRow}>
              <View style={s.txnBlock}>
                <Text style={s.txnLabel}>PAYMENT METHOD</Text>
                <Text style={s.txnValue}>{booking.paymentMethod.toUpperCase()}</Text>
              </View>
              {booking.transactionId && (
                <View style={s.txnBlock}>
                  <Text style={s.txnLabel}>TRANSACTION ID</Text>
                  <TouchableOpacity onPress={handleCopyTxn}>
                    <Text style={s.txnValue}>{booking.transactionId}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {booking.discountApplied && (
            <View style={s.discountRow}>
              <IconSymbol name="discount" size={12} color={STATUS.activeGreenDark} />
              <Text style={s.discountText}>
                {booking.discountApplied.code} ({booking.discountApplied.type === 'percentage' ? `${booking.discountApplied.amount}% off` : `NPR ${booking.discountApplied.amount} off`})
              </Text>
            </View>
          )}
          {booking.refundAmount && (
            <View style={s.discountRow}>
              <IconSymbol name="refresh" size={12} color={RED[600]} />
              <Text style={[s.discountText, { color: RED[600] }]}>Refunded: NPR {booking.refundAmount.toLocaleString()}</Text>
            </View>
          )}
        </View>

        {/* ── Stay Information ── */}
        <View style={s.sectionCard}>
          <View style={s.sectionHeader}>
            <IconSymbol name="calendar" size={16} color={NAVY} />
            <Text style={s.sectionTitle}>Stay Information</Text>
          </View>

          <View style={s.stayGrid}>
            <View style={s.stayBlock}>
              <Text style={s.stayLabel}>CHECK-IN</Text>
              <Text style={s.stayValue}>{checkinDT.date}</Text>
              <Text style={s.stayTime}>{checkinDT.time}</Text>
            </View>
            <View style={s.stayBlock}>
              <Text style={s.stayLabel}>CHECK-OUT</Text>
              <Text style={s.stayValue}>{checkoutDT.date}</Text>
              <Text style={s.stayTime}>{checkoutDT.time}</Text>
            </View>
          </View>

          <View style={s.stayGrid}>
            <View style={s.stayBlock}>
              <Text style={s.stayLabel}>DURATION</Text>
              <Text style={s.stayValue}>{nights} {nights === 1 ? 'Night' : 'Nights'}</Text>
            </View>
            <View style={s.stayBlock}>
              <Text style={s.stayLabel}>GUESTS</Text>
              <Text style={s.stayValue}>{booking.guests} adult{booking.guests !== 1 ? 's' : ''}</Text>
            </View>
          </View>

          <View style={s.stayGrid}>
            <View style={s.stayBlock}>
              <Text style={s.stayLabel}>ROOM</Text>
              <Text style={s.stayValue}>{booking.roomTypeName}</Text>
            </View>
          </View>
        </View>

        {/* ── Actions ── */}
        <View style={s.sectionCard}>
          <View style={s.actionsRow}>
            <TouchableOpacity style={s.actionBtn} onPress={handleCopyCode}>
              <IconSymbol name="checkmark" size={16} color={NAVY} />
              <Text style={s.actionBtnText}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={handleShare}>
              <IconSymbol name="share" size={16} color={NAVY} />
              <Text style={s.actionBtnText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={handleReceipt}>
              <IconSymbol name="receipt" size={16} color={NAVY} />
              <Text style={s.actionBtnText}>Receipt</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Reservation QR ── */}
        <View style={[s.sectionCard, { alignItems: 'center' }]}>
          <View style={[s.sectionHeader, { alignSelf: 'stretch' }]}>
            <IconSymbol name="qr.code" size={16} color={NAVY} />
            <Text style={s.sectionTitle}>Reservation QR</Text>
          </View>
          <BookingQrCode value={booking.refNumber || booking.id} size={160} hint="Show this QR code at check-in" />
        </View>

        {/* ── Contact Support ── */}
        <TouchableOpacity style={s.contactBtn}>
          <IconSymbol name="email" size={16} color={BG.white} />
          <Text style={s.contactBtnText}>Contact Support</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEUTRAL[50] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 },
  errorText: { fontSize: 16, fontWeight: '600', color: SLATE[400] },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: CORAL },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: BG.white },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, backgroundColor: BG.white,
    borderBottomWidth: 1, borderBottomColor: SLATE[100],
  },
  headerBackBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: NAVY },

  scrollContent: { padding: 16, paddingBottom: 120 },

  // ── Info Card ──
  infoCard: {
    backgroundColor: BG.white, borderRadius: 16, padding: 16, marginBottom: 14,
    shadowColor: TEXT.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  infoRow: { flexDirection: 'row', gap: 14 },
  infoLeft: { flex: 1 },
  infoRight: { width: 130 },
  hotelImage: { width: '100%', height: 100, borderRadius: 10, backgroundColor: SLATE[100], marginBottom: 10 },
  hotelInfo: { gap: 4 },
  hotelNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  hotelName: { fontSize: 16, fontWeight: '700', color: GRAY[900], flexShrink: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  locationText: { fontSize: 12, color: SLATE[500], lineHeight: 16 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  contactText: { fontSize: 11, color: SLATE[500] },
  mapLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  mapLinkText: { fontSize: 12, fontWeight: '600', color: CORAL },

  metaLabel: { fontSize: 9, fontWeight: '700', color: SLATE[400], letterSpacing: 0.5, marginTop: 8 },
  metaValue: { fontSize: 12, fontWeight: '600', color: GRAY[900], marginTop: 2 },
  bookingIdRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  bookingIdValue: { fontSize: 12, fontWeight: '700', color: GRAY[900], fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  copyIconBtn: { padding: 4 },
  paymentBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 2, alignSelf: 'flex-start' },
  paymentBadgeText: { fontSize: 11, fontWeight: '700' },
  totalPaidValue: { fontSize: 16, fontWeight: '800', color: NAVY, marginTop: 2 },

  // ── Section Card ──
  sectionCard: {
    backgroundColor: BG.white, borderRadius: 16, padding: 16, marginBottom: 14,
    shadowColor: TEXT.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: GRAY[900] },

  // ── Payment Summary ──
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: SLATE[100] },
  summaryLabel: { fontSize: 13, color: SLATE[500] },
  summaryValue: { fontSize: 13, fontWeight: '600', color: GRAY[900] },
  summaryRowTotal: { borderBottomWidth: 0, paddingTop: 12 },
  summaryLabelTotal: { fontSize: 14, fontWeight: '700', color: GRAY[900] },
  summaryValueTotal: { fontSize: 16, fontWeight: '800', color: NAVY },

  txnRow: { flexDirection: 'row', gap: 20, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: SLATE[100] },
  txnBlock: { flex: 1 },
  txnLabel: { fontSize: 9, fontWeight: '700', color: SLATE[400], letterSpacing: 0.5, marginBottom: 4 },
  txnValue: { fontSize: 13, fontWeight: '700', color: GRAY[900], textTransform: 'uppercase' },

  discountRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  discountText: { fontSize: 13, fontWeight: '600', color: STATUS.activeGreenDark },

  // ── Stay Information ──
  stayGrid: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  stayBlock: { flex: 1 },
  stayLabel: { fontSize: 9, fontWeight: '700', color: SLATE[400], letterSpacing: 0.5, marginBottom: 4 },
  stayValue: { fontSize: 14, fontWeight: '700', color: GRAY[900] },
  stayTime: { fontSize: 12, color: SLATE[500], marginTop: 2 },

  // ── Actions ──
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: SLATE[200], backgroundColor: BG.white,
  },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: NAVY },

  // ── Contact ──
  contactBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12, backgroundColor: CORAL, marginTop: 6,
  },
  contactBtnText: { fontSize: 15, fontWeight: '700', color: BG.white },
});
