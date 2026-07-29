import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHost } from '@/lib/context/host-context';
import type { Property } from '@/types/api';

const ACCENT = '#2E86AB';
const NAVY = '#1A3C5E';

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
    currency: 'USD', brand_color: '#2E86AB',
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
        brand_color: property.brand_color || '#2E86AB',
      });
    }
  }, [property]);

  const set = (key: keyof EditableFields, value: string) =>
    setFields(prev => ({ ...prev, [key]: value }));

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
      check_in_time_from: fields.check_in_time_from,
      check_in_time_to: fields.check_in_time_to,
      check_out_time_from: fields.check_out_time_from,
      check_out_time_to: fields.check_out_time_to,
      currency: fields.currency,
      brand_color: fields.brand_color,
    });
    Alert.alert('Saved', 'Property updated successfully', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  if (!property) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FB' }}>
        <Ionicons name="alert-circle-outline" size={48} color="#94A3B8" />
        <Text style={{ marginTop: 12, fontSize: 16, color: '#64748B' }}>Property not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FB' }}>
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
          </View>
        </View>

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
        placeholderTextColor="#CBD5E1"
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#F8F9FB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111', borderWidth: 1, borderColor: '#E2E8F0' },
});

const styles = StyleSheet.create({
  header: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 12, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111', flex: 1 },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: ACCENT },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 10 },
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
});
