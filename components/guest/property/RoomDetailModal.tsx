import React from 'react';
import { View, Text, Image, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FONTS } from '@/constants/portal-theme';
import type { Hotel } from '@/types/api';

const ACCENT = '#2E86AB';

interface RoomDetailModalProps {
  visible: boolean;
  room: Hotel['roomTypes'][0] | null;
  hotelName: string;
  onClose: () => void;
}

export function RoomDetailModal({ visible, room, hotelName, onClose }: RoomDetailModalProps) {
  if (!room) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.container}>
          <View style={s.handle} />
          <Image source={{ uri: room.image }} style={s.image} resizeMode="cover" />
          <View style={s.body}>
            <View style={s.header}>
              <Text style={s.name}>{room.name}</Text>
              <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                <IconSymbol name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={s.meta}>{room.bed} · Up to {room.occupancy} guests</Text>
            <Text style={s.price}>
              {ACCENT} {room.price?.toLocaleString()}<Text style={s.perNight}>/night</Text>
            </Text>
            {room.description && (
              <Text style={s.desc}>{room.description}</Text>
            )}
            {room.amenities && room.amenities.length > 0 && (
              <View style={s.amenities}>
                {room.amenities.map((a: any) => (
                  <View key={a.name || a} style={s.amenityTag}>
                    <Text style={s.amenityText}>{a.name || a}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={s.selectBtn} activeOpacity={0.9}>
            <Text style={s.selectBtnText}>Select Room</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: {
    backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0',
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  image: { width: '100%', height: 200 },
  body: { padding: 16, gap: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: '700', color: '#1A3C5E', fontFamily: FONTS.playfairDisplay.bold, flex: 1 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  meta: { fontSize: 12, color: '#94A3B8' },
  price: { fontSize: 16, fontWeight: '700', color: ACCENT, fontFamily: FONTS.inter.bold },
  perNight: { fontSize: 12, fontWeight: '400', color: '#94A3B8' },
  desc: { fontSize: 13, color: '#64748B', lineHeight: 20, marginTop: 4 },
  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  amenityTag: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    backgroundColor: 'rgba(46,134,171,0.08)',
  },
  amenityText: { fontSize: 11, fontWeight: '500', color: '#1A3C5E' },
  selectBtn: {
    margin: 16, marginTop: 8, paddingVertical: 15, borderRadius: 12,
    backgroundColor: '#1A3C5E', alignItems: 'center',
    shadowColor: '#1A3C5E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  selectBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF', fontFamily: FONTS.inter.semiBold },
});
