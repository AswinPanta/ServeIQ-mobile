import { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { safeGoBack } from '@/lib/utils';import { useTranslation } from 'react-i18next';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SkeletonList } from '@/components/ui/skeleton-loader';
import { FONTS, SHADOWS } from '@/constants/portal-theme';
import { CORAL as CORALTokens, GRAY, BRAND, NEUTRAL, BG, SLATE } from '@/lib/constants/figma-tokens';
import { hostApi, GuestReview } from '@/lib/api/host-api';
import { ReviewModal } from '@/components/feature/review-modal';

const CORAL = CORALTokens[500];

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <IconSymbol
          key={i}
          name="star"
          size={size}
          color={i <= rating ? CORAL : GRAY[200]}
        />
      ))}
    </View>
  );
}

export default function ReviewsScreen() {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<GuestReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<GuestReview | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await hostApi.getMyReviews();
      setReviews(res.reviews ?? []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleSubmitEdit = async (values: { rating: number; comment: string }) => {
    if (!editing) return;
    const ok = await hostApi.updateReview(editing.property.id, editing.id, values, () => null);
    setEditing(null);
    if (ok === null) {
      Alert.alert(t('common.error'), t('profile.reviews.updateFailed', 'Could not update your review. Please try again.'));
      return;
    }
    await load();
  };

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={s.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
          <IconSymbol name="chevron.left" size={20} color={BRAND.navyLight} />
        </TouchableOpacity>
        <Text style={s.title}>{t('profile.reviews.title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: 16 }}>
          <SkeletonList count={3} showImage={false} />
        </View>
      ) : reviews.length === 0 ? (
        <View style={s.emptyState}>
          <IconSymbol name="star" size={64} color={CORAL + '30'} />
          <Text style={s.emptyTitle}>{t('profile.reviews.empty')}</Text>
          <Text style={s.emptyDesc}>{t('profile.reviews.emptyDesc')}</Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {reviews.map(review => (
            <View key={review.id} style={s.reviewCard}>
              <View style={s.reviewHeader}>
                <Text style={s.hotelName}>{review.property?.name ?? ''}</Text>
                <Text style={s.reviewDate}>
                  {review.created_at
                    ? new Date(review.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : ''}
                </Text>
              </View>
              <View style={s.ratingRow}>
                <StarRating rating={review.rating} />
                {review.is_edited ? <Text style={s.editedBadge}>{t('profile.reviews.edited', 'Edited')}</Text> : null}
              </View>
              <Text style={s.comment}>{review.comment ?? ''}</Text>
              <TouchableOpacity style={s.editBtn} onPress={() => setEditing(review)} activeOpacity={0.7}>
                <IconSymbol name="edit" size={14} color={BRAND.navyLight} />
                <Text style={s.editBtnText}>{t('profile.reviews.edit', 'Edit')}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <ReviewModal
        visible={!!editing}
        onClose={() => setEditing(null)}
        onSubmit={handleSubmitEdit}
        hotelName={editing?.property?.name ?? ''}
        initial={editing ? { rating: editing.rating, comment: editing.comment ?? '' } : undefined}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEUTRAL[50] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: BG.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: SLATE[100],
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND.navyLight,
    letterSpacing: -0.5,
    fontFamily: FONTS.sora,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.navyLight,
    fontFamily: FONTS.inter.semiBold,
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: SLATE[400],
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: FONTS.inter.regular,
  },
  reviewCard: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: BG.white,
    borderWidth: 1,
    borderColor: SLATE[100],
    gap: 8,
    ...SHADOWS.card,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hotelName: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.navyLight,
    flex: 1,
    fontFamily: FONTS.inter.semiBold,
  },
  reviewDate: {
    fontSize: 11,
    color: SLATE[400],
    fontFamily: FONTS.inter.regular,
  },
  comment: {
    fontSize: 13,
    color: GRAY[600],
    lineHeight: 20,
    fontFamily: FONTS.inter.regular,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editedBadge: {
    fontSize: 11,
    color: SLATE[400],
    fontStyle: 'italic',
    fontFamily: FONTS.inter.regular,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: BRAND.navyLight + '10',
    marginTop: 4,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND.navyLight,
    fontFamily: FONTS.inter.semiBold,
  },
});
