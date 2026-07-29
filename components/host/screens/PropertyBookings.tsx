import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Property } from '@/types/api';
import { useHost } from '@/lib/context/host-context';
import { validateRoomCapacity, getRoomStatusColor, getRoomCapacitySummary } from '@/lib/host/capacity-validation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACCENT = '#2E86AB';

interface Props { property: Property }

export function PropertyBookings({ property }: Props) {
  const { getFilteredBookings, getFilteredRooms } = useHost();
  const bookings = getFilteredBookings(property.id);
  const rooms = getFilteredRooms(property.id);
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'checked_in' | 'checked_out'>('all');
  const [showNewBooking, setShowNewBooking] = useState(false);

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['all', 'pending', 'checked_in', 'checked_out'] as const).map(f => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)}
              style={[styles.filterChip, filter === f && { backgroundColor: ACCENT }]}>
              <Text style={[styles.filterText, filter === f && { color: '#FFF' }]}>{f.replace('_', ' ')}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity onPress={() => setShowNewBooking(true)} style={styles.addBtn}>
          <Ionicons name="add" size={16} color="#FFF" />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
            <Text style={{ marginTop: 12, fontSize: 15, color: '#94A3B8' }}>No {filter !== 'all' ? filter : ''} bookings</Text>
          </View>
        ) : (
          filtered.map(b => (
            <View key={b.id} style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ gap: 2 }}>
                  <Text style={styles.guestName}>{b.guest_name}</Text>
                  <Text style={styles.roomId}>Room {b.room_name}</Text>
                </View>
                <View style={[styles.badge, {
                  backgroundColor: b.status === 'checked_in' ? '#DCFCE7' : b.status === 'pending' ? '#FEF3C7' : '#E2E8F0',
                }]}>
                  <Text style={[styles.badgeText, {
                    color: b.status === 'checked_in' ? '#16A34A' : b.status === 'pending' ? '#D97706' : '#64748B',
                  }]}>{b.status.replace('_', ' ')}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <DetailItem icon="calendar-outline" label="Check In" value={b.check_in} />
                <DetailItem icon="calendar-outline" label="Check Out" value={b.check_out} />
                <DetailItem icon="cash-outline" label="Total" value={`$${b.total}`} />
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <NewBookingModal
        visible={showNewBooking}
        onClose={() => setShowNewBooking(false)}
        rooms={rooms}
        propertyId={property.id}
      />
    </View>
  );
}

function DetailItem({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={13} color="#94A3B8" />
      <View>
        <Text style={{ fontSize: 10, color: '#94A3B8' }}>{label}</Text>
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#111' }}>{value}</Text>
      </View>
    </View>
  );
}

