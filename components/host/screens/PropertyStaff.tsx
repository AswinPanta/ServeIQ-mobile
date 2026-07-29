import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Property } from '@/types/api';
import { useHost } from '@/lib/context/host-context';

interface Props { property: Property }

export function PropertyStaff({ property }: Props) {
  const { getFilteredStaff } = useHost();
  const staffList = getFilteredStaff(property.id);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {staffList.length === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 60 }}>
          <Ionicons name="briefcase-outline" size={48} color="#CBD5E1" />
          <Text style={{ marginTop: 12, fontSize: 15, color: '#94A3B8' }}>No staff assigned</Text>
        </View>
      ) : (
        staffList.map(s => (
          <View key={s.id} style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{s.first_name?.[0] || s.email[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{s.first_name} {s.last_name}</Text>
                <Text style={styles.role}>{s.role.replace('_', ' ')}</Text>
              </View>
              <View style={[styles.activeDot, { backgroundColor: s.is_active ? '#10B981' : '#CBD5E1' }]} />
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EBF5FB', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#2E86AB' },
  name: { fontSize: 15, fontWeight: '600', color: '#111' },
  role: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  activeDot: { width: 10, height: 10, borderRadius: 5 },
});
