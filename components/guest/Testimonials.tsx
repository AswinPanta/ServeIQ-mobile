import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useColors } from '@/hooks/use-colors';

const TESTIMONIALS = [
  { id: '1', name: 'Rahul Sharma', location: 'New Delhi, India', rating: 5, quote: 'Absolutely stunning property! The staff was incredibly welcoming and the views were breathtaking. Will definitely be coming back.', avatar: '👨‍💼' },
  { id: '2', name: 'Emily Chen', location: 'Singapore', rating: 5, quote: 'StayEasy made our honeymoon unforgettable. The booking process was seamless and the property exceeded our expectations.', avatar: '👩‍💼' },
  { id: '3', name: 'James Wilson', location: 'London, UK', rating: 4, quote: 'Great experience overall. Beautiful property with excellent amenities. The only minor issue was the check-in process which was slightly delayed.', avatar: '👨‍💼' },
  { id: '4', name: 'Priya Patel', location: 'Mumbai, India', rating: 5, quote: 'Perfect family getaway! The kids loved the pool and the staff arranged a wonderful local tour for us. Highly recommended!', avatar: '👩‍💼' },
];

function Stars({ count }: { count: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Text key={i} style={{ fontSize: 12 }}>{i < count ? '⭐' : '☆'}</Text>
      ))}
    </View>
  );
}

export function Testimonials() {
  const colors = useColors();

  return (
    <View className="py-8">
      <View className="px-6 mb-6">
        <Text className="text-2xl font-bold text-foreground">What Our Guests Say</Text>
        <Text className="text-sm text-muted mt-1">Real reviews from real travelers</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}>
        {TESTIMONIALS.map((t) => (
          <View key={t.id} style={{
            width: 280, padding: 20, borderRadius: 20,
            backgroundColor: colors.surface,
            borderWidth: 1, borderColor: colors.border,
            shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
          }}>
            <View className="flex-row items-center gap-3 mb-3">
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20 }}>{t.avatar}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-foreground">{t.name}</Text>
                <Text className="text-xs text-muted">{t.location}</Text>
              </View>
              <Stars count={t.rating} />
            </View>
            <Text className="text-sm text-foreground leading-5">{t.quote}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
