import { View, Text } from 'react-native';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
}

export function KpiCard({ label, value, icon, color, subtitle }: KpiCardProps) {
  return (
    <View style={{ backgroundColor: '#FFF', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, borderWidth: 1, borderColor: '#F1F5F9' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: color + '15', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 16 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#1E293B', fontVariant: ['tabular-nums'], marginTop: 1 }}>{value}</Text>
          {subtitle && <Text style={{ fontSize: 11, color: color, fontWeight: '500', marginTop: 1 }}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  );
}
