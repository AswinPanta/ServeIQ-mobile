import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator, StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useBookings } from '@/lib/context/booking-context';
import { MOCK_PROPERTIES } from '@/lib/mock/properties';
import { DiscountCodeInput } from '@/components/feature/discount-code-input';
import { CheckoutTimer } from '@/components/feature/checkout-timer';
import { useCRM } from '@/lib/context/crm-context';
import { useAuth } from '@/lib/context/auth-context';
import type { GuestProfile } from '@/types/api';
import { safeGoBack, bridgeGuestBookingToFrontDesk, DEFAULT_BRIDGE_PROPERTY_ID } from "@/lib/utils";
import { FONTS, GRAY } from '@/constants/portal-theme';
import { BRAND, TEXT, BG, BORDER, UI, SLATE } from '@/lib/constants/figma-tokens';
import { bookingApi } from '@/lib/api/booking-api';
import { searchHotelsApi, getAvailableRoomsApi } from '@/lib/api';
import { useRazorpay } from '@/lib/razorpay/use-razorpay';

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

const STEPS: { key: BookingStep; label: string }[] = [
  { key: 'rooms', label: 'Rooms' },
  { key: 'guests', label: 'Guests' },
  { key: 'addons', label: 'Add-ons' },
  { key: 'review', label: 'Review' },
  { key: 'payment', label: 'Payment' },
];

