import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHost } from '@/lib/context/host-context';
import { SRS, GRAY, RADIUS, TYPOGRAPHY } from '@/constants/portal-theme';
import type { Property } from '@/types/api';
import { BG } from '@/lib/constants/figma-tokens';

const ACCENT = SRS.teal;

interface Props {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: (property: Property) => React.ReactNode;
}

/**
 * Shared chrome for property sub-section screens: sticky header (back +
 * property name + section title) and a scrollable body. Data is resolved
 * from the route param via host-context — this component owns NO fetching.
 */
export function PropertySectionScreen({ title, icon, children }: Props) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { properties, activePropertyId, setActivePropertyId } = useHost();

  React.useEffect(() => {
    if (id && id !== activePropertyId) setActivePropertyId(id);
  }, [id, activePropertyId, setActivePropertyId]);

  const property = properties.find(p => p.id === id);

  if (!property) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: GRAY[50] }}>
        <Ionicons name="alert-circle-outline" size={48} color={GRAY[400]} />
        <Text style={{ marginTop: 12, ...TYPOGRAPHY.body, color: GRAY[500] }}>Property not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: GRAY[50] }}>
      <View style={[styles.bar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={SRS.navy} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            <Text style={styles.sub} numberOfLines={1}>{property.name} · {property.city}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push(`/(host)/property/edit/${property.id}`)}>
            <Ionicons name="create-outline" size={18} color={ACCENT} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ flex: 1 }}>
        {children(property)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: BG.white, borderBottomWidth: 1, borderBottomColor: GRAY[200], paddingBottom: 12, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: RADIUS.button, backgroundColor: GRAY[100], alignItems: 'center', justifyContent: 'center' },
  title: { ...TYPOGRAPHY.body, fontWeight: '700', color: GRAY[900] },
  sub: { ...TYPOGRAPHY.caption, color: GRAY[400], marginTop: 1 },
  editBtn: { width: 40, height: 40, borderRadius: RADIUS.button, backgroundColor: ACCENT + '18', alignItems: 'center', justifyContent: 'center' },
});
