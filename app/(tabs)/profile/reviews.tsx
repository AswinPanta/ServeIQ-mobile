import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FONTS, SHADOWS } from '@/constants/portal-theme';

const CORAL = '#E63946';

interface MockReview {
  id: string;
  hotelName: string;
  rating: number;
  date: string;
  comment: string;
}

const MOCK_REVIEWS: MockReview[] = [
  {
    id: 'r1',
    hotelName: 'Hyatt Regency Kathmandu',
    rating: 5,
    date: '2026-05-12',
    comment: 'Amazing stay! The staff was incredibly helpful and the room had a stunning view of the Himalayas.',
  },
  {
    id: 'r2',
    hotelName: 'Taj Mahal Palace Pokhara',
    rating: 4,
    date: '2026-03-28',
    comment: 'Beautiful property with excellent amenities. The lakeside location was perfect for evening walks.',
  },
  {
    id: 'r3',
    hotelName: 'The Everest Boutique Hotel',
    rating: 5,
    date: '2026-01-15',
    comment: 'A hidden gem in the heart of the city. The rooftop restaurant served the best local cuisine.',
  },
];

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <IconSymbol
          key={i}
          name="star"
          size={size}
          color={i <= rating ? CORAL : '#E5E7EB'}
        />
      ))}
    </View>
  );
}

export default function ReviewsScreen() {
  const { t } = useTranslation();
  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <IconSymbol name="chevron.left" size={20} color="#1A3C5E" />
        </TouchableOpacity>
        <Text style={s.title}>{t('profile.reviews.title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      {MOCK_REVIEWS.length === 0 ? (
        <View style={s.emptyState}>
          <IconSymbol name="star" size={64} color={CORAL + '30'} />
          <Text style={s.emptyTitle}>{t('profile.reviews.empty')}</Text>
          <Text style={s.emptyDesc}>{t('profile.reviews.emptyDesc')}</Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {MOCK_REVIEWS.map(review => (
            <View key={review.id} style={s.reviewCard}>
              <View style={s.reviewHeader}>
                <Text style={s.hotelName}>{review.hotelName}</Text>
                <Text style={s.reviewDate}>
                  {new Date(review.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              <StarRating rating={review.rating} />
              <Text style={s.comment}>{review.comment}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
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
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A3C5E',
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
    color: '#1A3C5E',
    fontFamily: FONTS.inter.semiBold,
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: FONTS.inter.regular,
  },
  reviewCard: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
    color: '#1A3C5E',
    flex: 1,
    fontFamily: FONTS.inter.semiBold,
  },
  reviewDate: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: FONTS.inter.regular,
  },
  comment: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
    fontFamily: FONTS.inter.regular,
  },
});
