/**
 * motion.tsx — Shared motion primitives for all 4 portals.
 *
 * One physics library, parameterised per portal via SPRING_PRESETS so each
 * portal has its own motion personality without duplicating this file.
 *
 *   AnimatedPressable : spring-scale on press + haptic + reduced-motion
 *   FadeInView        : Reanimated entering helper used as a drop-in View
 *   Stagger           : wraps children with staggered FadeInDown
 *   KpiCounter        : animatable numeric label that counts up
 *
 * Built for Reanimated 4.5 + GestureHandler 2.32 + expo-haptics.
 */
import React, { useEffect, useMemo } from 'react';
import { Text, TextProps, View, ViewProps } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeInDown,
  ReduceMotion,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// ─── Spring Presets ────────────────────────────────────────────────────────
export const SPRING_PRESETS = {
  guest: {
    // Playful, welcoming. Bouncy tab bars.
    tap: { damping: 14, stiffness: 180, mass: 0.7 },
    enter: { damping: 16, stiffness: 140, mass: 0.8 },
  },
  host: {
    // Professional, restrained.
    tap: { damping: 18, stiffness: 240, mass: 0.6 },
    enter: { damping: 20, stiffness: 180, mass: 0.7 },
  },
  operations: {
    // Utilitarian. Fast & responsive for staff use.
    tap: { damping: 22, stiffness: 320, mass: 0.5 },
    enter: { damping: 24, stiffness: 220, mass: 0.6 },
  },
  superadmin: {
    // Dense dashboard — minimal bounce.
    tap: { damping: 26, stiffness: 360, mass: 0.4 },
    enter: { damping: 28, stiffness: 240, mass: 0.5 },
  },
} as const;

export type PortalKey = keyof typeof SPRING_PRESETS;

// ─── Haptic helper (JS thread only) ───────────────────────────────────────
type HapticKind = 'none' | 'light' | 'medium' | 'heavy' | 'selection';

function triggerHaptic(kind: HapticKind) {
  if (kind === 'none') return;
  try {
    if (kind === 'selection') {
      Haptics.selectionAsync();
      return;
    }
    const style =
      kind === 'heavy'
        ? Haptics.ImpactFeedbackStyle.Heavy
        : kind === 'medium'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light;
    Haptics.impactAsync(style);
  } catch {
    // haptics not available on web/sim — silently skip
  }
}

