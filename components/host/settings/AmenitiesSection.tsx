import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHost } from '@/lib/context/host-context';
import { SettingSectionTitle, SettingSaveButton } from './shared';
import { SRS, GRAY, RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/portal-theme';
import { BG } from '@/lib/constants/figma-tokens';

const ACCENT = SRS.teal;

const AMENITY_PRESETS = [
  { name: 'WiFi', icon: '📶' },
  { name: 'Pool', icon: '🏊' },
  { name: 'Gym', icon: '💪' },
  { name: 'Parking', icon: '🅿️' },
  { name: 'Restaurant', icon: '🍽️' },
  { name: 'Bar', icon: '🍸' },
  { name: 'Spa', icon: '💆' },
  { name: 'Room Service', icon: '🛎️' },
  { name: 'AC', icon: '❄️' },
  { name: 'TV', icon: '📺' },
  { name: 'Kitchen', icon: '🍳' },
  { name: 'Laundry', icon: '👕' },
  { name: 'Airport Shuttle', icon: '🚌' },
  { name: 'Tour Desk', icon: '🗺️' },
  { name: 'Balcony', icon: '🌅' },
  { name: 'Garden', icon: '🌿' },
  { name: 'BBQ', icon: '🔥' },
  { name: 'Lake View', icon: '🏞️' },
  { name: 'Mountain View', icon: '🏔️' },
  { name: 'Mini Bar', icon: '🧊' },
  { name: 'Safe', icon: '🔒' },
  { name: 'Jacuzzi', icon: '♨️' },
  { name: 'Living Room', icon: '🛋️' },
  { name: 'Washer/Dryer', icon: '🧺' },
  { name: 'EV Charging', icon: '⚡' },
  { name: 'Business Center', icon: '💼' },
  { name: 'Concierge', icon: '🎩' },
  { name: 'Iron/Ironing Board', icon: '👔' },
  { name: 'Hair Dryer', icon: '💨' },
  { name: 'Microwave', icon: '📡' },
];

export function AmenitiesSection() {
  const { properties, activePropertyId, updateProperty } = useHost();
  const property = properties.find(p => p.id === activePropertyId);

  const [amenities, setAmenities] = useState<string[]>(property?.amenities || []);
  const [customAmenity, setCustomAmenity] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync when property changes
  React.useEffect(() => {
    if (property) setAmenities(property.amenities || []);
  }, [property?.id]);

  const hasChanges = JSON.stringify(amenities.sort()) !== JSON.stringify((property?.amenities || []).sort());

  const filteredPresets = AMENITY_PRESETS.filter(
    a => !search || a.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleAmenity = useCallback((name: string) => {
    setAmenities(prev =>
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
    );
  }, []);

  const addCustom = useCallback(() => {
    const name = customAmenity.trim();
    if (!name) return;
    if (amenities.includes(name)) {
      Alert.alert('Already Added', `"${name}" is already in the list`);
      return;
    }
    setAmenities(prev => [...prev, name]);
    setCustomAmenity('');
  }, [customAmenity, amenities]);

  const removeAmenity = useCallback((name: string) => {
    setAmenities(prev => prev.filter(a => a !== name));
  }, []);

  const handleSave = useCallback(async () => {
    if (!property) return;
    setSaving(true);
    try {
      await updateProperty(property.id, { amenities } as any);
      Alert.alert('Saved', 'Amenities updated successfully');
    } catch {
      Alert.alert('Error', 'Failed to save amenities. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [property, amenities, updateProperty]);

  if (!property) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <Text style={{ ...TYPOGRAPHY.body, color: GRAY[400], textAlign: 'center', marginTop: 40 }}>
          Select a property first
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <SettingSectionTitle>Amenities</SettingSectionTitle>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={GRAY[400]} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search amenities…"
          placeholderTextColor={GRAY[300]}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={GRAY[400]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Active Amenities */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Active Amenities ({amenities.length})</Text>
        {amenities.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="sparkles-outline" size={32} color={GRAY[300]} />
            <Text style={styles.emptyText}>No amenities selected</Text>
            <Text style={styles.emptyHint}>Tap amenities below to add them</Text>
          </View>
        ) : (
          <View style={styles.tagContainer}>
            {amenities.map(name => {
              const preset = AMENITY_PRESETS.find(a => a.name === name);
              return (
                <TouchableOpacity
                  key={name}
                  style={styles.activeTag}
                  onPress={() => removeAmenity(name)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.activeTagText}>{preset?.icon || '•'} {name}</Text>
                  <Ionicons name="close-circle" size={14} color={BG.white + '99'} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Preset Amenities */}
      <View style={[styles.card, { marginTop: 12 }]}>
        <Text style={styles.cardTitle}>Available Amenities</Text>
        <View style={styles.tagContainer}>
          {filteredPresets.map(a => {
            const isActive = amenities.includes(a.name);
            return (
              <TouchableOpacity
                key={a.name}
                style={[styles.presetTag, isActive && styles.presetTagActive]}
                onPress={() => toggleAmenity(a.name)}
                activeOpacity={0.7}
              >
                <Text style={[styles.presetTagText, isActive && styles.presetTagTextActive]}>
                  {a.icon} {a.name}
                </Text>
                {isActive && <Ionicons name="checkmark-circle" size={14} color={ACCENT} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Custom Amenity Input */}
      <View style={[styles.card, { marginTop: 12 }]}>
        <Text style={styles.cardTitle}>Add Custom Amenity</Text>
        <View style={styles.customRow}>
          <TextInput
            style={styles.customInput}
            value={customAmenity}
            onChangeText={setCustomAmenity}
            placeholder="e.g. Helipad, Private Beach…"
            placeholderTextColor={GRAY[300]}
          />
          <TouchableOpacity style={styles.customAddBtn} onPress={addCustom} disabled={!customAmenity.trim()}>
            <Ionicons name="add-circle" size={20} color={customAmenity.trim() ? ACCENT : GRAY[300]} />
            <Text style={[styles.customAddText, !customAmenity.trim() && { color: GRAY[300] }]}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {hasChanges && <SettingSaveButton onPress={handleSave} saving={saving} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: BG.white, borderRadius: RADIUS.input, borderWidth: 1, borderColor: GRAY[200], paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12, ...SHADOWS.card },
  searchInput: { flex: 1, ...TYPOGRAPHY.body, color: GRAY[900] },
  card: { backgroundColor: BG.white, borderRadius: RADIUS.card + 6, padding: 14, ...SHADOWS.card },
  cardTitle: { ...TYPOGRAPHY.body, fontWeight: '700', color: GRAY[900], marginBottom: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  emptyText: { ...TYPOGRAPHY.body, color: GRAY[500] },
  emptyHint: { ...TYPOGRAPHY.small, color: GRAY[400] },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  activeTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: ACCENT },
  activeTagText: { fontSize: 13, fontWeight: '600', color: BG.white },
  presetTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: GRAY[100], borderWidth: 1, borderColor: GRAY[200] },
  presetTagActive: { backgroundColor: ACCENT + '12', borderColor: ACCENT + '40' },
  presetTagText: { fontSize: 13, fontWeight: '500', color: GRAY[600] },
  presetTagTextActive: { color: ACCENT, fontWeight: '600' },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  customInput: { flex: 1, backgroundColor: GRAY[50], borderRadius: RADIUS.input, borderWidth: 1, borderColor: GRAY[200], paddingHorizontal: 14, paddingVertical: 12, ...TYPOGRAPHY.body, color: GRAY[900] },
  customAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 12, borderRadius: RADIUS.input, backgroundColor: ACCENT + '12' },
  customAddText: { fontSize: 13, fontWeight: '600', color: ACCENT },
});
