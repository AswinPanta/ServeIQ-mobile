import React from 'react';
import { View, Text, Image, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScarcityBadge } from '@/components/feature/scarcity-badge';
import { FONTS } from '@/constants/portal-theme';
import type { Hotel } from '@/types/api';

const ACCENT = '#2E86AB';

interface RoomSelectionPanelProps {
  roomTypes: Hotel['roomTypes'];
  guestCount: number;
  selectedRoom: Hotel['roomTypes'][0] | null;
  onSelectRoom: (room: Hotel['roomTypes'][0]) => void;
  hotelCurrency: string;
  getAvailability: (name: string) => number;
}

export function RoomSelectionPanel({
  roomTypes,
  guestCount,
  selectedRoom,
  onSelectRoom,
  hotelCurrency,
  getAvailability,
}: RoomSelectionPanelProps) {
  const maxOccupancy = Math.max(...roomTypes.map((r: any) => r.occupancy));

  return (
    <View>
      <Text style={s.title}>Room Type</Text>
      {guestCount > maxOccupancy && (
        <View style={s.warningBox}>
          <Text style={s.warningText}>
            ⚠️ {guestCount} guests selected — some rooms may not fit. Consider adding another room.
          </Text>
        </View>
      )}
      <View style={s.list}>
        {roomTypes.map((room: any) => {
          const fitsGuests = room.occupancy >= guestCount;
          const isDisabled = !fitsGuests;
          return (
            <TouchableOpacity
              key={room.id}
              onPress={() => {
                if (isDisabled) {
                  Alert.alert('Room Too Small', `This room fits up to ${room.occupancy} guests.`);
                  return;
                }
                onSelectRoom(room);
              }}
              activeOpacity={isDisabled ? 0.6 : 0.8}
              style={[
                s.card,
                {
                  borderColor: selectedRoom?.id === room.id ? ACCENT : '#E2E8F0',
                  backgroundColor: selectedRoom?.id === room.id ? 'rgba(46,134,171,0.04)' : '#FFF',
                  opacity: isDisabled ? 0.55 : 1,
                },
              ]}
            >
              <Image source={{ uri: room.image }} style={s.cardImg} resizeMode="cover" />
              <View style={s.cardInfo}>
                <Text style={[s.cardName, isDisabled && { color: '#94A3B8' }]}>{room.name}</Text>
                <Text style={s.cardMeta}>{room.bed} · Up to {room.occupancy} guests</Text>
                {isDisabled && <Text style={s.disabledNote}>✕ Fits {room.occupancy} guests only</Text>}
                <Text style={s.cardPrice}>
                  {hotelCurrency} {room.price.toLocaleString()}
                  <Text style={s.perNight}>/night</Text>
                </Text>
                <ScarcityBadge count={getAvailability(room.name)} maxThreshold={3} position="relative" />
              </View>
              <View style={[
                s.radio,
                {
                  borderColor: selectedRoom?.id === room.id ? ACCENT : '#CBD5E1',
                  backgroundColor: selectedRoom?.id === room.id ? ACCENT : 'transparent',
                },
              ]}>
                {selectedRoom?.id === room.id && <IconSymbol name="check" size={10} color="#FFF" />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 14, fontWeight: '700', color: '#1A3C5E', marginBottom: 10, letterSpacing: -0.2, fontFamily: FONTS.sora },
  warningBox: {
    padding: 12, borderRadius: 10, backgroundColor: 'rgba(211, 84, 0, 0.08)',
    borderWidth: 1, borderColor: 'rgba(211, 84, 0, 0.2)', marginBottom: 12,
  },
  warningText: { fontSize: 11, color: '#D35400', fontWeight: '500', lineHeight: 16 },
  list: { gap: 12 },
  card: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1.5 },
  cardImg: { width: 72, height: 72, borderRadius: 10 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 13, fontWeight: '700', color: '#1A3C5E' },
  cardMeta: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  disabledNote: { fontSize: 10, color: '#D35400', fontWeight: '600', marginTop: 1 },
  cardPrice: { fontSize: 14, fontWeight: '700', color: ACCENT, marginTop: 4, fontFamily: FONTS.inter.bold },
  perNight: { fontSize: 10, fontWeight: '400', color: '#94A3B8' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
});
