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
  upcoming: { bg: RED[50], text: CORAL, icon: 'calendar' as const },
  completed: { bg: GREEN[50], text: STATUS.activeGreenDark, icon: 'confirm' as const },
  cancelled: { bg: RED[50], text: RED[600], icon: 'cancel' as const },
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
    return () => {
      active = false;
    };
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
        <Text style={s.errorText}>{loading ? 'Loading booking…' : 'Booking not found'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const colors = STATUS_COLORS[booking.status];

  const nights = Math.max(1, Math.round((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)));
  const baseRate = Math.round(booking.totalPrice / nights);
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(booking.id);
    Alert.alert('Copied', 'Confirmation code copied to clipboard');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Booking Confirmed!\nHotel: ${booking.hotelName}\nRoom: ${booking.roomTypeName}\nCheck-in: ${formatDate(booking.checkIn)}\nCheck-out: ${formatDate(booking.checkOut)}\nConfirmation: ${booking.id}`,
      });
    } catch {
      // User cancelled share or platform error — non-fatal
    }
  };

  const handleReceipt = () => {
    shareBookingReceipt({
      confirmationCode: booking.id,
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
        base_rate: baseRate,
        nights,
        subtotal: booking.totalPrice,
      }],
      totalAmount: booking.totalPrice,
      currency: 'NPR',
      createdAt: new Date(booking.createdAt).toLocaleString(),
    });
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <IconSymbol name="chevron.left" size={20} color={NAVY} />
        </TouchableOpacity>
        <Text style={s.title}>Booking Details</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View style={s.imageWrap}>
          <Image source={{ uri: booking.hotelImage }} style={s.image} />
          <View style={[s.statusBadge, { backgroundColor: colors.bg }]}>
            <IconSymbol name={colors.icon} size={14} color={colors.text} />
            <Text style={[s.statusText, { color: colors.text }]}>{booking.status}</Text>
          </View>
        </View>

        <Text style={s.hotelName}>{booking.hotelName}</Text>
        <Text style={s.location}>{booking.hotelCity}, {booking.hotelCountry}</Text>

        <View style={s.detailsCard}>
          <DetailRow icon="guests" label="Guests" value={`${booking.guests} guest${booking.guests !== 1 ? 's' : ''}`} />
          <DetailRow icon="room" label="Room" value={booking.roomTypeName} />
          <DetailRow icon="calendar" label="Check-in" value={new Date(booking.checkIn).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} />
          <DetailRow icon="calendar" label="Check-out" value={new Date(booking.checkOut).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} />
          <DetailRow icon="clock" label="Booked on" value={new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />
        </View>

        <View style={s.priceCard}>
          <Text style={s.priceLabel}>Total Price</Text>
          <Text style={s.priceValue}>NPR {booking.totalPrice.toLocaleString()}</Text>
          {booking.discountApplied && (
            <View style={s.discountRow}>
              <IconSymbol name="discount" size={12} color={STATUS.activeGreenDark} />
              <Text style={s.discountText}>
                {booking.discountApplied.code} ({booking.discountApplied.type === 'percentage' ? `${booking.discountApplied.amount}% off` : `NPR ${booking.discountApplied.amount} off`})
              </Text>
            </View>
          )}
          {booking.refundAmount && (
            <View style={s.refundRow}>
              <IconSymbol name="refresh" size={12} color={RED[600]} />
              <Text style={s.refundText}>Refunded: NPR {booking.refundAmount.toLocaleString()}</Text>
            </View>
          )}
        </View>

        {booking.folio && booking.folio.length > 0 && (
          <View style={s.folioCard}>
            <Text style={s.folioTitle}>Folio Charges</Text>
            {booking.folio.map((charge, i) => (
              <View key={i} style={s.folioRow}>
                <Text style={s.folioName}>{charge.description}</Text>
                <Text style={s.folioAmount}>NPR {charge.amount.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Booking Actions: copy / share / receipt */}
        <View style={s.actionsCard}>
          <View style={s.actionsRow}>
            <TouchableOpacity style={s.actionBtn} onPress={handleCopyCode}>
              <IconSymbol name="checkmark" size={16} color={NAVY} />
              <Text style={s.actionBtnText}>Copy code</Text>
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
          <Text style={s.confirmationCode}>Ref: {booking.id}</Text>
        </View>

        {/* Reservation QR */}
        <View style={s.qrCard}>
          <Text style={s.qrTitle}>Reservation QR</Text>
          <BookingQrCode value={booking.id} size={160} hint="Show this QR code at check-in" />
        </View>

        <TouchableOpacity style={s.contactBtn}>
          <IconSymbol name="email" size={16} color={BG.white} />
          <Text style={s.contactBtnText}>Contact Support</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: IconSymbolName; label: string; value: string }) {
  return (
    <View style={s.detailRow}>
      <View style={s.detailLeft}>
        <IconSymbol name={icon} size={16} color={SLATE[500]} />
        <Text style={s.detailLabel}>{label}</Text>
      </View>
      <Text style={s.detailValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEUTRAL[50] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 },
  errorText: { fontSize: 16, fontWeight: '600', color: SLATE[400] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, backgroundColor: BG.white },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: NAVY },
  backBtnText: { fontSize: 14, fontWeight: '600', color: CORAL },

  imageWrap: { height: 200, borderRadius: 16, overflow: 'hidden', position: 'relative', marginBottom: 16 },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  statusBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },

  hotelName: { fontSize: 22, fontWeight: '700', color: GRAY[900], marginBottom: 4 },
  location: { fontSize: 14, color: SLATE[500], marginBottom: 20 },

  detailsCard: {
    backgroundColor: BG.white, borderRadius: 16, padding: 16, marginBottom: 14,
    shadowColor: TEXT.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: SLATE[100] },
  detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailLabel: { fontSize: 14, color: SLATE[500] },
  detailValue: { fontSize: 14, fontWeight: '600', color: GRAY[900] },

  priceCard: {
    backgroundColor: BG.white, borderRadius: 16, padding: 16, marginBottom: 14,
    shadowColor: TEXT.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  priceLabel: { fontSize: 13, color: SLATE[500], marginBottom: 4 },
  priceValue: { fontSize: 24, fontWeight: '800', color: NAVY },
  discountRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  discountText: { fontSize: 13, fontWeight: '600', color: STATUS.activeGreenDark },
  refundRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  refundText: { fontSize: 13, fontWeight: '600', color: RED[600] },

  folioCard: {
    backgroundColor: BG.white, borderRadius: 16, padding: 16, marginBottom: 14,
    shadowColor: TEXT.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  folioTitle: { fontSize: 15, fontWeight: '700', color: GRAY[900], marginBottom: 12 },
  folioRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: SLATE[100] },
  folioName: { fontSize: 13, color: SLATE[500], flex: 1 },
  folioAmount: { fontSize: 13, fontWeight: '600', color: GRAY[900] },

  actionsCard: {
    backgroundColor: BG.white, borderRadius: 16, padding: 16, marginBottom: 14,
    shadowColor: TEXT.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: SLATE[200], backgroundColor: BG.white,
  },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: NAVY },
  confirmationCode: {
    fontSize: 13, fontWeight: '700', color: SLATE[500], textAlign: 'center', marginTop: 12,
    letterSpacing: 0.5, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  qrCard: {
    backgroundColor: BG.white, borderRadius: 16, padding: 16, marginBottom: 14, alignItems: 'center',
    shadowColor: TEXT.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  qrTitle: { fontSize: 15, fontWeight: '700', color: GRAY[900], marginBottom: 12, alignSelf: 'flex-start' },

  contactBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12, backgroundColor: CORAL, marginTop: 6,
  },
  contactBtnText: { fontSize: 15, fontWeight: '700', color: BG.white },
});