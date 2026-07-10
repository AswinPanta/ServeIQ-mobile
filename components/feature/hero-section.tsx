/**
 * Hero Section Component
 * Landing page hero with search overlay
 */

import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { useColors } from '@/hooks/use-colors';

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
  onSearchPress?: () => void;
  onExplorePress?: () => void;
  searchPlaceholder?: string;
}

export function HeroSection({
  title = 'Find Your Perfect Stay',
  subtitle = 'Explore amazing hotels and restaurants',
  backgroundImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
  onSearchPress,
  onExplorePress,
  searchPlaceholder = 'Where are you going?',
}: HeroSectionProps) {
  const colors = useColors();

  return (
    <View className="relative w-full h-80 overflow-hidden rounded-b-3xl">
      {/* Background Image */}
      <ImageBackground
        source={{ uri: backgroundImage }}
        className="w-full h-full"
        resizeMode="cover"
      >
        {/* Overlay */}
        <View className="flex-1 bg-black/40" />
      </ImageBackground>

      {/* Content */}
      <View className="absolute inset-0 justify-between p-6 pb-8">
        {/* Header Text */}
        <View className="gap-2">
          <Text className="text-4xl font-bold text-white">{title}</Text>
          <Text className="text-base text-white/80">{subtitle}</Text>
        </View>

        {/* Search Bar */}
        <View className="gap-3">
          <TouchableOpacity
            onPress={onSearchPress}
            style={{ backgroundColor: 'white', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}
          >
            <Text className="text-xl">🔍</Text>
            <Text className="text-base text-muted flex-1">{searchPlaceholder}</Text>
          </TouchableOpacity>

          {/* Explore Button */}
          <TouchableOpacity
            onPress={onExplorePress}
            style={{ backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 24, paddingVertical: 14, alignItems: 'center' }}
          >
            <Text className="text-white font-semibold text-base">Explore Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
