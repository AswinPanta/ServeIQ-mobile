import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Property } from '@/types/api';
import { useHost } from '@/lib/context/host-context';
import { SRS, GRAY, TYPOGRAPHY, RADIUS, SHADOWS } from '@/constants/portal-theme';
import { STATUS, BLUE, AMBER, RED, PURPLE, SLATE, BG } from '@/lib/constants/figma-tokens';

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: STATUS.activeGreen, OCCUPIED: BLUE[500], DIRTY: AMBER[500],
  MAINTENANCE: RED[500], CLEANING: PURPLE[500], BLOCKED: SLATE[500],
};

interface Props { property: Property }

export function PropertyGuests({ property }: Props) {
  const { getFilteredRooms, getFilteredBookings } = useHost();
  const rooms = getFilteredRooms(property.id);
  const bookings = getFilteredBookings(property.id);
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);

  const checkedInBookings = bookings.filter(b => b.status === 'checked_in');

  const getRoomGuests = (roomName: string) =>
    checkedInBookings.filter(b => b.room_name === roomName);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>All Rooms</Text>
      <Text style={styles.sectionSub}>{rooms.length} rooms · {checkedInBookings.length} checked in</Text>

      <View style={{ gap: 10, marginTop: 12 }}>
        {rooms.map(r => {
          const guests = getRoomGuests(r.room_name);
          const isExpanded = expandedRoom === r.id;
          const isOccupied = r.status === 'OCCUPIED';

          return (
            <TouchableOpacity
              key={r.id}
              style={[styles.roomCard, { borderLeftColor: STATUS_COLORS[r.status] || GRAY[300] }]}
              activeOpacity={0.85}
              onPress={() => setExpandedRoom(isExpanded ? null : r.id)}
            >
              <View style={styles.roomHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <Ionicons
                    name={isOccupied ? 'person' : 'bed-outline'}
                    size={18}
                    color={isOccupied ? BLUE[500] : GRAY[400]}
                  />
                  <View>
                    <Text style={styles.roomName}>{r.room_name}</Text>
                    <Text style={styles.roomStatus}>{r.status}</Text>
                  </View>
                </View>
                <View style={[styles.capacityBadge]}>
                  <Ionicons name="people-outline" size={12} color={ACCENT} />
                  <Text style={styles.capacityText}>{r.max_adults}A / {r.max_children}C</Text>
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={GRAY[400]}
                />
              </View>

              {isExpanded && (
                <View style={styles.expandedContent}>
                  <View style={styles.detailRow}>
                    <Detail icon="bed-outline" label="Type" value={r.room_type_id} />
                    <Detail icon="layers-outline" label="Floor" value={`Floor ${r.floor_number}`} />
                    <Detail icon="cash-outline" label="Rate" value={`$${r.base_rate}`} />
                  </View>

                  {r.amenities.length > 0 && (
                    <View style={styles.amenitiesRow}>
                      <Text style={styles.amenitiesLabel}>Amenities:</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {r.amenities.map((a, i) => (
                          <View key={i} style={styles.amenityChip}>
                            <Text style={styles.amenityText}>{a}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {guests.length > 0 && (
                    <View style={styles.guestSection}>
                      <Text style={styles.guestSectionTitle}>Current Guests</Text>
                      {guests.map(g => (
                        <View key={g.id} style={styles.guestRow}>
                          <View style={styles.guestAvatar}>
                            <Text style={styles.guestAvatarText}>{g.guest_name[0]}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.guestName}>{g.guest_name}</Text>
                            <Text style={styles.guestStay}>{g.check_in} → {g.check_out}</Text>
                          </View>
                          <Text style={styles.guestTotal}>${g.total}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {!isOccupied && guests.length === 0 && (
                    <Text style={styles.emptyGuest}>No guests currently</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

function Detail({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
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

const ACCENT = SRS.teal;

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 17, fontWeight: '700', color: GRAY[900] },
  sectionSub: { ...TYPOGRAPHY.small, color: GRAY[400], marginTop: 2 },

  roomCard: {
    backgroundColor: BG.white, borderRadius: RADIUS.card + 6, padding: 14,
    borderLeftWidth: 3, overflow: 'hidden',
    ...SHADOWS.card,
  },
  roomHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roomName: { fontSize: 15, fontWeight: '700', color: GRAY[900] },
  roomStatus: { fontSize: 11, color: GRAY[400], marginTop: 1 },
  capacityBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full,
    backgroundColor: BLUE.tint,
  },
  capacityText: { fontSize: 11, fontWeight: '600', color: ACCENT },

  expandedContent: { borderTopWidth: 1, borderTopColor: GRAY[100], marginTop: 12, paddingTop: 12, gap: 12 },
  detailRow: { flexDirection: 'row', gap: 16 },

  amenitiesRow: { gap: 6 },
  amenitiesLabel: { fontSize: 11, fontWeight: '600', color: GRAY[500], marginBottom: 4 },
  amenityChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, backgroundColor: GRAY[100] },
  amenityText: { fontSize: 11, color: SLATE[600] },

  guestSection: { gap: 8 },
  guestSectionTitle: { fontSize: 12, fontWeight: '700', color: GRAY[900] },
  guestRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: GRAY[100] },
  guestAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: BLUE.tint, alignItems: 'center', justifyContent: 'center' },
  guestAvatarText: { ...TYPOGRAPHY.small, fontWeight: '700', color: ACCENT },
  guestName: { fontSize: 13, fontWeight: '600', color: GRAY[900] },
  guestStay: { fontSize: 11, color: GRAY[400], marginTop: 1 },
  guestTotal: { fontSize: 13, fontWeight: '700', color: GRAY[900] },
  emptyGuest: { fontSize: 12, color: GRAY[400], textAlign: 'center', paddingVertical: 8 },
});
