/**
 * Destination Card Component
 * Displays featured destination in carousel format with experience tags
 */

import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground, ScrollView } from 'react-native';
import { Card } from '@/components/ui/card';

interface DestinationCardProps {
  id: string;
  name: string;
  image: string | number;
  hotelCount: number;
  experiences?: string[];
  onPress?: () => void;
}

export function DestinationCard({
  id,
  name,
  image,
  hotelCount,
  experiences = [],
  onPress,
}: DestinationCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card variant="elevated" padding="none" className="overflow-hidden w-44 h-56">
        {/* Background Image */}
        <ImageBackground
          source={typeof image === 'string' ? { uri: image } : image}
          className="w-full h-full"
          resizeMode="cover"
        >
          {/* Gradient Overlay */}
          <View className="flex-1 bg-gradient-to-b from-black/20 via-black/40 to-black/70" />

          {/* Content */}
          <View className="absolute bottom-0 left-0 right-0 p-3 gap-2">
            <Text className="text-white font-bold text-lg" numberOfLines={1}>
              {name}
            </Text>
            <Text className="text-white/70 text-[11px] mb-1">
              {hotelCount} hotels available
            </Text>

            {/* Experience Tags */}
            {experiences.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 4 }}
              >
                {experiences.slice(0, 3).map((exp, idx) => (
                  <View
                    key={idx}
                    className="bg-white/20 rounded-full px-2 py-1"
                  >
                    <Text className="text-white text-[11px] font-medium" numberOfLines={1}>
                      {exp}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </ImageBackground>
      </Card>
    </TouchableOpacity>
  );
}
