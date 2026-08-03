import React, { useState, useMemo, useEffect, memo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Image,
  ActivityIndicator, StyleSheet, Platform, Alert, KeyboardAvoidingView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBookings } from '@/lib/context/booking-context';
import { useAuth } from '@/lib/context/auth-context';
import type { GuestProfile } from '@/types/api';
import { safeGoBack } from '@/lib/utils';
import { bookingApi } from '@/lib/api/booking-api';
import { searchHotelsApi, getAvailableRoomsApi, type AvailableRoom } from '@/lib/api';
import type { BookingReservationResponse } from '@/types/api';
import { useTranslation } from 'react-i18next';

function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 1;
  return Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const NAVY = '#1A3C5E';
const BLUE = '#0071c2';
const TEAL = '#00875A';

type PaymentGateway = 'dummy' | 'stripe' | 'khalti' | 'razorpay';

const PAYMENT_METHODS: { key: PaymentGateway; name: string; desc: string }[] = [
  { key: 'khalti', name: 'Khalti', desc: 'Pay with Khalti wallet' },
  { key: 'stripe', name: 'Card (Stripe)', desc: 'Credit / debit card' },
  { key: 'razorpay', name: 'Razorpay', desc: 'UPI, cards & net banking' },
  { key: 'dummy', name: 'Test (Demo)', desc: 'No real charge — for testing' },
];

type Step = 0 | 1 | 2;

interface SelectedRoom {
  id: string;
  name: string;
  roomType: string;
  bedType: string;
  price: number;
  maxAdults: number;
  maxChildren: number;
  image: string;
  cancellation: string;
  cancellationDesc: string;
  quantity: number;
}

