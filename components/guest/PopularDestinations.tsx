import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ImageBackground, StyleSheet, ImageStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { POPULAR_DESTINATIONS } from '@/lib/mock/landing-data';

interface Props {
  onSelect?: (destination: string) => void;
}

export function PopularDestinations({ onSelect }: Props) {
  const { t } = useTranslation();
  return (
    <View>
      <View style={s.header}>
        <Text style={s.title}>{t('components.destinations.popular')}</Text>
        <TouchableOpacity>
          <Text style={s.viewAll}>{t('components.destinations.viewAll')}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {POPULAR_DESTINATIONS.map((dest, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.85}
            onPress={() => onSelect?.(dest.city)}
            style={s.card}
          >
            <ImageBackground
              source={{ uri: dest.image }}
              style={s.cardImage}
              imageStyle={s.cardImageInner}
            >
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.5)']}
                style={s.gradient}
              />
              <View style={s.cardContent}>
                <Text style={s.cardCity}>{dest.city}</Text>
                <Text style={s.cardCountry}>{dest.country}</Text>
                <View style={s.metaRow}>
                  <Text style={s.properties}>{t('components.destinations.properties', { n: dest.properties })}</Text>
                  <View style={s.ratingBadge}>
                    <Text style={s.star}>⭐</Text>
                    <Text style={s.rating}>{dest.rating}</Text>
                  </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A3C5E',
    letterSpacing: -0.3,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E86AB',
  },
  scrollContent: {
    gap: 12,
    paddingRight: 16,
  },
  card: {
    width: 150,
    height: 200,
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
  cardContent: {
    padding: 12,
    gap: 2,
  },
  cardCity: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -0.2,
  },
  cardCountry: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  properties: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  star: {
    fontSize: 9,
  },
  rating: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
  },
});
