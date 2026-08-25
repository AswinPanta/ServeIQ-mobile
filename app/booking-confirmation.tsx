import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, Share, StyleSheet, Platform, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { BRAND, PAYMENT, BG, SLATE, CORAL, NEUTRAL, GREEN } from '@/lib/constants/figma-tokens';
import { BookingQrCode } from '@/components/feature/booking-qr-code';
import { shareBookingReceipt } from '@/lib/utils/booking-receipt';

const NAVY = BRAND.navyLight;
const TEAL = PAYMENT.success;

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(amount: number): string {
  return 'NPR ' + amount.toLocaleString('en-IN');
}

export default function BookingConfirmationScreen() {
  const params = useLocalSearchParams();

  const hotelName = (params.hotelName as string) || 'Hotel';
  const hotelImage = (params.hotelImage as string) || '';
  const hotelCity = (params.hotelCity as string) || '';
  const roomType = (params.roomType as string) || params.rooms as string || '';
  const checkIn = (params.checkIn as string) || '';
  const checkOut = (params.checkOut as string) || '';
  const nights = parseInt((params.nights as string) || '1', 10);
  const guests = parseInt((params.guests as string) || '2', 10);
  const totalPrice = parseInt((params.total as string) || '0', 10);
  // Stable fallback code — computed once (never in render) so the react-compiler purity rule stays satisfied.
  const [confirmationCode] = React.useState(() => (params.confirmationCode as string) || 'BK' + Date.now());
  const subtotal = parseInt((params.subtotal as string) || '0', 10);
  const tax = parseInt((params.tax as string) || '0', 10);
  const discount = parseInt((params.discount as string) || '0', 10);
  const guestName = (params.guestName as string) || 'Guest';
  const guestEmail = (params.guestEmail as string) || '';
  const guestPhone = (params.guestPhone as string) || '';
  const guestCountry = (params.guestCountry as string) || '';
  const bedTypes = (params.bedTypes as string) || 'Queen';
  const pricePerNight = nights > 0 ? Math.round(subtotal / nights) : subtotal;

  const initials = hotelName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(confirmationCode);
    Alert.alert('Copied', 'Confirmation code copied to clipboard');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Booking Confirmed!\nHotel: ${hotelName}\nRoom: ${roomType}\nCheck-in: ${formatDate(checkIn)}\nCheck-out: ${formatDate(checkOut)}\nConfirmation: ${confirmationCode}`,
      });
    } catch {
      // User cancelled share or platform error — non-fatal
    }
  };

  const handleReceipt = () => {
    shareBookingReceipt({
      confirmationCode,
      propertyName: hotelName,
      propertyLocation: hotelCity,
      checkIn,
      checkOut,
      totalGuests: guests,
      guestName,
      guestEmail,
      guestPhone,
      guestNationality: guestCountry,
      rooms: [{
        room_name: roomType,
        room_type: roomType,
        bed_type: bedTypes,
        base_rate: pricePerNight,
        nights,
        subtotal,
      }],
      discount: discount > 0 ? discount : undefined,
      totalAmount: totalPrice,
      currency: 'NPR',
      createdAt: new Date().toLocaleString(),
    });
  };

  return (
    <View style={styles.container}>
      {/* Success Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerContent}>
          <View style={styles.confirmedPill}>
            <Ionicons name="checkmark-circle" size={14} color={BG.white} />
            <Text style={styles.confirmedPillText}>Booking confirmed</Text>
          </View>
          <Text style={styles.bannerTitle}>Your stay is confirmed</Text>
          <Text style={styles.bannerSubtitle}>A confirmation has been sent to {guestEmail}</Text>
        </View>
      </View>

      {/* Progress Stepper - all done */}
      <View style={styles.stepper}>
        {['Your Selection', 'Your Details', 'Finish booking'].map((label, i) => (
          <React.Fragment key={label}>
            <View style={styles.stepperItem}>
              <View style={[styles.stepperDot, styles.stepperDotDone]}>
                <Ionicons name="checkmark" size={12} color={BG.white} />
              </View>
              <Text style={[styles.stepperLabel, styles.stepperLabelDone]} numberOfLines={1}>{label}</Text>
            </View>
            {i < 2 && <View style={[styles.stepperLine, styles.stepperLineDone]} />}
          </React.Fragment>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.twoCol}>
          {/* Left Column */}
          <View style={styles.leftCol}>
            {/* Room Details */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Room details</Text>
              <View style={styles.roomRow}>
                <Image source={{ uri: hotelImage }} style={styles.roomImage} />
                <View style={styles.roomInfo}>
                  <Text style={styles.roomName}>{roomType}</Text>
                  <Text style={styles.roomBed}>{bedTypes} bed</Text>
                  <Text style={styles.roomGuests}>Up to {guests} guests</Text>
                  <Text style={styles.roomRate}>{formatCurrency(pricePerNight)} × {nights} night{nights > 1 ? 's' : ''}</Text>
                </View>
              </View>
            </View>

            {/* Guest Details */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Guest details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name</Text>
                <Text style={styles.detailValue}>{guestName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{guestEmail}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{guestPhone}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Country</Text>
                <Text style={styles.detailValue}>{guestCountry}</Text>
              </View>
            </View>

            {/* Important Info */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Important information</Text>
              {[
                'Please present a valid photo ID at check-in',
                'Arrive at least 15 minutes before your check-in time',
                '24/7 front desk assistance available',
                'Breakfast included in your stay',
                'Free WiFi throughout the property',
              ].map((info, i) => (
                <View key={i} style={styles.infoRow}>
                  <Ionicons name="checkmark-circle" size={16} color={TEAL} />
                  <Text style={styles.infoText}>{info}</Text>
                </View>
              ))}
            </View>

            {/* Cancellation Policy */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Cancellation policy</Text>
              <View style={styles.cancelRow}>
                <Ionicons name="shield-checkmark-outline" size={18} color={TEAL} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cancelTitle}>Free cancellation</Text>
                  <Text style={styles.cancelDesc}>Cancel before {formatDate(checkIn)} for a full refund</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Right Column */}
          <View style={styles.rightCol}>
            {/* Booking Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View style={styles.initialsBadge}>
                  <Text style={styles.initialsText}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryHotelName} numberOfLines={2}>{hotelName}</Text>
                  <Text style={styles.summaryLocation}>{hotelCity}</Text>
                </View>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Ionicons name="key-outline" size={16} color={SLATE[500]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryLabel}>Confirmation code</Text>
                  <Text style={styles.confirmationCode}>{confirmationCode}</Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <Ionicons name="calendar-outline" size={16} color={SLATE[500]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryLabel}>Dates</Text>
                  <Text style={styles.summaryValue}>{formatDate(checkIn)} – {formatDate(checkOut)}</Text>
                  <Text style={styles.summarySub}>{nights} night{nights > 1 ? 's' : ''}</Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <Ionicons name="people-outline" size={16} color={SLATE[500]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryLabel}>Guests</Text>
                  <Text style={styles.summaryValue}>{guests} guest{guests > 1 ? 's' : ''}</Text>
                </View>
              </View>

              <View style={styles.summaryDivider} />

              {/* Price Breakdown */}
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Room × {nights} nights</Text>
                <Text style={styles.priceValue}>{formatCurrency(subtotal)}</Text>
              </View>
              {discount > 0 && (
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: RED }]}>Discount</Text>
                  <Text style={[styles.priceValue, { color: RED }]}>-{formatCurrency(discount)}</Text>
                </View>
              )}
              {tax > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Taxes & fees</Text>
                  <Text style={styles.priceValue}>{formatCurrency(tax)}</Text>
                </View>
              )}
              <View style={styles.priceDivider} />
              <View style={styles.priceRow}>
                <Text style={styles.priceTotalLabel}>Total paid</Text>
                <Text style={styles.priceTotalValue}>{formatCurrency(totalPrice)}</Text>
              </View>
              <View style={styles.paidBadge}>
                <View style={styles.paidDot} />
                <Text style={styles.paidText}>Paid</Text>
              </View>

              <View style={styles.summaryDivider} />

              {/* Action Buttons */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={handleCopyCode}>
                  <Ionicons name="copy-outline" size={16} color={NAVY} />
                  <Text style={styles.actionBtnText}>Copy code</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                  <Ionicons name="share-outline" size={16} color={NAVY} />
                  <Text style={styles.actionBtnText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={handleReceipt}>
                  <Ionicons name="document-text-outline" size={16} color={NAVY} />
                  <Text style={styles.actionBtnText}>Receipt</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* QR Code */}
            <View style={styles.qrCard}>
              <Text style={styles.qrTitle}>Booking QR Code</Text>
              <BookingQrCode value={confirmationCode} size={180} hint="Show this QR code at check-in" />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const RED = CORAL[600];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEUTRAL[300] },

  // Banner
  banner: { backgroundColor: TEAL, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 24, paddingHorizontal: 20 },
  bannerContent: { alignItems: 'center', gap: 8 },
  confirmedPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  confirmedPillText: { fontSize: 13, fontWeight: '600', color: BG.white },
  bannerTitle: { fontSize: 22, fontWeight: '700', color: BG.white, letterSpacing: -0.3 },
  bannerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },

  // Stepper
  stepper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: BG.white, borderBottomWidth: 1, borderBottomColor: SLATE[200] },
  stepperItem: { alignItems: 'center', width: 80 },
  stepperDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: SLATE[200], alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stepperDotDone: { backgroundColor: TEAL },
  stepperLabel: { fontSize: 9, color: SLATE[400], textAlign: 'center' },
  stepperLabelDone: { color: NAVY, fontWeight: '600' },
  stepperLine: { flex: 1, height: 2, backgroundColor: SLATE[200], marginBottom: 16, marginHorizontal: -4 },
  stepperLineDone: { backgroundColor: TEAL },

  // Layout
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  twoCol: { flexDirection: 'row', flexWrap: 'wrap' },
  leftCol: { flex: 1, minWidth: 320, padding: 16, gap: 12 },
  rightCol: { width: 360, padding: 16, gap: 12 },

  // Cards
  card: { backgroundColor: BG.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: SLATE[200] },
  cardTitle: { fontSize: 14, fontWeight: '700', color: NAVY, marginBottom: 12 },

  // Room Row
  roomRow: { flexDirection: 'row', gap: 12 },
  roomImage: { width: 80, height: 80, borderRadius: 10 },
  roomInfo: { flex: 1, gap: 2 },
  roomName: { fontSize: 14, fontWeight: '700', color: NAVY },
  roomBed: { fontSize: 12, color: SLATE[500] },
  roomGuests: { fontSize: 12, color: SLATE[500] },
  roomRate: { fontSize: 12, fontWeight: '600', color: TEAL, marginTop: 4 },

  // Detail Row
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: SLATE[50] },
  detailLabel: { fontSize: 13, color: SLATE[500] },
  detailValue: { fontSize: 13, fontWeight: '600', color: NAVY },

  // Info Row
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  infoText: { fontSize: 12, color: SLATE[500], flex: 1, lineHeight: 18 },

  // Cancellation
  cancelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, backgroundColor: GREEN.pale, borderWidth: 1, borderColor: GREEN.mint },
  cancelTitle: { fontSize: 13, fontWeight: '600', color: NAVY },
  cancelDesc: { fontSize: 11, color: SLATE[500], marginTop: 2 },

  // Summary Card
  summaryCard: { backgroundColor: BG.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: SLATE[200] },
  summaryHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  initialsBadge: { width: 44, height: 44, borderRadius: 12, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
  initialsText: { fontSize: 16, fontWeight: '700', color: BG.white },
  summaryHotelName: { fontSize: 15, fontWeight: '700', color: NAVY, lineHeight: 20 },
  summaryLocation: { fontSize: 12, color: SLATE[500] },
  summaryDivider: { height: 1, backgroundColor: SLATE[200], marginVertical: 12 },
  summaryRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 10 },
  summaryLabel: { fontSize: 11, color: SLATE[400], marginBottom: 2 },
  summaryValue: { fontSize: 13, fontWeight: '600', color: NAVY },
  summarySub: { fontSize: 12, color: SLATE[500] },
  confirmationCode: { fontSize: 16, fontWeight: '700', color: NAVY, letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  // Price
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  priceLabel: { fontSize: 13, color: SLATE[500] },
  priceValue: { fontSize: 13, fontWeight: '600', color: NAVY },
  priceDivider: { height: 1, backgroundColor: SLATE[200], marginVertical: 6 },
  priceTotalLabel: { fontSize: 15, fontWeight: '700', color: NAVY },
  priceTotalValue: { fontSize: 16, fontWeight: '700', color: TEAL },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  paidDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: TEAL },
  paidText: { fontSize: 12, fontWeight: '600', color: TEAL },

  // Actions
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: SLATE[200], backgroundColor: BG.white },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: NAVY },

  // QR
  qrCard: { backgroundColor: BG.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: SLATE[200], alignItems: 'center' },
  qrTitle: { fontSize: 14, fontWeight: '700', color: NAVY, marginBottom: 12, alignSelf: 'flex-start' },
  qrHint: { fontSize: 12, color: SLATE[400] },

  // Bottom Bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: Platform.OS === 'ios' ? 36 : 16, backgroundColor: BG.white, borderTopWidth: 1, borderTopColor: SLATE[200] },
  homeBtn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', backgroundColor: NAVY },
  homeBtnText: { fontSize: 14, fontWeight: '700', color: BG.white },
});
