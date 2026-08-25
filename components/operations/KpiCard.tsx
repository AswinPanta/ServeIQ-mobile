import { View, Text } from 'react-native';
import { BG, TEXT, SLATE } from '@/lib/constants/figma-tokens';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
}

export function KpiCard({ label, value, icon, color, subtitle }: KpiCardProps) {
  return (
    <View style={{ backgroundColor: BG.white, borderRadius: 12, padding: 14, shadowColor: TEXT.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, borderWidth: 1, borderColor: SLATE[100] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: color + '15', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 16 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: SLATE[500], fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: SLATE[800], fontVariant: ['tabular-nums'], marginTop: 1 }}>{value}</Text>
          {subtitle && <Text style={{ fontSize: 11, color: color, fontWeight: '500', marginTop: 1 }}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  );
}