const ACCENT = BRAND.teal;

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
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet' | 'bank' | 'razorpay'>('card');
  const [razorpaySubMethod, setRazorpaySubMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedDiscountCode, setAppliedDiscountCode] = useState<string | null>(null);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'free_night'>('fixed');
  const [timerExpired, setTimerExpired] = useState(false);
  const [guestErrors, setGuestErrors] = useState<Record<string, string>>({});
  const [apiRooms, setApiRooms] = useState<RoomOption[] | null>(null);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  const { user } = useAuth();
  const guestUser = user as GuestProfile | null;
  const { addBooking } = useBookings();
  const { earnPoints, recordStay } = useCRM();
  const { openCheckout } = useRazorpay();
  const matchedHotel = useMemo(() => MOCK_PROPERTIES.find(h => hotelName.includes(h.name) || h.name.includes(hotelName)), [hotelName]);

  const getAvailableCount = useCallback((roomTypeId: string, roomTypeName: string): number => {
    if (matchedHotel) {
      const mt = matchedHotel.roomTypes.find(r => r.id === roomTypeId || r.name === roomTypeName);
      if (mt && mt.available != null) return mt.available;
    }
    return 3;
  }, [matchedHotel]);

  const AVAILABLE_ROOMS: RoomOption[] = useMemo(() => {
    if (apiRooms) return apiRooms;
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
  }, [matchedHotel, getAvailableCount, apiRooms]);

  // Fetch real available rooms from backend
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const searchResult = await searchHotelsApi({ destination: hotelName, limit: 5 });
        const match = searchResult.hotels.find(h =>
          h.name.toLowerCase().includes(hotelName.toLowerCase()) ||
          hotelName.toLowerCase().includes(h.name.toLowerCase())
        );
        if (cancelled) return;
        if (match && checkInDate && checkOutDate) {
          const rooms = await getAvailableRoomsApi(match.id, checkInDate, checkOutDate);
          if (cancelled) return;
          if (rooms.length > 0) {
            setApiRooms(rooms.map(r => ({
              id: r.id,
              name: r.room_name,
              description: '',
              price: parseFloat(r.base_rate) || 0,
              currency: 'NPR',
              capacity: r.max_adults,
              amenities: [],
              image: r.photos?.cover || '',
              gallery: r.photos?.gallery || [],
              quantity: 0,
              availableCount: 1,
            })));
          }
        }
      } catch {
        // fall back to mock
      } finally {
        if (!cancelled) setIsLoadingRooms(false);
      }
    })();
    return () => { cancelled = true; };
  }, [hotelName, checkInDate, checkOutDate]);

  useEffect(() => {
    if (preselectedRoomId && selectedRooms.length === 0) {
      const room = (apiRooms || AVAILABLE_ROOMS).find(r => r.id === preselectedRoomId);
      if (room) {
        const timeout = setTimeout(() => setSelectedRooms([{ ...room, quantity: 1 }]), 0);
        return () => clearTimeout(timeout);
      }
    }
  }, [preselectedRoomId, AVAILABLE_ROOMS, apiRooms]);

  // Validate guest information before proceeding
  const validateGuestInfo = (): boolean => {
    const errors: Record<string, string> = {};
    if (!guestInfo.firstName.trim()) errors.firstName = 'First name is required';
    if (!guestInfo.lastName.trim()) errors.lastName = 'Last name is required';
    if (!guestInfo.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email)) errors.email = 'Enter a valid email';
    if (!guestInfo.phone.trim()) errors.phone = 'Phone is required';
    else if (!/^[\d\s+()-]{7,}$/.test(guestInfo.phone)) errors.phone = 'Enter a valid phone number';
    setGuestErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle step advancement with validation
  const handleStepNext = (nextStep: BookingStep) => {
    if (currentStep === 'guests' && !validateGuestInfo()) return;
    if (currentStep === 'rooms' && selectedRooms.length === 0) {
      Alert.alert('Select Rooms', 'Please select at least one room');
      return;
    }
    if (timerExpired) {
      Alert.alert('Session Expired', 'Your room hold has expired. Please start over.');
      return;
    }
    setCurrentStep(nextStep);
  };

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
    const roomsCost = selectedRooms.reduce((s, r) => s + r.price * r.quantity * nights, 0);
    const extrasCost = addOns.filter(a => a.selected).reduce((s, a) => s + (a.id === 'dinner' ? a.price * nights : a.price), 0);
    return roomsCost + extrasCost;
  }, [selectedRooms, addOns, nights]);
  const tax = useMemo(() => Math.round(subtotal * 0.13), [subtotal]);
  const total = useMemo(() => Math.max(0, subtotal + tax - discountAmount), [subtotal, tax, discountAmount]);

  const cardType = useMemo(() => {
    const c = cardNumber.replace(/\s/g, '');
    if (/^4/.test(c)) return 'Visa';
    if (/^5[1-5]/.test(c)) return 'Mastercard';
    if (/^3[47]/.test(c)) return 'Amex';
    return '';
  }, [cardNumber]);
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
      const idempotencyKey = `bk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const bookingResult = await bookingApi.createBooking(
        {
          idempotency_key: idempotencyKey,
          property_id: matchedHotel?.id || '1',
          room_ids: selectedRooms.map(r => r.id),
          check_in: checkInDate,
          check_out: checkOutDate,
          adults: guestCount,
          children: 0,
        },
        () => ({
          booking_id: 'BK' + Date.now(),
          ref_number: 'BK' + Date.now(),
          status: 'confirmed',
          check_in: checkInDate,
          check_out: checkOutDate,
          nights,
          property: { id: matchedHotel?.id || '1', name: hotelName, type: 'Hotel', currency: 'NPR' },
          rooms: selectedRooms.map(r => ({
            room_id: r.id, room_name: r.name, room_type: r.name, bed_type: 'Queen',
            max_adults: r.capacity, max_children: 0, base_rate: r.price, nights, subtotal: r.price * nights * r.quantity,
          })),
          total_amount: total,
          subtotal,
          special_offer_discount: 0,
          coupon_discount: 0,
          soft_lock_expires_at: new Date(Date.now() + 600000).toISOString(),
        }),
      );

      const refNumber = bookingResult.ref_number;

      let paymentGateway = 'stripe';

      if (paymentMethod === 'razorpay') {
        const intent = await bookingApi.createPaymentIntent(
          refNumber,
          { payment_gateway: 'razorpay' },
          () => ({
            ref_number: refNumber,
            payment_gateway: 'razorpay',
            amount: total,
            currency: 'INR',
            order_id: 'order_' + Date.now(),
          }),
        );

        const response = await openCheckout({
          key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '',
          amount: intent.amount,
          currency: intent.currency,
          order_id: intent.order_id || '',
          name: 'StayEasy',
          description: `Booking for ${hotelName}`,
          prefill: {
            name: `${guestInfo.firstName} ${guestInfo.lastName}`,
            email: guestInfo.email,
            contact: guestInfo.phone,
          },
          theme: { color: '#0071c2' },
        });

        await bookingApi.confirmPayment(
          refNumber,
          { idempotency_key: `pay-${idempotencyKey}`, gateway_payload: response as unknown as Record<string, unknown> },
          () => ({
            status: 'confirmed',
            ref_number: refNumber,
            booking_id: bookingResult.booking_id,
          }),
        );

        paymentGateway = 'razorpay';
      } else {
        const paymentIntent = await bookingApi.createPaymentIntent(
          refNumber,
          { payment_gateway: 'stripe' },
          () => ({
            ref_number: refNumber,
            payment_gateway: 'stripe',
            amount: total,
            currency: 'NPR',
          }),
        );

        await bookingApi.confirmPayment(
          refNumber,
          { idempotency_key: `pay-${idempotencyKey}` },
          () => ({
            status: 'confirmed',
            ref_number: refNumber,
            booking_id: bookingResult.booking_id,
          }),
        );

        paymentGateway = paymentIntent.payment_gateway;
      }

      if (appliedDiscountCode) {
        await bookingApi.applyDiscount(refNumber, appliedDiscountCode, () => bookingResult);
      }

      addBooking({
        hotelId: parseInt(matchedHotel?.id || '0'), hotelName,
        hotelCity: matchedHotel?.city || '', hotelCountry: matchedHotel?.country || '',
        hotelImage: matchedHotel?.images?.[0] || '',
        checkIn: checkInDate, checkOut: checkOutDate,
        roomTypeName: selectedRooms.map(r => r.name).join(', '),
        guests: guestCount, totalPrice: total,
        ...(appliedDiscountCode ? {
          discountApplied: {
            code: appliedDiscountCode!,
            type: discountType === 'free_night' ? 'fixed' : discountType as 'percentage' | 'fixed',
            amount: discountAmount,
          },
        } : {}),
      });

      const firstRoom = selectedRooms[0];
      bridgeGuestBookingToFrontDesk(DEFAULT_BRIDGE_PROPERTY_ID, {
        guest_name: `${guestInfo.firstName} ${guestInfo.lastName}`.trim() || guestInfo.email,
        email: guestInfo.email,
        phone: guestInfo.phone,
        room_type: (firstRoom?.name?.includes('Suite') ? 'Suite'
          : firstRoom?.name?.includes('Deluxe') ? 'Deluxe'
          : 'Standard') as 'Standard' | 'Deluxe' | 'Suite',
        checkin: checkInDate,
        checkout: checkOutDate,
        adults: guestCount,
        children: 0,
        special_requests: specialRequests,
      });

      const guestId = guestUser?.id || 'guest-' + Date.now();
      const pointsEarned = Math.round(total * 0.1);
      earnPoints(guestId, pointsEarned);
      recordStay(guestId, total);

      router.push({
        pathname: '/booking-confirmation',
        params: {
          bookingId: bookingResult.booking_id,
          confirmationCode: refNumber,
          hotelName,
          hotelImage: matchedHotel?.images?.[0] || '',
          hotelCity: matchedHotel?.city || '',
          roomType: selectedRooms.map(r => r.name).join(', '),
          checkIn: checkInDate, checkOut: checkOutDate,
          nights: String(nights), guests: String(guestCount),
          rooms: selectedRooms.map(r => `${r.name} x${r.quantity}`).join(', '),
          subtotal: String(subtotal), tax: String(tax),
          discount: String(discountAmount), total: String(total),
          pointsEarned: String(pointsEarned),
          paymentGateway,
        },
      });
    } catch (error) {
      Alert.alert('Booking Failed', 'An unexpected error occurred');
    } finally { setIsSubmitting(false); }
  };

  const currentIdx = STEPS.findIndex(s => s.key === currentStep);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
          <IconSymbol name="close" size={18} color={BRAND.navyLight} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Booking</Text>
        <Text style={s.headerStep}>{currentIdx + 1}/{STEPS.length}</Text>
      </View>

      {/* Steps */}
      <View style={s.stepBar}>
        {STEPS.map((step, i) => (
          <React.Fragment key={step.key}>
            <View style={[s.stepDot, { backgroundColor: i <= currentIdx ? ACCENT : SLATE[200] }]}>
              {i < currentIdx ? (
                <IconSymbol name="check" size={10} color={TEXT.inverse} />
              ) : (
                <Text style={[s.stepNum, { color: i === currentIdx ? TEXT.inverse : SLATE[400] }]}>{i + 1}</Text>
              )}
            </View>
            {i < STEPS.length - 1 && <View style={[s.stepLine, { backgroundColor: i < currentIdx ? ACCENT : SLATE[200] }]} />}
          </React.Fragment>
        ))}
      </View>

      {/* Checkout Timer - only show after rooms selected */}
      {selectedRooms.length > 0 && currentIdx >= 0 && currentIdx < 4 && (
        <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
          <CheckoutTimer
            durationSeconds={600}
            onExpired={() => setTimerExpired(true)}
          />
        </View>
      )}

      {timerExpired && (
        <View style={s.expiredBanner}>
          <IconSymbol name="alarm" size={14} color={TEXT.inverse} />
          <Text style={s.expiredText}>Session expired — rooms no longer held</Text>
        </View>
      )}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 160 }} contentInsetAdjustmentBehavior="automatic">
        {/* Rooms */}
        {currentStep === 'rooms' && (
          <View style={{ gap: 16 }}>
            <Text style={s.sectionTitle}>Select Rooms</Text>
            {checkInDate && checkOutDate && (
              <View style={s.dateStrip}>
                <Text style={s.dateLabel}>Check-in: <Text style={s.dateVal}>{checkInDate}</Text></Text>
                <Text style={s.dateLabel}>{nights} night{nights > 1 ? 's' : ''}</Text>
                <Text style={s.dateLabel}>Check-out: <Text style={s.dateVal}>{checkOutDate}</Text></Text>
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
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                    {room.amenities.slice(0, 3).map((a, i) => (
                      <View key={i} style={s.amenityChip}><Text style={s.amenityText}>{a}</Text></View>
                    ))}
                  </View>
                  <View style={s.counterBox}>
                    <Text style={s.counterLabel}>{selectedRooms.find(r => r.id === room.id)?.quantity || 0} selected</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <TouchableOpacity onPress={() => handleRoomQuantityChange(room.id, -1)} style={s.counterBtn}><IconSymbol name="minus" size={14} color={BRAND.navyLight} /></TouchableOpacity>
                      <Text style={s.counterVal}>{selectedRooms.find(r => r.id === room.id)?.quantity || 0}</Text>
                      <TouchableOpacity onPress={() => handleRoomQuantityChange(room.id, 1)} style={s.counterBtn}><IconSymbol name="add" size={14} color={BRAND.navyLight} /></TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Guest Info */}
        {currentStep === 'guests' && (
          <View style={{ gap: 16 }}>
            <Text style={s.sectionTitle}>Guest Information</Text>
            <Text style={s.sectionSub}>Fill in your details to continue</Text>
            {[
              { label: 'First Name', val: guestInfo.firstName, set: (t: string) => { setGuestInfo({ ...guestInfo, firstName: t }); if (guestErrors.firstName) setGuestErrors({ ...guestErrors, firstName: '' }); }, key: 'firstName' },
              { label: 'Last Name', val: guestInfo.lastName, set: (t: string) => { setGuestInfo({ ...guestInfo, lastName: t }); if (guestErrors.lastName) setGuestErrors({ ...guestErrors, lastName: '' }); }, key: 'lastName' },
              { label: 'Email', val: guestInfo.email, set: (t: string) => { setGuestInfo({ ...guestInfo, email: t }); if (guestErrors.email) setGuestErrors({ ...guestErrors, email: '' }); }, key: 'email', keyboard: 'email-address' as const },
              { label: 'Phone', val: guestInfo.phone, set: (t: string) => { setGuestInfo({ ...guestInfo, phone: t }); if (guestErrors.phone) setGuestErrors({ ...guestErrors, phone: '' }); }, key: 'phone', keyboard: 'phone-pad' as const },
            ].map(f => (
              <View key={f.key}>
                <Text style={s.fieldLabel}>{f.label}                    <Text style={{ color: UI.error }}>*</Text></Text>
                <TextInput
                  placeholder={`Enter ${f.label.toLowerCase()}`}                  placeholderTextColor={SLATE[400]}
                  value={f.val} onChangeText={f.set}
                  keyboardType={(f as any).keyboard || 'default'} autoCapitalize="none"
                  style={[s.input, guestErrors[f.key] && { borderColor: UI.error, backgroundColor: UI.errorBg }]}
                />
                {guestErrors[f.key] && <Text style={s.errorText}>{guestErrors[f.key]}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Add-ons */}
        {currentStep === 'addons' && (
          <View style={{ gap: 16 }}>
            <Text style={s.sectionTitle}>Enhance Your Stay</Text>
            <Text style={s.sectionSub}>Add extras to make your stay more comfortable</Text>
            {addOns.map(addOn => (
              <TouchableOpacity key={addOn.id} onPress={() => toggleAddOn(addOn.id)}
                style={[s.addonCard, addOn.selected && s.addonCardSelected]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[s.addonName, addOn.selected && { color: ACCENT }]}>{addOn.name}</Text>
                  <Text style={s.addonDesc}>{addOn.description}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', marginRight: 12 }}>
                  <Text style={[s.addonPrice, addOn.selected && { color: ACCENT }]}>{addOn.currency} {addOn.price.toLocaleString()}</Text>
                  {addOn.id === 'dinner' && <Text style={s.perNightSmall}>/night</Text>}
                </View>
                <View style={[s.addonCheck, addOn.selected && s.addonCheckSelected]}>
                  {addOn.selected && <IconSymbol name="check" size={10} color="#FFF" />}
                </View>
              </TouchableOpacity>
            ))}
            <View>
              <Text style={s.fieldLabel}>Special Requests</Text>
              <TextInput
                placeholder="Any special requests..."                  placeholderTextColor={SLATE[400]}
                value={specialRequests} onChangeText={setSpecialRequests}
                multiline numberOfLines={3}
                style={[s.input, { minHeight: 72, textAlignVertical: 'top' }]}
              />
            </View>
          </View>
        )}

        {/* Review */}
        {currentStep === 'review' && (
          <View style={{ gap: 14 }}>
            <Text style={s.sectionTitle}>Review Your Booking</Text>
            <View style={s.reviewCard}>
              <Text style={s.reviewHotel}>{hotelName}</Text>
              <ReviewRow label="Check-in" value={checkInDate} />
              <ReviewRow label="Check-out" value={checkOutDate} />
              <ReviewRow label="Duration" value={`${nights} night${nights > 1 ? 's' : ''}`} />
            </View>
            {selectedRooms.map(room => (
              <View key={room.id} style={s.reviewCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Image source={{ uri: room.image }} style={s.reviewRoomImg} resizeMode="cover" />
                  <View style={{ flex: 1 }}>
                    <Text style={s.reviewRoomName}>{room.name} x{room.quantity}</Text>
                    <Text style={s.reviewMeta}>{room.currency} {room.price.toLocaleString()} × {nights} nights</Text>
                  </View>
                  <Text style={s.reviewRoomTotal}>{room.currency} {(room.price * nights * room.quantity).toLocaleString()}</Text>
                </View>
              </View>
            ))}
            {addOns.filter(a => a.selected).length > 0 && (
              <View style={s.reviewCard}>
                <Text style={s.reviewSectionLabel}>Add-ons</Text>
                {addOns.filter(a => a.selected).map(a => (
                  <ReviewRow key={a.id} label={a.name} value={`${a.currency} ${(a.id === 'dinner' ? a.price * nights : a.price).toLocaleString()}`} />
                ))}
              </View>
            )}
            <DiscountCodeInput
              subtotal={subtotal}
              nights={nights}
              roomType={selectedRooms.map(r => r.name).join(', ')}
              onApply={(discount, amount) => {
                setDiscountAmount(amount);
                if (discount) {
                  setAppliedDiscountCode(discount.code);
                  setDiscountType(discount.type);
                } else {
                  setAppliedDiscountCode(null);
                }
              }}
            />
            <View style={s.priceSummary}>
              <PriceRow label="Subtotal" value={`NPR ${subtotal.toLocaleString()}`} />
              <PriceRow label="Tax (13%)" value={`NPR ${tax.toLocaleString()}`} />
              {discountAmount > 0 && <PriceRow label="Discount" value={`-NPR ${discountAmount.toLocaleString()}`} />}
              <View style={s.priceTotalRow}>
                <Text style={s.priceTotalLabel}>Total</Text>
                <Text style={s.priceTotalVal}>NPR {total.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Payment */}
        {currentStep === 'payment' && (
          <View style={{ gap: 16 }}>
            <Text style={s.sectionTitle}>Payment Method</Text>
            {[
              { id: 'card' as const, label: 'Credit/Debit Card', icon: 'payment' as const },
              { id: 'wallet' as const, label: 'Digital Wallet', icon: 'wallet' as const },
              { id: 'bank' as const, label: 'Bank Transfer', icon: 'business' as const },
              { id: 'razorpay' as const, label: 'Razorpay', icon: 'payment' as const },
            ].map(opt => (
              <TouchableOpacity key={opt.id} onPress={() => setPaymentMethod(opt.id)}
                style={[s.paymentOption, paymentMethod === opt.id && s.paymentOptionActive]}
              >
                <View style={[s.radioCircle, paymentMethod === opt.id && s.radioCircleActive]}>
                  {paymentMethod === opt.id && <View style={s.radioInner} />}
                </View>
                <IconSymbol name={opt.icon} size={20} color={paymentMethod === opt.id ? ACCENT : '#94A3B8'} />
                <Text style={[s.paymentLabel, paymentMethod === opt.id && { color: ACCENT }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}

            {paymentMethod === 'card' && (
              <View style={s.cardForm}>
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={s.fieldLabel}>Card Number</Text>
                    {cardType && <Text style={s.cardTypeLabel}>{cardType}</Text>}
                  </View>
                  <View style={[s.cardInput, cardErrors.cardNumber && s.cardInputError]}>
                    <TextInput value={cardNumber} onChangeText={(t) => { setCardNumber(formatCardNumber(t)); setCardErrors(p => ({ ...p, cardNumber: '' })); }}
                      placeholder="1234 5678 9012 3456"                  placeholderTextColor={SLATE[400]} keyboardType="number-pad" maxLength={19} style={s.cardTextInput} />
                  </View>
                  {cardErrors.cardNumber && <Text style={s.errorText}>{cardErrors.cardNumber}</Text>}
                </View>
                <View>
                  <Text style={s.fieldLabel}>Cardholder Name</Text>
                  <View style={[s.cardInput, cardErrors.cardName && s.cardInputError]}>
                    <TextInput value={cardName} onChangeText={(t) => { setCardName(t); setCardErrors(p => ({ ...p, cardName: '' })); }}
                      placeholder="John Doe"                  placeholderTextColor={SLATE[400]} autoCapitalize="words" style={s.cardTextInput} />
                  </View>
                  {cardErrors.cardName && <Text style={s.errorText}>{cardErrors.cardName}</Text>}
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>Expiry</Text>
                    <View style={[s.cardInput, cardErrors.cardExpiry && s.cardInputError]}>
                      <TextInput value={cardExpiry} onChangeText={(t) => { const cleaned = t.replace(/\D/g, ''); setCardExpiry(formatExpiry(cleaned)); setCardErrors(p => ({ ...p, cardExpiry: '' })); }}
                        placeholder="MM/YY"                  placeholderTextColor={SLATE[400]} keyboardType="number-pad" maxLength={5} style={s.cardTextInput} />
                    </View>
                    {cardErrors.cardExpiry && <Text style={s.errorText}>{cardErrors.cardExpiry}</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>CVV</Text>
                    <View style={[s.cardInput, cardErrors.cardCvv && s.cardInputError]}>
                      <TextInput value={cardCvv} onChangeText={(t) => { const cleaned = t.replace(/\D/g, ''); setCardCvv(cleaned.slice(0, cardType === 'Amex' ? 4 : 3)); setCardErrors(p => ({ ...p, cardCvv: '' })); }}
                        placeholder={cardType === 'Amex' ? '1234' : '123'}                  placeholderTextColor={SLATE[400]} keyboardType="number-pad" maxLength={4}
                        secureTextEntry style={s.cardTextInput} />
                    </View>
                    {cardErrors.cardCvv && <Text style={s.errorText}>{cardErrors.cardCvv}</Text>}
                  </View>
                </View>
              </View>
            )}

            {paymentMethod === 'razorpay' && (
              <View style={{ gap: 12 }}>
                {/* UPI */}
                <View style={[s.subMethodCard, razorpaySubMethod === 'upi' && s.subMethodCardActive]}>
                  <TouchableOpacity onPress={() => setRazorpaySubMethod('upi')} style={s.subMethodHeader}>
                    <View style={[s.radioCircle, razorpaySubMethod === 'upi' && s.radioCircleActive]}>
                      {razorpaySubMethod === 'upi' && <View style={s.radioInner} />}
                    </View>
                    <Text style={s.subMethodTitle}>UPI</Text>
                  </TouchableOpacity>
                  {razorpaySubMethod === 'upi' && (
                    <View style={{ gap: 10, marginTop: 10 }}>
                      <TextInput
                        placeholder="UPI ID (e.g. user@paytm)"
                        placeholderTextColor={SLATE[400]}
                        value={upiId}
                        onChangeText={setUpiId}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={s.input}
                      />
                      <TouchableOpacity onPress={handleCompleteBooking} style={s.subPayBtn}>
                        <Text style={s.subPayBtnText}>Pay via UPI</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Card */}
                <View style={[s.subMethodCard, razorpaySubMethod === 'card' && s.subMethodCardActive]}>
                  <TouchableOpacity onPress={() => setRazorpaySubMethod('card')} style={s.subMethodHeader}>
                    <View style={[s.radioCircle, razorpaySubMethod === 'card' && s.radioCircleActive]}>
                      {razorpaySubMethod === 'card' && <View style={s.radioInner} />}
                    </View>
                    <Text style={s.subMethodTitle}>Card</Text>
                  </TouchableOpacity>
                  {razorpaySubMethod === 'card' && (
                    <View style={{ gap: 10, marginTop: 10 }}>
                      <TextInput
                        placeholder="Card Number"
                        placeholderTextColor={SLATE[400]}
                        keyboardType="number-pad"
                        maxLength={19}
                        style={s.input}
                      />
                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TextInput
                          placeholder="MM/YY"
                          placeholderTextColor={SLATE[400]}
                          keyboardType="number-pad"
                          maxLength={5}
                          style={[s.input, { flex: 1 }]}
                        />
                        <TextInput
                          placeholder="CVV"
                          placeholderTextColor={SLATE[400]}
                          keyboardType="number-pad"
                          maxLength={4}
                          secureTextEntry
                          style={[s.input, { flex: 1 }]}
                        />
                      </View>
                      <TouchableOpacity onPress={handleCompleteBooking} style={s.subPayBtn}>
                        <Text style={s.subPayBtnText}>Pay with Card</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Net Banking */}
                <View style={[s.subMethodCard, razorpaySubMethod === 'netbanking' && s.subMethodCardActive]}>
                  <TouchableOpacity onPress={() => setRazorpaySubMethod('netbanking')} style={s.subMethodHeader}>
                    <View style={[s.radioCircle, razorpaySubMethod === 'netbanking' && s.radioCircleActive]}>
                      {razorpaySubMethod === 'netbanking' && <View style={s.radioInner} />}
                    </View>
                    <Text style={s.subMethodTitle}>Net Banking</Text>
                  </TouchableOpacity>
                  {razorpaySubMethod === 'netbanking' && (
                    <View style={{ gap: 8, marginTop: 10 }}>
                      {['SBI', 'HDFC', 'ICICI', 'Axis', 'Yes Bank'].map(bank => (
                        <TouchableOpacity key={bank} onPress={() => setSelectedBank(bank)}
                          style={[s.bankOption, selectedBank === bank && s.bankOptionActive]}
                        >
                          <Text style={[s.bankOptionText, selectedBank === bank && { color: ACCENT }]}>{bank}</Text>
                          {selectedBank === bank && <IconSymbol name="check" size={14} color={ACCENT} />}
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        onPress={handleCompleteBooking}
                        style={[s.subPayBtn, !selectedBank && { opacity: 0.5 }]}
                        disabled={!selectedBank}
                      >
                        <Text style={s.subPayBtnText}>Pay via Net Banking</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}

            <View style={s.termsBox}>
              <IconSymbol name="lock" size={14} color="#94A3B8" />
              <Text style={s.termsText}>By confirming, you agree to our Terms & Conditions and Privacy Policy</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Bar */}
      <View style={s.bottomBar}>
        {selectedRooms.length > 0 && (
          <View style={s.pricePreview}>
            <Text style={s.pricePreviewLabel}>Total</Text>
            <Text style={s.pricePreviewVal}>NPR {total.toLocaleString()}</Text>
          </View>
        )}
        <View style={s.navRow}>
          {currentIdx > 0 ? (
            <TouchableOpacity onPress={() => setCurrentStep(STEPS[currentIdx - 1].key)} style={s.navBack}>
              <Text style={s.navBackText}>Back</Text>
            </TouchableOpacity>
          ) : <View style={{ flex: 1 }} />}
          <TouchableOpacity
            onPress={currentStep === 'payment' ? handleCompleteBooking : () => handleStepNext(STEPS[currentIdx + 1].key)}
            style={[s.navNext, { backgroundColor: currentStep === 'payment' ? '#16A085' : (timerExpired ? '#94A3B8' : ACCENT) }]}
            activeOpacity={0.9}
            disabled={timerExpired && currentStep !== 'payment'}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={s.navNextText}>
                {currentStep === 'payment' && paymentMethod === 'razorpay' ? 'Pay with Razorpay' : currentStep === 'payment' ? 'Confirm & Pay' : 'Continue'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
      <Text style={reviewStyles.label}>{label}</Text>
      <Text style={reviewStyles.value}>{value}</Text>
    </View>
  );
}
const reviewStyles = StyleSheet.create({
  label: { fontSize: 12, color: '#64748B', fontFamily: FONTS.inter.regular },
  value: { fontSize: 13, fontWeight: '600', color: '#0F172A', fontFamily: FONTS.inter.medium },
});

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
      <Text style={priceStyles.label}>{label}</Text>
      <Text style={priceStyles.value}>{value}</Text>
    </View>
  );
}
const priceStyles = StyleSheet.create({
  label: { fontSize: 13, color: '#64748B', fontFamily: FONTS.inter.regular },
  value: { fontSize: 13, fontWeight: '600', color: '#0F172A', fontFamily: FONTS.inter.medium },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A3C5E', fontFamily: FONTS.playfairDisplay.bold },
  expiredBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#DC2626', marginHorizontal: 16, borderRadius: 8 },
  expiredText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  headerStep: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  stepBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF' },
  stepDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontSize: 11, fontWeight: '700' },
  stepLine: { flex: 1, height: 2, borderRadius: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A3C5E', letterSpacing: -0.3, fontFamily: FONTS.sora },
  sectionSub: { fontSize: 12, color: '#94A3B8', marginTop: -8, fontFamily: FONTS.inter.regular },
  dateStrip: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderRadius: 12, backgroundColor: 'rgba(46, 134, 171, 0.06)', borderWidth: 1, borderColor: 'rgba(46, 134, 171, 0.12)' },
  dateLabel: { fontSize: 11, color: '#64748B', fontFamily: FONTS.inter.regular },
  dateVal: { fontWeight: '700', color: '#1A3C5E' },
  roomCard: { borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' },
  roomImage: { width: '100%', height: 150 },
  scarcityBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: '#D35400' },
  scarcityText: { fontSize: 10, fontWeight: '600', color: '#FFF' },
  roomBody: { padding: 14, gap: 6 },
  roomName: { fontSize: 14, fontWeight: '700', color: '#1A3C5E', fontFamily: FONTS.inter.medium },
  roomPrice: { fontSize: 14, fontWeight: '700', color: ACCENT, fontFamily: FONTS.inter.bold },
  perNight: { fontSize: 10, fontWeight: '400', color: '#94A3B8', fontFamily: FONTS.inter.regular },
  roomDesc: { fontSize: 12, color: '#64748B', lineHeight: 18, fontFamily: FONTS.inter.regular },
  amenityChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(46, 134, 171, 0.08)' },
  amenityText: { fontSize: 10, fontWeight: '500', color: ACCENT },
  counterBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  counterLabel: { fontSize: 12, color: '#94A3B8' },
  counterBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(46, 134, 171, 0.1)', alignItems: 'center', justifyContent: 'center' },
  counterVal: { fontSize: 16, fontWeight: '700', color: '#1A3C5E', minWidth: 24, textAlign: 'center' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#1A3C5E', marginBottom: 4, fontFamily: FONTS.inter.medium },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#0F172A' },
  addonCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E2E8F0' },
  addonCardSelected: { borderColor: ACCENT, backgroundColor: 'rgba(46, 134, 171, 0.04)' },
  addonName: { fontSize: 13, fontWeight: '600', color: '#1A3C5E', fontFamily: FONTS.inter.medium },
  addonDesc: { fontSize: 11, color: '#94A3B8', marginTop: 1, fontFamily: FONTS.inter.regular },
  addonPrice: { fontSize: 13, fontWeight: '700', color: '#1A3C5E', fontFamily: FONTS.inter.bold },
  perNightSmall: { fontSize: 10, color: '#94A3B8', fontFamily: FONTS.inter.regular },
  addonCheck: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  addonCheckSelected: { backgroundColor: ACCENT, borderColor: ACCENT },
  reviewCard: { padding: 14, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9', gap: 2 },
  reviewHotel: { fontSize: 15, fontWeight: '700', color: '#1A3C5E', marginBottom: 6, fontFamily: FONTS.playfairDisplay.bold },
  reviewRoomImg: { width: 52, height: 40, borderRadius: 8 },
  reviewRoomName: { fontSize: 13, fontWeight: '600', color: '#1A3C5E', fontFamily: FONTS.inter.medium },
  reviewMeta: { fontSize: 11, color: '#94A3B8', fontFamily: FONTS.inter.regular },
  reviewRoomTotal: { fontSize: 13, fontWeight: '700', color: ACCENT, fontFamily: FONTS.inter.bold },
  reviewSectionLabel: { fontSize: 13, fontWeight: '700', color: '#1A3C5E', marginBottom: 4, fontFamily: FONTS.inter.medium },
  priceSummary: { padding: 14, borderRadius: 14, backgroundColor: 'rgba(46, 134, 171, 0.06)', borderWidth: 1, borderColor: 'rgba(46, 134, 171, 0.12)' },
  priceTotalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(46, 134, 171, 0.2)', paddingTop: 10, marginTop: 4 },
  priceTotalLabel: { fontSize: 14, fontWeight: '700', color: '#1A3C5E', fontFamily: FONTS.inter.bold },
  priceTotalVal: { fontSize: 16, fontWeight: '700', color: ACCENT, fontFamily: FONTS.inter.bold },
  paymentOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E2E8F0' },
  paymentOptionActive: { borderColor: ACCENT, backgroundColor: 'rgba(46, 134, 171, 0.04)' },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  radioCircleActive: { borderColor: ACCENT },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: ACCENT },
  paymentLabel: { fontSize: 13, fontWeight: '600', color: '#1A3C5E', fontFamily: FONTS.inter.medium },
  cardForm: { gap: 14 },
  cardInput: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#FFF' },
  cardInputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  cardTextInput: { fontSize: 14, color: '#0F172A', paddingVertical: 11 },
  cardTypeLabel: { fontSize: 11, fontWeight: '600', color: ACCENT, fontFamily: FONTS.inter.medium },
  errorText: { fontSize: 11, color: '#EF4444', marginTop: 2, marginLeft: 2 },
  termsBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: '#F8FAFC' },
  termsText: { fontSize: 11, color: '#94A3B8', flex: 1, lineHeight: 16, fontFamily: FONTS.inter.regular },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 36, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 10 },
  pricePreview: { flexDirection: 'row', justifyContent: 'space-between' },
  pricePreviewLabel: { fontSize: 12, color: '#64748B' },
  pricePreviewVal: { fontSize: 16, fontWeight: '700', color: ACCENT, fontFamily: FONTS.inter.bold },
  navRow: { flexDirection: 'row', gap: 12 },
  navBack: { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: 'center', backgroundColor: '#F1F5F9' },
  navBackText: { fontSize: 13, fontWeight: '600', color: '#64748B', fontFamily: FONTS.inter.semiBold },
  navNext: { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  navNextText: { fontSize: 14, fontWeight: '700', color: '#FFF', fontFamily: FONTS.inter.semiBold },
  subMethodCard: { padding: 14, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E2E8F0' },
  subMethodCardActive: { borderColor: ACCENT, backgroundColor: 'rgba(46, 134, 171, 0.04)' },
  subMethodHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  subMethodTitle: { fontSize: 14, fontWeight: '700', color: '#1A3C5E', fontFamily: FONTS.inter.medium },
  subPayBtn: { paddingVertical: 12, borderRadius: 10, backgroundColor: ACCENT, alignItems: 'center' },
  subPayBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF', fontFamily: FONTS.inter.semiBold },
  bankOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  bankOptionActive: { borderColor: ACCENT, backgroundColor: 'rgba(46, 134, 171, 0.06)' },
  bankOptionText: { fontSize: 13, fontWeight: '600', color: '#1A3C5E', fontFamily: FONTS.inter.medium },
});
