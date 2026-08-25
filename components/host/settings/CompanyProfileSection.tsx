import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Property } from '@/types/api';
import { useHost } from '@/lib/context/host-context';
import { ImagePickerOverlay } from '@/components/host/ImagePickerOverlay';
import { SettingRow, SettingInput, SettingSectionTitle, SettingSaveButton } from './shared';
import { SRS, GRAY, RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/portal-theme';
import { BG } from '@/lib/constants/figma-tokens';
import { normalizePhone } from '@/lib/api/host-api';

const ACCENT = SRS.teal;

export function CompanyProfileSection({ property }: { property: Property }) {
  const { updateProperty, setPropertyCoverPhoto, addPropertyGalleryPhotos, removePropertyGalleryPhoto } = useHost();

  const [name, setName] = useState(property.name);
  const [description, setDescription] = useState(property.description || '');
  const [phone, setPhone] = useState(property.phone_number || '');
  const [email, setEmail] = useState(property.email || '');
  const [checkInFrom, setCheckInFrom] = useState(property.check_in_time_from || '14:00');
  const [checkOutTo, setCheckOutTo] = useState(property.check_out_time_to || '11:00');
  const [saving, setSaving] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);

  // Sync local state when property changes (e.g. after save)
  useEffect(() => {
    setName(property.name);
    setDescription(property.description || '');
    setPhone(property.phone_number || '');
    setEmail(property.email || '');
    setCheckInFrom(property.check_in_time_from || '14:00');
    setCheckOutTo(property.check_out_time_to || '11:00');
  }, [property.id, property.name, property.description, property.phone_number, property.email, property.check_in_time_from, property.check_out_time_to]);

  const cover = property.photos.find(p => p.category === 'cover');
  const gallery = property.photos.filter(p => p.category === 'gallery');

  const hasChanges =
    name.trim() !== property.name ||
    description !== (property.description || '') ||
    phone !== (property.phone_number || '') ||
    email !== (property.email || '') ||
    checkInFrom !== (property.check_in_time_from || '14:00') ||
    checkOutTo !== (property.check_out_time_to || '11:00');

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Property name is required');
      return;
    }
    if (phone && normalizePhone(phone)?.length !== 10) {
      Alert.alert('Invalid Phone', 'Phone number must be exactly 10 digits');
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setSaving(true);
    try {
      await updateProperty(property.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        phone_number: phone ? normalizePhone(phone) : undefined,
        email: email || undefined,
        check_in_time: checkInFrom,
        check_out_time: checkOutTo,
      } as any);
      Alert.alert('Saved', 'Company profile updated successfully');
    } catch {
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [property.id, name, description, phone, email, checkInFrom, checkOutTo, updateProperty]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <SettingSectionTitle>Company Profile</SettingSectionTitle>

      {/* Cover Photo */}
      <View style={[styles.card, { marginBottom: 12 }]}>
        <Text style={styles.cardLabel}>Cover Photo</Text>
        {cover ? (
          <View style={{ position: 'relative', marginBottom: 8 }}>
            <Image source={{ uri: cover.photo_url }} style={{ width: '100%', height: 160, borderRadius: 12 }} resizeMode="cover" />
            <TouchableOpacity
              onPress={() => setShowCoverPicker(true)}
              style={{ position: 'absolute', bottom: 8, right: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Ionicons name="camera-outline" size={14} color={BG.white} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: BG.white }}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setShowCoverPicker(true)}
            style={{ height: 120, borderRadius: 12, borderWidth: 1.5, borderColor: ACCENT + '40', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: ACCENT + '08' }}>
            <Ionicons name="camera-outline" size={24} color={ACCENT} />
            <Text style={{ fontSize: 12, color: ACCENT, fontWeight: '600', marginTop: 4 }}>Upload Cover Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Gallery */}
      <View style={[styles.card, { marginBottom: 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12 }}>
          <Text style={styles.cardLabel}>Gallery ({gallery.length})</Text>
          <TouchableOpacity onPress={() => setShowGalleryPicker(true)} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: ACCENT + '15' }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: ACCENT }}>+ Add</Text>
          </TouchableOpacity>
        </View>
        {gallery.length === 0 ? (
          <Text style={{ ...TYPOGRAPHY.small, color: GRAY[400], paddingVertical: 16 }}>No gallery photos yet</Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 12 }}>
            {gallery.map((photo, idx) => (
              <View key={photo.id || idx} style={{ width: '30%', aspectRatio: 4 / 3, borderRadius: RADIUS.card, overflow: 'hidden', backgroundColor: GRAY[100] }}>
                <Image source={{ uri: photo.photo_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                <TouchableOpacity onPress={() => removePropertyGalleryPhoto(property.id, photo.photo_url)}
                  style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: RADIUS.full, backgroundColor: 'rgba(239,68,68,0.85)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ ...TYPOGRAPHY.small, fontWeight: '700', color: BG.white }}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Editable Fields */}
      <View style={styles.card}>
        <SettingInput label="Property Name" value={name} onChange={setName} placeholder="e.g. Grand Hotel" />
        <SettingInput label="Description" value={description} onChange={setDescription} multiline placeholder="Describe your property…" />
        <SettingInput label="Phone Number" value={phone} onChange={setPhone} placeholder="10-digit phone number" keyboard="numeric" hint="Backend requires exactly 10 digits" />
        <SettingInput label="Email" value={email} onChange={setEmail} placeholder="contact@hotel.com" keyboard="email-address" />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <SettingInput label="Check-in Time" value={checkInFrom} onChange={setCheckInFrom} placeholder="HH:MM" />
          </View>
          <View style={{ flex: 1 }}>
            <SettingInput label="Check-out Time" value={checkOutTo} onChange={setCheckOutTo} placeholder="HH:MM" />
          </View>
        </View>
        <SettingRow label="Property Type" value={property.type} />
        <SettingRow label="Status" value={property.is_active ? 'Active' : 'Inactive'} />
        <SettingRow label="City" value={property.city} />
        <SettingRow label="Country" value={property.country} />
      </View>

      {hasChanges && <SettingSaveButton onPress={handleSave} saving={saving} />}

      <ImagePickerOverlay
        visible={showCoverPicker}
        onClose={() => setShowCoverPicker(false)}
        onImagePicked={async (uri) => { await setPropertyCoverPhoto(property.id, uri); }}
      />
      <ImagePickerOverlay
        visible={showGalleryPicker}
        onClose={() => setShowGalleryPicker(false)}
        onImagePicked={async (uri) => { await addPropertyGalleryPhotos(property.id, [uri]); }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: BG.white, borderRadius: RADIUS.card + 6, overflow: 'hidden', padding: 12, ...SHADOWS.card },
  cardLabel: { ...TYPOGRAPHY.small, fontWeight: '600', color: GRAY[500], padding: 12 },
});
