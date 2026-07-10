import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ImageBackground, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { destinations } from '@/lib/mock/destinations';

export default function DestinationsPage() {
  return (
    <ScrollView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <IconSymbol name="arrow.back" size={18} color={SRS.navy} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Destinations</Text>
          <Text style={s.sub}>Explore {destinations.length} stunning destinations</Text>
        </View>
      </View>

      {/* Grid */}
      <View style={s.grid}>
        {destinations.map((d) => (
          <TouchableOpacity key={d.id} onPress={() => router.push({ pathname: '/guest-search-results', params: { location: d.name } })}
            activeOpacity={0.85} style={s.card}
          >
            <ImageBackground source={{ uri: d.image }} style={s.cardImage} resizeMode="cover">
              <View style={s.cardOverlay} />
              <View style={s.cardContent}>
                <Text style={s.cardName}>{d.name}</Text>
                <Text style={s.cardCount}>{d.hotelCount} hotels available</Text>
                {d.experiences.length > 0 && (
                  <View style={s.tagRow}>
                    {d.experiences.slice(0, 4).map((exp, i) => (
                      <View key={i} style={s.tag}>
                        <Text style={s.tagText}>{exp}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.md },
  backBtn: { width: 40, height: 40, borderRadius: RADIUS.card, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', ...SHADOWS.card },
  title: { ...TYPOGRAPHY.h2, color: SRS.navy },
  sub: { ...TYPOGRAPHY.small, color: GRAY[500] },
  grid: { paddingHorizontal: SPACING.lg, paddingBottom: 32, gap: SPACING.lg },
  card: { borderRadius: RADIUS.modal, overflow: 'hidden', ...SHADOWS.card },
  cardImage: { width: '100%', height: 200, justifyContent: 'flex-end' },
  cardOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.30)' },
  cardContent: { padding: SPACING.lg },
  cardName: { color: '#FFF', fontSize: 22, fontWeight: '700', marginBottom: 2 },
  cardCount: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: SPACING.sm },
  tag: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { color: '#FFF', fontSize: 11, fontWeight: '500' },
});
