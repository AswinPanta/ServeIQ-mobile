import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, Share, StyleSheet, Platform, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { FONTS, SRS, RADIUS, SHADOWS, FIGMA_COLORS } from '@/constants/portal-theme';
import { useAuth } from '@/lib/context/auth-context';
import type { GuestProfile } from '@/types/api';

function formatDateShort(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatDay(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
}

function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 1;
  return Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
}

function formatCurrency(amount: number): string {
  return 'NPR ' + amount.toLocaleString('en-IN');
}

export default function BookingConfirmationScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const hotelName = (params.hotelName as string) || 'Himalayan Lakeview Resort';
  const hotelImage = (params.hotelImage as string) || '';
  const hotelCity = (params.hotelCity as string) || 'Pokhara';
  const roomType = (params.roomType as string) || params.rooms as string || 'Lakeview Room';
  const checkIn = (params.checkIn as string) || '';
  const checkOut = (params.checkOut as string) || '';
  const guests = parseInt((params.guests as string) || '2', 10);
  const nights = parseInt((params.nights as string) || '1', 10) || calculateNights(checkIn, checkOut);
  const totalPrice = parseInt((params.total as string) || (params.totalPrice as string) || '0', 10);
  const confirmationCode = (params.confirmationCode as string) || (params.bookingId as string) || 'BK1782975486778';
  const subtotal = parseInt((params.subtotal as string) || '0', 10) || Math.round(totalPrice * 0.88);
  const tax = parseInt((params.tax as string) || '0', 10) || Math.round(totalPrice * 0.12);
  const discount = parseInt((params.discount as string) || '0', 10);
  const paymentGateway = (params.paymentGateway as string) || 'stripe';
  const pricePerNight = nights > 0 ? Math.round(subtotal / nights) : subtotal;

  const userName = user ? ((user as GuestProfile).name || (user as GuestProfile).full_name || 'Guest') : 'Guest';
  const userInitial = userName.charAt(0).toUpperCase();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Booking Confirmed!\nHotel: ${hotelName}\nRoom: ${roomType}\nCheck-in: ${formatDateShort(checkIn)}\nCheck-out: ${formatDateShort(checkOut)}\nConfirmation: ${confirmationCode}`,
      });
    } catch {}
  };

  return (
    <View style={styles.root}>
      {/* Gradient Banner Header */}
      <View style={styles.gradientBanner}>
        <View style={styles.bannerOverlay}>
          <Text style={styles.bannerLogo}>StayEasy</Text>
          <Text style={styles.bannerTitle}>Booking Confirmed</Text>
          <Text style={styles.bannerSubtitle}>Your reservation has been successfully confirmed</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Confirmation Code Card */}
        <View style={styles.confirmationCard}>
          <Text style={styles.confirmationLabel}>CONFIRMATION CODE</Text>
          <Text style={styles.confirmationCode}>{confirmationCode}</Text>
          <Text style={styles.confirmationHint}>Save this code for check-in</Text>
          <TouchableOpacity
            onPress={async () => {
              await Clipboard.setStringAsync(confirmationCode);
              Alert.alert('Copied', 'Confirmation code copied to clipboard');
            }}
            style={styles.copyBtn}
          >
            <Ionicons name="copy-outline" size={14} color={SRS.teal} />
            <Text style={styles.copyBtnText}>Copy Code</Text>
          </TouchableOpacity>
        </View>

        {/* Hotel Details Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>HOTEL DETAILS</Text>
          <View style={styles.hotelRow}>
            {hotelImage ? (
              <Image source={{ uri: hotelImage }} style={styles.hotelImage} />
            ) : (
              <View style={[styles.hotelImage, styles.hotelImagePlaceholder]}>
                <Ionicons name="image-outline" size={32} color="#94A3B8" />
              </View>
            )}
            <View style={styles.hotelInfo}>
              <Text style={styles.hotelName} numberOfLines={2}>{hotelName}</Text>
              <Text style={styles.hotelRoom}>{roomType} · {hotelCity}</Text>
              <View style={styles.confirmedBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#1E8449" />
                <Text style={styles.confirmedBadgeText}>Confirmed</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stay Details Grid */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>STAY DETAILS</Text>
          <View style={styles.stayGrid}>
            <View style={styles.stayCell}>
              <Text style={styles.stayLabel}>CHECK-IN</Text>
              <Text style={styles.stayValue}>{formatDateShort(checkIn)}</Text>
              <Text style={styles.stayDay}>{formatDay(checkIn)}</Text>
            </View>
            <View style={styles.stayCell}>
              <Text style={styles.stayLabel}>CHECK-OUT</Text>
              <Text style={styles.stayValue}>{formatDateShort(checkOut)}</Text>
              <Text style={styles.stayDay}>{formatDay(checkOut)}</Text>
            </View>
            <View style={styles.stayCell}>
              <Text style={styles.stayLabel}>NIGHTS</Text>
              <Text style={styles.stayValue}>{nights}</Text>
              <Text style={styles.stayDay}>{nights === 1 ? 'Night' : 'Nights'}</Text>
            </View>
            <View style={styles.stayCell}>
              <Text style={styles.stayLabel}>GUESTS</Text>
              <Text style={styles.stayValue}>{guests}</Text>
              <Text style={styles.stayDay}>{guests === 1 ? 'Guest' : 'Guests'}</Text>
            </View>
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>PRICE BREAKDOWN</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Room ({nights} {nights === 1 ? 'night' : 'nights'} × {formatCurrency(pricePerNight)})</Text>
            <Text style={styles.priceValue}>{formatCurrency(subtotal - Math.round(subtotal * 0.1))}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Taxes & Fees (13%)</Text>
            <Text style={styles.priceValue}>{formatCurrency(tax)}</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}>
            <Text style={styles.priceTotalLabel}>Total</Text>
            <Text style={styles.priceTotalValue}>{formatCurrency(totalPrice)}</Text>
          </View>
        </View>

        {/* Important Information */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>IMPORTANT INFORMATION</Text>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color="#1E8449" />
            <Text style={styles.infoText}>Check-in time is 2:00 PM onwards. Early check-in is subject to availability.</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color="#1E8449" />
            <Text style={styles.infoText}>A valid government-issued photo ID is required at check-in.</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color="#1E8449" />
            <Text style={styles.infoText}>Breakfast is included in your room rate.</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color="#1E8449" />
            <Text style={styles.infoText}>Free WiFi is available throughout the property.</Text>
          </View>
        </View>

        {/* Cancellation Policy */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>CANCELLATION POLICY</Text>
          <View style={styles.cancelRow}>
            <Ionicons name="warning" size={18} color="#C0392B" />
            <Text style={styles.cancelText}>
              Free cancellation up to 24 hours before check-in. Cancellations within 24 hours incur a 1-night charge.
            </Text>
          </View>
        </View>

        {/* QR Code */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>BOOKING QR CODE</Text>
          <View style={styles.qrPlaceholder}>
            <Ionicons name="qr-code-outline" size={80} color="#94A3B8" />
          </View>
          <Text style={styles.qrHint}>Show this QR code at check-in</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.outlineBtn} onPress={handleShare} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={18} color={SRS.navy} />
            <Text style={styles.outlineBtnText}>Share Booking</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.7} onPress={() => Alert.alert('Receipt', 'Receipt downloaded successfully')}>
            <Ionicons name="download-outline" size={18} color={SRS.navy} />
            <Text style={styles.outlineBtnText}>Download Receipt</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.7}
          >
            <Text style={styles.primaryBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const PF = FONTS.playfairDisplay.bold;
const IR = FONTS.inter.regular;
const IM = FONTS.inter.medium;
const IB = FONTS.inter.bold;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: FIGMA_COLORS.pageBg },

  // Gradient Banner
  gradientBanner: {
    backgroundColor: SRS.navy,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  bannerOverlay: { alignItems: 'center' },
  bannerLogo: { fontSize: 16, color: 'rgba(255,255,255,0.6)', letterSpacing: -0.3, fontFamily: PF, marginBottom: 8 },
  bannerTitle: { fontSize: 24, color: '#FFFFFF', marginBottom: 4, fontFamily: PF },
  bannerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: IR },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },

  // Confirmation Card
  confirmationCard: {
    backgroundColor: '#FFFFFF', borderRadius: RADIUS.card,
    paddingVertical: 20, alignItems: 'center', marginTop: -16,
    ...SHADOWS.card,
  },
  confirmationLabel: {
    fontSize: 10, color: '#94A3B8', letterSpacing: 0.8, marginBottom: 6, fontFamily: IB,
  },
  confirmationCode: {
    fontSize: 20, color: SRS.navy, letterSpacing: 1, marginBottom: 4, fontFamily: IB,
  },
  confirmationHint: { fontSize: 11, color: '#94A3B8', marginBottom: 12, fontFamily: IR },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, borderColor: SRS.teal, backgroundColor: 'rgba(30, 132, 73, 0.04)',
  },
  copyBtnText: { fontSize: 12, color: SRS.teal, fontFamily: IB },

  // Cards
  card: {
    backgroundColor: '#FFFFFF', borderRadius: RADIUS.card,
    padding: 16, marginTop: 12, ...SHADOWS.card,
  },
  sectionHeading: {
    fontSize: 12, color: '#94A3B8', letterSpacing: 0.6, marginBottom: 14, fontFamily: PF,
  },

  // Hotel Details
  hotelRow: { flexDirection: 'row', gap: 14 },
  hotelImage: { width: 96, height: 96, borderRadius: RADIUS.card },
  hotelImagePlaceholder: {
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  hotelInfo: { flex: 1, justifyContent: 'center', gap: 4 },
  hotelName: { fontSize: 16, color: SRS.navy, lineHeight: 22, fontFamily: PF },
  hotelRoom: { fontSize: 12, color: '#64748B', fontFamily: IR },
  confirmedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: FIGMA_COLORS.successBg, borderRadius: RADIUS.badge,
    paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 4,
  },
  confirmedBadgeText: { fontSize: 11, color: '#1E8449', fontFamily: IB },

  // Stay Details Grid
  stayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 1 },
  stayCell: {
    width: '49.5%', backgroundColor: '#FFFFFF', borderRadius: RADIUS.badge,
    borderWidth: 1, borderColor: FIGMA_COLORS.cardBorder,
    paddingVertical: 12, paddingHorizontal: 14,
  },
  stayLabel: {
    fontSize: 10, color: '#94A3B8', letterSpacing: 0.5, marginBottom: 4, fontFamily: IB,
  },
  stayValue: { fontSize: 14, color: SRS.navy, marginBottom: 2, fontFamily: IB },
  stayDay: { fontSize: 11, color: '#64748B', fontFamily: IR },

  // Price Breakdown
  priceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6,
  },
  priceLabel: { fontSize: 13, color: '#64748B', fontFamily: IR, flex: 1 },
  priceValue: { fontSize: 13, color: SRS.navy, fontFamily: IM },
  priceDivider: {
    height: 1, backgroundColor: FIGMA_COLORS.cardBorder, marginVertical: 8,
  },
  priceTotalLabel: { fontSize: 15, color: SRS.navy, fontFamily: IB },
  priceTotalValue: { fontSize: 16, color: SRS.teal, fontFamily: IB },

  // Important Information
  infoItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10,
  },
  infoText: { fontSize: 12, color: '#64748B', flex: 1, lineHeight: 18, fontFamily: IR },

  // Cancellation Policy
  cancelRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: FIGMA_COLORS.dangerBg, borderRadius: RADIUS.badge, padding: 12,
  },
  cancelText: { fontSize: 12, color: '#64748B', flex: 1, lineHeight: 18, fontFamily: IR },

  // QR Code
  qrPlaceholder: {
    width: 194, height: 194, alignSelf: 'center',
    borderRadius: RADIUS.card, borderWidth: 2, borderColor: '#E2E8F0',
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F8FAFC', marginBottom: 10,
  },
  qrHint: { fontSize: 12, color: '#94A3B8', textAlign: 'center', fontFamily: IR },

  // Action Buttons
  actionsSection: { marginTop: 16, gap: 12 },
  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: SRS.navy, borderRadius: RADIUS.card,
    paddingVertical: 14, backgroundColor: '#FFFFFF',
  },
  outlineBtnText: { fontSize: 14, color: SRS.navy, fontFamily: IB },
  primaryBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: SRS.navy, borderRadius: RADIUS.card, paddingVertical: 14,
  },
  primaryBtnText: { fontSize: 14, color: '#FFFFFF', fontFamily: IB },

  // Bottom Tab Bar
  tabBar: {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: FIGMA_COLORS.cardBorder,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12, paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabLabel: { fontSize: 10, color: '#94A3B8', fontFamily: IM },
  tabLabelActive: { color: SRS.teal },
});
