import React from 'react';
import { View, Text } from 'react-native';
import { useColors } from '@/hooks/use-colors';

interface UrgencyBadgeProps {
  count: number;
}

export function UrgencyBadge({ count }: UrgencyBadgeProps) {
  const colors = useColors();

  if (count > 3) return null;

  const getMessage = () => {
    if (count === 0) return 'Sold Out';
    if (count === 1) return 'Last room!';
    return `Only ${count} left!`;
  };

  const getColor = () => {
    if (count === 0) return colors.muted;
    if (count === 1) return colors.error;
    return colors.warning || '#f59e0b';
  };

  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: `${getColor()}20`,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: getColor(),
        }}
      >
        {getMessage()}
      </Text>
    </View>
  );
}
