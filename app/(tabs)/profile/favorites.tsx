import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useFavorites } from '@/lib/context/favorites-context';
import { MOCK_PROPERTIES, Hotel } from '@/lib/mock/properties';
import { FONTS, SHADOWS } from '@/constants/portal-theme';

const CORAL = '#E63946';
const NAVY = '#1A3C5E';

function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <IconSymbol
          key={i}
          name="star"
          size={size}
          color={i <= Math.round(rating) ? CORAL : '#E5E7EB'}
        />
      ))}
    </View>
  );
}

function FavoriteCard({ hotel }: { hotel: Hotel }) {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/guest-hotel-detail/[id]', params: { id: hotel.id } })}
      style={s.card}
    >
      <View style={s.imagePlaceholder}>
        <IconSymbol name="hotel" size={28} color="#CBD5E1" />
      </View>
      <View style={s.cardBody}>
        <Text style={s.cardName} numberOfLines={1}>{hotel.name}</Text>
        <StarRating rating={hotel.rating} />
        <Text style={s.cardPrice}>NPR {hotel.price.toLocaleString()}<Text style={s.cardPerNight}> {t('profile.favorites.perNight')}</Text></Text>
      </View>
    </TouchableOpacity>
  );
}

export default function FavoritesScreen() {
  const { favorites } = useFavorites();
  const { t } = useTranslation();
  const favoriteHotels = MOCK_PROPERTIES.filter(h => favorites.has(h.id));
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <IconSymbol name="chevron.left" size={20} color={NAVY} />
        </TouchableOpacity>
        <Text style={s.title}>{t('profile.favorites.title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      {favoriteHotels.length === 0 ? (
        <View style={s.emptyState}>
          <View style={s.emptyIcon}>
            <IconSymbol name="heart.fill" size={48} color={CORAL} />
          </View>
          <Text style={s.emptyTitle}>{t('profile.favorites.empty')}</Text>
          <Text style={s.emptyDesc}>{t('profile.favorites.emptyDesc')}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)')} style={s.exploreBtn}>
            <Text style={s.exploreBtnText}>{t('profile.favorites.emptyCTA')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favoriteHotels}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={s.row}
          renderItem={({ item }) => <FavoriteCard hotel={item} />}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={CORAL}
              colors={[CORAL]}
            />
          }
        />
      )}
    </View>
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
    color: NAVY,
    letterSpacing: -0.5,
    fontFamily: FONTS.sora,
  },
  list: {
    paddingHorizontal: 12,
    paddingBottom: 120,
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  imagePlaceholder: {
    height: 100,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardBody: {
    padding: 10,
    gap: 4,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '600',
    color: NAVY,
    fontFamily: FONTS.inter.semiBold,
  },
  cardPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: CORAL,
    fontFamily: FONTS.inter.bold,
  },
  cardPerNight: {
    fontSize: 10,
    fontWeight: '400',
    color: '#94A3B8',
    fontFamily: FONTS.inter.regular,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    gap: 12,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: CORAL + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: NAVY,
    fontFamily: FONTS.inter.semiBold,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: FONTS.inter.regular,
  },
  exploreBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: CORAL,
  },
  exploreBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: FONTS.inter.semiBold,
  },
});
