import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { useHost } from '@/lib/context/host-context';
import { router } from 'expo-router';
import type { AdminRoomStatus } from '@/types/api';
import { BLUE, STATUS, AMBER, PURPLE, RED, GRAY, BG } from '@/lib/constants/figma-tokens';

const ACCENT = BLUE[600];
const STATUS_COLORS: Record<AdminRoomStatus, string> = {
  AVAILABLE: STATUS.activeGreen,
  OCCUPIED: AMBER[500],
  DIRTY: BLUE[500],
  CLEANING: BLUE[500],
  INSPECTED: PURPLE[500],
  MAINTENANCE: RED[500],
  BLOCKED: GRAY[500],
};
const STATUS_OPTIONS: AdminRoomStatus[] = [
  'AVAILABLE', 'OCCUPIED', 'DIRTY', 'CLEANING', 'INSPECTED', 'MAINTENANCE', 'BLOCKED',
];

function statusBadgeColor(status: AdminRoomStatus): string {
  return STATUS_COLORS[status] || GRAY[500];
}

export function HostRooms() {
  const colors = useColors();
  const {
    properties, roomTypes, activePropertyId,
    getFilteredRooms, updateRoomStatus,
  } = useHost();

  const [expandedFloors, setExpandedFloors] = useState<Set<number>>(new Set());
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());

  const activeProperty = properties.find(p => p.id === activePropertyId);
  const propRooms = activePropertyId ? getFilteredRooms(activePropertyId) : [];

  const sortedRooms = [...propRooms].sort((a, b) => {
    if (a.floor_number !== b.floor_number) return a.floor_number - b.floor_number;
    return a.room_name.localeCompare(b.room_name);
  });

  const floorMap = sortedRooms.reduce<Record<number, typeof sortedRooms>>((acc, room) => {
    if (!acc[room.floor_number]) acc[room.floor_number] = [];
    acc[room.floor_number].push(room);
    return acc;
  }, {});

  const floorNumbers = Object.keys(floorMap).map(Number).sort((a, b) => a - b);

  const totalRooms = propRooms.length;
  const available = propRooms.filter(r => r.status === 'AVAILABLE').length;
  const occupied = propRooms.filter(r => r.status === 'OCCUPIED').length;
  const maintenance = propRooms.filter(r => r.status === 'MAINTENANCE').length;

  const toggleFloor = (floor: number) => {
    setExpandedFloors(prev => {
      const next = new Set(prev);
      if (next.has(floor)) next.delete(floor);
      else next.add(floor);
      return next;
    });
  };

  const toggleRoom = (id: string) => {
    setExpandedRooms(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getRoomTypeName = (roomTypeId: string): string => {
    const rt = roomTypes.find(r => r.id === roomTypeId);
    return rt ? rt.room_type_name : 'Unknown';
  };

  const handleChangeStatus = (room: typeof sortedRooms[0]) => {
    Alert.alert(
      'Change Status',
      'Select new status for ' + room.room_name,
      [
        ...STATUS_OPTIONS.map(s => ({
          text: s.charAt(0) + s.slice(1).toLowerCase(),
          onPress: () => updateRoomStatus(room.id, s),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  };

  if (!activePropertyId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 16 }}>
        <Text style={{ fontSize: 16, color: colors.muted, textAlign: 'center' }}>Select a property to view rooms</Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} style={{ flex: 1, backgroundColor: colors.background }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color: colors.foreground }}>{activeProperty?.name || 'Rooms'}</Text>
      <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 16, marginTop: 2 }}>
        {activeProperty?.city}{activeProperty?.city && activeProperty?.country ? ', ' : ''}{activeProperty?.country}
      </Text>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
        {[
          { label: 'Total', value: totalRooms, color: ACCENT },
          { label: 'Available', value: available, color: STATUS.activeGreen },
          { label: 'Occupied', value: occupied, color: AMBER[500] },
          { label: 'Maint.', value: maintenance, color: RED[500] },
        ].map((item, i) => (
          <View key={i} style={{ flex: 1, padding: 12, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: item.color }}>{item.value}</Text>
            <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>{item.label}</Text>
          </View>
        ))}
      </View>

      {totalRooms === 0 && (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: colors.muted, textAlign: 'center', marginBottom: 8 }}>No rooms found for this property</Text>
          <TouchableOpacity
            style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: ACCENT }}
            onPress={() => router.push('/(host)/listing-wizard')}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: BG.white }}>Add Rooms</Text>
          </TouchableOpacity>
        </View>
      )}

      {floorNumbers.map(floor => {
        const isFloorExpanded = expandedFloors.has(floor);
        const roomsOnFloor = floorMap[floor];

        return (
          <View key={floor} style={{ marginBottom: 12, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: colors.background }}
              onPress={() => toggleFloor(floor)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>Floor {floor}</Text>
                <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: ACCENT + '20' }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: ACCENT }}>{roomsOnFloor.length} rooms</Text>
                </View>
              </View>
              <Text style={{ fontSize: 16, color: colors.muted }}>{isFloorExpanded ? 'v' : '>'}</Text>
            </TouchableOpacity>

            {isFloorExpanded && roomsOnFloor.map(room => {
              const isRoomExpanded = expandedRooms.has(room.id);
              const roomTypeName = getRoomTypeName(room.room_type_id);
              const statusColor = statusBadgeColor(room.status);

              return (
                <View key={room.id} style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                  <TouchableOpacity
                    style={{ padding: 14, flexDirection: 'row', alignItems: 'center' }}
                    onPress={() => toggleRoom(room.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>{room.room_name}</Text>
                        {room.smoking && <Text style={{ fontSize: 10, color: colors.muted }}>SMOKING</Text>}
                        {room.accessible && <Text style={{ fontSize: 10, color: colors.muted }}>ACCESSIBLE</Text>}
                      </View>
                      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                        {roomTypeName} · Floor {room.floor_number} · {room.max_adults} adults, {room.max_children} children
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: ACCENT, marginTop: 2 }}>
                        ${room.base_rate.toFixed(2)}
                      </Text>
                    </View>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: statusColor + '20', marginRight: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: statusColor }}>{room.status}</Text>
                    </View>
                    <Text style={{ fontSize: 14, color: colors.muted }}>{isRoomExpanded ? 'v' : '>'}</Text>
                  </TouchableOpacity>

                  {isRoomExpanded && (
                    <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 10 }}>
                      <View style={{ height: 1, backgroundColor: colors.border }} />

                      {room.amenities.length > 0 && (
                        <View>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 4 }}>AMENITIES</Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                            {room.amenities.map((a, i) => (
                              <View key={i} style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: ACCENT + '10' }}>
                                <Text style={{ fontSize: 11, color: ACCENT }}>{a}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      <View style={{ flexDirection: 'row', gap: 16 }}>
                        <View>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted }}>CANCELLATION</Text>
                          <Text style={{ fontSize: 13, color: colors.foreground, marginTop: 2 }}>{room.cancellation_policy}</Text>
                        </View>
                        {room.cancellation_notes && (
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted }}>NOTES</Text>
                            <Text style={{ fontSize: 13, color: colors.foreground, marginTop: 2 }}>{room.cancellation_notes}</Text>
                          </View>
                        )}
                      </View>

                      {room.blocked_dates.length > 0 && (
                        <View>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 4 }}>BLOCKED DATES</Text>
                          {room.blocked_dates.map((bd, i) => (
                            <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                              <Text style={{ fontSize: 12, color: RED[500] }}>{bd.start} - {bd.end}</Text>
                              <Text style={{ fontSize: 11, color: colors.muted }}>({bd.reason})</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      <TouchableOpacity
                        style={{ paddingVertical: 10, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center', marginTop: 4 }}
                        onPress={() => handleChangeStatus(room)}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: BG.white }}>Change Status</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}
