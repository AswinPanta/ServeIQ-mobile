import { View, Text } from 'react-native';

interface StatusBadgeProps {
  label: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ label, color, size = 'sm' }: StatusBadgeProps) {
  const sizeStyles = {
    sm: { px: 8, py: 2, fontSize: 11, dot: 6 },
    md: { px: 10, py: 3, fontSize: 12, dot: 7 },
    lg: { px: 12, py: 4, fontSize: 13, dot: 8 },
  };
  const s = sizeStyles[size];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: color + '15',
        paddingHorizontal: s.px,
        paddingVertical: s.py,
        borderRadius: 999,
      }}
    >
      <View style={{ width: s.dot, height: s.dot, borderRadius: s.dot / 2, backgroundColor: color }} />
      <Text style={{ fontSize: s.fontSize, fontWeight: '600', color, letterSpacing: 0.3, textTransform: 'uppercase' }}>
        {label}
      </Text>
    </View>
  );
}
