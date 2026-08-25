import React, { useState } from 'react';
import {
  View, Text, Modal, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AdminRoom, AdminRoomStatus } from '@/types/api';
import { useHost } from '@/lib/context/host-context';
import { getRoomStatusColor, getRoomCapacitySummary } from '@/lib/host/capacity-validation';
import { hostApi } from '@/lib/api/host-api';
import { ImagePickerOverlay } from '@/components/host/ImagePickerOverlay';
import { SRS, NEUTRAL, BG, SLATE, BLUE, GRAY } from '@/lib/constants/figma-tokens';
;
;

const ACCENT = SRS.teal;
const STATUS_OPTIONS: AdminRoomStatus[] = ['AVAILABLE', 'OCCUPIED', 'DIRTY', 'CLEANING', 'INSPECTED', 'MAINTENANCE', 'BLOCKED'];
const AMENITY_OPTIONS = [
  'WiFi', 'AC', 'TV', 'Mini Bar', 'Balcony', 'Jacuzzi', 'Living Room',
  'Kitchen', 'Garden', 'BBQ', 'Pool', 'Gym', 'Spa', 'Beach Access',
  'Room Service', 'Breakfast', 'Parking', 'Pet Friendly', 'Smoke Detector',
  'Safe', 'Hair Dryer', 'Iron', 'Coffee Machine', 'Work Desk',
];

interface Props {
  room: AdminRoom | null;
  visible: boolean;
  onClose: () => void;
}

