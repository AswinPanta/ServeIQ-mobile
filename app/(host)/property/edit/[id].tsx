import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHost } from '@/lib/context/host-context';
import { normalizeTime } from '@/lib/api/host-api';
import { SRS, GRAY, RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/portal-theme';
import type { Property } from '@/types/api';
import { MapLocationPicker } from '@/components/host/MapLocationPicker';
import { reverseGeocode } from '@/hooks/use-location';
import { SRS as SRSTokens, BG } from '@/lib/constants/figma-tokens';

const ACCENT = SRS.teal;
const NAVY = SRS.navy;

type EditableFields = {
  name: string;
  description: string;
  type: string;
  city: string;
  state: string;
  country: string;
  address: string;
  zip_code: string;
  number_of_floors: string;
  total_rooms: string;
  check_in_time_from: string;
  check_in_time_to: string;
  check_out_time_from: string;
  check_out_time_to: string;
  currency: string;
  brand_color: string;
  latitude: string;
  longitude: string;
};

export default function EditProperty() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { properties, updateProperty } = useHost();
  const property = properties.find(p => p.id === id);

  const [fields, setFields] = useState<EditableFields>({
    name: '', description: '', type: 'hotel', city: '', state: '',
    country: '', address: '', zip_code: '', number_of_floors: '1',
    total_rooms: '1', check_in_time_from: '14:00', check_in_time_to: '00:00',
    check_out_time_from: '00:00', check_out_time_to: '11:00',
    currency: 'USD', brand_color: SRSTokens.teal,
    latitude: '', longitude: '',
  });

  useEffect(() => {
    if (property) {
      setFields({
        name: property.name,
        description: property.description || '',
        type: property.type,
        city: property.city,
        state: property.state || '',
        country: property.country,
        address: property.address || '',
        zip_code: property.zip_code || '',
        number_of_floors: String(property.number_of_floors || 1),
        total_rooms: String(property.total_rooms || 1),
        check_in_time_from: property.check_in_time_from || '14:00',
        check_in_time_to: property.check_in_time_to || '00:00',
        check_out_time_from: property.check_out_time_from || '00:00',
        check_out_time_to: property.check_out_time_to || '11:00',
        currency: property.currency || 'USD',
        brand_color: property.brand_color || SRSTokens.teal,
        latitude: property.latitude != null ? String(property.latitude) : '',
        longitude: property.longitude != null ? String(property.longitude) : '',
      });
    }
  }, [property]);

  const set = (key: keyof EditableFields, value: string) =>
    setFields(prev => ({ ...prev, [key]: value }));

  const [showMapPicker, setShowMapPicker] = useState(false);

  const handleLocationSelect = async (lat: number, lng: number) => {
    set('latitude', String(lat));
    set('longitude', String(lng));
    try {
      const geo = await reverseGeocode(lat, lng);
      // Auto-fill empty address fields so a pin on the map completes the form.
      if (geo.street && !fields.address) set('address', geo.street);
      if (geo.city && !fields.city) set('city', geo.city);
      if (geo.state && !fields.state) set('state', geo.state);
      if (geo.country && !fields.country) set('country', geo.country);
      if (geo.postcode && !fields.zip_code) set('zip_code', geo.postcode);
    } catch {
      // Coordinates are still saved even if reverse geocoding fails
    }
  };

  const handleSave = () => {
    if (!fields.name.trim()) {
      Alert.alert('Required', 'Property name is required');
      return;
    }
    updateProperty(id!, {
      name: fields.name,
      description: fields.description,
      type: fields.type as Property['type'],
      city: fields.city,
      state: fields.state,
      country: fields.country,
      address: fields.address,
      zip_code: fields.zip_code,
      number_of_floors: parseInt(fields.number_of_floors) || 1,
      total_rooms: parseInt(fields.total_rooms) || 1,
      check_in_time: normalizeTime(fields.check_in_time_from),
      check_in_time_from: fields.check_in_time_from,
      check_in_time_to: fields.check_in_time_to,
      check_out_time: normalizeTime(fields.check_out_time_to),
      check_out_time_from: fields.check_out_time_from,
      check_out_time_to: fields.check_out_time_to,
      currency: fields.currency,
      brand_color: fields.brand_color,
      latitude: fields.latitude ? parseFloat(fields.latitude) : undefined,
      longitude: fields.longitude ? parseFloat(fields.longitude) : undefined,
    } as any);
    Alert.alert('Saved', 'Property updated successfully', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

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
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={NAVY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Property</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Info</Text>
          <View style={styles.card}>
            <Field label="Property Name" value={fields.name} onChange={v => set('name', v)} />
            <Field label="Property Type" value={fields.type} onChange={v => set('type', v)} />
            <Field label="Description" value={fields.description} onChange={v => set('description', v)} multiline />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.card}>
            <Field label="Country" value={fields.country} onChange={v => set('country', v)} />
            <Field label="State" value={fields.state} onChange={v => set('state', v)} />
            <Field label="City" value={fields.city} onChange={v => set('city', v)} />
            <Field label="Address" value={fields.address} onChange={v => set('address', v)} />
            <Field label="ZIP Code" value={fields.zip_code} onChange={v => set('zip_code', v)} />
            <TouchableOpacity onPress={() => setShowMapPicker(true)} style={mapStyles.pickerBtn} activeOpacity={0.8}>
              <Ionicons name="map-outline" size={16} color={ACCENT} />
              <Text style={mapStyles.pickerText}>
                {fields.latitude && fields.longitude
                  ? `Pinned: ${fields.latitude}, ${fields.longitude}`
                  : 'Set Location on Map'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={GRAY[400]} />
            </TouchableOpacity>
          </View>
        </View>

        <MapLocationPicker
          visible={showMapPicker}
          onClose={() => setShowMapPicker(false)}
          onLocationSelect={handleLocationSelect}
          initialLat={fields.latitude ? parseFloat(fields.latitude) : undefined}
          initialLng={fields.longitude ? parseFloat(fields.longitude) : undefined}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Details</Text>
          <View style={styles.card}>
            <Field label="Floors" value={fields.number_of_floors} onChange={v => set('number_of_floors', v)} keyboard="numeric" />
            <Field label="Total Rooms" value={fields.total_rooms} onChange={v => set('total_rooms', v)} keyboard="numeric" />
            <Field label="Currency" value={fields.currency} onChange={v => set('currency', v)} />
            <Field label="Brand Color" value={fields.brand_color} onChange={v => set('brand_color', v)} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Check-in / Check-out</Text>
          <View style={styles.card}>
            <Field label="Check-in From" value={fields.check_in_time_from} onChange={v => set('check_in_time_from', v)} />
            <Field label="Check-in To" value={fields.check_in_time_to} onChange={v => set('check_in_time_to', v)} />
            <Field label="Check-out From" value={fields.check_out_time_from} onChange={v => set('check_out_time_from', v)} />
            <Field label="Check-out To" value={fields.check_out_time_to} onChange={v => set('check_out_time_to', v)} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Field({
  label, value, onChange, multiline, keyboard,
}: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; keyboard?: 'default' | 'numeric';
}) {
  return (
    <View style={fieldStyles.wrapper}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={[fieldStyles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={keyboard || 'default'}
        placeholderTextColor={GRAY[300]}
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { ...TYPOGRAPHY.caption, fontWeight: '600', color: GRAY[500], marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: GRAY[50], borderRadius: RADIUS.input, paddingHorizontal: 14, paddingVertical: 12, ...TYPOGRAPHY.body, color: GRAY[900], borderWidth: 1, borderColor: GRAY[200] },
});

const mapStyles = StyleSheet.create({
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: ACCENT + '0D', borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: ACCENT + '55', borderRadius: RADIUS.input,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  pickerText: { flex: 1, fontSize: 13, fontWeight: '600', color: ACCENT },
});

const styles = StyleSheet.create({
  header: { backgroundColor: BG.white, borderBottomWidth: 1, borderBottomColor: GRAY[200], paddingBottom: 12, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: RADIUS.button, backgroundColor: GRAY[100], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TYPOGRAPHY.body, fontWeight: '700', color: GRAY[900], flex: 1 },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: RADIUS.button, backgroundColor: ACCENT },
  saveBtnText: { ...TYPOGRAPHY.body, fontWeight: '700', color: BG.white },
  section: { marginBottom: 20 },
  sectionTitle: { ...TYPOGRAPHY.body, fontWeight: '700', color: GRAY[900], marginBottom: 10 },
  card: { backgroundColor: BG.white, borderRadius: RADIUS.card + 6, padding: 16, ...SHADOWS.card },
});
