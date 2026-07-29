import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Alert, TextInput, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/use-colors';

interface BookingModifyModalProps {
  visible: boolean;
  onClose: () => void;
  booking: {
    id: string;
    hotelName: string;
    roomType: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    totalPrice: number;
  };
  onSave: (updatedBooking: any) => void;
}

export function BookingModifyModal({ visible, onClose, booking, onSave }: BookingModifyModalProps) {
  const colors = useColors();
  const [newCheckIn, setNewCheckIn] = useState(booking.checkIn);
  const [newCheckOut, setNewCheckOut] = useState(booking.checkOut);

  const newNights = Math.max(1, Math.ceil(
    (new Date(newCheckOut).getTime() - new Date(newCheckIn).getTime()) / (1000 * 60 * 60 * 24)
  ));
  const nightDifference = newNights - booking.nights;
  const pricePerNight = Math.round(booking.totalPrice / Math.max(booking.nights, 1));
  const priceDifference = nightDifference * pricePerNight;
  const newTotal = booking.totalPrice + priceDifference;

  const handleSave = () => {
    if (newNights < 1) {
      Alert.alert('Error', 'Check-out must be after check-in');
      return;
    }
    onSave({
      ...booking,
      checkIn: newCheckIn,
      checkOut: newCheckOut,
      nights: newNights,
      totalPrice: newTotal,
    });
    onClose();
    Alert.alert(
      'Booking Updated',
      priceDifference > 0
        ? `Additional charge: Rs ${priceDifference.toLocaleString()}`
        : priceDifference < 0
        ? `Refund: Rs ${Math.abs(priceDifference).toLocaleString()}`
        : 'No change in price'
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '80%' }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground, marginBottom: 20 }}>
            Modify Booking
          </Text>

          {/* Check-in Date Input */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 4 }}>Check-in Date (YYYY-MM-DD)</Text>
            <TextInput
              value={newCheckIn}
              onChangeText={setNewCheckIn}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, fontSize: 14 }}
            />
          </View>

          {/* Check-out Date Input */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 4 }}>Check-out Date (YYYY-MM-DD)</Text>
            <TextInput
              value={newCheckOut}
              onChangeText={setNewCheckOut}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, fontSize: 14 }}
            />
          </View>

          {/* Price Summary */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: colors.muted }}>Original Total</Text>
              <Text style={{ color: colors.foreground }}>Rs {booking.totalPrice.toLocaleString()}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: colors.muted }}>Nights: {booking.nights} → {newNights}</Text>
              <Text style={{ color: priceDifference >= 0 ? colors.foreground : colors.success }}>
                {priceDifference >= 0 ? '+' : ''} Rs {priceDifference.toLocaleString()}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '700', color: colors.foreground }}>New Total</Text>
              <Text style={{ fontWeight: '700', color: colors.foreground }}>Rs {newTotal.toLocaleString()}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
            >
              <Text style={{ fontWeight: '600', color: colors.foreground }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center' }}
            >
              <Text style={{ fontWeight: '600', color: 'white' }}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
