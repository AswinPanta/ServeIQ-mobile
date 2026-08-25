import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal, StyleSheet, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Property } from '@/types/api';
import { useHost } from '@/lib/context/host-context';
import { validateRoomCapacity, getRoomStatusColor, getRoomCapacitySummary } from '@/lib/host/capacity-validation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SRS, GRAY, TYPOGRAPHY, RADIUS } from '@/constants/portal-theme';
import { BG, STATUS, AMBER, NEUTRAL, RED, SLATE, CYAN } from '@/lib/constants/figma-tokens';
import { isApiPropertyId } from '@/lib/context/host-utils';

const ACCENT = SRS.teal;

interface Props { property: Property }

export function PropertyBookings({ property }: Props) {
  const { getFilteredBookings, getFilteredRooms, fetchHostData } = useHost();
  const bookings = getFilteredBookings(property.id);
  const rooms = getFilteredRooms(property.id);
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'checked_in' | 'checked_out'>('all');
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isBackendProperty = isApiPropertyId(property.id);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    fetchHostData();
    // Small delay to let the data load
    setTimeout(() => setRefreshing(false), 1500);
  }, [fetchHostData]);

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['all', 'pending', 'checked_in', 'checked_out'] as const).map(f => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)}
              style={[styles.filterChip, filter === f && { backgroundColor: ACCENT }]}>
              <Text style={[styles.filterText, filter === f && { color: BG.white }]}>{f.replace('_', ' ')}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity onPress={() => setShowNewBooking(true)} style={styles.addBtn}>
          <Ionicons name="add" size={16} color={BG.white} />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
      >
        {filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Ionicons name="receipt-outline" size={48} color={GRAY[300]} />
            <Text style={{ marginTop: 12, fontSize: 15, color: GRAY[400], textAlign: 'center' }}>
              {isBackendProperty
                ? filter !== 'all'
                  ? `No ${filter.replace('_', ' ')} bookings found`
                  : 'No bookings yet for this property'
                : `No ${filter !== 'all' ? filter : ''} bookings`
              }
            </Text>
            {isBackendProperty && filter === 'all' && (
              <Text style={{ marginTop: 8, fontSize: 13, color: GRAY[400], textAlign: 'center', lineHeight: 18 }}>
                Bookings will appear here once guests book through the platform{'\n'}or you create them from the front desk.
              </Text>
            )}
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
                  backgroundColor: b.status === 'checked_in' ? STATUS.badgeGreen : b.status === 'pending' ? AMBER[100] : GRAY[200],
                }]}>
                  <Text style={[styles.badgeText, {
                    color: b.status === 'checked_in' ? STATUS.activeGreenDark : b.status === 'pending' ? AMBER[600] : GRAY[500],
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
      <Ionicons name={icon} size={13} color={GRAY[400]} />
      <View>
        <Text style={{ ...TYPOGRAPHY.caption, color: GRAY[400] }}>{label}</Text>
        <Text style={{ ...TYPOGRAPHY.small, fontWeight: '600', color: GRAY[900] }}>{value}</Text>
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
      <View style={{ flex: 1, backgroundColor: NEUTRAL[100] }}>
        <View style={[modalStyles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={onClose} style={modalStyles.backBtn}>
            <Ionicons name="close" size={20} color={GRAY[900]} />
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
                      <Ionicons name="remove" size={16} color={GRAY[900]} />
                    </TouchableOpacity>
                    <Text style={modalStyles.stepperValue}>{adults}</Text>
                    <TouchableOpacity onPress={() => setAdults(String(Math.min(20, parseInt(adults) + 1)))}
                      style={modalStyles.stepperBtn}>
                      <Ionicons name="add" size={16} color={GRAY[900]} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.fieldLabel}>Children</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity onPress={() => setChildren(String(Math.max(0, parseInt(children) - 1)))}
                      style={modalStyles.stepperBtn}>
                      <Ionicons name="remove" size={16} color={GRAY[900]} />
                    </TouchableOpacity>
                    <Text style={modalStyles.stepperValue}>{children}</Text>
                    <TouchableOpacity onPress={() => setChildren(String(Math.min(10, parseInt(children) + 1)))}
                      style={modalStyles.stepperBtn}>
                      <Ionicons name="add" size={16} color={GRAY[900]} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {selectedRoom && (
                <View style={modalStyles.capacityInfo}>
                  <Ionicons name="information-circle-outline" size={14} color={GRAY[500]} />
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
              <Ionicons name="alert-circle" size={16} color={RED[500]} />
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
        placeholderTextColor={GRAY[300]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', alignItems: 'center', paddingRight: 16, paddingVertical: 10, backgroundColor: BG.white, borderBottomWidth: 1, borderBottomColor: GRAY[200] },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: GRAY[100], marginLeft: 12 },
  filterText: { ...TYPOGRAPHY.small, fontWeight: '600', color: SLATE[600] },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: ACCENT, marginLeft: 8 },
  addBtnText: { ...TYPOGRAPHY.small, fontWeight: '700', color: BG.white },
  card: { backgroundColor: BG.white, borderRadius: RADIUS.card + 6, padding: 16, marginBottom: 10, gap: 12 },
  guestName: { fontSize: 15, fontWeight: '700', color: GRAY[900] },
  roomId: { ...TYPOGRAPHY.small, color: GRAY[400] },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  badgeText: { fontSize: 11, fontWeight: '700' },
  detailRow: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: GRAY[100], paddingTop: 12 },
});

const modalStyles = StyleSheet.create({
  header: { backgroundColor: BG.white, borderBottomWidth: 1, borderBottomColor: GRAY[200], paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: RADIUS.button, backgroundColor: GRAY[100], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: GRAY[900], flex: 1 },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: RADIUS.button, backgroundColor: ACCENT },
  saveBtnText: { ...TYPOGRAPHY.body, fontWeight: '700', color: BG.white },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: GRAY[900], marginBottom: 4 },
  hint: { ...TYPOGRAPHY.small, color: GRAY[400] },
  card: { backgroundColor: BG.white, borderRadius: RADIUS.card + 6, padding: 16 },
  fieldLabel: { ...TYPOGRAPHY.small, fontWeight: '600', color: GRAY[500], marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: NEUTRAL[100], borderRadius: RADIUS.button, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: GRAY[900], borderWidth: 1, borderColor: GRAY[200] },
  roomOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: BG.white, borderRadius: RADIUS.modal, padding: 14, borderWidth: 1.5, borderColor: GRAY[200] },
  roomOptionSelected: { borderColor: ACCENT, backgroundColor: CYAN[50] },
  roomOptionName: { fontSize: 15, fontWeight: '700', color: GRAY[900] },
  roomOptionBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  roomOptionBadgeText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  roomOptionCapacity: { fontSize: 11, color: GRAY[500], marginTop: 3 },
  roomOptionRate: { fontSize: 13, fontWeight: '700', color: GRAY[900] },
  stepperBtn: { width: 36, height: 36, borderRadius: RADIUS.button, backgroundColor: GRAY[100], alignItems: 'center', justifyContent: 'center' },
  stepperValue: { fontSize: 18, fontWeight: '700', color: GRAY[900], minWidth: 24, textAlign: 'center' },
  capacityInfo: { flexDirection: 'row', gap: 6, backgroundColor: NEUTRAL[100], borderRadius: RADIUS.button, padding: 12, marginTop: 8 },
  capacityInfoText: { ...TYPOGRAPHY.small, color: GRAY[500], flex: 1 },
  errorBox: { flexDirection: 'row', gap: 8, backgroundColor: RED[50], borderRadius: RADIUS.modal, padding: 14, marginTop: 8 },
  errorText: { ...TYPOGRAPHY.small, color: RED[500] },
});
