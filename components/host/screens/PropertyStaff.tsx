import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, StyleSheet, Alert, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { Property, StaffMember, StaffRole, StaffPhotos } from '@/types/api';
import { useHost } from '@/lib/context/host-context';
import { isApiPropertyId } from '@/lib/context/host-utils';
import { hostApi } from '@/lib/api/host-api';
import { GRAY, TYPOGRAPHY, RADIUS, SPACING, SHADOWS } from '@/constants/portal-theme';
import { STATUS, BG, BLUE, TEAL, PURPLE, AMBER, ORANGE, RED } from '@/lib/constants/figma-tokens';
import { StaffCreatedEmailModal } from '@/components/operations/StaffCreatedEmailModal';
import { ImagePickerOverlay } from '@/components/host/ImagePickerOverlay';
import { PropertySyncBanner } from '@/components/host/PropertySyncBanner';

interface Props { property: Property }

const ACCENT = TEAL[600];

type PhotoSlotKey = keyof StaffPhotos;

const PHOTO_SLOTS: { key: PhotoSlotKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'profile', label: 'Profile photo', icon: 'person' },
  { key: 'citizenship_front', label: 'Citizenship (front)', icon: 'card' },
  { key: 'citizenship_back', label: 'Citizenship (back)', icon: 'card' },
];

const ROLE_COLORS: Record<StaffRole, string> = {
  manager: PURPLE[500],
  front_desk: BLUE[500],
  housekeeping: STATUS.activeGreen,
  waiter: AMBER[500],
  kitchen: ORANGE[500],
  maintenance: RED[500],
};

