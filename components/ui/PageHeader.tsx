import { View, Text, TouchableOpacity } from 'react-native';
import { ACCENT, getAccentColor } from '@/constants/portal-theme';
import { safeGoBack } from '@/lib/utils';
import { SLATE } from '@/lib/constants/figma-tokens';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  count?: number;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export function PageHeader({ title, subtitle, count, showBack = true, rightAction }: PageHeaderProps) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          {showBack && (
            <TouchableOpacity
              onPress={() => safeGoBack()}
              style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: SLATE[100], alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 18, color: SLATE[600] }}>←</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: SLATE[800] }}>{title}</Text>
              {count !== undefined && (
                <View style={{ backgroundColor: getAccentColor(0.12), paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: ACCENT }}>{count}</Text>
                </View>
              )}
            </View>
            {subtitle && <Text style={{ fontSize: 13, color: SLATE[500], marginTop: 1 }}>{subtitle}</Text>}
          </View>
        </View>
        {rightAction}
      </View>
    </View>
  );
}
