import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { TESTIMONIALS } from '@/lib/mock/landing-data';

export function Testimonials() {
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const totalPages = Math.ceil(TESTIMONIALS.length / 2);

  const scrollTo = (index: number) => {
    setCurrent(index);
    scrollRef.current?.scrollTo({ x: index * 320, animated: true });
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>What travelers say</Text>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        onMomentumScrollEnd={(e) => {
          const page = Math.round(e.nativeEvent.contentOffset.x / 320);
          setCurrent(page);
        }}
      >
        {TESTIMONIALS.map((t) => (
          <View key={t.id} style={s.card}>
            {/* Quote mark */}
            <Text style={s.quoteMark}>"</Text>
            <Text style={s.quote}>{t.quote}</Text>
            <View style={s.authorRow}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>
                  {t.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              <View>
                <Text style={s.authorName}>{t.name}</Text>
                <Text style={s.authorRole}>{t.role}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      <View style={s.dots}>
        {Array.from({ length: totalPages }).map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => scrollTo(i)}
            style={[s.dot, current === i && s.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingTop: 24,
    paddingBottom: 8,
    backgroundColor: '#F8F9FB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A3C5E',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    width: 300,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  quoteMark: {
    fontSize: 32,
    fontWeight: '800',
    color: 'rgba(46,134,171,0.2)',
    lineHeight: 32,
    marginBottom: 4,
  },
  quote: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2E86AB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  authorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A3C5E',
  },
  authorRole: {
    fontSize: 11,
    color: '#94A3B8',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  dotActive: {
    backgroundColor: '#2E86AB',
    width: 24,
  },
});