const ROLE_LABELS: Record<StaffRole, string> = {
  manager: 'Manager',
  front_desk: 'Front Desk',
  housekeeping: 'Housekeeping',
  waiter: 'Waiter',
  kitchen: 'Kitchen',
  maintenance: 'Maintenance',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatJoiningDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function PropertyStaff({ property }: Props) {
  const { getFilteredStaff, addStaff, updateStaff, removeStaff } = useHost();
  const staffList = getFilteredStaff(property.id);

  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<StaffRole>('front_desk');
  const [joiningDate, setJoiningDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [showJoiningPicker, setShowJoiningPicker] = useState(false);
  const [photos, setPhotos] = useState<Partial<Record<PhotoSlotKey, string>>>({});
  const [pickerSlot, setPickerSlot] = useState<PhotoSlotKey | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<PhotoSlotKey | null>(null);
  const [emailModalStaff, setEmailModalStaff] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    role: StaffRole;
    department: string;
    position: string;
  } | null>(null);

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setRole('front_desk');
    setPhotos({});
    setShowJoiningPicker(false);
    setEditingStaff(null);
  };

  const handleJoiningDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowJoiningPicker(false);
    if (event.type === 'set' && selectedDate) {
      const d = new Date(selectedDate);
      d.setHours(0, 0, 0, 0);
      setJoiningDate(d);
    }
  };

  const handlePhotoPicked = async (slot: PhotoSlotKey, uri: string) => {
    setPickerSlot(null);
    setUploadingSlot(slot);
    try {
      let uploadedUrl: string | null = null;
      if (isApiPropertyId(property.id)) {
        const formData = new FormData();
        formData.append('image', { uri, type: 'image/jpeg', name: `staff_${slot}_${Date.now()}.jpg` } as any);
        const res = await hostApi.uploadStaffImage(property.id, formData);
        uploadedUrl = typeof res === 'string' ? res : (res?.data ?? null);
      }
      const next = uploadedUrl || (!isApiPropertyId(property.id) ? uri : null);
      if (next) {
        setPhotos(prev => ({ ...prev, [slot]: next }));
      } else {
        Alert.alert('Upload Failed', 'Could not upload this photo. You can still send the invitation without it.');
        setPhotos(prev => ({ ...prev, [slot]: null }));
      }
    } catch {
      Alert.alert('Upload Failed', 'Could not upload this photo. You can still send the invitation without it.');
      setPhotos(prev => ({ ...prev, [slot]: null }));
    }
    setUploadingSlot(null);
  };

  const startEdit = (s: StaffMember) => {
    setEditingStaff(s);
    setFullName(`${s.first_name} ${s.last_name}`.trim());
    setEmail(s.email);
    setPhone(s.phone || '');
    setRole(s.role);
    const d = new Date(s.created_at);
    d.setHours(0, 0, 0, 0);
    setJoiningDate(Number.isNaN(d.getTime()) ? new Date() : d);
    setPhotos({});
    setShowJoiningPicker(false);
    setShowForm(true);
  };

  const handleDeleteStaff = (s: StaffMember) => {
    Alert.alert(
      'Remove Staff',
      `Remove ${s.first_name} ${s.last_name} from your property?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeStaff(s.id) },
      ]
    );
  };

  const handleCreateStaff = async () => {
    if (!fullName.trim() || !email.trim()) {
      Alert.alert('Validation Error', 'Full name and email are required.');
      return;
    }

    // Phone number validation: must be exactly 10 digits (allowing common formats)
    if (phone.trim()) {
      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length !== 10) {
        Alert.alert('Validation Error', 'Phone number must be exactly 10 digits.');
        return;
      }
    }

    if (editingStaff) {
      const nameParts = fullName.trim().split(/\s+/);
      const pickedPhotos = !!(photos.profile || photos.citizenship_front || photos.citizenship_back);
      updateStaff(editingStaff.id, {
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' '),
        email: email.trim(),
        phone: phone.trim() || '',
        role,
      }, {
        joining_date: toISODate(joiningDate),
        ...(pickedPhotos
          ? {
              photos: {
                profile: photos.profile ?? null,
                citizenship_front: photos.citizenship_front ?? null,
                citizenship_back: photos.citizenship_back ?? null,
              },
            }
          : {}),
      });
      setShowForm(false);
      resetForm();
      return;
    }

    const nameParts = fullName.trim().split(/\s+/);
    const now = new Date().toISOString();
    const newStaff: StaffMember = {
      id: `st-${Date.now()}`,
      tenant_id: property.tenant_id || 'demo-host-1',
      email: email.trim(),
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' '),
      phone: phone.trim() || '',
      role,
      property_id: property.id,
      is_active: true,
      pos_discount_limit: role === 'manager' ? 20 : role === 'front_desk' ? 10 : 0,
      created_at: now,
      updated_at: now,
    };

    setSubmitting(true);
    const created = await addStaff(newStaff, toISODate(joiningDate), {
      profile: photos.profile ?? null,
      citizenship_front: photos.citizenship_front ?? null,
      citizenship_back: photos.citizenship_back ?? null,
    });
    setSubmitting(false);
    if (!created) return;

    setEmailModalStaff({
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' '),
      email: email.trim(),
      role,
      department: '',
      position: ROLE_LABELS[role],
    });

    resetForm();
    setShowForm(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {/* Header row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Text style={{ ...TYPOGRAPHY.subtitle, fontWeight: '700', color: GRAY[900] }}>
            {staffList.length} {staffList.length === 1 ? 'Member' : 'Members'}
          </Text>
          <TouchableOpacity
            onPress={() => setShowForm(true)}
            style={styles.addBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="person-add" size={16} color={BG.white} />
            <Text style={styles.addBtnText}>Add Staff</Text>
          </TouchableOpacity>
        </View>

        {!isApiPropertyId(property.id) && <PropertySyncBanner property={property} />}

        {staffList.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 40, paddingBottom: 20 }}>
            <Ionicons name="briefcase-outline" size={48} color={GRAY[300]} />
            <Text style={{ marginTop: 12, fontSize: 15, color: GRAY[500] }}>No staff assigned</Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: GRAY[400] }}>Invite your first staff member</Text>
            <TouchableOpacity
              onPress={() => setShowForm(true)}
              style={[styles.addBtn, { marginTop: 16 }]}
              activeOpacity={0.7}
            >
              <Ionicons name="person-add" size={16} color={BG.white} />
              <Text style={styles.addBtnText}>Add Staff</Text>
            </TouchableOpacity>
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
                  <Text style={styles.role}>{ROLE_LABELS[s.role] || s.role.replace('_', ' ')}</Text>
                  <Text style={styles.email}>{s.email}</Text>
                </View>
                <TouchableOpacity onPress={() => startEdit(s)} hitSlop={8} style={{ padding: 6 }}>
                  <Ionicons name="pencil" size={18} color={GRAY[500]} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteStaff(s)} hitSlop={8} style={{ padding: 6 }}>
                  <Ionicons name="trash-outline" size={18} color={RED[500]} />
                </TouchableOpacity>
                <View style={[styles.activeDot, { backgroundColor: s.is_active ? STATUS.activeGreen : GRAY[300] }]} />
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add / Edit Staff Modal */}
      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, SHADOWS.card]}>
            <Text style={styles.modalTitle}>{editingStaff ? 'Edit Staff Member' : 'Invite Staff Member'}</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.md, paddingBottom: 8 }}>
              <View style={{ gap: 4 }}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="John Doe"
                  placeholderTextColor={GRAY[400]}
                  autoCapitalize="words"
                  style={styles.input}
                />
              </View>

              <View style={{ gap: 4 }}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="staff@serveiq.com"
                  placeholderTextColor={GRAY[400]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>

              <View style={{ gap: 4 }}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+977-9841234567"
                  placeholderTextColor={GRAY[400]}
                  keyboardType="phone-pad"
                  maxLength={13}
                  style={styles.input}
                />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={styles.label}>Role</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {(Object.keys(ROLE_LABELS) as StaffRole[]).map(r => (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setRole(r)}
                      style={[
                        styles.roleChip,
                        { backgroundColor: role === r ? ROLE_COLORS[r] : GRAY[100] },
                      ]}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: role === r ? BG.white : GRAY[700] }}>
                        {ROLE_LABELS[r]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={{ gap: 4 }}>
                <Text style={styles.label}>Joining Date</Text>
                <TouchableOpacity
                  onPress={() => setShowJoiningPicker(true)}
                  style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                >
                  <Text style={{ fontSize: 13, color: GRAY[800] }}>{formatJoiningDate(joiningDate)}</Text>
                  <Ionicons name="calendar-outline" size={16} color={GRAY[400]} />
                </TouchableOpacity>
                {showJoiningPicker && Platform.OS === 'ios' && (
                  <View style={{ marginTop: 4 }}>
                    <DateTimePicker
                      value={joiningDate}
                      mode="date"
                      display="spinner"
                      maximumDate={new Date()}
                      onChange={handleJoiningDateChange}
                    />
                    <TouchableOpacity
                      onPress={() => setShowJoiningPicker(false)}
                      style={{ alignItems: 'center', paddingVertical: 10 }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '700', color: ACCENT }}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {showJoiningPicker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={joiningDate}
                  mode="date"
                  maximumDate={new Date()}
                  onChange={handleJoiningDateChange}
                />
              )}

              <View style={{ gap: 6 }}>
                <Text style={styles.label}>Documents (optional)</Text>
                <View style={{ gap: 8 }}>
                  {PHOTO_SLOTS.map(slot => {
                    const uri = photos[slot.key];
                    return (
                      <View key={slot.key} style={[styles.photoSlot, uri && { padding: 4 }]}>
                        {uri ? (
                          <>
                            <TouchableOpacity onPress={() => setPickerSlot(slot.key)} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                              <Image source={{ uri }} style={styles.photoPreview} />
                              <View style={styles.photoSlotText}>
                                <Text style={styles.photoSlotLabel}>{slot.label}</Text>
                                <Text style={styles.photoSlotHint}>Tap to replace</Text>
                              </View>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setPhotos(prev => ({ ...prev, [slot.key]: undefined }))} hitSlop={8}>
                              <Ionicons name="close-circle" size={18} color={RED[500]} />
                            </TouchableOpacity>
                          </>
                        ) : (
                          <TouchableOpacity onPress={() => setPickerSlot(slot.key)} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                            <View style={[styles.photoSlotIcon, uploadingSlot === slot.key && { opacity: 0.5 }]}>
                              <Ionicons
                                name={uploadingSlot === slot.key ? 'hourglass-outline' : slot.icon}
                                size={20}
                                color={ACCENT}
                              />
                            </View>
                            <View style={styles.photoSlotText}>
                              <Text style={styles.photoSlotLabel}>{slot.label}</Text>
                              <Text style={styles.photoSlotHint}>{uploadingSlot === slot.key ? 'Uploading…' : 'Add photo'}</Text>
                            </View>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg }}>
              <TouchableOpacity
                onPress={() => { setShowForm(false); resetForm(); }}
                style={[styles.cancelBtn, { borderColor: GRAY[200] }]}
                disabled={submitting}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: GRAY[600] }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateStaff}
                style={[styles.createBtn, { backgroundColor: ACCENT }]}
                disabled={submitting}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: BG.white }}>
                  {submitting ? 'Sending…' : editingStaff ? 'Save Changes' : 'Send Invitation'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Invitation Sent Confirmation */}
      {emailModalStaff && (
        <StaffCreatedEmailModal
          visible={!!emailModalStaff}
          onClose={() => setEmailModalStaff(null)}
          staff={emailModalStaff}
        />
      )}

      {/* Photo picker (profile / citizenship) */}
      <ImagePickerOverlay
        visible={pickerSlot !== null}
        onClose={() => setPickerSlot(null)}
        onImagePicked={(uri) => { if (pickerSlot) handlePhotoPicked(pickerSlot, uri); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: BG.white, borderRadius: RADIUS.card + 6, padding: 14, marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: BLUE.tint, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: ACCENT },
  name: { fontSize: 15, fontWeight: '600', color: GRAY[900] },
  role: { ...TYPOGRAPHY.small, color: GRAY[400], marginTop: 2 },
  email: { fontSize: 12, color: GRAY[400], marginTop: 2 },
  activeDot: { width: 10, height: 10, borderRadius: 5 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ACCENT,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.button,
  },
  addBtnText: { color: BG.white, fontSize: 13, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: BG.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '88%',
  },
  modalTitle: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: GRAY[900], marginBottom: SPACING.lg },
  label: { fontSize: 12, fontWeight: '600', color: GRAY[600] },
  input: {
    borderWidth: 1,
    borderColor: GRAY[200],
    borderRadius: RADIUS.input,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
    color: GRAY[900],
  },
  roleChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    marginRight: 8,
  },
  photoSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: GRAY[200],
    borderStyle: 'dashed',
    borderRadius: RADIUS.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  photoSlotIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ACCENT + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSlotText: { flex: 1 },
  photoSlotLabel: { fontSize: 13, fontWeight: '600', color: GRAY[800] },
  photoSlotHint: { fontSize: 12, color: GRAY[400], marginTop: 1 },
  photoPreview: { width: 48, height: 48, borderRadius: RADIUS.input, backgroundColor: GRAY[100] },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    alignItems: 'center',
  },
  createBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: RADIUS.button,
    alignItems: 'center',
  },
});
