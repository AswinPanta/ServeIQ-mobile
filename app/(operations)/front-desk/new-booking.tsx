import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { useFrontDesk } from '@/lib/context/frontdesk-context';
import { useBookingStore } from '@/stores/useBookingStore';
import { useFolioStore } from '@/stores/useFolioStore';
import { useGuestStore } from '@/stores/useGuestStore';
import { useActivityStore } from '@/stores/useActivityStore';

const ROOM_TYPES = [
  { id: 'Standard' as const, label: 'Standard', price: '₹2,499', desc: 'Comfortable single/double room' },
  { id: 'Deluxe' as const, label: 'Deluxe', price: '₹4,999', desc: 'Spacious with premium amenities' },
  { id: 'Suite' as const, label: 'Suite', price: '₹8,999', desc: 'Luxury suite with living area' },
];

const PAYMENT_METHODS = [
  { id: 'card', label: 'Card', icon: 'payment', color: SRS.teal },
  { id: 'cash', label: 'Cash', icon: 'wallet', color: SRS.green },
  { id: 'upi', label: 'UPI', icon: 'qr.code', color: '#8E44AD' },
  { id: 'wallet', label: 'Wallet', icon: 'wallet', color: SRS.orange },
];

export default function NewBookingScreen() {
  const [guestName, setGuestName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roomType, setRoomType] = useState('');
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const handleSubmit = () => {
    if (!guestName || !email || !phone || !roomType || !checkin || !checkout) {
      Alert.alert('Incomplete', 'Please fill in all required fields');
      return;
    }
    useFrontDesk().createBooking({
      guestName, email, phone, nationality: '',
      roomType: roomType as 'Standard' | 'Deluxe' | 'Suite',
      checkIn: checkin, checkOut: checkout,
      adults, children, specialRequests,
    });
    const newBooking = useBookingStore.getState().createBooking({
      guestName, email, phone, roomType, checkin, checkout, adults, children, specialRequests, paymentMethod,
    } as any);
    useFolioStore.getState().createFolio(newBooking.ref, guestName, 'TBD');
    useGuestStore.getState().addGuest({
      name: guestName, email, phone, nationality: '', documentType: 'Passport', documentNumber: '', notes: '',
    });
    useActivityStore.getState().addActivity({
      type: 'booking',
      title: `New booking — ${guestName}`,
      description: `${roomType} · ${checkin} → ${checkout}`,
      icon: '🔄',
      color: SRS.teal,
    });
    Alert.alert(
      'Booking Created',
      'Booking confirmed for ' + guestName + '\n' + roomType + '\n' + checkin + ' \u2192 ' + checkout + (paymentMethod ? '\nPayment: ' + paymentMethod.toUpperCase() : ''),
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <IconSymbol name="arrow.back" size={18} color={GRAY[500]} />
        </TouchableOpacity>
        <Text style={s.title}>New Booking</Text>
        <Text style={s.sub}>Walk-in or phone reservation</Text>
      </View>

      <View style={s.body}>
        {/* Guest Details */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <IconSymbol name="person.fill" size={16} color={SRS.navy} />
            <Text style={s.cardTitle}>Guest Details</Text>
          </View>
          <View style={{ gap: SPACING.md }}>
            {[
              { label: 'Full Name', val: guestName, set: setGuestName, placeholder: 'John Doe', required: true },
              { label: 'Email', val: email, set: setEmail, placeholder: 'john@email.com', keyboard: 'email-address' as const, required: true },
              { label: 'Phone', val: phone, set: setPhone, placeholder: '+1 234 567 890', keyboard: 'phone-pad' as const, required: true },
            ].map((f) => (
              <View key={f.label}>
                <Text style={s.fieldLabel}>{f.label}{f.required && <Text style={{ color: SRS.red }}> *</Text>}</Text>
                <TextInput
                  placeholder={f.placeholder} placeholderTextColor={GRAY[400]}
                  value={f.val} onChangeText={f.set}
                  keyboardType={f.keyboard || 'default'} autoCapitalize="none"
                  style={s.input}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Room Type */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <IconSymbol name="hotel" size={16} color={SRS.navy} />
            <Text style={s.cardTitle}>Room Type <Text style={{ color: SRS.red }}>*</Text></Text>
          </View>
          <View style={{ gap: SPACING.sm }}>
            {ROOM_TYPES.map((rt) => {
              const active = roomType === rt.id;
              return (
                <TouchableOpacity key={rt.id} onPress={() => setRoomType(rt.id)}
                  style={[s.roomOption, { backgroundColor: active ? SRS.teal + '08' : GRAY[50], borderColor: active ? SRS.teal : GRAY[200] }]}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[s.roomLabel, { color: active ? SRS.teal : SRS.navy }]}>{rt.label}</Text>
                    <Text style={s.roomDesc}>{rt.desc}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={s.roomPrice}>{rt.price}</Text>
                    <Text style={s.roomNight}>/night</Text>
                  </View>
                  {active && (
                    <View style={s.roomCheck}>
                      <IconSymbol name="check" size={12} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Stay Details */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <IconSymbol name="calendar" size={16} color={SRS.navy} />
            <Text style={s.cardTitle}>Stay Details</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            {[
              { label: 'Check-in', val: checkin, set: setCheckin },
              { label: 'Check-out', val: checkout, set: setCheckout },
            ].map((d) => (
              <View key={d.label} style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>{d.label} <Text style={{ color: SRS.red }}>*</Text></Text>
                <TextInput placeholder="YYYY-MM-DD" placeholderTextColor={GRAY[400]}
                  value={d.val} onChangeText={d.set} style={s.input}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Guests */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <IconSymbol name="group" size={16} color={SRS.navy} />
            <Text style={s.cardTitle}>Guests</Text>
          </View>
          <View style={{ gap: SPACING.md }}>
            {[
              { label: 'Adults', val: adults, set: setAdults, min: 1, max: 10 },
              { label: 'Children', val: children, set: setChildren, min: 0, max: 6 },
            ].map((item) => (
              <View key={item.label} style={s.guestCounter}>
                <Text style={{ ...TYPOGRAPHY.body, color: SRS.navy }}>{item.label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
                  <TouchableOpacity onPress={() => item.val > item.min && item.set(item.val - 1)}
                    style={[s.counterBtn, { opacity: item.val <= item.min ? 0.4 : 1 }]}
                    disabled={item.val <= item.min}
                  >
                    <IconSymbol name="minus" size={14} color={SRS.teal} />
                  </TouchableOpacity>
                  <Text style={s.counterVal}>{item.val}</Text>
                  <TouchableOpacity onPress={() => item.val < item.max && item.set(item.val + 1)}
                    style={[s.counterBtn, { opacity: item.val >= item.max ? 0.4 : 1 }]}
                    disabled={item.val >= item.max}
                  >
                    <IconSymbol name="add" size={14} color={SRS.teal} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Special Requests */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Special Requests</Text>
          <TextInput placeholder="Any special requests..." placeholderTextColor={GRAY[400]}
            value={specialRequests} onChangeText={setSpecialRequests}
            multiline numberOfLines={3}
            style={[s.input, { minHeight: 70, textAlignVertical: 'top' }]}
          />
        </View>

        {/* Payment Method */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <IconSymbol name="payment" size={16} color={SRS.navy} />
            <Text style={s.cardTitle}>Payment Method</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md }}>
            {PAYMENT_METHODS.map((pm) => (
              <TouchableOpacity key={pm.id} onPress={() => setPaymentMethod(pm.id)}
                style={[s.paymentBtn, { backgroundColor: paymentMethod === pm.id ? pm.color + '12' : GRAY[50], borderColor: paymentMethod === pm.id ? pm.color : GRAY[200] }]}
                activeOpacity={0.7}
              >
                <IconSymbol name={pm.icon as any} size={28} color={paymentMethod === pm.id ? pm.color : GRAY[500]} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: paymentMethod === pm.id ? pm.color : GRAY[600], marginTop: 4 }}>{pm.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity onPress={handleSubmit} style={s.submitBtn} activeOpacity={0.85}>
          <IconSymbol name="add" size={18} color="#FFF" />
          <Text style={s.submitText}>Create Booking</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.xs },
  backBtn: { width: 36, height: 36, borderRadius: RADIUS.card, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  title: { ...TYPOGRAPHY.h2, color: SRS.navy },
  sub: { ...TYPOGRAPHY.small, color: GRAY[500], marginTop: 2 },
  body: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xs, gap: SPACING.lg },
  card: { backgroundColor: '#FFF', borderRadius: RADIUS.card, padding: SPACING.lg, borderWidth: 1, borderColor: GRAY[100] },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  cardTitle: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy },
  fieldLabel: { ...TYPOGRAPHY.small, fontWeight: '600', color: SRS.navy, marginBottom: 4 },
  input: { backgroundColor: GRAY[50], borderWidth: 1, borderColor: GRAY[200], borderRadius: RADIUS.card, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: SRS.navy },
  roomOption: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.card, borderWidth: 1.5 },
  roomLabel: { ...TYPOGRAPHY.body, fontWeight: '700' },
  roomDesc: { ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: 1 },
  roomPrice: { fontSize: 14, fontWeight: '700', color: SRS.teal },
  roomNight: { ...TYPOGRAPHY.caption, color: GRAY[400] },
  roomCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: SRS.teal, alignItems: 'center', justifyContent: 'center', marginLeft: SPACING.md },
  guestCounter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counterBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: SRS.teal + '12', alignItems: 'center', justifyContent: 'center' },
  counterVal: { fontSize: 16, fontWeight: '700', color: SRS.navy, minWidth: 24, textAlign: 'center' },
  paymentBtn: { width: '47%', padding: SPACING.lg, borderRadius: RADIUS.card, alignItems: 'center', borderWidth: 2 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 16, borderRadius: RADIUS.card, backgroundColor: SRS.teal, ...SHADOWS.card },
  submitText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
