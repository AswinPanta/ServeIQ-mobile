import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FONTS, SRS, RADIUS, SHADOWS, FIGMA_COLORS, GRAY } from '@/constants/portal-theme';
import { safeGoBack } from '@/lib/utils';
import { BG } from '@/lib/constants/figma-tokens';

export default function RateBreakdownScreen() {
  const params = useLocalSearchParams();

  const hotelName = (params.hotelName as string) || 'Grand Palace Hotel';
  const roomType = (params.roomType as string) || 'Deluxe King';
  const checkIn = (params.checkIn as string) || '24 May 2025';
  const checkOut = (params.checkOut as string) || '27 May 2025';
  const guests = (params.guests as string) || '2 Adults, 1 Child';
  const nights = parseInt((params.nights as string) || '3', 10);
  const pricePerNight = parseFloat((params.pricePerNight as string) || '150');
  const subtotal = parseFloat((params.subtotal as string) || '450');
  const taxes = parseFloat((params.taxes as string) || '45');
  const total = parseFloat((params.total as string) || '435');
  const discountCode = (params.discountCode as string) || '';
  const discountAmount = parseFloat((params.discountAmount as string) || '0');

  const hasDiscount = !!discountCode && discountAmount > 0;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={s.headerBtn}>
          <IconSymbol name="arrow.back" size={20} color={BG.white} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Rate Breakdown</Text>
        <TouchableOpacity style={s.headerBtn}>
          <IconSymbol name="share" size={20} color={BG.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Booking Info Bar */}
        <View style={s.infoBar}>
          <View style={s.infoCol}>
            <IconSymbol name="room" size={16} color={SRS.navy} />
            <Text style={s.infoLabel}>Room</Text>
            <Text style={s.infoValue}>{roomType}</Text>
          </View>
          <View style={s.infoDivider} />
          <View style={s.infoCol}>
            <IconSymbol name="calendar" size={16} color={SRS.navy} />
            <Text style={s.infoLabel}>Check-in</Text>
            <Text style={s.infoValue}>{checkIn}</Text>
          </View>
          <View style={s.infoDivider} />
          <View style={s.infoCol}>
            <IconSymbol name="guests" size={16} color={SRS.navy} />
            <Text style={s.infoLabel}>Guests</Text>
            <Text style={s.infoValue}>{guests}</Text>
          </View>
        </View>

        {/* Detailed Breakdown */}
        <View style={s.breakdownCard}>
          {/* Section 1: Base Rate */}
          <View style={s.section}>
            <View style={[s.sectionIcon, { backgroundColor: FIGMA_COLORS.infoBg }]}>
              <IconSymbol name="room" size={18} color={SRS.navy} />
            </View>
            <View style={s.sectionBody}>
              <Text style={s.sectionTitle}>1. Base Rate</Text>
              <Text style={s.sectionSubtitle}>Room Price calculation</Text>
              <View style={s.calcRow}>
                <Text style={s.calcText}>NPR {pricePerNight.toFixed(0)} × {nights} Nights</Text>
                <Text style={s.calcAmount}>NPR {subtotal.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          <View style={s.sectionDivider} />

          {/* Section 2: Taxes & Fees */}
          <View style={s.section}>
            <View style={[s.sectionIcon, { backgroundColor: FIGMA_COLORS.infoBg }]}>
              <IconSymbol name="receipt" size={18} color={SRS.navy} />
            </View>
            <View style={s.sectionBody}>
              <Text style={s.sectionTitle}>2. Taxes & Fees</Text>
              <Text style={s.sectionSubtitle}>Service Fee, Cleaning Fee, Gov Tax</Text>
              <View style={s.feeLine}>
                <Text style={s.feeLabel}>Service Fee</Text>
                <Text style={s.feeValue}>NPR {(taxes * 0.4).toFixed(2)}</Text>
              </View>
              <View style={s.feeLine}>
                <Text style={s.feeLabel}>Cleaning Fee</Text>
                <Text style={s.feeValue}>NPR {(taxes * 0.3).toFixed(2)}</Text>
              </View>
              <View style={s.feeLine}>
                <Text style={s.feeLabel}>Gov Tax</Text>
                <Text style={s.feeValue}>NPR {(taxes * 0.3).toFixed(2)}</Text>
              </View>
              <View style={s.feeLine}>
                <Text style={s.feeLabel}>Subtotal</Text>
                <Text style={[s.feeValue, { fontFamily: FONTS.inter.semiBold }]}>NPR {taxes.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Section 3: Discount (conditional) */}
          {hasDiscount && (
            <>
              <View style={s.sectionDivider} />
              <View style={s.section}>
                <View style={[s.sectionIcon, { backgroundColor: FIGMA_COLORS.successBg }]}>
                  <IconSymbol name="tag" size={18} color={FIGMA_COLORS.successText} />
                </View>
                <View style={s.sectionBody}>
                  <Text style={s.sectionTitle}>3. Discount</Text>
                  <View style={s.couponBadge}>
                    <Text style={s.couponText}>Coupon: {discountCode}</Text>
                  </View>
                  <Text style={s.discountAmount}>NPR -{discountAmount.toFixed(2)}</Text>
                </View>
              </View>
            </>
          )}

          {/* Total Amount Banner */}
          <View style={s.totalBanner}>
            <Text style={s.totalLabel}>Total Amount</Text>
            <Text style={s.totalValue}>NPR {total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Booking Summary Card */}
        <View style={s.summaryCard}>
          <View style={s.summaryRow}>
            <View style={s.summaryThumb}>
              <IconSymbol name="room" size={32} color={SRS.navy} />
            </View>
            <View style={s.summaryInfo}>
              <Text style={s.summaryHotel}>{hotelName}</Text>
              <Text style={s.summaryGuests}>{guests}</Text>
              <Text style={s.summaryDates}>{checkIn} — {checkOut}</Text>
              <Text style={s.summaryNights}>{nights} Nights</Text>
            </View>
          </View>

          {hasDiscount && (
            <View style={s.savingsBanner}>
              <IconSymbol name="tag" size={14} color={BG.white} />
              <Text style={s.savingsText}>You save NPR {discountAmount.toFixed(2)} with {discountCode}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={s.bottomBar}>
        <TouchableOpacity style={s.checkoutBtn} activeOpacity={0.85} onPress={() => router.push('/booking-confirmation')}>
          <Text style={s.checkoutText}>Continue to Checkout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SRS.navy },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: SRS.navy,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontFamily: FONTS.playfairDisplay.bold,
    fontSize: 20,
    color: BG.white,
  },
  scroll: { flex: 1, backgroundColor: FIGMA_COLORS.pageBg },
  scrollContent: { paddingHorizontal: 32, paddingTop: 20, paddingBottom: 160 },

  infoBar: {
    flexDirection: 'row',
    backgroundColor: BG.white,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: FIGMA_COLORS.cardBorder,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  infoCol: { flex: 1, alignItems: 'center', gap: 4 },
  infoDivider: { width: 1, backgroundColor: FIGMA_COLORS.cardBorder, marginHorizontal: 8 },
  infoLabel: {
    fontFamily: FONTS.inter.regular,
    fontSize: 12,
    color: FIGMA_COLORS.secondaryText,
    marginTop: 4,
  },
  infoValue: {
    fontFamily: FONTS.inter.semiBold,
    fontSize: 14,
    color: SRS.navy,
    textAlign: 'center',
  },

  breakdownCard: {
    backgroundColor: BG.white,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: FIGMA_COLORS.cardBorder,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  section: { flexDirection: 'row', gap: 12 },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.badge,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  sectionBody: { flex: 1 },
  sectionTitle: {
    fontFamily: FONTS.playfairDisplay.bold,
    fontSize: 16,
    color: SRS.navy,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontFamily: FONTS.inter.regular,
    fontSize: 14,
    color: FIGMA_COLORS.secondaryText,
    marginBottom: 8,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: FIGMA_COLORS.cardBorder,
    marginVertical: 14,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcText: {
    fontFamily: FONTS.inter.regular,
    fontSize: 14,
    color: FIGMA_COLORS.bodyText,
  },
  calcAmount: {
    fontFamily: FONTS.inter.semiBold,
    fontSize: 14,
    color: SRS.navy,
  },
  feeLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  feeLabel: {
    fontFamily: FONTS.inter.regular,
    fontSize: 14,
    color: FIGMA_COLORS.bodyText,
  },
  feeValue: {
    fontFamily: FONTS.inter.regular,
    fontSize: 14,
    color: SRS.navy,
  },
  couponBadge: {
    alignSelf: 'flex-start',
    backgroundColor: FIGMA_COLORS.successBg,
    borderRadius: RADIUS.badge,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 6,
  },
  couponText: {
    fontFamily: FONTS.inter.semiBold,
    fontSize: 12,
    color: FIGMA_COLORS.successText,
  },
  discountAmount: {
    fontFamily: FONTS.inter.semiBold,
    fontSize: 14,
    color: FIGMA_COLORS.successText,
  },

  totalBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: SRS.navy,
    borderRadius: RADIUS.badge,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 16,
  },
  totalLabel: {
    fontFamily: FONTS.inter.semiBold,
    fontSize: 16,
    color: BG.white,
  },
  totalValue: {
    fontFamily: FONTS.inter.semiBold,
    fontSize: 16,
    color: BG.white,
  },

  summaryCard: {
    backgroundColor: BG.white,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: FIGMA_COLORS.cardBorder,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  summaryRow: { flexDirection: 'row', gap: 14 },
  summaryThumb: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.card,
    backgroundColor: FIGMA_COLORS.infoBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryInfo: { flex: 1, justifyContent: 'center', gap: 3 },
  summaryHotel: {
    fontFamily: FONTS.playfairDisplay.bold,
    fontSize: 16,
    color: SRS.navy,
  },
  summaryGuests: {
    fontFamily: FONTS.inter.regular,
    fontSize: 13,
    color: FIGMA_COLORS.bodyText,
  },
  summaryDates: {
    fontFamily: FONTS.inter.regular,
    fontSize: 13,
    color: FIGMA_COLORS.secondaryText,
  },
  summaryNights: {
    fontFamily: FONTS.inter.semiBold,
    fontSize: 13,
    color: SRS.navy,
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: FIGMA_COLORS.successText,
    borderRadius: RADIUS.badge,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  savingsText: {
    fontFamily: FONTS.inter.semiBold,
    fontSize: 13,
    color: BG.white,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BG.white,
    borderTopWidth: 1,
    borderTopColor: FIGMA_COLORS.cardBorder,
    paddingBottom: 24,
    ...SHADOWS.dropdown,
  },
  checkoutBtn: {
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: SRS.teal,
    borderRadius: RADIUS.button,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkoutText: {
    fontFamily: FONTS.inter.semiBold,
    fontSize: 16,
    color: BG.white,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  navItem: { alignItems: 'center', gap: 3 },
  navLabel: {
    fontFamily: FONTS.inter.regular,
    fontSize: 11,
    color: GRAY[400],
  },
});
