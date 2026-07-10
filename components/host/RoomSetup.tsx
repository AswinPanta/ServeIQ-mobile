import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { ImagePickerOverlay } from '@/components/host/ImagePickerOverlay';

const ACCENT = '#2563EB';

interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
  bedConfig: string;
  maxOccupancy: number;
  price: string;
  smoking: boolean;
  amenities: string[];
  photos: string[];
  cancellationPolicy: string;
}

interface Floor {
  id: string;
  name: string;
  rooms: Room[];
}

const ROOM_TYPES = ['Standard', 'Deluxe', 'Suite', 'Penthouse', 'Villa'];
const BED_OPTIONS = ['Single', 'Double', 'Twin', 'Queen', 'King'];
const ROOM_AMENITIES = ['WiFi', 'AC', 'TV', 'Balcony', 'Safe', 'Mini Bar'];
const CANCELLATION_POLICIES = ['Flexible', 'Moderate', 'Strict'];

interface RoomSetupProps {
  rooms: Floor[];
  onRoomsChange: (rooms: Floor[]) => void;
}

export function RoomSetup({ rooms, onRoomsChange }: RoomSetupProps) {
  const colors = useColors();
  const [photoPicker, setPhotoPicker] = useState<{ visible: boolean; floorId: string; roomId: string }>({ visible: false, floorId: '', roomId: '' });

  const addFloor = () => {
    const floorNum = rooms.length + 1;
    onRoomsChange([...rooms, {
      id: `floor-${Date.now()}`,
      name: `Floor ${floorNum}`,
      rooms: [],
    }]);
  };

  const updateFloorName = (floorId: string, name: string) => {
    onRoomsChange(rooms.map(f => f.id === floorId ? { ...f, name } : f));
  };

  const addRoom = (floorId: string) => {
    onRoomsChange(rooms.map(f => {
      if (f.id !== floorId) return f;
      const roomNum = f.rooms.length + 1;
      return {
        ...f,
        rooms: [...f.rooms, {
          id: `room-${Date.now()}`,
          roomNumber: `${roomNum}`,
          roomType: 'Standard',
          bedConfig: 'Double',
          maxOccupancy: 2,
          price: '',
          smoking: false,
          amenities: [],
          photos: [],
          cancellationPolicy: 'Flexible',
        }],
      };
    }));
  };

  const updateRoom = (floorId: string, roomId: string, updates: Partial<Room>) => {
    onRoomsChange(rooms.map(f => {
      if (f.id !== floorId) return f;
      return {
        ...f,
        rooms: f.rooms.map(r => r.id === roomId ? { ...r, ...updates } : r),
      };
    }));
  };

  const removeRoom = (floorId: string, roomId: string) => {
    onRoomsChange(rooms.map(f => {
      if (f.id !== floorId) return f;
      return { ...f, rooms: f.rooms.filter(r => r.id !== roomId) };
    }));
  };

  const removeFloor = (floorId: string) => {
    onRoomsChange(rooms.filter(f => f.id !== floorId));
  };

  const toggleRoomAmenity = (floorId: string, roomId: string, amenity: string) => {
    const floor = rooms.find(f => f.id === floorId);
    const room = floor?.rooms.find(r => r.id === roomId);
    if (!room) return;
    const amenities = room.amenities.includes(amenity)
      ? room.amenities.filter(a => a !== amenity)
      : [...room.amenities, amenity];
    updateRoom(floorId, roomId, { amenities });
  };

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-bold text-foreground">Room Configuration</Text>
        <TouchableOpacity onPress={addFloor}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12,
            backgroundColor: ACCENT + '12',
          }}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 16, color: ACCENT }}>+</Text>
          <Text className="text-sm font-bold" style={{ color: ACCENT }}>Add Floor</Text>
        </TouchableOpacity>
      </View>

      {rooms.length === 0 && (
        <View style={{ padding: 24, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' }}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>🏗️</Text>
          <Text className="text-base font-semibold text-muted text-center">No rooms configured yet</Text>
          <Text className="text-sm text-muted text-center mt-1">Add a floor and start adding rooms</Text>
        </View>
      )}

      {rooms.map((floor) => (
        <View key={floor.id} style={{ borderRadius: 16, backgroundColor: colors.surface, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
            backgroundColor: ACCENT + '08', borderBottomWidth: 1, borderBottomColor: colors.border,
          }}>
            <TextInput
              value={floor.name}
              onChangeText={(t) => updateFloorName(floor.id, t)}
              className="text-base font-bold text-foreground flex-1"
              placeholderTextColor={colors.muted}
            />
            <TouchableOpacity onPress={() => addRoom(floor.id)} style={{ padding: 12, marginRight: 8 }}>
              <Text style={{ fontSize: 18, color: ACCENT }}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeFloor(floor.id)}>
              <Text style={{ fontSize: 16, color: '#EF4444' }}>✕</Text>
            </TouchableOpacity>
          </View>

          {floor.rooms.map((room) => (
            <View key={room.id} style={{
              paddingHorizontal: 16, paddingVertical: 12,
              borderBottomWidth: 1, borderBottomColor: colors.border,
            }}>
              <View className="flex-row items-center gap-3 mb-2">
                <Text className="text-sm font-bold text-foreground w-12">Room</Text>
                <TextInput
                  value={room.roomNumber}
                  onChangeText={(t) => updateRoom(floor.id, room.id, { roomNumber: t })}
                  className="flex-1 text-sm text-foreground bg-background px-3 py-2 rounded-lg"
                  placeholderTextColor={colors.muted}
                  placeholder="#"
                />
                <TouchableOpacity onPress={() => removeRoom(floor.id, room.id)}>
                  <Text style={{ fontSize: 14, color: '#EF4444' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row gap-2 mb-2">
                <View className="flex-1">
                  <Text className="text-xs text-muted mb-1">Type</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {ROOM_TYPES.map((t) => (
                      <TouchableOpacity key={t} onPress={() => updateRoom(floor.id, room.id, { roomType: t })}
                        style={{
                          paddingHorizontal: 12, paddingVertical: 16, borderRadius: 8, marginRight: 4,
                          backgroundColor: room.roomType === t ? ACCENT : colors.border,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '600', color: room.roomType === t ? '#fff' : colors.foreground }}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View className="flex-row gap-2 items-center mb-2">
                <View className="flex-1">
                  <Text className="text-xs text-muted mb-1">Bed</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {BED_OPTIONS.map((b) => (
                      <TouchableOpacity key={b} onPress={() => updateRoom(floor.id, room.id, { bedConfig: b })}
                        style={{
                          paddingHorizontal: 12, paddingVertical: 16, borderRadius: 8, marginRight: 4,
                          backgroundColor: room.bedConfig === b ? ACCENT : colors.border,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '600', color: room.bedConfig === b ? '#fff' : colors.foreground }}>
                          {b}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View className="flex-row gap-3 items-center mb-2">
                <View className="flex-1">
                  <Text className="text-xs text-muted mb-1">Price/Night</Text>
                  <TextInput
                    value={room.price}
                    onChangeText={(t) => updateRoom(floor.id, room.id, { price: t.replace(/[^0-9]/g, '') })}
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                    className="text-sm text-foreground bg-background px-3 py-1.5 rounded-lg"
                  />
                </View>
                <View className="flex-row items-center gap-1">
                  {ROOM_AMENITIES.slice(0, 3).map((a) => (
                    <TouchableOpacity key={a} onPress={() => toggleRoomAmenity(floor.id, room.id, a)}
                      style={{
                        width: 44, height: 44, borderRadius: 8,
                        backgroundColor: room.amenities.includes(a) ? '#10B981' + '20' : colors.border,
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 12 }}>{a === 'WiFi' ? '📶' : a === 'AC' ? '❄️' : a === 'TV' ? '📺' : a}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text className="text-xs text-muted mb-1">Cancellation</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {CANCELLATION_POLICIES.map((p) => (
                    <TouchableOpacity key={p} onPress={() => updateRoom(floor.id, room.id, { cancellationPolicy: p })}
                      style={{
                        paddingHorizontal: 12, paddingVertical: 16, borderRadius: 8, marginRight: 4,
                        backgroundColor: room.cancellationPolicy === p ? ACCENT : colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '600', color: room.cancellationPolicy === p ? '#fff' : colors.foreground }}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Room Photos Section */}
              <View className="mt-2">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-xs text-muted">Photos</Text>
                  <Text className="text-[10px] text-muted">{room.photos.length} selected</Text>
                </View>
                <View className="flex-row flex-wrap gap-1.5">
                  {room.photos.slice(0, 4).map((uri, pIdx) => (
                    <View key={pIdx} style={{ width: '23%', aspectRatio: 4 / 3, borderRadius: 6, overflow: 'hidden', backgroundColor: colors.border }}>
                      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      <TouchableOpacity
                        onPress={() => {
                          const updated = room.photos.filter((_, i) => i !== pIdx);
                          updateRoom(floor.id, room.id, { photos: updated });
                        }}
                        style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(239,68,68,0.9)', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  {room.photos.length < 8 && (
                    <TouchableOpacity
                      onPress={() => setPhotoPicker({ visible: true, floorId: floor.id, roomId: room.id })}
                      style={{ width: '23%', aspectRatio: 4 / 3, borderRadius: 6, borderWidth: 1, borderColor: ACCENT + '40', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: ACCENT + '05' }}
                    >
                      <Text style={{ fontSize: 16 }}>+</Text>
                      <Text style={{ fontSize: 8, color: ACCENT, marginTop: 1 }}>Add</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))}

          {floor.rooms.length === 0 && (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text className="text-sm text-muted">No rooms on this floor. Tap + to add one.</Text>
            </View>
          )}
        </View>
      ))}

      <ImagePickerOverlay
        visible={photoPicker.visible}
        onClose={() => setPhotoPicker({ visible: false, floorId: '', roomId: '' })}
        onImagePicked={(uri) => {
          if (photoPicker.floorId && photoPicker.roomId) {
            const floor = rooms.find(f => f.id === photoPicker.floorId);
            const room = floor?.rooms.find(r => r.id === photoPicker.roomId);
            if (room) {
              updateRoom(photoPicker.floorId, photoPicker.roomId, {
                photos: [...room.photos, uri],
              });
            }
          }
        }}
      />
    </View>
  );
}
