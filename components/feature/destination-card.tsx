/**
 * Destination Card Component
 * Displays featured destination in carousel format
 */

import React from 'react';
import { View, Text, TouchableOpacity, Image, ImageBackground } from 'react-native';
import { Card } from '@/components/ui/card';

interface DestinationCardProps {
  id: string;
  name: string;
  image: string | number;
  hotelCount: number;
  onPress?: () => void;
}

export function DestinationCard({
  id,
  name,
  image,
  hotelCount,
  onPress,
}: DestinationCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card variant="elevated" padding="none" className="overflow-hidden w-40 h-48">
        {/* Background Image */}
        <ImageBackground
          source={typeof image === 'string' ? { uri: image } : image}
          className="w-full h-full"
          resizeMode="cover"
        >
          {/* Overlay */}
          <View className="flex-1 bg-black/40" />

          {/* Content */}
          <View className="absolute bottom-0 left-0 right-0 p-3 gap-1">
            <Text className="text-white font-bold text-lg" numberOfLines={2}>
              {name}
            </Text>
            <Text className="text-white/80 text-xs">
              {hotelCount} hotels available
            </Text>
          </View>
        </ImageBackground>
      </Card>
    </TouchableOpacity>
  );
}
