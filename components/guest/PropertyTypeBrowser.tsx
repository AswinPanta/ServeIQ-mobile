import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ImageBackground, StyleSheet, ImageStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PROPERTY_TYPES } from '@/lib/mock/landing-data';

interface Props {
  onSelect?: (type: string) => void;
  selected?: string;
}

export function PropertyTypeBrowser({ onSelect, selected }: Props) {
  return (
    <View>
      <Text style={s.title}>Browse by property type</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {PROPERTY_TYPES.map((property, index) => {
          const isActive = selected === property.type.toLowerCase();
          return (
            <TouchableOpacity
              key={index}
              onPress={() => onSelect?.(property.type.toLowerCase())}
              activeOpacity={0.85}
              style={[s.card, isActive && s.cardActive]}
            >
              <ImageBackground
                source={{ uri: property.imageUrl }}
                style={s.cardImage}
                imageStyle={s.cardImageInner}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.5)']}
                  style={s.gradient}
                />
                <View style={s.cardOverlay}>
                  <View style={s.iconCircle}>
                    <Text style={s.iconEmoji}>
                      {property.type === 'Hotels' ? '🏨' :
                       property.type === 'Apartments' ? '🏢' :
                       property.type === 'Villa' ? '🏰' :
                       property.type === 'Resort' ? '🌊' : '✨'}
                    </Text>
                  </View>
                  <Text style={s.cardType}>{property.type}</Text>
                  <Text style={s.cardSubtitle}>{property.subtitle}</Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A3C5E',
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  scrollContent: {
    gap: 12,
    paddingRight: 16,
  },
  card: {
    width: 160,
    height: 130,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardActive: {
    borderWidth: 2,
    borderColor: '#2E86AB',
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
  cardOverlay: {
    padding: 12,
    alignItems: 'center',
    gap: 2,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  iconEmoji: {
    fontSize: 14,
  },
  cardType: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cardSubtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
