import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, PanResponder, TouchableOpacity, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { BLUE, STATUS, AMBER, PURPLE, BRAND, SLATE, BG, TEXT, SRS } from '@/lib/constants/figma-tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.78;
const CARD_GAP = 12;
const STEP = CARD_WIDTH + CARD_GAP;
const AUTO_SCROLL_INTERVAL = 3500;
const ANIM_DURATION = 450;

const FEATURES = [
  { icon: '🔒', color: BLUE[500], titleKey: 'components.whyServeIQ.secureBooking', descKey: 'components.whyServeIQ.secureBookingDesc' },
  { icon: '🤝', color: STATUS.activeGreen, titleKey: 'components.whyServeIQ.support', descKey: 'components.whyServeIQ.supportDesc' },
  { icon: '✅', color: AMBER[500], titleKey: 'components.whyServeIQ.bestPrice', descKey: 'components.whyServeIQ.bestPriceDesc' },
  { icon: '🌟', color: PURPLE[500], titleKey: 'components.whyServeIQ.curated', descKey: 'components.whyServeIQ.curatedDesc' },
];

const COUNT = FEATURES.length;

export function WhyServeIQ() {
  const { t } = useTranslation();
  const position = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);
  const posRef = useRef(0);
  const dragStartRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const id = position.addListener(({ value }) => {
      const rounded = Math.round(value);
      setActiveIndex((prev) => (prev === rounded ? prev : rounded));
    });
    return () => position.removeListener(id);
  }, [position]);

  const stopAutoScroll = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const animateTo = useCallback((target: number, duration = ANIM_DURATION) => {
    animRef.current?.stop();
    const clamped = Math.max(0, Math.min(COUNT - 1, target));
    posRef.current = clamped;
    setActiveIndex(clamped);
    animRef.current = Animated.timing(position, {
      toValue: clamped,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animRef.current.start();
  }, [position]);

  const startAutoScroll = useCallback(() => {
    stopAutoScroll();
    timerRef.current = setInterval(() => {
      const next = (Math.round(posRef.current) + 1) % COUNT;
      animateTo(next, next === 0 ? ANIM_DURATION * 2 : ANIM_DURATION);
    }, AUTO_SCROLL_INTERVAL);
  }, [animateTo, stopAutoScroll]);

  useFocusEffect(
    useCallback(() => {
      startAutoScroll();
      return () => stopAutoScroll();
    }, [startAutoScroll, stopAutoScroll])
  );

  useEffect(() => () => stopAutoScroll(), [stopAutoScroll]);

  const goTo = useCallback((i: number) => {
    animateTo(i);
    startAutoScroll();
  }, [animateTo, startAutoScroll]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, g) =>
      Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderGrant: () => {
      stopAutoScroll();
      position.stopAnimation((v) => {
        dragStartRef.current = v;
        posRef.current = v;
      });
    },
    onPanResponderMove: (_, g) => {
      const next = dragStartRef.current - g.dx / STEP;
      position.setValue(next);
      posRef.current = next;
    },
    onPanResponderRelease: (_, g) => {
      const v = posRef.current;
      const target = g.vx > 0.5 ? Math.floor(v) : g.vx < -0.5 ? Math.ceil(v) : Math.round(v);
      animateTo(target);
      startAutoScroll();
    },
    onPanResponderTerminate: () => {
      animateTo(Math.round(posRef.current));
      startAutoScroll();
    },
  }), [animateTo, startAutoScroll, position, stopAutoScroll]);

  const translateX = position.interpolate({
    inputRange: [0, COUNT - 1],
    outputRange: [0, -(COUNT - 1) * STEP],
    extrapolate: 'clamp',
  });

  return (
    <View>
      <Text style={styles.title}>{t('components.whyServeIQ.title')}</Text>
      <Text style={styles.subtitle}>{t('components.whyServeIQ.subtitle')}</Text>

      <View {...panResponder.panHandlers}>
        <Animated.View style={[styles.strip, { transform: [{ translateX }] }]}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.card}>
              <View style={[styles.iconWrap, { backgroundColor: f.color + '14' }]}>
                <Text style={styles.icon}>{f.icon}</Text>
              </View>
              <Text style={styles.cardTitle}>{t(f.titleKey)}</Text>
              <Text style={styles.cardDesc}>{t(f.descKey)}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Pagination dots */}
      <View style={styles.dots}>
        {FEATURES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)} hitSlop={8}>
            <View style={[styles.dot, activeIndex === i && styles.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND.navyLight,
    letterSpacing: -0.3,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: SLATE[400],
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  strip: {
    flexDirection: 'row',
    gap: CARD_GAP,
    paddingHorizontal: 16,
    alignItems: 'stretch',
  },
  card: {
    width: CARD_WIDTH,
    padding: 20,
    borderRadius: 18,
    backgroundColor: BG.white,
    borderWidth: 1,
    borderColor: SLATE[100],
    shadowColor: TEXT.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  icon: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND.navyLight,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: SLATE[500],
    lineHeight: 20,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: SLATE[200],
  },
  dotActive: {
    width: 20,
    backgroundColor: SRS.teal,
  },
});