export function RoomEditModal({ room, visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { updateRoom, properties, rooms } = useHost();
  const isNew = !room;
  const property = room ? properties.find(p => p.id === room.property_id) : null;

  const [form, setForm] = useState({
    room_name: '',
    room_type_id: '',
    floor_number: '1',
    max_adults: '2',
    max_children: '0',
    max_occupancy: '2',
    base_rate: '0',
    status: 'AVAILABLE' as AdminRoomStatus,
    smoking: false,
    accessible: false,
    amenitiesInput: '',
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const isNewRef = React.useRef(false);

  React.useEffect(() => {
    if (room) {
      const justCreated = room.id.startsWith('room-') && !room.room_type_id;
      isNewRef.current = justCreated;
      setForm({
        room_name: room.room_name,
        room_type_id: room.room_type_id,
        floor_number: String(room.floor_number),
        max_adults: String(room.max_adults),
        max_children: String(room.max_children),
        max_occupancy: String(room.max_occupancy),
        base_rate: String(room.base_rate),
        status: room.status,
        smoking: room.smoking,
        accessible: room.accessible,
        amenitiesInput: room.amenities.join(', '),
      });
      setPhotos(room.photos || []);
    }
  }, [room]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleImagePicked = async (uri: string) => {
    if (!room) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('images', { uri, type: 'image/jpeg', name: `room-${room.id}-${Date.now()}.jpg` } as any);
    try {
      const res = await hostApi.uploadRoomImages(room.property_id, fd);
      const uploadedUrl = res?.data?.urls?.[0] || res?.data?.[0] || res?.url || uri;
      const updated = [...photos, uploadedUrl];
      setPhotos(updated);
      updateRoom(room.id, { photos: updated });
    } catch {
      // Fallback: keep as local URI
      const updated = [...photos, uri];
      setPhotos(updated);
      updateRoom(room.id, { photos: updated });
    }
    setUploading(false);
  };

  const handleRemovePhoto = (idx: number) => {
    if (!room) return;
    const updated = photos.filter((_, i) => i !== idx);
    setPhotos(updated);
    updateRoom(room.id, { photos: updated });
  };

  const handleSave = async () => {
    if (!form.room_name.trim()) {
      Alert.alert('Required', 'Room name is required');
      return;
    }

    // Check for duplicate room names within the same property
    const propertyId = room?.property_id || property?.id;
    if (propertyId) {
      const existingRoomNames = rooms
        .filter(r => r.property_id === propertyId && r.id !== room?.id)
        .map(r => r.room_name.toLowerCase().trim());
      if (existingRoomNames.includes(form.room_name.toLowerCase().trim())) {
        Alert.alert('Duplicate', 'A room with this name already exists in this property');
        return;
      }
    }

    const adults = parseInt(form.max_adults) || 2;
    const children = parseInt(form.max_children) || 0;
    const maxOcc = parseInt(form.max_occupancy) || (adults + children);

    if (adults + children > maxOcc) {
      Alert.alert('Invalid', 'Adults + children exceeds max occupancy');
      return;
    }

    const amenities = form.amenitiesInput.split(',').map(a => a.trim()).filter(Boolean);

    if (room && propertyId) {
      if (isNewRef.current) {
        const payload = {
          floor_number: parseInt(form.floor_number) || 1,
          room_name: form.room_name,
          room_type_id: form.room_type_id || 'standard',
          bed_type_id: 'standard',
          base_rate: Math.max(1, parseFloat(form.base_rate) || 1),
          max_adults: adults,
          max_children: children,
          smoking: form.smoking,
          accessible: form.accessible,
        };
        await hostApi.createRoom(propertyId, payload, () => ({ id: room.id } as any));
      }
      updateRoom(room.id, {
        room_name: form.room_name,
        room_type_id: form.room_type_id,
        floor_number: parseInt(form.floor_number) || 1,
        max_adults: adults,
        max_children: children,
        max_occupancy: maxOcc,
        base_rate: parseFloat(form.base_rate) || 0,
        status: form.status,
        smoking: form.smoking,
        accessible: form.accessible,
        amenities,
        photos,
      });
      Alert.alert('Saved', `Room ${form.room_name} updated`);
    }
    onClose();
  };

  if (!room && !isNew) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: NEUTRAL[100] }}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="close" size={20} color={GRAY[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isNew ? 'New Room' : `Edit ${room?.room_name}`}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={90}
        >
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Room Info</Text>
            <View style={styles.card}>
              <Field label="Room Name / Number" value={form.room_name} onChange={v => set('room_name', v)} />
              <Field label="Room Type ID" value={form.room_type_id} onChange={v => set('room_type_id', v)} />
              <Field label="Floor Number" value={form.floor_number} onChange={v => set('floor_number', v)} keyboard="numeric" />
              <Field label="Base Rate ($)" value={form.base_rate} onChange={v => set('base_rate', v)} keyboard="numeric" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Capacity</Text>
            <View style={styles.card}>
              <View style={styles.capacityRow}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Max Adults"
                    value={form.max_adults}
                    onChange={v => {
                      set('max_adults', v);
                      const a = parseInt(v) || 0;
                      const c = parseInt(form.max_children) || 0;
                      if (a + c > parseInt(form.max_occupancy) || 0) {
                        set('max_occupancy', String(a + c));
                      }
                    }}
                    keyboard="numeric"
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Field
                    label="Max Children"
                    value={form.max_children}
                    onChange={v => {
                      set('max_children', v);
                      const a = parseInt(form.max_adults) || 0;
                      const c = parseInt(v) || 0;
                      if (a + c > parseInt(form.max_occupancy) || 0) {
                        set('max_occupancy', String(a + c));
                      }
                    }}
                    keyboard="numeric"
                  />
                </View>
              </View>
              <Field
                label="Max Total Occupancy"
                value={form.max_occupancy}
                onChange={v => set('max_occupancy', v)}
                keyboard="numeric"
              />
              {room && (
                <Text style={styles.capacityHint}>
                  Current: {getRoomCapacitySummary(room)}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {STATUS_OPTIONS.map(st => (
                  <TouchableOpacity
                    key={st}
                    onPress={() => set('status', st)}
                    style={[styles.statusChip, form.status === st && { backgroundColor: getRoomStatusColor(st), borderColor: getRoomStatusColor(st) }]}
                  >
                    <Text style={[styles.statusChipText, form.status === st && { color: BG.white }]}>{st}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Toggles</Text>
            <View style={styles.card}>
              <ToggleRow label="Smoking Allowed" value={form.smoking} onChange={v => set('smoking', v)} />
              <ToggleRow label="Accessible Room" value={form.accessible} onChange={v => set('accessible', v)} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos ({photos.length})</Text>
            <View style={styles.card}>
              {photos.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  <View style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
                    <Image source={{ uri: photos[0] }} style={{ width: '100%', height: 160 }} resizeMode="cover" />
                    <View style={{ position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: BG.white }}>COVER</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemovePhoto(0)}
                      style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.9)', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="close" size={14} color={BG.white} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setImagePickerVisible(true)}
                      style={{ position: 'absolute', bottom: 8, right: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="camera-outline" size={12} color={BG.white} />
                      <Text style={{ fontSize: 11, fontWeight: '600', color: BG.white }}>Change</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {photos.length > 1 ? (
                <>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: SLATE[500], marginBottom: 8 }}>More Photos</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {photos.slice(1).map((url, idx) => (
                      <View key={idx} style={{ width: '30%', aspectRatio: 4 / 3, borderRadius: 8, overflow: 'hidden', backgroundColor: SLATE[100] }}>
                        <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        <TouchableOpacity onPress={() => handleRemovePhoto(idx + 1)}
                          style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.85)', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: BG.white }}>×</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                          const reordered = [...photos];
                          const moved = reordered.splice(idx + 1, 1)[0];
                          reordered.unshift(moved);
                          setPhotos(reordered);
                          updateRoom(room!.id, { photos: reordered });
                        }}
                          style={{ position: 'absolute', bottom: 2, left: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                          <Text style={{ fontSize: 9, fontWeight: '600', color: BG.white }}>Set as Cover</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity onPress={() => setImagePickerVisible(true)}
                      style={{ width: '30%', aspectRatio: 4 / 3, borderRadius: 8, borderWidth: 1.5, borderColor: ACCENT + '40', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: ACCENT + '05' }}>
                      {uploading ? (
                        <Text style={{ fontSize: 10, color: ACCENT }}>Uploading...</Text>
                      ) : (
                        <>
                          <Ionicons name="camera-outline" size={20} color={ACCENT} />
                          <Text style={{ fontSize: 10, color: ACCENT, marginTop: 2 }}>Add</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              ) : photos.length === 0 ? (
                <TouchableOpacity onPress={() => setImagePickerVisible(true)}
                  style={{ height: 120, borderRadius: 12, borderWidth: 1.5, borderColor: ACCENT + '40', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: ACCENT + '05' }}>
                  {uploading ? (
                    <Text style={{ fontSize: 12, color: ACCENT }}>Uploading...</Text>
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={28} color={ACCENT} />
                      <Text style={{ fontSize: 12, color: ACCENT, fontWeight: '600', marginTop: 4 }}>Add Photos</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.card}>
              <Text style={{ fontSize: 11, color: SLATE[400], marginBottom: 8 }}>Tap to toggle amenities</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {AMENITY_OPTIONS.map(a => {
                  const selected = form.amenitiesInput.split(',').map(x => x.trim().toLowerCase()).includes(a.toLowerCase());
                  return (
                    <TouchableOpacity
                      key={a}
                      onPress={() => {
                        const list = form.amenitiesInput.split(',').map(x => x.trim()).filter(Boolean);
                        const idx = list.findIndex(x => x.toLowerCase() === a.toLowerCase());
                        if (idx >= 0) list.splice(idx, 1);
                        else list.push(a);
                        set('amenitiesInput', list.join(', '));
                      }}
                      style={[styles.amenityChip, selected && styles.amenityChipSelected]}
                    >
                      <Text style={[styles.amenityChipText, selected && styles.amenityChipTextSelected]}>{a}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>

        <ImagePickerOverlay
          visible={imagePickerVisible}
          onClose={() => setImagePickerVisible(false)}
          onImagePicked={handleImagePicked}
        />
      </View>
    </Modal>
  );
}

function Field({
  label, value, onChange, keyboard, multiline,
}: {
  label: string; value: string; onChange: (v: string) => void;
  keyboard?: 'default' | 'numeric'; multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={[fieldStyles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard || 'default'}
        placeholderTextColor={SLATE[300]}
      />
    </View>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity onPress={() => onChange(!value)} style={toggleStyles.row}>
      <Text style={toggleStyles.label}>{label}</Text>
      <View style={[toggleStyles.track, value && toggleStyles.trackOn]}>
        <View style={[toggleStyles.thumb, value && toggleStyles.thumbOn]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: BG.white, borderBottomWidth: 1, borderBottomColor: SLATE[200], paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: SLATE[100], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: GRAY[900], flex: 1 },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: ACCENT },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: BG.white },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: GRAY[900], marginBottom: 10 },
  card: { backgroundColor: BG.white, borderRadius: 14, padding: 16 },
  capacityRow: { flexDirection: 'row' },
  capacityHint: { fontSize: 11, color: SLATE[400], marginTop: -8, marginBottom: 4 },
  statusChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: SLATE[200], backgroundColor: NEUTRAL[100] },
  statusChipText: { fontSize: 11, fontWeight: '600', color: SLATE[600] },
  amenityChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: SLATE[100], borderWidth: 1, borderColor: SLATE[200] },
  amenityChipSelected: { backgroundColor: BLUE.tint, borderColor: ACCENT },
  amenityChipText: { fontSize: 12, color: SLATE[600], fontWeight: '500' },
  amenityChipTextSelected: { color: ACCENT, fontWeight: '700' },
});

const fieldStyles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '600', color: SLATE[500], marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: NEUTRAL[100], borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: GRAY[900], borderWidth: 1, borderColor: SLATE[200] },
});

const toggleStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  label: { fontSize: 14, color: GRAY[900] },
  track: { width: 48, height: 28, borderRadius: 14, backgroundColor: SLATE[200], justifyContent: 'center', paddingHorizontal: 3 },
  trackOn: { backgroundColor: ACCENT },
  thumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: BG.white },
  thumbOn: { alignSelf: 'flex-end' },
});