export default function BookingFlowScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const hotelName = (params.hotelName as string) || 'Hotel';
  const propertyId = (params.propertyId as string) || '';
  const checkIn = (params.checkIn as string) || '';
  const checkOut = (params.checkOut as string) || '';
  const guests = parseInt((params.guests as string) || '2', 10);
  const preselectedRoomId = params.roomId as string | undefined;
  const nights = useMemo(() => calculateNights(checkIn, checkOut), [checkIn, checkOut]);

  const { user } = useAuth();
  const guestUser = user as GuestProfile | null;

  // Require login to book
  useEffect(() => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'Please login or create an account to complete your booking.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => safeGoBack() },
          { text: 'Login', onPress: () => router.replace('/(auth)/login') },
        ],
      );
    }
  }, [user]);
  const { addBooking } = useBookings();

  // ── State ──
  const [step, setStep] = useState<Step>(0);
  const [availableRooms, setAvailableRooms] = useState<SelectedRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRooms, setSelectedRooms] = useState<SelectedRoom[]>([]);
  const [resolvedPropertyId, setResolvedPropertyId] = useState(propertyId);

  const [guestInfo, setGuestInfo] = useState({ firstName: '', lastName: '', email: '', phone: '', country: 'Nepal' });
  const [guestErrors, setGuestErrors] = useState<Record<string, string>>({});

  const [paymentMethod, setPaymentMethod] = useState<'dummy' | 'stripe' | 'khalti' | 'razorpay'>('khalti');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const [bookingResult, setBookingResult] = useState<BookingReservationResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // ── Pre-fill guest info from profile ──
  useEffect(() => {
    if (guestUser) {
      const parts = (guestUser.name || guestUser.full_name || '').split(' ');
      setGuestInfo({
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
        email: guestUser.email || '',
        phone: guestUser.phone || '',
        country: guestUser.country || guestUser.nationality || 'Nepal',
      });
    }
  }, [guestUser]);

  // ── Fetch available rooms ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Resolve property ID from search if not provided
        let pid = propertyId;
        if (!pid) {
          const searchResult = await searchHotelsApi({ destination: hotelName, limit: 5 });
          const match = searchResult.hotels.find(h =>
            h.name.toLowerCase().includes(hotelName.toLowerCase()) ||
            hotelName.toLowerCase().includes(h.name.toLowerCase())
          );
          if (match) {
            pid = match.id;
            if (!cancelled) setResolvedPropertyId(match.id);
          }
        }

        if (!pid || !checkIn || !checkOut) {
          if (!cancelled) setIsLoading(false);
          return;
        }

        const rooms = await getAvailableRoomsApi(pid, checkIn, checkOut);
        if (cancelled) return;

        const mapped: SelectedRoom[] = rooms.map((r: AvailableRoom) => ({
          id: r.id,
          name: r.room_name,
          roomType: r.room_type || 'Standard',
          bedType: r.bed_type || 'Queen',
          price: parseFloat(r.base_rate) || 0,
          maxAdults: r.max_adults,
          maxChildren: r.max_children,
          image: r.photos?.cover || '',
          cancellation: r.cancellation_title || 'Free cancellation',
          cancellationDesc: r.cancellation_description || 'Cancel up to 24 hours before check-in',
          quantity: 0,
        }));

        setAvailableRooms(mapped);

        // Auto-select preselected room
        if (preselectedRoomId) {
          const pre = mapped.find(r => r.id === preselectedRoomId);
          if (pre) setSelectedRooms([{ ...pre, quantity: 1 }]);
        }
      } catch {
        // fall back to empty
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [propertyId, hotelName, checkIn, checkOut, preselectedRoomId]);

  // ── Room selection handlers ──
  const toggleRoom = (room: SelectedRoom) => {
    setSelectedRooms(prev => {
      const existing = prev.find(r => r.id === room.id);
      if (existing) return prev.filter(r => r.id !== room.id);
      return [...prev, { ...room, quantity: 1 }];
    });
  };

  const updateQuantity = (roomId: string, delta: number) => {
    setSelectedRooms(prev => {
      const existing = prev.find(r => r.id === roomId);
      if (!existing) return prev;
      const newQty = existing.quantity + delta;
      if (newQty <= 0) return prev.filter(r => r.id !== roomId);
      return prev.map(r => r.id === roomId ? { ...r, quantity: newQty } : r);
    });
  };

  // ── Price calculation ──
  const roomSubtotal = useMemo(() =>
    selectedRooms.reduce((sum, r) => sum + r.price * r.quantity * nights, 0),
    [selectedRooms, nights]
  );
  const promoDiscount = appliedPromo?.discount || 0;
  const tax = Math.round(roomSubtotal * 0.13);
  const total = Math.max(0, roomSubtotal + tax - promoDiscount);

  // ── Validation ──
  const validateGuest = (): boolean => {
    const e: Record<string, string> = {};
    if (!guestInfo.firstName.trim()) e.firstName = 'Required';
    if (!guestInfo.lastName.trim()) e.lastName = 'Required';
    if (!guestInfo.email.trim()) e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email)) e.email = 'Invalid email';
    if (!guestInfo.phone.trim()) e.phone = 'Required';
    setGuestErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Navigation ──
  const handleNext = () => {
    if (step === 0 && selectedRooms.length === 0) {
      Alert.alert('Select Rooms', 'Please select at least one room');
      return;
    }
    if (step === 1 && !validateGuest()) return;
    setStep((step + 1) as Step);
  };

  // ── Apply promo code ──
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    if (!bookingResult?.ref_number) {
      Alert.alert('Note', 'Promo codes can be applied after creating the booking');
      return;
    }
    setPromoLoading(true);
    try {
      const updated = await bookingApi.applyDiscount(
        bookingResult.ref_number,
        promoCode,
        () => bookingResult,
      );
      setAppliedPromo({ code: promoCode, discount: updated.coupon_discount || 0 });
      setBookingResult(updated);
    } catch {
      Alert.alert('Invalid Code', 'This promo code is not valid or has expired');
    } finally {
      setPromoLoading(false);
    }
  };

  // ── Complete booking: POST /bookings/ → payment-intent → apply-discount → confirm ──
  const handleComplete = async () => {
    if (isSubmitting || isProcessing) return;
    setIsSubmitting(true);

    try {
      const idempotencyKey = `bk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const pid = resolvedPropertyId;
      if (!pid) {
        Alert.alert('Error', 'Could not identify the property. Please go back and try again.');
        setIsSubmitting(false);
        return;
      }

      // Step 1: Create booking
      const result = await bookingApi.createBooking(
        {
          idempotency_key: idempotencyKey,
          property_id: pid,
          room_ids: selectedRooms.flatMap(r => Array(r.quantity).fill(r.id)),
          check_in: checkIn,
          check_out: checkOut,
          adults: guests,
          children: 0,
        },
        () => ({
          booking_id: 'BK' + Date.now(),
          ref_number: 'BK-' + new Date().toISOString().slice(0, 10) + '-' + Math.floor(Math.random() * 999),
          status: 'pending_payment',
          number_of_adults: guests,
          number_of_children: 0,
          check_in: checkIn,
          check_out: checkOut,
          nights,
          property: { id: pid, name: hotelName, type: 'Hotel', currency: 'NPR', phone_number: '', email: '' },
          rooms: selectedRooms.map(r => ({
            room_id: r.id, room_name: r.name, room_type: r.roomType, bed_type: r.bedType,
            max_adults: r.maxAdults, max_children: r.maxChildren,
            base_rate: r.price, nights, subtotal: r.price * nights * r.quantity,
            photo: r.image,
            cancellation_title: r.cancellation, cancellation_description: r.cancellationDesc,
          })),
          total_amount: total, subtotal: roomSubtotal,
          special_offer_discount: 0, coupon_discount: promoDiscount,
          soft_lock_expires_at: new Date(Date.now() + 600000).toISOString(),
        }),
      );

      setBookingResult(result);
      setIsSubmitting(false);
      setIsProcessing(true);

      const ref = result.ref_number;

      // Step 2: Create payment intent
      const paymentIntent = await bookingApi.createPaymentIntent(
        ref,
        { payment_gateway: paymentMethod },
        () => ({
          ref_number: ref,
          payment_gateway: paymentMethod,
          amount: total,
          currency: 'NPR',
        }),
      );

      // Step 3: Apply discount (must be BEFORE confirm)
      if (appliedPromo) {
        await bookingApi.applyDiscount(ref, appliedPromo.code, () => result);
      }

      // Step 4: Confirm payment
      const gatewayPayload: Record<string, unknown> | undefined =
        paymentMethod === 'khalti'
          ? (paymentIntent.pidx ? { pidx: paymentIntent.pidx } : paymentIntent.payment_intent_id ? { payment_intent_id: paymentIntent.payment_intent_id } : undefined)
          : paymentMethod === 'razorpay'
            ? (paymentIntent.order_id ? { order_id: paymentIntent.order_id } : undefined)
            : paymentMethod === 'stripe'
              ? (paymentIntent.payment_intent_id ? { payment_intent_id: paymentIntent.payment_intent_id } : undefined)
              : undefined;

      await bookingApi.confirmPayment(
        ref,
        {
          idempotency_key: `pay-${idempotencyKey}`,
          gateway_payload: gatewayPayload,
        },
        () => ({
          status: 'confirmed',
          booking_id: result.booking_id,
          ref_number: ref,
        }),
      );

      // Save to local context
      addBooking({
        hotelId: 0,
        hotelName,
        hotelCity: result.property?.city || '',
        hotelCountry: result.property?.country || '',
        hotelImage: selectedRooms[0]?.image || '',
        checkIn,
        checkOut,
        roomTypeName: selectedRooms.map(r => r.name).join(', '),
        guests,
        totalPrice: total,
        ...(appliedPromo ? {
          discountApplied: { code: appliedPromo.code, type: 'percentage' as const, amount: promoDiscount },
        } : {}),
      });

      // Navigate to confirmation
      router.replace({
        pathname: '/booking-confirmation',
        params: {
          bookingId: result.booking_id,
          confirmationCode: ref,
          hotelName,
          hotelImage: selectedRooms[0]?.image || '',
          hotelCity: result.property?.city || '',
          roomType: selectedRooms.map(r => r.name).join(', '),
          checkIn,
          checkOut,
          nights: String(nights),
          guests: String(guests),
          rooms: selectedRooms.map(r => `${r.name} x${r.quantity}`).join(', '),
          subtotal: String(roomSubtotal),
          tax: String(tax),
          discount: String(promoDiscount),
          total: String(total),
          guestName: `${guestInfo.firstName} ${guestInfo.lastName}`.trim(),
          guestEmail: guestInfo.email,
          guestPhone: guestInfo.phone,
          guestCountry: guestInfo.country,
          bedTypes: selectedRooms.map(r => r.bedType).join(', '),
        },
      });
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Booking Failed', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Progress indicator ──
  const stepLabels = ['Select rooms', 'Your details', 'Finish booking'];
  const ProgressHeader = useMemo(() => memo(() => (
    <View style={styles.progress}>
      {stepLabels.map((label, i) => (
        <React.Fragment key={label}>
          <View style={styles.progressItem}>
            <View style={[
              styles.progressDot,
              i < step && styles.progressDotDone,
              i === step && styles.progressDotActive,
            ]}>
              {i < step ? (
                <Ionicons name="checkmark" size={12} color="#FFF" />
              ) : (
                <Text style={[styles.progressNum, i === step && styles.progressNumActive]}>{i + 1}</Text>
              )}
            </View>
            <Text style={[styles.progressLabel, i <= step && styles.progressLabelActive]} numberOfLines={1}>
              {label}
            </Text>
          </View>
          {i < stepLabels.length - 1 && (
            <View style={[styles.progressLine, i < step && styles.progressLineDone]} />
          )}
        </React.Fragment>
      ))}
    </View>
  )), [step]);

  // ── Step 0: Room Selection ──
  const StepRooms = useMemo(() => memo(() => (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Select your rooms</Text>
      <Text style={styles.stepSub}>Choose the perfect room for your stay</Text>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.loadingText}>Finding available rooms...</Text>
        </View>
      ) : availableRooms.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="bed-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyText}>No rooms available for these dates</Text>
        </View>
      ) : (
        availableRooms.map(room => {
          const isSelected = selectedRooms.some(r => r.id === room.id);
          const selectedRoom = selectedRooms.find(r => r.id === room.id);
          const qty = selectedRoom?.quantity || 0;

          return (
            <TouchableOpacity
              key={room.id}
              onPress={() => toggleRoom(room)}
              style={[styles.roomCard, isSelected && styles.roomCardSelected]}
              activeOpacity={0.7}
            >
              <Image source={{ uri: room.image }} style={styles.roomImage} />
              <View style={styles.roomBody}>
                <View style={styles.roomTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roomName}>{room.name}</Text>
                    <Text style={styles.roomMeta}>{room.bedType} bed · Up to {room.maxAdults} guests</Text>
                  </View>
                  <View style={styles.roomPriceBox}>
                    <Text style={styles.roomPrice}>NPR {room.price.toLocaleString()}</Text>
                    <Text style={styles.roomPerNight}>/night</Text>
                  </View>
                </View>

                <View style={styles.roomBadge}>
                  <Ionicons name="checkmark-circle-outline" size={14} color={TEAL} />
                  <Text style={styles.roomBadgeText}>{room.cancellation}</Text>
                </View>

                {isSelected && (
                  <View style={styles.qtyRow}>
                    <Text style={styles.qtyLabel}>Quantity</Text>
                    <View style={styles.qtyControls}>
                      <TouchableOpacity onPress={() => updateQuantity(room.id, -1)} style={styles.qtyBtn}>
                        <Ionicons name="remove" size={18} color={BLUE} />
                      </TouchableOpacity>
                      <Text style={styles.qtyVal}>{qty}</Text>
                      <TouchableOpacity onPress={() => updateQuantity(room.id, 1)} style={styles.qtyBtn}>
                        <Ionicons name="add" size={18} color={BLUE} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.qtyTotal}>NPR {(room.price * qty * nights).toLocaleString()}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  )), [isLoading, availableRooms, selectedRooms, nights]);

  // ── Step 1: Guest Details ──
  const StepDetails = useMemo(() => memo(() => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Enter your details</Text>
        <Text style={styles.stepSub}>Please fill in your information to complete the booking</Text>

        {[
          { key: 'firstName', label: 'First name', placeholder: 'John', value: guestInfo.firstName, onChange: (v: string) => setGuestInfo(p => ({ ...p, firstName: v })) },
          { key: 'lastName', label: 'Last name', placeholder: 'Doe', value: guestInfo.lastName, onChange: (v: string) => setGuestInfo(p => ({ ...p, lastName: v })) },
          { key: 'email', label: 'Email address', placeholder: 'john@example.com', value: guestInfo.email, onChange: (v: string) => setGuestInfo(p => ({ ...p, email: v })), keyboard: 'email-address' as const },
          { key: 'phone', label: 'Phone number', placeholder: '+977 98XXXXXXXX', value: guestInfo.phone, onChange: (v: string) => setGuestInfo(p => ({ ...p, phone: v })), keyboard: 'phone-pad' as const },
        ].map(f => (
          <View key={f.key} style={styles.field}>
            <Text style={styles.fieldLabel}>{f.label} <Text style={{ color: '#EF4444' }}>*</Text></Text>
            <TextInput
              placeholder={f.placeholder}
              placeholderTextColor="#94A3B8"
              value={f.value}
              onChangeText={(v) => { f.onChange(v); if (guestErrors[f.key]) setGuestErrors(p => ({ ...p, [f.key]: '' })); }}
              keyboardType={f.keyboard || 'default'}
              autoCapitalize="none"
              style={[styles.input, guestErrors[f.key] && styles.inputError]}
            />
            {guestErrors[f.key] && <Text style={styles.errorText}>{guestErrors[f.key]}</Text>}
          </View>
        ))}

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Country / Region</Text>
          <View style={styles.select}>
            <Text style={styles.selectText}>{guestInfo.country}</Text>
            <Ionicons name="chevron-down" size={16} color="#94A3B8" />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )), [guestInfo, guestErrors]);

  // ── Step 2: Payment & Review ──
  const StepPayment = useMemo(() => memo(() => (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Finish booking</Text>
      <Text style={styles.stepSub}>Review your booking and complete payment</Text>

      {/* Promo code */}
      <View style={styles.promoBox}>
        <Text style={styles.fieldLabel}>Promo code</Text>
        {appliedPromo ? (
          <View style={styles.promoApplied}>
            <Ionicons name="checkmark-circle" size={16} color={TEAL} />
            <Text style={styles.promoCode}>{appliedPromo.code}</Text>
            <Text style={styles.promoDiscount}>-{appliedPromo.discount.toLocaleString()}</Text>
            <TouchableOpacity onPress={() => { setAppliedPromo(null); setPromoCode(''); }}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.promoRow}>
            <TextInput
              placeholder="Enter code"
              placeholderTextColor="#94A3B8"
              value={promoCode}
              onChangeText={setPromoCode}
              style={[styles.input, { flex: 1 }]}
            />
            <TouchableOpacity onPress={handleApplyPromo} style={styles.promoBtn} disabled={promoLoading}>
              {promoLoading ? <ActivityIndicator size="small" color={BLUE} /> : <Text style={styles.promoBtnText}>Apply</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Price summary */}
      <View style={styles.priceBox}>
        <Text style={styles.priceTitle}>Price details</Text>
        {selectedRooms.map(r => (
          <View key={r.id} style={styles.priceRow}>
            <Text style={styles.priceLabel}>{r.name} x{r.quantity} × {nights}n</Text>
            <Text style={styles.priceVal}>NPR {(r.price * r.quantity * nights).toLocaleString()}</Text>
          </View>
        ))}
        {promoDiscount > 0 && (
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: '#DC2626' }]}>Discount</Text>
            <Text style={[styles.priceVal, { color: '#DC2626' }]}>-NPR {promoDiscount.toLocaleString()}</Text>
          </View>
        )}
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Taxes & fees (13%)</Text>
          <Text style={styles.priceVal}>NPR {tax.toLocaleString()}</Text>
        </View>
        <View style={styles.priceDivider} />
        <View style={styles.priceRow}>
          <Text style={styles.priceTotalLabel}>Total</Text>
          <Text style={styles.priceTotalVal}>NPR {total.toLocaleString()}</Text>
        </View>
      </View>

      {/* Cancellation */}
      <View style={styles.cancelBox}>
        <Ionicons name="shield-checkmark-outline" size={18} color={TEAL} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cancelTitle}>Free cancellation</Text>
          <Text style={styles.cancelDesc}>Cancel before {formatDate(checkIn)} for a full refund</Text>
        </View>
      </View>

      {/* Payment method */}
      <View style={styles.payBox}>
        <Text style={styles.fieldLabel}>Payment method</Text>
        {PAYMENT_METHODS.map(m => {
          const selected = paymentMethod === m.key;
          return (
            <TouchableOpacity
              key={m.key}
              onPress={() => setPaymentMethod(m.key)}
              style={[styles.payOption, selected && { borderColor: BLUE, backgroundColor: '#F0F7FF' }]}
            >
              <View style={[styles.payRadio, selected && { borderColor: BLUE }]}>
                {selected && <View style={styles.payRadioInner} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payName}>{m.name}</Text>
                <Text style={styles.payDesc}>{m.desc}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  )), [selectedRooms, nights, promoCode, appliedPromo, promoLoading, promoDiscount, tax, total, checkIn, paymentMethod]);

  // ── Bottom bar ──
  const BottomBar = useMemo(() => memo(() => (
    <View style={styles.bottomBar}>
      <View style={styles.bottomPrice}>
        <Text style={styles.bottomTotalLabel}>Total</Text>
        <Text style={styles.bottomTotalVal}>NPR {total.toLocaleString()}</Text>
      </View>
      <View style={styles.bottomBtns}>
        {step > 0 && (
          <TouchableOpacity onPress={() => setStep((step - 1) as Step)} style={styles.btnBack}>
            <Text style={styles.btnBackText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={step === 2 ? handleComplete : handleNext}
          style={[styles.btnNext, step === 2 && styles.btnNextConfirm]}
          disabled={isSubmitting || isProcessing}
        >
          {isSubmitting || isProcessing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.btnNextText}>
              {step === 2 ? 'Complete booking' : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )), [step, total, isSubmitting, isProcessing]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={NAVY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking</Text>
        <View style={{ width: 36 }} />
      </View>

      <ProgressHeader />

      {step === 0 && <StepRooms />}
      {step === 1 && <StepDetails />}
      {step === 2 && <StepPayment />}

      <BottomBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: NAVY },

  // Progress
  progress: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  progressItem: { alignItems: 'center', width: 72 },
  progressDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  progressDotActive: { backgroundColor: BLUE },
  progressDotDone: { backgroundColor: TEAL },
  progressNum: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
  progressNumActive: { color: '#FFF' },
  progressLabel: { fontSize: 9, color: '#94A3B8', textAlign: 'center' },
  progressLabelActive: { color: NAVY, fontWeight: '600' },
  progressLine: { flex: 1, height: 2, backgroundColor: '#E2E8F0', marginBottom: 16, marginHorizontal: -4 },
  progressLineDone: { backgroundColor: TEAL },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 140, gap: 12 },

  // Steps
  stepTitle: { fontSize: 20, fontWeight: '700', color: NAVY, letterSpacing: -0.3 },
  stepSub: { fontSize: 13, color: '#94A3B8', marginTop: -6, marginBottom: 4 },

  // Loading / Empty
  loadingBox: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  loadingText: { fontSize: 13, color: '#94A3B8' },
  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, color: '#94A3B8' },

  // Room cards
  roomCard: { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', overflow: 'hidden' },
  roomCardSelected: { borderColor: BLUE, backgroundColor: '#F0F7FF' },
  roomImage: { width: '100%', height: 140 },
  roomBody: { padding: 14, gap: 8 },
  roomTop: { flexDirection: 'row', alignItems: 'flex-start' },
  roomName: { fontSize: 16, fontWeight: '700', color: NAVY },
  roomMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  roomPriceBox: { alignItems: 'flex-end' },
  roomPrice: { fontSize: 16, fontWeight: '700', color: TEAL },
  roomPerNight: { fontSize: 11, color: '#94A3B8' },
  roomBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  roomBadgeText: { fontSize: 12, color: TEAL, fontWeight: '500' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  qtyLabel: { fontSize: 12, color: '#94A3B8' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  qtyBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  qtyVal: { fontSize: 16, fontWeight: '700', color: NAVY, minWidth: 24, textAlign: 'center' },
  qtyTotal: { fontSize: 14, fontWeight: '700', color: TEAL },

  // Fields
  field: { gap: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: NAVY },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#0F172A' },
  inputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  errorText: { fontSize: 11, color: '#EF4444' },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  selectText: { fontSize: 15, color: '#0F172A' },

  // Promo
  promoBox: { gap: 6 },
  promoRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  promoBtn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10, backgroundColor: BLUE },
  promoBtnText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  promoApplied: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, backgroundColor: '#F0FFF4', borderWidth: 1, borderColor: '#BBF7D0' },
  promoCode: { fontSize: 14, fontWeight: '600', color: TEAL, flex: 1 },
  promoDiscount: { fontSize: 14, fontWeight: '600', color: '#DC2626' },

  // Price
  priceBox: { padding: 16, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', gap: 6 },
  priceTitle: { fontSize: 15, fontWeight: '700', color: NAVY, marginBottom: 4 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceLabel: { fontSize: 13, color: '#64748B', flex: 1 },
  priceVal: { fontSize: 13, fontWeight: '600', color: NAVY },
  priceDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 4 },
  priceTotalLabel: { fontSize: 16, fontWeight: '700', color: NAVY },
  priceTotalVal: { fontSize: 18, fontWeight: '700', color: TEAL },

  // Cancel
  cancelBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, backgroundColor: '#F0FFF4', borderWidth: 1, borderColor: '#BBF7D0' },
  cancelTitle: { fontSize: 13, fontWeight: '600', color: NAVY },
  cancelDesc: { fontSize: 12, color: '#64748B', marginTop: 2 },

  // Payment method
  payBox: { gap: 8 },
  payOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E2E8F0' },
  payRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  payRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: BLUE },
  payName: { fontSize: 14, fontWeight: '600', color: NAVY },
  payDesc: { fontSize: 12, color: '#64748B', marginTop: 1 },

  // Bottom bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: Platform.OS === 'ios' ? 36 : 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0', gap: 10 },
  bottomPrice: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bottomTotalLabel: { fontSize: 13, color: '#64748B' },
  bottomTotalVal: { fontSize: 20, fontWeight: '700', color: NAVY },
  bottomBtns: { flexDirection: 'row', gap: 10 },
  btnBack: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#F1F5F9' },
  btnBackText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  btnNext: { flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: BLUE },
  btnNextConfirm: { backgroundColor: TEAL },
  btnNextText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
