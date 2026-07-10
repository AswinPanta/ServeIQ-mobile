import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator, StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { useBookings } from '@/lib/context/booking-context';
import { MOCK_PROPERTIES } from '@/lib/mock/properties';

type BookingStep = 'rooms' | 'guests' | 'addons' | 'review' | 'payment';

interface RoomOption {
  id: string; name: string; description: string; price: number;
  currency: string; capacity: number; amenities: string[]; image: string;
  gallery?: string[]; quantity: number; availableCount?: number;
}

interface AddOn { id: string; name: string; description: string; price: number; currency: string; selected: boolean; }

function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 1;
  return Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
}

const STEPS: { key: BookingStep; label: string; icon: string }[] = [
  { key: 'rooms', label: 'Rooms', icon: 'hotel' },
  { key: 'guests', label: 'Guests', icon: 'person.fill' },
  { key: 'addons', label: 'Add-ons', icon: 'add' },
  { key: 'review', label: 'Review', icon: 'check' },
  { key: 'payment', label: 'Payment', icon: 'payment' },
];

export default function BookingFlowScreen() {
  const params = useLocalSearchParams();
  const hotelName = (params.hotelName as string) || 'Hotel';
  const checkInDate = (params.checkIn as string) || '';
  const checkOutDate = (params.checkOut as string) || '';
  const guestCount = parseInt((params.guests as string) || '1', 10);
  const preselectedRoomId = params.roomId as string | undefined;
  const nights = useMemo(() => calculateNights(checkInDate, checkOutDate), [checkInDate, checkOutDate]);
  const initialStep: BookingStep = preselectedRoomId ? 'guests' : 'rooms';

  const [currentStep, setCurrentStep] = useState<BookingStep>(initialStep);
  const [selectedRooms, setSelectedRooms] = useState<RoomOption[]>([]);
  const [guestInfo, setGuestInfo] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [addOns, setAddOns] = useState<AddOn[]>([
    { id: 'breakfast', name: 'Breakfast Buffet', description: 'Daily breakfast for all guests', price: 1500, currency: 'NPR', selected: false },
    { id: 'airport-transfer', name: 'Airport Transfer', description: 'Round-trip airport pickup & drop', price: 3000, currency: 'NPR', selected: false },
    { id: 'early-checkin', name: 'Early Check-in', description: 'Check in from 10:00 AM', price: 1000, currency: 'NPR', selected: false },
    { id: 'late-checkout', name: 'Late Check-out', description: 'Check out by 4:00 PM', price: 1000, currency: 'NPR', selected: false },
    { id: 'dinner', name: 'Dinner Package', description: 'Set dinner per night', price: 2500, currency: 'NPR', selected: false },
    { id: 'spa', name: 'Spa Voucher', description: '60-min massage & spa', price: 4000, currency: 'NPR', selected: false },
  ]);
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet' | 'bank'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [activePhotoIndex, setActivePhotoIndex] = useState<Record<string, number>>({});
  const { addBooking } = useBookings();
  const matchedHotel = useMemo(() => MOCK_PROPERTIES.find(h => hotelName.includes(h.name) || h.name.includes(hotelName)), [hotelName]);

  const getAvailableCount = (roomTypeId: string, roomTypeName: string): number => {
    if (matchedHotel) {
      const mt = matchedHotel.roomTypes.find(r => r.id === roomTypeId || r.name === roomTypeName);
      if (mt && mt.available != null) return mt.available;
    }
    return 3;
  };

  const AVAILABLE_ROOMS: RoomOption[] = useMemo(() => {
    if (matchedHotel) {
      return matchedHotel.roomTypes.map(r => ({
        id: r.id, name: r.name, description: r.description, price: r.price,
        currency: r.currency, capacity: r.occupancy, amenities: r.amenities,
        image: r.image, gallery: r.gallery || [r.image], quantity: 0,
        availableCount: getAvailableCount(r.id, r.name),
      }));
    }
    return [
      { id: '1', name: 'Standard Room', description: 'Comfortable with modern amenities', price: 5000, currency: 'NPR', capacity: 2, amenities: ['WiFi', 'AC', 'TV'], image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400', quantity: 0, availableCount: 3 },
      { id: '2', name: 'Deluxe Room', description: 'Spacious with premium amenities', price: 8000, currency: 'NPR', capacity: 2, amenities: ['WiFi', 'AC', 'TV', 'Mini Bar'], image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400', quantity: 0, availableCount: 5 },
      { id: '3', name: 'Suite', description: 'Luxurious with separate living area', price: 12000, currency: 'NPR', capacity: 4, amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Balcony'], image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400', quantity: 0, availableCount: 1 },
    ];
  }, [matchedHotel, getAvailableCount]);

  useEffect(() => {
    if (preselectedRoomId && selectedRooms.length === 0) {
      const room = AVAILABLE_ROOMS.find(r => r.id === preselectedRoomId);
      if (room) setSelectedRooms([{ ...room, quantity: 1 }]);
    }
  }, [preselectedRoomId, AVAILABLE_ROOMS]);

  const handleRoomQuantityChange = (roomId: string, change: number) => {
    setSelectedRooms(prev => {
      const existing = prev.find(r => r.id === roomId);
      if (existing) {
        const q = existing.quantity + change;
        if (q <= 0) return prev.filter(r => r.id !== roomId);
        return prev.map(r => r.id === roomId ? { ...r, quantity: q } : r);
      } else if (change > 0) {
        const room = AVAILABLE_ROOMS.find(r => r.id === roomId);
        return [...prev, { ...room!, quantity: 1 }];
      }
      return prev;
    });
  };

  const toggleAddOn = (id: string) => setAddOns(prev => prev.map(a => a.id === id ? { ...a, selected: !a.selected } : a));

  const subtotal = useMemo(() => {
    const rooms = selectedRooms.reduce((s, r) => s + r.price * r.quantity * nights, 0);
    const extras = addOns.filter(a => a.selected).reduce((s, a) => s + (a.id === 'dinner' ? a.price * nights : a.price), 0);
    return rooms + extras;
  }, [selectedRooms, addOns, nights]);
  const tax = useMemo(() => Math.round(subtotal * 0.13), [subtotal]);
  const total = useMemo(() => Math.max(0, subtotal + tax - discountAmount), [subtotal, tax, discountAmount]);

  const detectCardType = (num: string) => {
    const c = num.replace(/\s/g, '');
    if (/^4/.test(c)) return 'Visa';
    if (/^5[1-5]/.test(c)) return 'Mastercard';
    if (/^3[47]/.test(c)) return 'Amex';
    return '';
  };
  const cardType = detectCardType(cardNumber);
  const formatCardNumber = (text: string) => text.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (text: string) => { const c = text.replace(/\D/g, '').slice(0, 4); return c.length > 2 ? c.slice(0, 2) + '/' + c.slice(2) : c; };

  const validateCard = (): boolean => {
    const e: Record<string, string> = {};
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.length < 13) e.cardNumber = 'Enter a valid card number';
    if (!cardExpiry.match(/^\d{2}\/\d{2}$/)) e.cardExpiry = 'Enter MM/YY';
    else { const [m, y] = cardExpiry.split('/').map(Number); if (m < 1 || m > 12 || new Date(2000 + y, m) < new Date()) e.cardExpiry = 'Card expired'; }
    const cvvLen = cardType === 'Amex' ? 4 : 3;
    if (cardCvv.length !== cvvLen || !/^\d+$/.test(cardCvv)) e.cardCvv = `CVV must be ${cvvLen} digits`;
    if (!cardName.trim()) e.cardName = 'Name is required';
    setCardErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCompleteBooking = async () => {
    if (paymentMethod === 'card' && !validateCard()) return;
    setIsSubmitting(true);
    try {
      addBooking({
        hotelId: parseInt(matchedHotel?.id || '0'), hotelName,
        hotelCity: matchedHotel?.city || '', hotelCountry: matchedHotel?.country || '',
        hotelImage: matchedHotel?.images?.[0] || '',
        checkIn: checkInDate, checkOut: checkOutDate,
        roomTypeName: selectedRooms.map(r => r.name).join(', '),
        guests: guestCount, totalPrice: total,
      });
      router.push({
        pathname: '/booking-confirmation',
        params: {
          bookingId: 'BK' + Date.now(), hotelName,
          checkIn: checkInDate, checkOut: checkOutDate,
          nights: String(nights), guests: String(guestCount),
          rooms: selectedRooms.map(r => `${r.name} x${r.quantity}`).join(', '),
          subtotal: String(subtotal), tax: String(tax),
          discount: String(discountAmount), total: String(total),
        },
      });
    } catch (error) {
      Alert.alert('Booking Failed', 'An unexpected error occurred');
    } finally { setIsSubmitting(false); }
  };

  const currentIdx = STEPS.findIndex(s => s.key === currentStep);

  const renderStepIndicator = () => (
    <View style={s.stepBar}>
      {STEPS.map((step, i) => (
        <React.Fragment key={step.key}>
          <View style={[s.stepDot, { backgroundColor: i <= currentIdx ? SRS.teal : GRAY[200] }]}>
            <IconSymbol name={step.icon as any} size={12} color="#FFF" />
          </View>
          {i < STEPS.length - 1 && <View style={[s.stepLine, { backgroundColor: i < currentIdx ? SRS.teal : GRAY[200] }]} />}
        </React.Fragment>
      ))}
    </View>
  );

  const renderRooms = () => (
    <View style={{ gap: SPACING.lg }}>
      <Text style={s.sectionTitle}>Select Your Rooms</Text>
      {checkInDate && checkOutDate && (
        <View style={s.dateStrip}>
          <View><Text style={s.dateStripLabel}>Check-in</Text><Text style={s.dateStripVal}>{checkInDate}</Text></View>
          <View style={{ alignItems: 'center' }}><Text style={s.dateStripLabel}>{nights} night{nights > 1 ? 's' : ''}</Text><IconSymbol name="arrow.forward" size={16} color={SRS.teal} /></View>
          <View style={{ alignItems: 'flex-end' }}><Text style={s.dateStripLabel}>Check-out</Text><Text style={s.dateStripVal}>{checkOutDate}</Text></View>
        </View>
      )}
      {AVAILABLE_ROOMS.map(room => (
        <View key={room.id} style={s.roomCard}>
          <Image source={{ uri: room.image }} style={s.roomImage} resizeMode="cover" />
          {room.availableCount !== undefined && room.availableCount <= 3 && (
            <View style={s.scarcityBadge}>
              <IconSymbol name="alarm" size={10} color="#FFF" />
              <Text style={s.scarcityText}>Only {room.availableCount} left</Text>
            </View>
          )}
          <View style={s.roomBody}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={s.roomName}>{room.name}</Text>
              <Text style={s.roomPrice}>{room.currency} {room.price.toLocaleString()}<Text style={s.perNight}>/night</Text></Text>
            </View>
            <Text style={s.roomDesc}>{room.description}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: SPACING.sm }}>
              {room.amenities.slice(0, 3).map((a, i) => (
                <View key={i} style={s.amenityChip}><Text style={s.amenityText}>{a}</Text></View>
              ))}
            </View>
            <View style={s.roomCounter}>
              <Text style={{ ...TYPOGRAPHY.small, color: GRAY[500] }}>
                {selectedRooms.find(r => r.id === room.id)?.quantity || 0} selected
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
                <TouchableOpacity onPress={() => handleRoomQuantityChange(room.id, -1)} style={s.counterCircle}>
                  <IconSymbol name="minus" size={14} color={SRS.navy} />
                </TouchableOpacity>
                <Text style={s.counterVal}>{selectedRooms.find(r => r.id === room.id)?.quantity || 0}</Text>
                <TouchableOpacity onPress={() => handleRoomQuantityChange(room.id, 1)} style={s.counterCircle}>
                  <IconSymbol name="add" size={14} color={SRS.navy} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderGuests = () => (
    <View style={{ gap: SPACING.lg }}>
      <Text style={s.sectionTitle}>Guest Information</Text>
      {[
        { label: 'First Name', val: guestInfo.firstName, set: (t: string) => setGuestInfo({ ...guestInfo, firstName: t }), icon: 'person.fill' as const },
        { label: 'Last Name', val: guestInfo.lastName, set: (t: string) => setGuestInfo({ ...guestInfo, lastName: t }), icon: 'person.fill' as const },
        { label: 'Email', val: guestInfo.email, set: (t: string) => setGuestInfo({ ...guestInfo, email: t }), icon: 'email' as const, keyboard: 'email-address' as const },
        { label: 'Phone', val: guestInfo.phone, set: (t: string) => setGuestInfo({ ...guestInfo, phone: t }), icon: 'phone' as const, keyboard: 'phone-pad' as const },
      ].map(f => (
        <View key={f.label}>
          <Text style={s.fieldLabel}>{f.label} <Text style={{ color: SRS.red }}>*</Text></Text>
          <View style={s.inputRow}>
            <IconSymbol name={f.icon} size={16} color={GRAY[400]} style={{ marginRight: SPACING.sm }} />
            <TextInput
              placeholder={`Enter ${f.label.toLowerCase()}`} placeholderTextColor={GRAY[400]}
              value={f.val} onChangeText={f.set}
              keyboardType={(f as any).keyboard || 'default'} autoCapitalize="none"
              style={s.input}
            />
          </View>
        </View>
      ))}
    </View>
  );

  const renderAddOnsSection = () => (
    <View style={{ gap: SPACING.lg }}>
      <View>
        <Text style={s.sectionTitle}>Enhance Your Stay</Text>
        <Text style={{ ...TYPOGRAPHY.body, color: GRAY[500], marginTop: 2 }}>Add extras to make your stay more comfortable</Text>
      </View>
      {addOns.map(addOn => (
        <TouchableOpacity key={addOn.id} onPress={() => toggleAddOn(addOn.id)}
          style={[s.addonCard, { borderColor: addOn.selected ? SRS.teal : GRAY[200], backgroundColor: addOn.selected ? SRS.teal + '08' : '#FFF' }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[s.addonName, { color: addOn.selected ? SRS.teal : SRS.navy }]}>{addOn.name}</Text>
            <Text style={s.addonDesc}>{addOn.description}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', marginRight: SPACING.md }}>
            <Text style={[s.addonPrice, { color: addOn.selected ? SRS.teal : SRS.navy }]}>
              {addOn.currency} {addOn.price.toLocaleString()}
            </Text>
            {addOn.id === 'dinner' && <Text style={s.perNightSmall}>/night</Text>}
          </View>
          <View style={[s.addonCheck, { borderColor: addOn.selected ? SRS.teal : GRAY[300], backgroundColor: addOn.selected ? SRS.teal : 'transparent' }]}>
            {addOn.selected && <IconSymbol name="check" size={10} color="#FFF" />}
          </View>
        </TouchableOpacity>
      ))}
      <View>
        <Text style={s.fieldLabel}>Special Requests</Text>
        <TextInput
          placeholder="Any special requests..." placeholderTextColor={GRAY[400]}
          value={specialRequests} onChangeText={setSpecialRequests}
          multiline numberOfLines={3}
          style={[s.input, { minHeight: 72, textAlignVertical: 'top', marginTop: SPACING.xs }]}
        />
      </View>
    </View>
  );

  const renderReview = () => (
    <View style={{ gap: SPACING.lg }}>
      <Text style={s.sectionTitle}>Review Your Booking</Text>

      <View style={s.reviewCard}>
        <Text style={s.reviewHotelName}>{hotelName}</Text>
        <View style={s.reviewRow}><Text style={s.reviewLabel}>Check-in</Text><Text style={s.reviewVal}>{checkInDate}</Text></View>
        <View style={s.reviewRow}><Text style={s.reviewLabel}>Check-out</Text><Text style={s.reviewVal}>{checkOutDate}</Text></View>
        <View style={s.reviewRow}><Text style={s.reviewLabel}>Duration</Text><Text style={s.reviewVal}>{nights} night{nights > 1 ? 's' : ''}</Text></View>
      </View>

      {selectedRooms.map(room => (
        <View key={room.id} style={s.reviewCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
            <Image source={{ uri: room.image }} style={{ width: 56, height: 42, borderRadius: RADIUS.button }} resizeMode="cover" />
            <View style={{ flex: 1 }}>
              <Text style={s.reviewRoomName}>{room.name}</Text>
              <Text style={s.reviewMeta}>{room.currency} {room.price.toLocaleString()} × {nights} nights × {room.quantity}</Text>
            </View>
            <Text style={s.reviewRoomTotal}>{room.currency} {(room.price * nights * room.quantity).toLocaleString()}</Text>
          </View>
        </View>
      ))}

      {addOns.filter(a => a.selected).length > 0 && (
        <View style={s.reviewCard}>
          <Text style={{ ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy, marginBottom: SPACING.sm }}>Add-ons</Text>
          {addOns.filter(a => a.selected).map(a => (
            <View key={a.id} style={s.reviewRow}>
              <Text style={s.reviewLabel}>{a.name}</Text>
              <Text style={[s.reviewVal, { color: SRS.teal }]}>{a.currency} {(a.id === 'dinner' ? a.price * nights : a.price).toLocaleString()}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={s.reviewCard}>
        <Text style={{ ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy, marginBottom: SPACING.sm }}>Guest</Text>
        <Text style={{ ...TYPOGRAPHY.body, color: SRS.navy }}>{guestInfo.firstName} {guestInfo.lastName}</Text>
        <Text style={{ ...TYPOGRAPHY.caption, color: GRAY[500] }}>{guestInfo.email} · {guestInfo.phone}</Text>
      </View>

      {/* Price Summary */}
      <View style={s.priceCard}>
        <View style={s.priceRow}><Text style={s.priceLabel}>Subtotal</Text><Text style={s.priceVal}>NPR {subtotal.toLocaleString()}</Text></View>
        <View style={s.priceRow}><Text style={s.priceLabel}>Taxes & Fees (13%)</Text><Text style={s.priceVal}>NPR {tax.toLocaleString()}</Text></View>
        {discountAmount > 0 && (
          <View style={s.priceRow}><Text style={[s.priceLabel, { color: SRS.green }]}>Discount</Text><Text style={[s.priceVal, { color: SRS.green }]}>-NPR {discountAmount.toLocaleString()}</Text></View>
        )}
        <View style={[s.priceRow, s.priceTotalRow]}><Text style={s.priceTotalLabel}>Total</Text><Text style={s.priceTotalVal}>NPR {total.toLocaleString()}</Text></View>
      </View>
    </View>
  );

  const renderPayment = () => (
    <View style={{ gap: SPACING.lg }}>
      <Text style={s.sectionTitle}>Payment Method</Text>
      {[
        { id: 'card' as const, label: 'Credit/Debit Card', icon: 'payment' as const },
        { id: 'wallet' as const, label: 'Digital Wallet', icon: 'wallet' as const },
        { id: 'bank' as const, label: 'Bank Transfer', icon: 'business' as const },
      ].map(opt => (
        <TouchableOpacity key={opt.id} onPress={() => setPaymentMethod(opt.id)}
          style={[s.paymentOption, { borderColor: paymentMethod === opt.id ? SRS.teal : GRAY[200], backgroundColor: paymentMethod === opt.id ? SRS.teal + '08' : '#FFF' }]}
        >
          <View style={[s.radioCircle, { borderColor: paymentMethod === opt.id ? SRS.teal : GRAY[300], backgroundColor: paymentMethod === opt.id ? SRS.teal : 'transparent' }]}>
            {paymentMethod === opt.id && <IconSymbol name="check" size={10} color="#FFF" />}
          </View>
          <IconSymbol name={opt.icon} size={22} color={paymentMethod === opt.id ? SRS.teal : GRAY[500]} />
          <Text style={[s.paymentLabel, { color: paymentMethod === opt.id ? SRS.teal : SRS.navy }]}>{opt.label}</Text>
        </TouchableOpacity>
      ))}

      {paymentMethod === 'card' && (
        <View style={s.cardForm}>
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={s.fieldLabel}>Card Number</Text>
              {cardType && <Text style={{ ...TYPOGRAPHY.caption, fontWeight: '600', color: SRS.teal }}>{cardType}</Text>}
            </View>
            <View style={[s.inputRow, { borderColor: cardErrors.cardNumber ? SRS.red : GRAY[200] }]}>
              <TextInput value={cardNumber} onChangeText={(t) => { setCardNumber(formatCardNumber(t)); setCardErrors(p => ({ ...p, cardNumber: '' })); }}
                placeholder="1234 5678 9012 3456" placeholderTextColor={GRAY[400]} keyboardType="number-pad" maxLength={19} style={s.input}
              />
              <IconSymbol name="payment" size={20} color={GRAY[400]} />
            </View>
            {cardErrors.cardNumber && <Text style={s.errorText}>{cardErrors.cardNumber}</Text>}
          </View>
          <View>
            <Text style={s.fieldLabel}>Cardholder Name</Text>
            <View style={[s.inputRow, { borderColor: cardErrors.cardName ? SRS.red : GRAY[200] }]}>
              <TextInput value={cardName} onChangeText={(t) => { setCardName(t); setCardErrors(p => ({ ...p, cardName: '' })); }}
                placeholder="John Doe" placeholderTextColor={GRAY[400]} autoCapitalize="words" style={s.input}
              />
            </View>
            {cardErrors.cardName && <Text style={s.errorText}>{cardErrors.cardName}</Text>}
          </View>
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            {[
              { label: 'Expiry', val: cardExpiry, set: setCardExpiry, key: 'cardExpiry', placeholder: 'MM/YY' },
              { label: 'CVV', val: cardCvv, set: setCardCvv, key: 'cardCvv', placeholder: cardType === 'Amex' ? '1234' : '123' },
            ].map(f => (
              <View key={f.key} style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>{f.label}</Text>
                <View style={[s.inputRow, { borderColor: (cardErrors as any)[f.key] ? SRS.red : GRAY[200] }]}>
                  <TextInput value={f.val}
                    onChangeText={(t) => { const cleaned = t.replace(/\D/g, ''); f.set(f.key === 'cardExpiry' ? formatExpiry(cleaned) : cleaned.slice(0, f.key === 'cardCvv' && cardType === 'Amex' ? 4 : 3)); setCardErrors(p => ({ ...p, [f.key]: '' })); }}
                    placeholder={f.placeholder} placeholderTextColor={GRAY[400]} keyboardType="number-pad" maxLength={f.key === 'cardExpiry' ? 5 : 4}
                    secureTextEntry={f.key === 'cardCvv'} style={s.input}
                  />
                </View>
                {(cardErrors as any)[f.key] && <Text style={s.errorText}>{(cardErrors as any)[f.key]}</Text>}
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={s.termsBox}>
        <IconSymbol name="lock" size={14} color={GRAY[400]} />
        <Text style={s.termsText}>By confirming, you agree to our Terms & Conditions and Privacy Policy</Text>
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <IconSymbol name="close" size={18} color={SRS.navy} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Booking</Text>
        <Text style={s.headerStep}>{currentIdx + 1}/{STEPS.length}</Text>
      </View>

      {/* Step Indicator */}
      <View style={s.stepContainer}>{renderStepIndicator()}</View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.lg, paddingBottom: 200 }}>
        {currentStep === 'rooms' && renderRooms()}
        {currentStep === 'guests' && renderGuests()}
        {currentStep === 'addons' && renderAddOnsSection()}
        {currentStep === 'review' && renderReview()}
        {currentStep === 'payment' && renderPayment()}
      </ScrollView>

      {/* Bottom Bar */}
      <View style={s.bottomBar}>
        {selectedRooms.length > 0 && (
          <View style={s.priceBar}>
            <Text style={{ ...TYPOGRAPHY.caption, color: GRAY[500] }}>Total</Text>
            <Text style={s.priceBarTotal}>NPR {total.toLocaleString()}</Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', gap: SPACING.md }}>
          {currentIdx > 0 ? (
            <TouchableOpacity onPress={() => setCurrentStep(STEPS[currentIdx - 1].key)} style={s.navBack}>
              <Text style={s.navBackText}>Back</Text>
            </TouchableOpacity>
          ) : <View style={{ flex: 1 }} />}
          <TouchableOpacity
            onPress={currentStep === 'payment' ? handleCompleteBooking : () => setCurrentStep(STEPS[currentIdx + 1].key)}
            style={[s.navNext, { backgroundColor: currentStep === 'payment' ? SRS.green : SRS.navy }]}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <IconSymbol name={currentStep === 'payment' ? 'check' : 'arrow.forward'} size={16} color="#FFF" />
                <Text style={s.navNextText}>
                  {currentStep === 'payment' ? 'Complete Booking' : 'Continue'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.sm, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: GRAY[100] },
  backBtn: { width: 36, height: 36, borderRadius: RADIUS.card, backgroundColor: GRAY[50], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TYPOGRAPHY.h3, color: SRS.navy },
  headerStep: { ...TYPOGRAPHY.small, color: GRAY[500], fontWeight: '600' },
  stepContainer: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: '#FFF' },
  stepBar: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepLine: { flex: 1, height: 3, borderRadius: 2 },
  sectionTitle: { ...TYPOGRAPHY.h3, color: SRS.navy },
  dateStrip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.card, backgroundColor: SRS.teal + '08', borderWidth: 1, borderColor: SRS.teal + '18' },
  dateStripLabel: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  dateStripVal: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy },
  roomCard: { borderRadius: RADIUS.card, backgroundColor: '#FFF', borderWidth: 1, borderColor: GRAY[100], overflow: 'hidden' },
  roomImage: { width: '100%', height: 160 },
  scarcityBadge: { position: 'absolute', top: SPACING.md, right: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: SRS.orange },
  scarcityText: { fontSize: 11, fontWeight: '600', color: '#FFF' },
  roomBody: { padding: SPACING.lg, gap: SPACING.sm },
  roomName: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy },
  roomPrice: { fontSize: 16, fontWeight: '700', color: SRS.teal },
  perNight: { fontSize: 11, fontWeight: '400', color: GRAY[400] },
  roomDesc: { ...TYPOGRAPHY.body, color: GRAY[500] },
  amenityChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.badge, backgroundColor: SRS.teal + '10' },
  amenityText: { fontSize: 11, fontWeight: '500', color: SRS.teal },
  roomCounter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: GRAY[50] },
  counterCircle: { width: 36, height: 36, borderRadius: RADIUS.card, backgroundColor: SRS.teal + '12', alignItems: 'center', justifyContent: 'center' },
  counterVal: { fontSize: 18, fontWeight: '700', color: SRS.navy, minWidth: 28, textAlign: 'center' },
  fieldLabel: { ...TYPOGRAPHY.small, fontWeight: '600', color: SRS.navy, marginBottom: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: GRAY[200], borderRadius: RADIUS.card, paddingHorizontal: 14, paddingVertical: 2 },
  input: { flex: 1, fontSize: 14, color: SRS.navy, paddingVertical: 10 },
  errorText: { ...TYPOGRAPHY.caption, color: SRS.red, marginTop: 2 },
  addonCard: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.card, borderWidth: 1.5 },
  addonName: { ...TYPOGRAPHY.body, fontWeight: '600' },
  addonDesc: { ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: 1 },
  addonPrice: { fontSize: 14, fontWeight: '700' },
  perNightSmall: { ...TYPOGRAPHY.caption, color: GRAY[400] },
  addonCheck: { width: 22, height: 22, borderRadius: RADIUS.card, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  reviewCard: { padding: SPACING.md, borderRadius: RADIUS.card, backgroundColor: '#FFF', borderWidth: 1, borderColor: GRAY[100], gap: 4 },
  reviewHotelName: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy, marginBottom: SPACING.sm },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  reviewLabel: { ...TYPOGRAPHY.small, color: GRAY[500] },
  reviewVal: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy },
  reviewRoomName: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy },
  reviewMeta: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  reviewRoomTotal: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.teal },
  priceCard: { padding: SPACING.lg, borderRadius: RADIUS.card, backgroundColor: SRS.teal + '08', borderWidth: 1, borderColor: SRS.teal + '18', gap: SPACING.sm },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceLabel: { ...TYPOGRAPHY.body, color: GRAY[600] },
  priceVal: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy },
  priceTotalRow: { borderTopWidth: 1, borderTopColor: SRS.teal + '25', paddingTop: SPACING.sm, marginTop: SPACING.xs },
  priceTotalLabel: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy },
  priceTotalVal: { ...TYPOGRAPHY.h3, fontWeight: '700', color: SRS.teal },
  paymentOption: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.card, borderWidth: 1.5 },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  paymentLabel: { ...TYPOGRAPHY.body, fontWeight: '600' },
  cardForm: { gap: SPACING.md },
  termsBox: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md, borderRadius: RADIUS.card, backgroundColor: GRAY[100] },
  termsText: { ...TYPOGRAPHY.caption, color: GRAY[500], flex: 1 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.lg, paddingBottom: 40, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: GRAY[100], gap: SPACING.md },
  priceBar: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  priceBarTotal: { ...TYPOGRAPHY.h2, fontWeight: '700', color: SRS.teal },
  navBack: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.card, alignItems: 'center', backgroundColor: GRAY[100] },
  navBackText: { fontSize: 14, fontWeight: '600', color: GRAY[600] },
  navNext: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 14, borderRadius: RADIUS.card },
  navNextText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
