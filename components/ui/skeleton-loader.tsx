/**
 * Skeleton Loader Component
 * Animated skeleton placeholder for loading states
 */

import React, { useEffect } from 'react';
import { View, ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

interface SkeletonProps extends ViewProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  className,
  ...props
}: SkeletonProps) {
  const colors = useColors();
  const animationValue = useSharedValue(0);

  useEffect(() => {
    animationValue.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    );
  }, [animationValue]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animationValue.value,
      [0, 1],
      [0.3, 0.7],
      Extrapolate.CLAMP
    );

    return {
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: typeof width === 'string' ? width : width,
          height: typeof height === 'number' ? height : height,
          borderRadius,
          backgroundColor: colors.border,
        } as any,
        animatedStyle,
      ]}
      {...props}
    />
  );
}

interface SkeletonCardProps {
  lines?: number;
  showImage?: boolean;
  className?: string;
}

export function SkeletonCard({
  lines = 3,
  showImage = true,
  className,
}: SkeletonCardProps) {
  return (
    <View className={cn('gap-3', className)}>
      {showImage && <Skeleton width="100%" height={200} borderRadius={12} />}
      <View className="gap-2 px-4">
        <Skeleton width="70%" height={16} borderRadius={4} />
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            width={i === lines - 1 ? '50%' : '100%'}
            height={12}
            borderRadius={4}
          />
        ))}
      </View>
    </View>
  );
}

interface SkeletonListProps {
  count?: number;
  showImage?: boolean;
  className?: string;
}

export function SkeletonList({
  count = 5,
  showImage = true,
  className,
}: SkeletonListProps) {
  return (
    <View className={cn('gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} showImage={showImage} />
      ))}
    </View>
  );
}
