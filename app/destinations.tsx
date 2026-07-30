import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { destinations } from '@/lib/mock/destinations';
import { safeGoBack } from '@/lib/utils';

export default function DestinationsPage() {
  const { t } = useTranslation();
  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: 32 }}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
          <IconSymbol name="arrow.back" size={18} color="#1A3C5E" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{t('destinations.title')}</Text>
          <Text style={s.sub}>{t('destinations.subtitle', { count: destinations.length })}</Text>
        </View>
      </View>

      {/* Grid */}
      <View style={s.grid}>
        {destinations.map((d) => (
          <TouchableOpacity
            key={d.id}
            onPress={() => router.push({ pathname: '/guest-search-results', params: { location: d.name } })}
            activeOpacity={0.9}
            style={s.card}
          >
            <Image source={{ uri: d.image }} style={s.cardImage} resizeMode="cover" />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={s.cardOverlay}
            />
            <View style={s.cardContent}>
              <Text style={s.cardName}>{d.name}</Text>
              <Text style={s.cardCount}>{t('destinations.hotelCount', { count: d.hotelCount })}</Text>
              <View style={s.tagRow}>
                {d.experiences.slice(0, 3).map((exp, i) => (
                  <View key={i} style={s.tag}>
                    <Text style={s.tagText}>{exp}</Text>
                  </View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  title: { fontSize: 22, fontWeight: '700', color: '#1A3C5E', letterSpacing: -0.5 },
  sub: { fontSize: 12, color: '#94A3B8', marginTop: 1 },
  grid: { paddingHorizontal: 16, gap: 14 },
  card: { borderRadius: 16, overflow: 'hidden', height: 200, position: 'relative' },
  cardImage: { width: '100%', height: '100%', position: 'absolute' },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' },
  cardContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, gap: 2 },
  cardName: { color: '#FFF', fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  cardCount: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginBottom: 4 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  tagText: { color: '#FFF', fontSize: 10, fontWeight: '500' },
});
