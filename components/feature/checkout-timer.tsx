import React, { useState, useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import { useColors } from '@/hooks/use-colors';

interface CheckoutTimerProps {
  durationSeconds?: number;
  onExpired: () => void;
}

export function CheckoutTimer({ durationSeconds = 600, onExpired }: CheckoutTimerProps) {
  const colors = useColors();
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [onExpired]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isUrgent = secondsLeft <= 120;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: isUrgent ? `${colors.error}15` : `${colors.primary}10`,
        borderWidth: 1,
        borderColor: isUrgent ? `${colors.error}30` : `${colors.primary}20`,
      }}
    >
      <Text style={{ fontSize: 14, marginRight: 6 }}>
        {isUrgent ? '⚠️' : '⏱️'}
      </Text>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: isUrgent ? colors.error : colors.primary,
        }}
      >
        Rooms held for{' '}
        <Text style={{ fontWeight: '800', fontVariant: ['tabular-nums'] }}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </Text>
      </Text>
    </View>
  );
}
