import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useColors } from '@/hooks/use-colors';

const SIMILAR_PROPERTIES = [
  { id: 'h1', name: 'Mountain View Resort', location: 'Pokhara, Nepal', rating: 4.8, price: 'NPR 8,500', image: '🏔️', reviews: 124 },
  { id: 'h2', name: 'Lakeside Boutique Hotel', location: 'Phewa Lake, Pokhara', rating: 4.6, price: 'NPR 6,200', image: '🏞️', reviews: 89 },
  { id: 'h3', name: 'Heritage Palace', location: 'Bhaktapur, Nepal', rating: 4.9, price: 'NPR 12,000', image: '🏛️', reviews: 203 },
  { id: 'h4', name: 'Jungle Safari Lodge', location: 'Chitwan, Nepal', rating: 4.5, price: 'NPR 7,800', image: '🌿', reviews: 67 },
];

export function OtherHotels({ title = 'Explore More Properties' }: { title?: string }) {
  const colors = useColors();

  return (
    <View className="py-8">
      <View className="px-6 mb-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-foreground">{title}</Text>
          <TouchableOpacity>
            <Text className="text-sm font-semibold" style={{ color: '#E63946' }}>See All</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 14 }}>
        {SIMILAR_PROPERTIES.map((p) => (
          <TouchableOpacity key={p.id} onPress={() => router.push(`/${p.id}` as any)}
            style={{
              width: 200, borderRadius: 20, backgroundColor: colors.surface,
              borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
              shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
            }}
            activeOpacity={0.85}
          >
            <View style={{ height: 110, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 40 }}>{p.image}</Text>
            </View>
            <View style={{ padding: 14 }}>
              <Text className="text-base font-bold text-foreground mb-0.5" numberOfLines={1}>{p.name}</Text>
              <Text className="text-xs text-muted" numberOfLines={1}>{p.location}</Text>
              <View className="flex-row items-center justify-between mt-2">
                <View className="flex-row items-center gap-1">
                  <Text style={{ fontSize: 12 }}>⭐</Text>
                  <Text className="text-xs font-bold text-foreground">{p.rating}</Text>
                  <Text className="text-xs text-muted">({p.reviews})</Text>
                </View>
                <Text className="text-sm font-bold" style={{ color: '#E63946' }}>{p.price}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
