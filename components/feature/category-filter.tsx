import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { cn } from '@/lib/utils';
import { useColors } from '@/hooks/use-colors';

const categories = [
  { id: 'all', label: 'All', icon: '✦' },
  { id: 'beachfront', label: 'Beachfront', icon: '🏖️' },
  { id: 'mountain', label: 'Mountain', icon: '⛰️' },
  { id: 'city', label: 'City Centre', icon: '🏙️' },
  { id: 'villa', label: 'Villas', icon: '🏡' },
  { id: 'luxury', label: 'Luxury', icon: '💎' },
  { id: 'pool', label: 'Amazing Pools', icon: '🏊' },
  { id: 'countryside', label: 'Countryside', icon: '🌿' },
  { id: 'historic', label: 'Historic', icon: '🏛️' },
];

interface CategoryFilterProps {
  selected: string;
  onChange: (id: string) => void;
}

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  const colors = useColors();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const idx = categories.findIndex((c) => c.id === selected);
    if (idx >= 0 && scrollRef.current) {
      scrollRef.current.scrollTo({ x: idx * 100, animated: true });
    }
  }, [selected]);

  return (
    <View className="border-b border-border bg-surface">
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4 py-3 gap-2"
      >
        {categories.map((cat) => {
          const isActive = selected === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => onChange(cat.id)}
              className={cn(
                'flex-row items-center gap-2 px-4 py-2 rounded-full border',
                isActive ? 'border-primary' : 'border-border'
              )}
              style={{
                backgroundColor: isActive ? colors.primary : colors.surface,
              }}
            >
              <Text className="text-sm">{cat.icon}</Text>
              <Text
                className={cn(
                  'text-xs font-semibold',
                  isActive ? 'text-white' : 'text-foreground'
                )}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