function NewBookingModal({
  visible, onClose, rooms, propertyId,
}: {
  visible: boolean; onClose: () => void;
  rooms: any[]; propertyId: string;
}) {
  const insets = useSafeAreaInsets();
  const availableRooms = rooms.filter(r => r.status === 'AVAILABLE');

  const [guestName, setGuestName] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [adults, setAdults] = useState('1');
  const [children, setChildren] = useState('0');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [validation, setValidation] = useState<{ errors: string[] } | null>(null);

  const selectedRoom = rooms.find(r => r.id === selectedRoomId) || null;

  const handleSubmit = () => {
    const a = parseInt(adults) || 0;
    const c = parseInt(children) || 0;
    const result = validateRoomCapacity(selectedRoom, a, c);

    if (!result.valid) {
      setValidation({ errors: result.errors });
      return;
    }

    if (!guestName.trim()) {
      Alert.alert('Required', 'Guest name is required');
      return;
    }
    if (!checkIn || !checkOut) {
      Alert.alert('Required', 'Check-in and check-out dates are required');
      return;
    }

    setValidation(null);
    Alert.alert('Booking Created', `${guestName} → Room ${selectedRoom?.room_name} (${a} Adult${a !== 1 ? 's' : ''}, ${c} Child${c !== 1 ? 'ren' : ''})`, [
      { text: 'OK', onPress: onClose },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#F8F9FB' }}>
        <View style={[modalStyles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={onClose} style={modalStyles.backBtn}>
            <Ionicons name="close" size={20} color="#111" />
          </TouchableOpacity>
          <Text style={modalStyles.headerTitle}>New Booking</Text>
          <TouchableOpacity onPress={handleSubmit} style={modalStyles.saveBtn}>
            <Text style={modalStyles.saveBtnText}>Create</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          <View style={modalStyles.section}>
            <Text style={modalStyles.sectionTitle}>Guest Info</Text>
            <View style={modalStyles.card}>
              <BookingField label="Guest Name" value={guestName} onChange={setGuestName} />
            </View>
          </View>

          <View style={modalStyles.section}>
            <Text style={modalStyles.sectionTitle}>Select Room</Text>
            <Text style={modalStyles.hint}>{availableRooms.length} rooms available</Text>
            <View style={{ gap: 8, marginTop: 8 }}>
              {rooms.map(r => {
                const selected = selectedRoomId === r.id;
                const isAvail = r.status === 'AVAILABLE';
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[modalStyles.roomOption, selected && modalStyles.roomOptionSelected, !isAvail && { opacity: 0.5 }]}
                    onPress={() => isAvail && setSelectedRoomId(r.id)}
                    disabled={!isAvail}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={modalStyles.roomOptionName}>{r.room_name}</Text>
                        <View style={[modalStyles.roomOptionBadge, { backgroundColor: getRoomStatusColor(r.status) + '20' }]}>
                          <Text style={[modalStyles.roomOptionBadgeText, { color: getRoomStatusColor(r.status) }]}>{r.status}</Text>
                        </View>
                      </View>
                      <Text style={modalStyles.roomOptionCapacity}>{getRoomCapacitySummary(r)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={modalStyles.roomOptionRate}>${r.base_rate}/night</Text>
                      {selected && <Ionicons name="checkmark-circle" size={20} color={ACCENT} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={modalStyles.section}>
            <Text style={modalStyles.sectionTitle}>Guest Count</Text>
            <View style={modalStyles.card}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.fieldLabel}>Adults</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity onPress={() => setAdults(String(Math.max(1, parseInt(adults) - 1)))}
                      style={modalStyles.stepperBtn}>
                      <Ionicons name="remove" size={16} color="#111" />
                    </TouchableOpacity>
                    <Text style={modalStyles.stepperValue}>{adults}</Text>
                    <TouchableOpacity onPress={() => setAdults(String(Math.min(20, parseInt(adults) + 1)))}
                      style={modalStyles.stepperBtn}>
                      <Ionicons name="add" size={16} color="#111" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.fieldLabel}>Children</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity onPress={() => setChildren(String(Math.max(0, parseInt(children) - 1)))}
                      style={modalStyles.stepperBtn}>
                      <Ionicons name="remove" size={16} color="#111" />
                    </TouchableOpacity>
                    <Text style={modalStyles.stepperValue}>{children}</Text>
                    <TouchableOpacity onPress={() => setChildren(String(Math.min(10, parseInt(children) + 1)))}
                      style={modalStyles.stepperBtn}>
                      <Ionicons name="add" size={16} color="#111" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {selectedRoom && (
                <View style={modalStyles.capacityInfo}>
                  <Ionicons name="information-circle-outline" size={14} color="#64748B" />
                  <Text style={modalStyles.capacityInfoText}>
                    Room {selectedRoom.room_name}: max {selectedRoom.max_adults} adults, {selectedRoom.max_children} children, {selectedRoom.max_occupancy} total
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={modalStyles.section}>
            <Text style={modalStyles.sectionTitle}>Stay Dates</Text>
            <View style={modalStyles.card}>
              <BookingField label="Check-in (YYYY-MM-DD)" value={checkIn} onChange={setCheckIn} />
              <BookingField label="Check-out (YYYY-MM-DD)" value={checkOut} onChange={setCheckOut} />
            </View>
          </View>

          {validation && (
            <View style={modalStyles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <View style={{ flex: 1 }}>
                {validation.errors.map((e, i) => (
                  <Text key={i} style={modalStyles.errorText}>{e}</Text>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function BookingField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={modalStyles.fieldLabel}>{label}</Text>
      <TextInput
        style={modalStyles.input}
        value={value}
        onChangeText={onChange}
        placeholderTextColor="#CBD5E1"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', alignItems: 'center', paddingRight: 16, paddingVertical: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: '#F1F5F9', marginLeft: 12 },
  filterText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: ACCENT, marginLeft: 8 },
  addBtnText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 10, gap: 12 },
  guestName: { fontSize: 15, fontWeight: '700', color: '#111' },
  roomId: { fontSize: 12, color: '#94A3B8' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  detailRow: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
});

const modalStyles = StyleSheet.create({
  header: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111', flex: 1 },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: ACCENT },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 4 },
  hint: { fontSize: 12, color: '#94A3B8' },
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#F8F9FB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111', borderWidth: 1, borderColor: '#E2E8F0' },
  roomOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: '#E2E8F0' },
  roomOptionSelected: { borderColor: ACCENT, backgroundColor: '#F0F9FF' },
  roomOptionName: { fontSize: 15, fontWeight: '700', color: '#111' },
  roomOptionBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  roomOptionBadgeText: { fontSize: 10, fontWeight: '700' },
  roomOptionCapacity: { fontSize: 11, color: '#64748B', marginTop: 3 },
  roomOptionRate: { fontSize: 13, fontWeight: '700', color: '#111' },
  stepperBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  stepperValue: { fontSize: 18, fontWeight: '700', color: '#111', minWidth: 24, textAlign: 'center' },
  capacityInfo: { flexDirection: 'row', gap: 6, backgroundColor: '#F8F9FB', borderRadius: 10, padding: 12, marginTop: 8 },
  capacityInfoText: { fontSize: 12, color: '#64748B', flex: 1 },
  errorBox: { flexDirection: 'row', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, marginTop: 8 },
  errorText: { fontSize: 12, color: '#EF4444' },
});
