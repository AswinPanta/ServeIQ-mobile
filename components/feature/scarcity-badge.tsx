import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';

interface ScarcityBadgeProps {
  /** How many rooms are still available */
  count: number;
  /** Total available — used to compute urgency level */
  maxThreshold?: number;
  /** Positioning mode: 'absolute' (default, for overlaying on images) or 'relative' (inline flow) */
  position?: 'absolute' | 'relative';
}

const BADGE_COLORS: Record<string, { bg: string; pulse: string; text: string }> = {
  critical: { bg: '#DC2626', pulse: '#FCA5A5', text: '#fff' },
  warning: { bg: '#D97706', pulse: '#FDE68A', text: '#fff' },
  low: { bg: '#2563EB', pulse: '#93C5FD', text: '#fff' },
};

function getColorConfig(count: number) {
  if (count === 1) return BADGE_COLORS.critical;
  if (count === 2) return BADGE_COLORS.warning;
  return BADGE_COLORS.low;
}

function getLabel(count: number): string {
  if (count === 1) return '⚡ Only 1 left';
  if (count <= 3) return `⚡ Only ${count} left`;
  return '';
}

export function ScarcityBadge({ count, maxThreshold = 3, position = 'absolute' }: ScarcityBadgeProps) {
  const pulse = useSharedValue(0);
  const scale = useSharedValue(1);

  const show = count > 0 && count <= maxThreshold;
  const colors = getColorConfig(count);

  useEffect(() => {
    if (!show) return;
    // Continuous gentle pulse animation
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
      ),
      3, // pulse 3 times then settle (~7.2s total)
      true, // reverse
    );
    // Subtle scale breathe
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      ),
      3,
      true,
    );
    return () => {
      pulse.value = 0;
      scale.value = 1;
    };
  }, [show]);

  const animatedBgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      pulse.value,
      [0, 1],
      [colors.bg, colors.pulse],
    ),
    transform: [{ scale: scale.value }],
  }));

  if (!show) return null;

  return (
    <Animated.View
      style={[
        {
          ...(position === 'absolute'
            ? { position: 'absolute', top: 8, left: 8, zIndex: 10 }
            : { alignSelf: 'flex-start', marginTop: 6 }),
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 5,
        },
        animatedBgStyle,
      ]}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: '800',
          color: colors.text,
          letterSpacing: 0.3,
        }}
      >
        {getLabel(count)}
      </Text>
    </Animated.View>
  );
}
