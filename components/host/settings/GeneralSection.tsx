import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import type { Property } from '@/types/api';
import { useHost } from '@/lib/context/host-context';
import { SettingRow, SettingInput, SettingSectionTitle, SettingSaveButton } from './shared';
import { SRS, GRAY, RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/portal-theme';
import { BG } from '@/lib/constants/figma-tokens';

const ACCENT = SRS.teal;

const CURRENCIES = ['USD', 'NPR', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY', 'THB', 'SGD'];
const TIMEZONES = [
  'UTC', 'Asia/Kathmandu', 'Asia/Kolkata', 'Asia/Dubai', 'Asia/Bangkok',
  'Asia/Singapore', 'Asia/Tokyo', 'Europe/London', 'Europe/Paris', 'America/New_York',
  'America/Los_Angeles', 'Australia/Sydney', 'Pacific/Auckland',
];

export function GeneralSection({ property }: { property: Property }) {
  const { updateProperty } = useHost();

  const [currency, setCurrency] = useState(property.currency || 'USD');
  const [timezone, setTimezone] = useState(property.timezone || 'UTC');
  const [floors, setFloors] = useState(String(property.number_of_floors || 1));
  const [totalRooms, setTotalRooms] = useState(String(property.total_rooms || 1));
  const [checkIn, setCheckIn] = useState(property.check_in_time_from || '14:00');
  const [checkOut, setCheckOut] = useState(property.check_out_time_to || '11:00');
  const [saving, setSaving] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showTimezonePicker, setShowTimezonePicker] = useState(false);

  useEffect(() => {
    setCurrency(property.currency || 'USD');
    setTimezone(property.timezone || 'UTC');
    setFloors(String(property.number_of_floors || 1));
    setTotalRooms(String(property.total_rooms || 1));
    setCheckIn(property.check_in_time_from || '14:00');
    setCheckOut(property.check_out_time_to || '11:00');
  }, [property.id, property.currency, property.timezone, property.number_of_floors, property.total_rooms, property.check_in_time_from, property.check_out_time_to]);

  const hasChanges =
    currency !== (property.currency || 'USD') ||
    timezone !== (property.timezone || 'UTC') ||
    floors !== String(property.number_of_floors || 1) ||
    totalRooms !== String(property.total_rooms || 1) ||
    checkIn !== (property.check_in_time_from || '14:00') ||
    checkOut !== (property.check_out_time_to || '11:00');

  const handleSave = useCallback(async () => {
    const parsedFloors = parseInt(floors) || 1;
    const parsedRooms = parseInt(totalRooms) || 1;

    if (parsedFloors < 1 || parsedFloors > 200) {
      Alert.alert('Invalid Floors', 'Number of floors must be between 1 and 200');
      return;
    }
    if (parsedRooms < 1 || parsedRooms > 10000) {
      Alert.alert('Invalid Rooms', 'Total rooms must be between 1 and 10,000');
      return;
    }

    setSaving(true);
    try {
      await updateProperty(property.id, {
        currency,
        timezone,
        number_of_floors: parsedFloors,
        total_rooms: parsedRooms,
        check_in_time: checkIn,
        check_out_time: checkOut,
      } as any);
      Alert.alert('Saved', 'General settings updated successfully');
    } catch {
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [property.id, currency, timezone, floors, totalRooms, checkIn, checkOut, updateProperty]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <SettingSectionTitle>General Settings</SettingSectionTitle>

      {/* Currency Picker */}
      <View style={styles.card}>
        <Text style={styles.pickerLabel}>Default Currency</Text>
        <TouchableOpacity
          style={styles.pickerBtn}
          onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
          activeOpacity={0.7}
        >
          <Text style={styles.pickerValue}>{currency}</Text>
          <Text style={styles.pickerChevron}>{showCurrencyPicker ? '▴' : '▾'}</Text>
        </TouchableOpacity>
        {showCurrencyPicker && (
          <View style={styles.pickerDropdown}>
            {CURRENCIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.pickerOption, c === currency && styles.pickerOptionActive]}
                onPress={() => { setCurrency(c); setShowCurrencyPicker(false); }}
              >
                <Text style={[styles.pickerOptionText, c === currency && styles.pickerOptionTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Timezone Picker */}
      <View style={styles.card}>
        <Text style={styles.pickerLabel}>Time Zone</Text>
        <TouchableOpacity
          style={styles.pickerBtn}
          onPress={() => setShowTimezonePicker(!showTimezonePicker)}
          activeOpacity={0.7}
        >
          <Text style={styles.pickerValue}>{timezone}</Text>
          <Text style={styles.pickerChevron}>{showTimezonePicker ? '▴' : '▾'}</Text>
        </TouchableOpacity>
        {showTimezonePicker && (
          <View style={styles.pickerDropdown}>
            {TIMEZONES.map(tz => (
              <TouchableOpacity
                key={tz}
                style={[styles.pickerOption, tz === timezone && styles.pickerOptionActive]}
                onPress={() => { setTimezone(tz); setShowTimezonePicker(false); }}
              >
                <Text style={[styles.pickerOptionText, tz === timezone && styles.pickerOptionTextActive]}>{tz}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Editable Fields */}
      <View style={styles.card}>
        <SettingInput label="Number of Floors" value={floors} onChange={setFloors} keyboard="numeric" hint="Min 1, max 200" />
        <SettingInput label="Total Rooms" value={totalRooms} onChange={setTotalRooms} keyboard="numeric" hint="Min 1, max 10,000 (backend enforced)" />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <SettingInput label="Default Check-in" value={checkIn} onChange={setCheckIn} placeholder="HH:MM" />
          </View>
          <View style={{ flex: 1 }}>
            <SettingInput label="Default Check-out" value={checkOut} onChange={setCheckOut} placeholder="HH:MM" />
          </View>
        </View>
      </View>

      {/* Read-only rows */}
      <View style={styles.card}>
        <SettingRow label="Language" value="English" />
        <SettingRow label="Status" value={property.is_active ? 'Active' : 'Inactive'} />
      </View>

      {hasChanges && <SettingSaveButton onPress={handleSave} saving={saving} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BG.white, borderRadius: RADIUS.card + 6, padding: 14,
    marginBottom: 12, ...SHADOWS.card,
  },
  pickerLabel: { ...TYPOGRAPHY.small, fontWeight: '600', color: GRAY[500], marginBottom: 8 },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: GRAY[50], borderRadius: RADIUS.input, borderWidth: 1, borderColor: GRAY[200],
    paddingHorizontal: 14, paddingVertical: 12,
  },
  pickerValue: { fontSize: 14, fontWeight: '600', color: GRAY[900] },
  pickerChevron: { fontSize: 12, color: GRAY[400] },
  pickerDropdown: {
    marginTop: 8, backgroundColor: GRAY[50], borderRadius: RADIUS.input,
    borderWidth: 1, borderColor: GRAY[200], maxHeight: 200, overflow: 'scroll',
  },
  pickerOption: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: GRAY[100],
  },
  pickerOptionActive: { backgroundColor: ACCENT + '15' },
  pickerOptionText: { fontSize: 13, color: GRAY[700] },
  pickerOptionTextActive: { fontWeight: '700', color: ACCENT },
});