// ─── AnimatedPressable ─────────────────────────────────────────────────────
export interface AnimatedPressableProps extends ViewProps {
  portal?: PortalKey;
  /** Press-scale amount (default 0.96 — subtle, AI-slop-safe). */
  scaleTo?: number;
  /** Trigger haptic on press (fires from JS thread after gesture). */
  haptic?: HapticKind;
  disabled?: boolean;
  /** Min ms between consecutive press callbacks (guards accidental double-taps). */
  cooldownMs?: number;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function AnimatedPressable({
  portal = 'guest',
  scaleTo = 0.96,
  haptic = 'light',
  disabled = false,
  cooldownMs = 350,
  onPress,
  onLongPress,
  children,
  style,
  ...rest
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const lastPressAt = React.useRef(0);

  useEffect(() => {
    if (disabled) {
      scale.value = withTiming(1, { duration: 120 });
      opacity.value = withTiming(0.55, { duration: 120 });
    } else {
      opacity.value = withTiming(1, { duration: 120 });
    }
  }, [disabled, opacity, scale]);

  // JS-thread callback invoked from the gesture's `onEnd`.
  const firePress = () => {
    // eslint-disable-next-line react-hooks/purity -- event-handler timestamp guard, not render-phase
    const now = Date.now();
    if (now - lastPressAt.current < cooldownMs) return;
    lastPressAt.current = now;
    triggerHaptic(haptic);
    onPress?.();
  };
  const fireLongPress = () => {
    triggerHaptic('medium');
    onLongPress?.();
  };

  // Gestures — onBegin/onFinalize stay UI-thread (worklets); callbacks
  // cross over via runOnJS() so haptic + onPress don't violate worklet rules.
  const tap = useMemo(
    () =>
      Gesture.Tap()
        .enabled(!disabled)
        .maxDuration(700)
        .onBegin(() => {
          'worklet';
          // eslint-disable-next-line react-hooks/immutability
          scale.value = withSpring(scaleTo, SPRING_PRESETS[portal].tap);
        })
        .onFinalize(() => {
          'worklet';
          // eslint-disable-next-line react-hooks/immutability
          scale.value = withSpring(1, SPRING_PRESETS[portal].tap);
        })
        // eslint-disable-next-line react-hooks/refs -- firePress is invoked on the JS thread via runOnJS, never during render
        .onEnd(() => {
          'worklet';
          runOnJS(firePress)();
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disabled, portal, scaleTo]
  );

  const longPress = useMemo(
    () =>
      Gesture.LongPress()
        .enabled(!disabled && !!onLongPress)
        .minDuration(500)
        .onStart(() => {
          'worklet';
          runOnJS(fireLongPress)();
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disabled, onLongPress]
  );

  const composed =
    onLongPress != null
      ? Gesture.Exclusive(longPress, tap)
      : tap;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[animatedStyle, style]} {...rest}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

// ─── FadeInView ────────────────────────────────────────────────────────────
export function FadeInView({
  delay = 0,
  duration = 320,
  portal = 'guest',
  children,
  style,
  ...rest
}: ViewProps & { delay?: number; duration?: number; portal?: PortalKey }) {
  const pres = SPRING_PRESETS[portal].enter;
  return (
    <Animated.View
      entering={FadeInDown.delay(delay)
        .duration(duration)
        .springify()
        .damping(pres.damping)
        .stiffness(pres.stiffness)
        .reduceMotion(ReduceMotion.System)}
      style={style}
      {...rest}
    >
      {children}
    </Animated.View>
  );
}

// ─── Stagger ───────────────────────────────────────────────────────────────
export function Stagger({
  step = 70,
  initialDelay = 0,
  portal = 'guest',
  children,
  style,
}: {
  step?: number;
  initialDelay?: number;
  portal?: PortalKey;
  children: React.ReactNode;
  style?: ViewProps['style'];
}) {
  const arr = React.Children.toArray(children);
  const pres = SPRING_PRESETS[portal].enter;
  return (
    <View style={style}>
      {arr.map((child, i) => (
        <Animated.View
          key={i}
          entering={FadeInDown.delay(initialDelay + i * step)
            .duration(360)
            .springify()
            .damping(pres.damping)
            .stiffness(pres.stiffness)
            .reduceMotion(ReduceMotion.System)}
        >
          {child}
        </Animated.View>
      ))}
    </View>
  );
}

// ─── KpiCounter ────────────────────────────────────────────────────────────
export interface KpiCounterProps extends TextProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  /** Decimal places — defaults 0. */
  decimals?: number;
}

export function KpiCounter({
  value,
  duration = 850,
  prefix = '',
  suffix = '',
  decimals = 0,
  style,
  ...rest
}: KpiCounterProps) {
  const anim = useSharedValue(0);
  const [display, setDisplay] = React.useState<string>(format(0, decimals));

  useEffect(() => {
    cancelAnimation(anim);
    anim.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.quad),
      reduceMotion: ReduceMotion.System,
    });
  }, [anim, duration, value]);

  useEffect(() => {
    let raf: ReturnType<typeof setInterval> | null = null;
    raf = setInterval(() => {
      const v = anim.value;
      setDisplay(format(v, decimals));
      if (Math.abs(v - value) < 0.01) raf && clearInterval(raf);
    }, 32);
    return () => {
      if (raf) clearInterval(raf);
    };
  }, [anim, decimals, value]);

  return (
    <Text style={style} {...rest}>
      {prefix}
      {display}
      {suffix}
    </Text>
  );
}

function format(n: number, decimals: number) {
  if (decimals <= 0) return Math.round(n).toLocaleString();
  return n.toFixed(decimals);
}
