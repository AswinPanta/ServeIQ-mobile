import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, Alert, StyleSheet, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ReviewModal } from '@/components/feature/review-modal';
import { useBookings } from '@/lib/context/booking-context';
import { useAuth } from '@/lib/context/auth-context';
import { FONTS } from '@/constants/portal-theme';
import { safeGoBack } from '@/lib/utils';
import type { GuestProfile } from '@/types/api';
import { SRS, BRAND, SLATE, STATUS, BG, STATUS_COLORS, NEUTRAL } from '@/lib/constants/figma-tokens';

const ACCENT = SRS.teal;

interface ReviewEntry {
  bookingId: string;
  hotelName: string;
  rating: number;
  title: string;
  comment: string;
  photos: string[];
  createdAt: string;
}

export default function PostStayReviewScreen() {
  const { bookings } = useBookings();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);
  const [reviewTarget, setReviewTarget] = useState<{ bookingId: string; hotelName: string } | null>(null);

  const userName = user ? ((user as GuestProfile).name || (user as GuestProfile).full_name || 'Guest') : 'Guest';

  const completedBookings = useMemo(
    () => bookings.filter(b => b.status === 'completed'),
    [bookings],
  );

  const reviewedBookingIds = useMemo(
    () => new Set(reviews.map(r => r.bookingId)),
    [reviews],
  );

  const pendingReviews = completedBookings.filter(b => !reviewedBookingIds.has(b.id));

  const handleSubmitReview = (review: { rating: number; title: string; comment: string; photos: string[] }) => {
    if (!reviewTarget) return;
    setReviews(prev => [...prev, {
      bookingId: reviewTarget.bookingId,
      hotelName: reviewTarget.hotelName,
      ...review,
      createdAt: new Date().toISOString(),
    }]);
    setReviewTarget(null);
    Alert.alert('Thank You!', 'Your review has been submitted successfully.');
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
          <IconSymbol name="arrow.back" size={18} color={BRAND.navyLight} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Reviews</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}>
        {/* Greeting */}
        <View style={s.greetingCard}>
          <Text style={s.greetingText}>Hi, {userName}!</Text>
          <Text style={s.greetingSub}>
            {pendingReviews.length > 0
              ? `You have ${pendingReviews.length} stay${pendingReviews.length > 1 ? 's' : ''} to review`
              : 'All your stays have been reviewed'}
          </Text>
        </View>

        {/* Pending Reviews */}
        {pendingReviews.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>Pending Reviews</Text>
            {pendingReviews.map(booking => (
              <TouchableOpacity
                key={booking.id}
                onPress={() => setReviewTarget({ bookingId: booking.id, hotelName: booking.hotelName })}
                style={s.reviewPromptCard}
                activeOpacity={0.7}
              >
                <View style={s.reviewPromptRow}>
                  {booking.hotelImage ? (
                    <Image source={{ uri: booking.hotelImage }} style={s.reviewPromptImg} />
                  ) : (
                    <View style={[s.reviewPromptImg, s.reviewPromptImgPlaceholder]}>
                      <IconSymbol name="hotel" size={20} color={SLATE[300]} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={s.reviewPromptName} numberOfLines={1}>{booking.hotelName}</Text>
                    <Text style={s.reviewPromptMeta}>{booking.roomTypeName} · {booking.hotelCity}</Text>
                    <Text style={s.reviewPromptDate}>
                      {new Date(booking.checkOut).toLocaleDateString()} checkout
                    </Text>
                  </View>
                  <View style={s.reviewPromptAction}>
                    <IconSymbol name="edit" size={16} color={ACCENT} />
                  </View>
                </View>
                <View style={s.starRow}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <IconSymbol key={star} name="star" size={16} color={SLATE[200]} />
                  ))}
                  <Text style={s.starHint}>Tap to rate</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* No pending reviews */}
        {pendingReviews.length === 0 && completedBookings.length > 0 && (
          <View style={s.emptyState}>
            <IconSymbol name="check" size={48} color={STATUS.activeGreen} />
            <Text style={s.emptyTitle}>All caught up!</Text>
            <Text style={s.emptyDesc}>{"You've reviewed all your completed stays. Thank you for sharing your experiences!"}</Text>
          </View>
        )}

        {/* No completed bookings */}
        {completedBookings.length === 0 && (
          <View style={s.emptyState}>
            <IconSymbol name="hotel" size={48} color={SLATE[300]} />
            <Text style={s.emptyTitle}>No completed stays yet</Text>
            <Text style={s.emptyDesc}>Complete a stay to leave a review and help other travelers.</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/search')} style={s.browseBtn}>
              <Text style={s.browseBtnText}>Browse Hotels</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Submitted Reviews */}
        {reviews.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>Your Reviews ({reviews.length})</Text>
            {reviews.map((rev, i) => (
              <View key={i} style={s.submittedCard}>
                <View style={s.submittedHeader}>
                  <Text style={s.submittedHotel}>{rev.hotelName}</Text>
                  <View style={s.submittedRatingBadge}>
                    <IconSymbol name="star" size={10} color={BG.white} />
                    <Text style={s.submittedRatingText}>{rev.rating}.0</Text>
                  </View>
                </View>
                {rev.title ? <Text style={s.submittedTitle}>{rev.title}</Text> : null}
                <Text style={s.submittedComment} numberOfLines={3}>{rev.comment}</Text>
                <View style={s.submittedStarRow}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <IconSymbol
                      key={star}
                      name="star"
                      size={14}
                      color={star <= rev.rating ? STATUS_COLORS.gold : SLATE[200]}
                    />
                  ))}
                  <Text style={s.submittedDate}>{new Date(rev.createdAt).toLocaleDateString()}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Loyalty Points Info */}
        <View style={s.pointsCard}>
          <IconSymbol name="star" size={24} color={STATUS_COLORS.gold} />
          <View style={{ flex: 1 }}>
            <Text style={s.pointsTitle}>Earn Points for Reviews</Text>
            <Text style={s.pointsDesc}>Get 50 loyalty points for each verified review you submit.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Review Modal */}
      <ReviewModal
        visible={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        onSubmit={handleSubmitReview}
        hotelName={reviewTarget?.hotelName || ''}
      />
    </View>
  );
}

const PF = FONTS.playfairDisplay.bold;
const IR = FONTS.inter.regular;
const IM = FONTS.inter.medium;
const IB = FONTS.inter.bold;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEUTRAL[50] },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 12,
    backgroundColor: BG.white, borderBottomWidth: 1, borderBottomColor: SLATE[100],
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: SLATE[50], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: BRAND.navyLight, fontFamily: PF },

  greetingCard: { padding: 16, borderRadius: 14, backgroundColor: 'rgba(46, 134, 171, 0.06)', borderWidth: 1, borderColor: 'rgba(46, 134, 171, 0.12)' },
  greetingText: { fontSize: 18, fontWeight: '700', color: BRAND.navyLight, fontFamily: PF },
  greetingSub: { fontSize: 13, color: SLATE[500], marginTop: 2, fontFamily: IR },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: BRAND.navyLight, fontFamily: FONTS.sora },

  reviewPromptCard: { padding: 14, borderRadius: 14, backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[200], gap: 10 },
  reviewPromptRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reviewPromptImg: { width: 56, height: 56, borderRadius: 10 },
  reviewPromptImgPlaceholder: { backgroundColor: SLATE[100], alignItems: 'center', justifyContent: 'center' },
  reviewPromptName: { fontSize: 14, fontWeight: '700', color: BRAND.navyLight, fontFamily: IM },
  reviewPromptMeta: { fontSize: 11, color: SLATE[400], marginTop: 1, fontFamily: IR },
  reviewPromptDate: { fontSize: 11, color: SLATE[500], marginTop: 2, fontFamily: IR },
  reviewPromptAction: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(46, 134, 171, 0.08)', alignItems: 'center', justifyContent: 'center' },

  starRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  starHint: { fontSize: 11, color: SLATE[400], marginLeft: 8, fontFamily: IR },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: BRAND.navyLight, fontFamily: PF },
  emptyDesc: { fontSize: 13, color: SLATE[400], textAlign: 'center', lineHeight: 19, fontFamily: IR },
  browseBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: ACCENT },
  browseBtnText: { fontSize: 13, fontWeight: '700', color: BG.white, fontFamily: IB },

  submittedCard: { padding: 14, borderRadius: 14, backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[100], gap: 4 },
  submittedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  submittedHotel: { fontSize: 14, fontWeight: '700', color: BRAND.navyLight, fontFamily: IM },
  submittedRatingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: ACCENT },
  submittedRatingText: { fontSize: 11, fontWeight: '700', color: BG.white, fontFamily: IB },
  submittedTitle: { fontSize: 13, fontWeight: '600', color: SLATE[900], fontFamily: IM },
  submittedComment: { fontSize: 12, color: SLATE[500], lineHeight: 18, fontFamily: IR },
  submittedStarRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  submittedDate: { fontSize: 10, color: SLATE[300], marginLeft: 8, fontFamily: IR },

  pointsCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14,
    backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[100],
  },
  pointsTitle: { fontSize: 13, fontWeight: '700', color: BRAND.navyLight, fontFamily: IM },
  pointsDesc: { fontSize: 11, color: SLATE[400], marginTop: 1, fontFamily: IR },
});
