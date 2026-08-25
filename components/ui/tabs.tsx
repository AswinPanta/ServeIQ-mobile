import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { cn } from '@/lib/utils';
import { BLUE } from '@/lib/constants/figma-tokens';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'pills';
  className?: string;
}

export function Tabs({ tabs, active, onChange, variant = 'underline', className }: TabsProps) {
  const [positions, setPositions] = useState<Record<string, number>>({});
  const [widths, setWidths] = useState<Record<string, number>>({});
  const scrollRef = useRef<ScrollView>(null);

  const indicatorStyle = useAnimatedStyle(() => ({
    left: withSpring(positions[active] ?? 0, { stiffness: 300, damping: 30 }),
    width: withSpring(widths[active] ?? 0, { stiffness: 300, damping: 30 }),
  }));

  const handleLayout = (tabId: string, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setPositions(prev => ({ ...prev, [tabId]: x }));
    setWidths(prev => ({ ...prev, [tabId]: width }));
  };

  if (variant === 'pills') {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className={cn('flex-row', className)}>
        <View className="flex-row gap-1.5">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onChange(tab.id)}
              className={cn(
                'px-4 py-1.5 rounded-lg',
                active === tab.id ? 'bg-primary' : 'bg-transparent'
              )}
            >
              <Text className={cn(
                'text-xs font-medium',
                active === tab.id ? 'text-primary-foreground' : 'text-muted-foreground'
              )}>
                {tab.label}
                {tab.count !== undefined ? ` ${tab.count}` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <View className={cn('relative', className)}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} ref={scrollRef}>
        <View className="flex-row">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onChange(tab.id)}
              onLayout={(e) => handleLayout(tab.id, e)}
              className="px-4 py-2.5"
            >
              <Text className={cn(
                'text-sm font-medium',
                active === tab.id ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {tab.label}
                {tab.count !== undefined ? (
                  <Text className={cn('text-xs ml-1', active === tab.id ? 'text-primary' : 'text-muted-foreground/60')}>
                    {tab.count}
                  </Text>
                ) : null}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <Animated.View
        style={[indicatorStyle, { bottom: 0, height: 2, backgroundColor: BLUE.ios, position: 'absolute' } as any]}
      />
    </View>
  );
}
