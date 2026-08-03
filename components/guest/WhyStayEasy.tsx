import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.78;
const CARD_GAP = 12;

const FEATURES = [
  { icon: '🔒', color: '#3B82F6', titleKey: 'components.whyStayEasy.secureBooking', descKey: 'components.whyStayEasy.secureBookingDesc' },
  { icon: '🤝', color: '#10B981', titleKey: 'components.whyStayEasy.support', descKey: 'components.whyStayEasy.supportDesc' },
  { icon: '✅', color: '#F59E0B', titleKey: 'components.whyStayEasy.bestPrice', descKey: 'components.whyStayEasy.bestPriceDesc' },
  { icon: '🌟', color: '#8B5CF6', titleKey: 'components.whyStayEasy.curated', descKey: 'components.whyStayEasy.curatedDesc' },
];

export function WhyStayEasy() {
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onScroll = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_GAP));
    setActiveIndex(idx);
  };

  return (
    <View>
      <Text style={styles.title}>{t('components.whyStayEasy.title')}</Text>
      <Text style={styles.subtitle}>{t('components.whyStayEasy.subtitle')}</Text>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        snapToAlignment="start"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: CARD_GAP }}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {FEATURES.map((f, i) => (
          <View key={i} style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: f.color + '14' }]}>
              <Text style={styles.icon}>{f.icon}</Text>
            </View>
            <Text style={styles.cardTitle}>{t(f.titleKey)}</Text>
            <Text style={styles.cardDesc}>{t(f.descKey)}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      <View style={styles.dots}>
        {FEATURES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, activeIndex === i && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A3C5E',
    letterSpacing: -0.3,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    width: CARD_WIDTH,
    padding: 20,
    borderRadius: 18,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
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
    color: '#1A3C5E',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748B',
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
    backgroundColor: '#E2E8F0',
  },
  dotActive: {
    width: 20,
    backgroundColor: '#2E86AB',
  },
});
