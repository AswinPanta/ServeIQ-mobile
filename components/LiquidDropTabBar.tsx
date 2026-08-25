import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useFrameCallback,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CORAL, SLATE, BG } from '@/lib/constants/figma-tokens';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface Tab {
  key: string;
  label: string;
  icon: string;
  iconFocused?: string;
}

interface LiquidDropTabBarProps {
  tabs: Tab[];
  activeIndex: number;
  onTabPress: (index: number, tab: Tab) => void;
}

const BAR_H = 66;
const BLOB_R = 22;
const ICON_CY = 24;
const BASE_HALF_MAX = 30;

const SPRING_STIFFNESS = 210;
const SPRING_DAMPING = 25;
const VELOCITY_NORM = 420;
const ARRIVAL_DURATION = 0.42;
const ARRIVAL_WOBBLE = Math.PI * 2.2;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

const clamp = (v: number, min: number, max: number): number => {
  'worklet';
  return Math.max(min, Math.min(max, v));
};

const easeOutCubic = (t: number): number => {
  'worklet';
  return 1 - Math.pow(1 - t, 3);
};

const f2 = (n: number): string => {
  'worklet';
  return n.toFixed(1);
};

function liquidPath(cx: number, halfWidth: number, radius: number, vScale: number, hScale: number): string {
  'worklet';
  const half = halfWidth * hScale;
  const top = ICON_CY - radius * vScale;
  const bottom = ICON_CY + radius * vScale;
  const left = cx - half;
  const right = cx + half;
  const sideRadius = radius * 0.88;

  return [
    `M ${f2(right)} ${ICON_CY}`,
    `C ${f2(right + sideRadius * .65)} ${f2(ICON_CY - sideRadius * .15)}, ${f2(right + sideRadius * .65)} ${f2(top + sideRadius * .10)}, ${f2(right - 2)} ${f2(top + 1)}`,
    `C ${f2(right - 10)} ${f2(top - 2)}, ${f2(cx + half * .45)} ${f2(top)}, ${f2(cx)} ${f2(top)}`,
    `C ${f2(cx - half * .45)} ${f2(top)}, ${f2(left + 10)} ${f2(top - 2)}, ${f2(left + 2)} ${f2(top + 1)}`,
    `C ${f2(left - sideRadius * .65)} ${f2(top + sideRadius * .10)}, ${f2(left - sideRadius * .65)} ${f2(ICON_CY - sideRadius * .15)}, ${f2(left)} ${f2(ICON_CY)}`,
    `C ${f2(left - sideRadius * .65)} ${f2(ICON_CY + sideRadius * .15)}, ${f2(left - sideRadius * .65)} ${f2(bottom - sideRadius * .10)}, ${f2(left + 2)} ${f2(bottom - 1)}`,
    `C ${f2(left + 10)} ${f2(bottom + 2)}, ${f2(cx - half * .45)} ${f2(bottom)}, ${f2(cx)} ${f2(bottom)}`,
    `C ${f2(cx + half * .45)} ${f2(bottom)}, ${f2(right - 10)} ${f2(bottom + 2)}, ${f2(right - 2)} ${f2(bottom - 1)}`,
    `C ${f2(right + sideRadius * .65)} ${f2(bottom - sideRadius * .10)}, ${f2(right + sideRadius * .65)} ${f2(ICON_CY + sideRadius * .15)}, ${f2(right)} ${f2(ICON_CY)}`,
    'Z',
  ].join(' ');
}

