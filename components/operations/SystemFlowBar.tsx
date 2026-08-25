import { View, Text, ScrollView } from 'react-native';
import { ACCENT, getAccentColor } from '@/constants/portal-theme';
import { SLATE } from '@/lib/constants/figma-tokens';

interface FlowItem {
  label: string;
  count?: number;
  active?: boolean;
}

interface SystemFlowBarProps {
  items: FlowItem[];
}

export function SystemFlowBar({ items }: SystemFlowBarProps) {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: SLATE[100] }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', gap: 4 }}>
        {items.map((item, idx) => (
          <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center' }}>
            {idx > 0 && (
              <Text style={{ fontSize: 12, color: SLATE[300], marginHorizontal: 4 }}>›</Text>
            )}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 8,
                backgroundColor: item.active ? getAccentColor(0.1) : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: item.active ? '700' : '500',
                  color: item.active ? ACCENT : SLATE[500],
                }}
              >
                {item.label}
              </Text>
              {item.count !== undefined && (
                <Text style={{ fontSize: 10, fontWeight: '600', color: item.active ? ACCENT : SLATE[400] }}>
                  ({item.count})
                </Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
