import React from 'react';
import { View, Text } from 'react-native';
import { useColors } from '@/hooks/use-colors';

const FEATURES = [
  { icon: '🔒', title: 'Secure Booking', desc: 'Your payments and personal information are always protected with enterprise-grade security.' },
  { icon: '🤝', title: '24/7 Support', desc: 'Our team is available around the clock to help with any questions or issues.' },  
  { icon: '✅', title: 'Best Price Guarantee', desc: 'Find a lower price elsewhere and we\'ll match it. Book with confidence.' },
  { icon: '🌟', title: 'Curated Properties', desc: 'Every property is hand-picked and verified for quality and comfort.' },
];

export function WhyStayEasy() {
  const colors = useColors();

  return (
    <View className="py-8 px-6">
      <Text className="text-2xl font-bold text-foreground mb-2">Why StayEasy?</Text>
      <Text className="text-sm text-muted mb-6">We make travel simple and memorable</Text>

      <View className="gap-3">
        {FEATURES.map((f, i) => (
          <View key={i} style={{
            flexDirection: 'row', padding: 16, borderRadius: 16,
            backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
          }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Text style={{ fontSize: 22 }}>{f.icon}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground mb-1">{f.title}</Text>
              <Text className="text-sm text-muted leading-5">{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
