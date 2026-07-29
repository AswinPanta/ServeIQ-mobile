import { View } from 'react-native';
import { useEffect, useRef, useMemo } from 'react';
import { Animated } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const opacityAnim = useMemo(() => new Animated.Value(0.3), []);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    animRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animRef.current.start();
    return () => animRef.current?.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[{ width: width as any, height, borderRadius, backgroundColor: '#E2E8F0', opacity: opacityAnim }, style]}
    />
  );
}

export function CardSkeleton() {
  return (
    <View style={{ padding: 16, backgroundColor: '#FFF', borderRadius: 12, gap: 10 }}>
      <Skeleton width="60%" height={14} />
      <Skeleton width="100%" height={12} />
      <Skeleton width="80%" height={12} />
    </View>
  );
}
