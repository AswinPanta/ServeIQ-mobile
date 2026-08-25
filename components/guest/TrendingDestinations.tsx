import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ImageBackground, StyleSheet, ImageStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { TRENDING_DESTINATIONS } from '@/lib/mock/landing-data';
import { BRAND, BG } from '@/lib/constants/figma-tokens';

interface Props {
  onSelect?: (destination: string) => void;
}

export function TrendingDestinations({ onSelect }: Props) {
  const { t } = useTranslation();
  return (
    <View>
      <Text style={s.title}>{t('components.destinations.trending')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {TRENDING_DESTINATIONS.map((dest) => (
          <TouchableOpacity
            key={dest.id}
            activeOpacity={0.85}
            onPress={() => onSelect?.(dest.location)}
            style={s.card}
          >
            <ImageBackground
              source={{ uri: dest.image }}
              style={s.cardImage}
              imageStyle={s.cardImageInner}
            >
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={s.gradient}
              />
              {/* Type badge */}
              <View style={s.typeBadge}>
                <Text style={s.typeText}>{dest.type}</Text>
              </View>
              {/* Content */}
              <View style={s.cardContent}>
                <Text style={s.cardName}>{dest.name}</Text>
                <Text style={s.cardLocation}>{dest.location}</Text>
                <View style={s.priceRow}>
                  <Text style={s.priceStrike}>${dest.price + 30}</Text>
                  <Text style={s.price}>${dest.price}                   <Text style={s.priceUnit}>{t('components.destinations.perNight')}</Text></Text>
                </View>
                <View style={s.ratingRow}>
                  <Text style={s.star}>⭐</Text>
                  <Text style={s.rating}>{dest.rating}</Text>
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND.navyLight,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  scrollContent: {
    gap: 12,
    paddingRight: 16,
  },
  card: {
    width: 200,
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cardImageInner: {
    borderRadius: 16,
  },
  gradient: {
    ...StyleSheet.absoluteFill as ImageStyle,
    borderRadius: 16,
  },
  typeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  typeText: {
    fontSize: 9,
    fontWeight: '700',
    color: BRAND.navyLight,
  },
  cardContent: {
    padding: 12,
    gap: 2,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '700',
    color: BG.white,
    letterSpacing: -0.2,
  },
  cardLocation: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceStrike: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    color: BG.white,
  },
  priceUnit: {
    fontSize: 10,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  star: {
    fontSize: 10,
  },
  rating: {
    fontSize: 11,
    fontWeight: '600',
    color: BG.white,
  },
});