export function LiquidDropTabBar({ tabs, activeIndex, onTabPress }: LiquidDropTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === 'web' ? 12 : Math.max(insets.bottom, 8);

  const px = useSharedValue(0);
  const pv = useSharedValue(0);
  const targetX = useSharedValue(0);
  const restHalf = useSharedValue(BASE_HALF_MAX);
  const transitionDist = useSharedValue(1);
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);
  const liquidAmt = useSharedValue(0);
  const velAmt = useSharedValue(0);
  const dirSign = useSharedValue(1);
  const glossOff = useSharedValue(0);
  const arrivalStart = useSharedValue(0);
  const liftIcon = useSharedValue(0);

  const tabXArr = useRef<number[]>([]);
  const tabWArr = useRef<number[]>([]);
  const [ready, setReady] = useState(false);
  const firstRun = useRef(true);
  const prevIndex = useRef(activeIndex);

  useFrameCallback((frameInfo) => {
    const dtMs = frameInfo.timeSincePreviousFrame ?? 16.6;
    const dt = Math.min((dtMs > 0 ? dtMs : 16.6) / 1000, 0.032);
    const now = frameInfo.timestamp;

    const displacement = targetX.value - px.value;
    const acc = displacement * SPRING_STIFFNESS - pv.value * SPRING_DAMPING;
    pv.value += acc * dt;
    px.value += pv.value * dt;

    const distance = Math.abs(targetX.value - px.value);
    const normalizedDistance = clamp(distance / Math.max(transitionDist.value, 1), 0, 1);
    const velocityAmount = clamp(Math.abs(pv.value) / VELOCITY_NORM, 0, 1);
    const liquidAmount = Math.max(velocityAmount, normalizedDistance * 0.82);

    const stretch = 1 + liquidAmount * 0.72;
    const squash = 1 - liquidAmount * 0.26;

    if (distance < 0.45 && Math.abs(pv.value) < 5) {
      if (arrivalStart.value === 0) arrivalStart.value = now;
    }

    let aSX = 1;
    let aSY = 1;
    if (arrivalStart.value > 0) {
      const elapsed = (now - arrivalStart.value) / 1000;
      const p = clamp(elapsed / ARRIVAL_DURATION, 0, 1);
      const e = easeOutCubic(p);
      const rebound = Math.sin(p * ARRIVAL_WOBBLE) * (1 - p);
      aSX = 1 + rebound * 0.10 - (1 - e) * 0.04;
      aSY = 1 - rebound * 0.14 + (1 - e) * 0.05;
      if (p >= 1) arrivalStart.value = 0;
    }

    scaleX.value = stretch * aSX;
    scaleY.value = squash * aSY;
    liquidAmt.value = liquidAmount;
    velAmt.value = velocityAmount;
    dirSign.value = pv.value > 0 ? -1 : 1;
    glossOff.value = clamp(pv.value / 35, -7, 7);
  });

  const onBarLayout = useCallback(() => {
    setReady(true);
  }, []);

  const onTabLayout = useCallback((i: number, e: any) => {
    const { x, width } = e.nativeEvent.layout;
    tabXArr.current[i] = x + width / 2;
    tabWArr.current[i] = width;
  }, []);

  useEffect(() => {
    if (!ready) return;
    const cx = tabXArr.current[activeIndex] ?? 0;
    const w = tabWArr.current[activeIndex] ?? 0;
    const half = Math.min(w / 2, BASE_HALF_MAX);

    if (firstRun.current) {
      firstRun.current = false;
      prevIndex.current = activeIndex;
      px.value = cx;
      pv.value = 0;
      targetX.value = cx;
      restHalf.value = half;
      arrivalStart.value = 0;
      liftIcon.value = -1;
      return;
    }

    targetX.value = cx;
    restHalf.value = half;
    transitionDist.value = Math.max(1, Math.abs(cx - px.value));
    prevIndex.current = activeIndex;
    arrivalStart.value = 0;

    liftIcon.value = 0;
    liftIcon.value = withTiming(-1, { duration: 180 });
  }, [activeIndex, arrivalStart, liftIcon, px, pv, ready, restHalf, targetX, transitionDist]);

  const blobProps = useAnimatedProps(() => ({
    d: liquidPath(px.value, restHalf.value, BLOB_R, scaleY.value, scaleX.value),
  }));

  const glowProps = useAnimatedProps(() => ({
    cx: px.value,
    rx: 25 + liquidAmt.value * 18,
    opacity: 0.07 + liquidAmt.value * 0.10,
  }));

  const highlightProps = useAnimatedProps(() => ({
    cx: px.value - 2,
    rx: 19 + liquidAmt.value * 7,
  }));

  const glossProps = useAnimatedProps(() => ({
    cx: px.value - 8 - glossOff.value,
    cy: ICON_CY - 7,
    opacity: 0.18 + velAmt.value * 0.18,
  }));

  const tailProps = useAnimatedProps(() => {
    const v = velAmt.value;
    if (v > 0.08) {
      const len = 5 + v * 22;
      const tx = px.value + dirSign.value * (restHalf.value * 0.7);
      const mid = ICON_CY;
      return {
        d: [
          `M ${f2(tx)} ${f2(mid - 5)}`,
          `C ${f2(tx + dirSign.value * len)} ${f2(mid - 3)}, ${f2(tx + dirSign.value * len)} ${f2(mid + 3)}, ${f2(tx)} ${f2(mid + 5)}`,
          'Z',
        ].join(' '),
        opacity: v * 0.32,
      };
    }
    return { d: '', opacity: 0 };
  });

  const dropletProps = useAnimatedProps(() => {
    const v = velAmt.value;
    if (v > 0.55) {
      return {
        cx: px.value + dirSign.value * (restHalf.value + 5),
        cy: ICON_CY + 16,
        r: 1.5 + v * 2,
        opacity: v * 0.22,
      };
    }
    return { cx: 0, cy: 0, r: 0, opacity: 0 };
  });

  const liftIconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: liftIcon.value }],
  }));

  return (
    <View style={[styles.bar, { paddingBottom: bottomPadding }]}>
      <View style={styles.pill} onLayout={onBarLayout}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%">
            <AnimatedEllipse animatedProps={glowProps} cy={ICON_CY + 8} ry={13} fill={CORAL[500]} />
            <AnimatedPath animatedProps={blobProps} fill={CORAL[500]} />
            <AnimatedEllipse animatedProps={highlightProps} cy={ICON_CY - 18} ry={5} fill="#FFFFFF" opacity={0.22} />
            <AnimatedCircle animatedProps={glossProps} r={3} fill="#FFFFFF" />
            <AnimatedPath animatedProps={tailProps} fill="#D92F40" />
            <AnimatedCircle animatedProps={dropletProps} fill="#D92F40" />
          </Svg>
        </View>

        {tabs.map((tab, i) => {
          const active = i === activeIndex;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              activeOpacity={0.7}
              onPress={() => onTabPress(i, tab)}
              onLayout={(e) => onTabLayout(i, e)}
            >
              <Animated.View style={[styles.iconWrap, active && liftIconStyle]}>
                <IconSymbol
                  size={22}
                  name={(active && tab.iconFocused ? tab.iconFocused : tab.icon) as any}
                  color={active ? '#FFFFFF' : SLATE[400]}
                />
              </Animated.View>

              <Text style={[styles.label, active && styles.labelOn]} numberOfLines={1}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BG.white,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 12,
  },
  pill: {
    height: BAR_H,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: BG.white,
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  iconWrap: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: SLATE[400],
    marginTop: 1,
    height: 14,
    lineHeight: 14,
  },
  labelOn: {
    color: CORAL[500],
  },
});
