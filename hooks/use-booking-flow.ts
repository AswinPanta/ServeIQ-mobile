import { useState, useMemo, useEffect, useRef } from 'react';
import { Alert, Platform, type AlertButton } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useBookings } from '@/lib/context/booking-context';
import { useAuth } from '@/lib/context/auth-context';
import type { GuestProfile } from '@/types/api';
import { bookingApi } from '@/lib/api/booking-api';
import { toDateParam, KHALTI_RETURN_URL_BASE } from '@/constants/api-config';
import { searchHotelsApi, getAvailableRoomsApi, type AvailableRoom } from '@/lib/api';
import type { BookingReservationResponse, ConfirmPaymentRequest, ConfirmPaymentResponse } from '@/types/api';
import type {
  SdkStripeOptions,
  SdkRazorpayOptions,
  SdkKhaltiOptions,
} from '@/components/feature/sdk-payment-checkout';
import {
  calculateNights, isPaymentVerified,
  GATEWAYS_WITH_SDK, IS_EXPO_GO,
  STRIPE_PUBLISHABLE_KEY, RAZORPAY_KEY_ID, KHALTI_PUBLIC_KEY, KHALTI_ENVIRONMENT,
  PAYMENT_METHODS,
} from '@/components/booking/constants';
import type { Step, SelectedRoom, GuestInfo } from '@/components/booking/constants';

export function useBookingFlow() {
  const params = useLocalSearchParams();
  const hotelName = (params.hotelName as string) || 'Hotel';
  const propertyId = (params.propertyId as string || params.id as string) || '';
  const currency = (params.currency as string) || 'NPR';
  const checkIn = toDateParam(params.checkIn as string);
  const checkOut = toDateParam(params.checkOut as string);
  // Guest split: the search modal and detail page pass adults + children
  // separately. Fall back to the legacy single `guests` total (all adults).
  const adults = Math.max(1, parseInt((params.adults as string) || (params.guests as string) || '2', 10) || 1);
  const children = Math.max(0, parseInt((params.children as string) || '0', 10) || 0);
  const guests = adults + children;
  const preselectedRoomId = params.roomId as string | undefined;
  // Multiple rooms pre-selected from room-select page (JSON array of {id, qty})
  const preselectedRoomIds = useMemo(() => {
    try {
      const raw = params.roomIds as string | undefined;
      if (!raw) return [];
      const parsed = JSON.parse(raw) as { id: string; qty: number }[];
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }, [params.roomIds]);
  const nights = useMemo(() => calculateNights(checkIn, checkOut), [checkIn, checkOut]);

  const { user } = useAuth();
  const guestUser = user as GuestProfile | null;

  // Build a redirect back to this booking (with selections) after login/registration
  const buildRedirect = () => {
    const q = new URLSearchParams();
    if (hotelName) q.set('hotelName', hotelName);
    if (propertyId) q.set('propertyId', propertyId);
    if (checkIn) q.set('checkIn', checkIn);
    if (checkOut) q.set('checkOut', checkOut);
    q.set('guests', String(guests));
    q.set('adults', String(adults));
    q.set('children', String(children));
    if (preselectedRoomId) q.set('roomId', preselectedRoomId);
    return `/booking-flow?${q.toString()}`;
  };
  const openLogin = () => router.push({ pathname: '/(auth)/login', params: { portal: 'guest', redirect: buildRedirect() } });
  const openRegister = () => router.push({ pathname: '/(auth)/register', params: { portal: 'guest', redirect: buildRedirect() } });

  const { addBooking } = useBookings();

  // ── State ──
  const [step, setStep] = useState<Step>(0);
  const [preselectMatched, setPreselectMatched] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<SelectedRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<SelectedRoom[]>([]);
  const [resolvedPropertyId, setResolvedPropertyId] = useState(propertyId);

  const [guestInfo, setGuestInfo] = useState({ firstName: '', lastName: '', email: '', phone: '', country: 'Nepal', specialRequests: '' });
  const [guestErrors, setGuestErrors] = useState<Record<string, string>>({});

  const [paymentMethod, setPaymentMethod] = useState<'dummy' | 'stripe' | 'khalti' | 'razorpay' | 'esewa'>('khalti');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const [bookingResult, setBookingResult] = useState<BookingReservationResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // ── Hosted checkout (WebView) ──
  // For real gateways we open the gateway's payment_url and only confirm the
  // booking AFTER the user completes payment — never before. The resolver ref
  // lets the modal (rendered at the bottom) hand control back to handleComplete.
  const [checkout, setCheckout] = useState<{ url: string; gateway: string } | null>(null);
  const checkoutResolverRef = useRef<((ok: boolean, params: Record<string, string>) => void) | null>(null);
  // Native-SDK checkout (Stripe PaymentSheet / Razorpay sheet) — same resolver
  // pattern as the WebView modal: SdkPaymentCheckout hands control back to
  // handleComplete only after the guest actually paid (or cancelled).
  const [sdkCheckout, setSdkCheckout] = useState<{
    gateway: 'stripe' | 'razorpay' | 'khalti';
    options: SdkStripeOptions | SdkRazorpayOptions | SdkKhaltiOptions;
  } | null>(null);
  const sdkResolverRef = useRef<((ok: boolean, params: Record<string, string>, message?: string) => void) | null>(null);
  // Khalti only accepts return_urls starting with the backend's configured base
  // (KHALTI_RETURN_URL_BASE), so we use it for both the intent call and the
  // WebView's completion-detection prefix (Khalti redirects here after payment).
  const returnUrlPrefix = KHALTI_RETURN_URL_BASE;

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
        specialRequests: '',
      });
    }
  }, [guestUser]);

  // ── Fetch available rooms ──
  // Takes an isCancelled() callback so the effect's cleanup flag actually stops
  // stale responses from overwriting newer data (prevents setState races).
  const fetchRooms = async (isCancelled: () => boolean = () => false) => {
    try {
      if (!isCancelled()) { setIsLoading(true); setRoomsError(null); }

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
          if (!isCancelled()) setResolvedPropertyId(match.id);
        }
      }

      if (!pid || !checkIn || !checkOut) {
        if (!isCancelled()) {
          setRoomsError('Missing property or dates. Please go back and try again.');
          setIsLoading(false);
        }
        return;
      }

      const rooms = await getAvailableRoomsApi(pid, checkIn, checkOut);
      if (isCancelled()) return;

      // Count how many rooms of each type are available from the backend.
      const typeCountMap = new Map<string, number>();
      for (const r of rooms) {
        const t = r.room_type || 'Standard';
        typeCountMap.set(t, (typeCountMap.get(t) || 0) + 1);
      }

      const mapped: SelectedRoom[] = rooms.map((r: AvailableRoom) => {
        const roomType = r.room_type || 'Standard';
        return {
          id: r.id,
          name: r.room_name,
          roomType,
          bedType: r.bed_type || 'Queen',
          price: parseFloat(r.base_rate) || 0,
          maxAdults: r.max_adults,
          maxChildren: r.max_children,
          image: r.photos?.cover || '',
          cancellation: r.cancellation_title || 'Free cancellation',
          cancellationDesc: r.cancellation_description || 'Cancel up to 24 hours before check-in',
          quantity: 0,
          maxQuantity: typeCountMap.get(roomType) || 1,
        };
      });

      if (!isCancelled()) setAvailableRooms(mapped);

      // Auto-select preselected rooms from room-select page (multiple rooms)
      if (preselectedRoomIds.length > 0 && !isCancelled()) {
        const preselected = preselectedRoomIds
          .map(p => mapped.find(r => r.id === p.id))
          .filter((r): r is SelectedRoom => !!r)
          .map(r => ({ ...r, quantity: preselectedRoomIds.find(p => p.id === r.id)?.qty || 1 }));
        if (preselected.length > 0) {
          setSelectedRooms(preselected);
          setPreselectMatched(true);
          setStep(prev => (prev === 0 ? 1 : prev));
        } else {
          setPreselectMatched(false);
        }
      // Single room preselected from hotel detail page
      } else if (preselectedRoomId && !isCancelled()) {
        const pre = mapped.find(r => r.id === preselectedRoomId);
        if (pre && (pre.maxAdults ?? 0) >= adults && (pre.maxChildren ?? 0) >= children) {
          setSelectedRooms([{ ...pre, quantity: 1 }]);
          setPreselectMatched(true);
          setStep(prev => (prev === 0 ? 1 : prev));
        } else {
          setPreselectMatched(false);
        }
      }
    } catch (err: any) {
      if (!isCancelled()) setRoomsError(err?.message || 'Failed to load rooms. Please try again.');
    } finally {
      if (!isCancelled()) setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetchRooms(() => cancelled);
    return () => { cancelled = true; };
  }, [propertyId, hotelName, checkIn, checkOut, preselectedRoomId, preselectedRoomIds]);

  // ── Room selection handlers ──
  const toggleRoom = (room: SelectedRoom) => {
    setSelectedRooms(prev => {
      const existing = prev.find(r => r.id === room.id);
      if (existing) return prev.filter(r => r.id !== room.id);
      // Check if adding this room would exceed the type's available count
      const typeTotal = prev
        .filter(r => r.roomType === room.roomType)
        .reduce((sum, r) => sum + r.quantity, 0);
      const max = room.maxQuantity ?? Infinity;
      if (typeTotal >= max) return prev;
      return [...prev, { ...room, quantity: 1 }];
    });
  };

  const updateQuantity = (roomId: string, delta: number) => {
    setSelectedRooms(prev => {
      const existing = prev.find(r => r.id === roomId);
      if (!existing) return prev;
      const newQty = existing.quantity + delta;
      if (newQty <= 0) return prev.filter(r => r.id !== roomId);
      // Cap at maxQuantity for this room type (total across all rooms of same type).
      const typeTotal = prev
        .filter(r => r.roomType === existing.roomType && r.id !== roomId)
        .reduce((sum, r) => sum + r.quantity, 0) + newQty;
      const max = existing.maxQuantity ?? Infinity;
      if (typeTotal > max) return prev;
      return prev.map(r => r.id === roomId ? { ...r, quantity: newQty } : r);
    });
  };

  // ── Price calculation ──
  const roomSubtotal = useMemo(() =>
    selectedRooms.reduce((sum, r) => sum + r.price * r.quantity * nights, 0),
    [selectedRooms, nights]
  );
  const promoDiscount = appliedPromo?.discount || 0;
  // Server-authoritative pricing: the backend charges subtotal − discounts and
  // does not add a separate tax line (reference behavior — taxes are included),
  // so the client total is kept in line with the charged total_amount.
  const total = Math.max(0, roomSubtotal - promoDiscount);

  // ── Capacity validation ──
  // Mirror the backend's rule (BookingService.create_booking): each selected
  // room must fit ceil(adults / room_count) adults AND ceil(children / room_count)
  // children, otherwise POST /bookings/ is rejected with "One or more selected
  // rooms cannot accommodate the requested guests". Checking it client-side
  // keeps the guest on the room step instead of a failed booking (whose
  // fallback mock then breaks the payment intent with "Booking not found").
  const capacityError = useMemo(() => {
    const roomCount = selectedRooms.reduce((sum, r) => sum + r.quantity, 0);
    if (roomCount === 0) return null;
    const adultsPerRoom = Math.ceil(adults / roomCount);
    const childrenPerRoom = Math.ceil(children / roomCount);
    // ?? 0 keeps parity with the backend: a room with missing/zero capacity is
    // undersized (undefined would otherwise fail the comparison and slip past).
    const undersized = selectedRooms.find(
      r => (r.maxAdults ?? 0) < adultsPerRoom || (r.maxChildren ?? 0) < childrenPerRoom
    );
    if (!undersized) return null;
    const fits =
      `fits up to ${undersized.maxAdults ?? 0} adult${(undersized.maxAdults ?? 0) === 1 ? '' : 's'}` +
      ((undersized.maxChildren ?? 0) > 0 ? ` + ${undersized.maxChildren ?? 0} child${(undersized.maxChildren ?? 0) > 1 ? 'ren' : ''}` : '');
    const bookingFor =
      `booking for ${adults} adult${adults === 1 ? '' : 's'}` +
      (children > 0 ? ` + ${children} child${children > 1 ? 'ren' : ''}` : '') +
      ` (${adultsPerRoom} adult${adultsPerRoom === 1 ? '' : 's'}` +
      (childrenPerRoom > 0 ? ` + ${childrenPerRoom} child${childrenPerRoom > 1 ? 'ren' : ''}` : '') + ' per room)';
    return `${undersized.name} ${fits}, but you're ${bookingFor}. Pick a larger room or reduce the guest count.`;
  }, [selectedRooms, adults, children]);

  // ── Validation ──
  const validateGuest = (): boolean => {
    const e: Record<string, string> = {};
    if (!guestInfo.firstName.trim()) e.firstName = 'Required';
    // LastName is optional — many cultures use single-word names
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
    if (step === 0 && capacityError) {
      Alert.alert('Room Capacity', capacityError);
      return;
    }
    if (step === 1 && !validateGuest()) return;
    setStep((step + 1) as Step);
  };

  // ── Create the booking if it doesn't exist yet (promo codes need a real ref) ──
  // An in-flight promise is reused so rapid Apply/Complete taps can never create
  // two bookings (idempotent even though the bookingResult state hasn't updated).
  const bookingPromiseRef = useRef<Promise<BookingReservationResponse> | null>(null);
  const ensureBooking = async (pid: string): Promise<BookingReservationResponse> => {
    if (bookingResult?.ref_number) return bookingResult;
    if (bookingPromiseRef.current) return bookingPromiseRef.current;
    const promise = (async () => {
      const idempotencyKey = `bk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const result = await bookingApi.createBooking(
        {
          idempotency_key: idempotencyKey,
          property_id: pid,
          room_ids: selectedRooms.flatMap(r => Array(r.quantity).fill(r.id)),
          check_in: checkIn,
          check_out: checkOut,
          adults,
          children,
          special_requests: guestInfo.specialRequests || undefined,
        },
        () => ({
          booking_id: 'BK' + Date.now(),
          ref_number: 'BK-' + new Date().toISOString().slice(0, 10) + '-' + Math.floor(Math.random() * 999),
          status: 'pending_payment',
          number_of_adults: adults,
          number_of_children: children,
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
      return result;
    })().finally(() => {
      bookingPromiseRef.current = null;
    });
    bookingPromiseRef.current = promise;
    return promise;
  };

  // ── Apply promo code — creates the booking on demand so the code can be
  //    applied server-side (matches the reference ReservePage flow) ──
  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    if (!user) {
      openLogin();
      return;
    }
    const pid = resolvedPropertyId;
    if (!pid) {
      Alert.alert('Error', 'Could not identify the property. Please go back and try again.');
      return;
    }
    if (capacityError) {
      Alert.alert('Room Capacity', capacityError);
      return;
    }
    setPromoLoading(true);
    try {
      const created = await ensureBooking(pid);
      const updated = await bookingApi.applyDiscount(created.ref_number, code, () => created);
      setAppliedPromo({ code, discount: updated.coupon_discount || 0 });
      setBookingResult(updated);
    } catch {
      Alert.alert('Invalid Code', 'This promo code is not valid or has expired');
    } finally {
      setPromoLoading(false);
    }
  };

  // ── Confirm payment with retry — the Render backend can cold-start mid-flow ──
  const confirmWithRetry = async (ref: string, payload: ConfirmPaymentRequest): Promise<ConfirmPaymentResponse> => {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await bookingApi.confirmPaymentStrict(ref, payload);
      } catch (err) {
        lastError = err;
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }
    throw lastError;
  };

  // ── Complete booking: create → apply-discount → payment-intent → confirm ──
  const handleComplete = async () => {
    if (isSubmitting || isProcessing || promoLoading) return;
    if (!user) {
      openLogin();
      return;
    }
    if (capacityError) {
      Alert.alert('Room Capacity', capacityError);
      return;
    }
    setIsSubmitting(true);

    try {
      const pid = resolvedPropertyId;
      if (!pid) {
        Alert.alert('Error', 'Could not identify the property. Please go back and try again.');
        setIsSubmitting(false);
        return;
      }

      // Step 1: Create booking (reuses the one created for a promo code)
      let finalBooking = await ensureBooking(pid);
      const ref = finalBooking.ref_number;

      // Step 2: Apply a typed-but-unapplied promo code before payment
      let finalDiscount = appliedPromo?.discount || 0;
      const pendingPromo = promoCode.trim().toUpperCase();
      if (pendingPromo && !appliedPromo) {
        try {
          const updated = await bookingApi.applyDiscount(ref, pendingPromo, () => finalBooking);
          finalBooking = updated;
          finalDiscount = updated.coupon_discount || 0;
          setAppliedPromo({ code: pendingPromo, discount: finalDiscount });
          setBookingResult(updated);
        } catch {
          // Invalid code — continue without a discount
        }
      }

      // Server owns the money: prefer the booking's subtotal/total_amount over
      // client-side estimates so the receipt matches what is actually charged.
      const serverSubtotal = finalBooking.subtotal ?? roomSubtotal;
      const finalTotal = finalBooking.total_amount ?? Math.max(0, serverSubtotal - finalDiscount);

      setIsSubmitting(false);
      setIsProcessing(true);

      // Step 3: Create payment intent
      const paymentIntent = await bookingApi.createPaymentIntent(
        ref,
        {
          payment_gateway: paymentMethod,
          // Khalti/eSewa require return_url to start with the backend's
          // configured base — the WebView intercepts the redirect to it after
          // payment and hands control back with authoritative identifiers.
          ...(paymentMethod === 'khalti' || paymentMethod === 'esewa'
            ? { return_url: returnUrlPrefix }
            : {}),
        },
        () => ({
          ref_number: ref,
          payment_gateway: paymentMethod,
          amount: finalTotal,
          currency: 'NPR',
        }),
      );

      // Build the gateway payload the backend verifies against.
      const gatewayPayload: Record<string, unknown> =
        paymentMethod === 'dummy'
          ? {}
          : paymentMethod === 'khalti'
            ? (paymentIntent.pidx ? { pidx: paymentIntent.pidx } : paymentIntent.payment_intent_id ? { payment_intent_id: paymentIntent.payment_intent_id } : {})
            : paymentMethod === 'razorpay'
              ? (paymentIntent.order_id ? { order_id: paymentIntent.order_id } : {})
              : (paymentIntent.payment_intent_id ? { payment_intent_id: paymentIntent.payment_intent_id } : {});

      // Step 4: Real gateways require an actual checkout — the guest enters
      // credentials and pays BEFORE the booking is confirmed:
      //  - Khalti: native SDK preferred (development build + public key);
      //    otherwise the hosted payment_url opens in an in-app WebView.
      //  - Stripe/Razorpay: native SDK checkout (PaymentSheet / Razorpay sheet)
      //    — the backend returns no hosted URL for these, so the SDK must be
      //    able to run HERE, otherwise we explain and stop.
      // The demo gateway skips straight to confirm (no real charge).
      let checkoutParams: Record<string, string> = {};
      if (paymentMethod !== 'dummy') {
        // Khalti: if backend omits payment_url, construct the hosted checkout
        // URL from the pidx so the WebView fallback works in Expo Go / web.
        const khaltiHostedBase =
          KHALTI_ENVIRONMENT === 'PROD'
            ? 'https://khalti.com/#/payment'
            : 'https://test.khalti.com/#/payment';
        const checkoutUrl =
          paymentIntent.payment_url ||
          (paymentMethod === 'khalti' && paymentIntent.pidx
            ? `${khaltiHostedBase}/${paymentIntent.pidx}`
            : undefined);
        const isSdkGateway = GATEWAYS_WITH_SDK.includes(paymentMethod);
        const sdkReady =
          isSdkGateway &&
          Platform.OS !== 'web' &&
          !IS_EXPO_GO &&
          (paymentMethod === 'stripe'
            ? !!STRIPE_PUBLISHABLE_KEY && !!paymentIntent.client_secret
            : paymentMethod === 'razorpay'
              ? !!RAZORPAY_KEY_ID && !!paymentIntent.order_id
              : !!KHALTI_PUBLIC_KEY && !!paymentIntent.pidx);

        if (!sdkReady && !checkoutUrl && paymentMethod !== 'esewa') {
          setIsProcessing(false);
          // Graceful note: the backend returns no hosted checkout URL for this
          // gateway and its native SDK can't run HERE — never silently confirm
          // a payment that never happened.
          const note =
            paymentMethod === 'stripe'
              ? 'The backend returns a Stripe client_secret (no hosted URL) — card payments need the Stripe SDK.'
              : paymentMethod === 'razorpay'
                ? 'The backend returns a Razorpay order_id (no hosted URL) — Razorpay payments need its SDK.'
                : 'Khalti returned no hosted checkout URL and its native SDK cannot run here.';
          const hint =
            Platform.OS === 'web'
              ? 'Native SDKs don\'t run on web.'
              : IS_EXPO_GO
                ? 'Run a development build — Expo Go can\'t load native SDKs.'
                : 'Add the gateway\'s public key to .env (EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY / EXPO_PUBLIC_RAZORPAY_KEY_ID / EXPO_PUBLIC_KHALTI_PUBLIC_KEY) and rebuild.';
          const actions: AlertButton[] = [
            ...(paymentMethod !== 'khalti'
              ? [{ text: 'Use Khalti', onPress: () => setPaymentMethod('khalti') }]
              : []),
            { text: 'Use Test (Demo)', onPress: () => setPaymentMethod('dummy') },
            { text: 'OK' },
          ];
          Alert.alert(
            'Payment method unavailable',
            `${note}\n${hint}\n\nYour booking is saved — you can switch payment method and try again.`,
            actions,
          );
          return;
        }

        if (sdkReady) {
          // Native SDK checkout — Stripe PaymentSheet / Razorpay sheet /
          // Khalti wallet. Khalti prefers this over the hosted WebView when it
          // can run (development build + public key).
          const result = await new Promise<{ ok: boolean; params: Record<string, string>; message?: string }>((resolve) => {
            sdkResolverRef.current = (ok, params, message) => resolve({ ok, params, message });
            setSdkCheckout({
              gateway: paymentMethod as 'stripe' | 'razorpay' | 'khalti',
              options:
                paymentMethod === 'stripe'
                  ? {
                      publishableKey: STRIPE_PUBLISHABLE_KEY,
                      clientSecret: paymentIntent.client_secret as string,
                      paymentIntentId: paymentIntent.payment_intent_id,
                      merchantDisplayName: 'ServeIQ',
                    }
                  : paymentMethod === 'razorpay'
                    ? {
                        keyId: RAZORPAY_KEY_ID,
                        orderId: paymentIntent.order_id as string,
                        amount: finalTotal,
                        currency: paymentIntent.currency || 'NPR',
                        description: `${hotelName} · Booking ${ref}`,
                        prefillName: `${guestInfo.firstName} ${guestInfo.lastName}`.trim(),
                        email: guestInfo.email,
                        phone: guestInfo.phone,
                      }
                    : {
                        publicKey: KHALTI_PUBLIC_KEY,
                        pidx: paymentIntent.pidx as string,
                        environment: KHALTI_ENVIRONMENT,
                      },
            });
          });
          checkoutParams = result.params || {};
          if (!result.ok) {
            setIsProcessing(false);
            if (result.message) {
              // The SDK couldn't run here (Expo Go / web / missing key) —
              // graceful note with a working alternative.
              const actions: AlertButton[] = [
                ...(paymentMethod !== 'khalti'
                  ? [{ text: 'Use Khalti', onPress: () => setPaymentMethod('khalti') }]
                  : []),
                { text: 'Use Test (Demo)', onPress: () => setPaymentMethod('dummy') },
                { text: 'OK' },
              ];
              Alert.alert(
                'Payment method unavailable',
                `${result.message}\n\nYour booking is saved — switch to Khalti or Test (Demo) to continue.`,
                actions,
              );
            } else {
              Alert.alert('Payment Cancelled', 'Your booking is saved. Complete the payment from your bookings to confirm it.');
            }
            return;
          }
        } else if (checkoutUrl) {
          // Hosted checkout (Khalti) — in-app WebView fallback for Expo Go,
          // web, or when no Khalti public key is configured. (If both the SDK
          // and a hosted URL are missing, the guard above already returned.)
          const gatewayName = PAYMENT_METHODS.find(m => m.key === paymentMethod)?.name || paymentMethod;
          const result = await new Promise<{ ok: boolean; params: Record<string, string> }>((resolve) => {
            checkoutResolverRef.current = (ok, params) => resolve({ ok, params });
            setCheckout({ url: checkoutUrl, gateway: gatewayName });
            // Safety net: if the modal ever fails to mount, never leave the
            // button spinning forever — auto-cancel after 15 minutes.
            setTimeout(() => {
              if (checkoutResolverRef.current) {
                checkoutResolverRef.current(false, {});
                checkoutResolverRef.current = null;
              }
            }, 15 * 60 * 1000);
          });
          checkoutParams = result.params || {};
          if (!result.ok) {
            setIsProcessing(false);
            Alert.alert('Payment Cancelled', 'Your booking is saved. Complete the payment from your bookings to confirm it.');
            return;
          }
        } else if (paymentMethod === 'esewa') {
          // eSewa — the live backend has no real integration yet and returns no
          // hosted payment_url, so (like the reference web app) we render a
          // local sandbox checkout that mimics the eSewa wallet flow. The
          // confirm step still verifies server-side against the payment intent.
          const result = await new Promise<{ ok: boolean; params: Record<string, string> }>((resolve) => {
            checkoutResolverRef.current = (ok, params) => resolve({ ok, params });
            setCheckout({ url: '', gateway: 'eSewa' });
            setTimeout(() => {
              if (checkoutResolverRef.current) {
                checkoutResolverRef.current(false, {});
                checkoutResolverRef.current = null;
              }
            }, 15 * 60 * 1000);
          });
          checkoutParams = result.params || {};
          if (!result.ok) {
            setIsProcessing(false);
            Alert.alert('Payment Cancelled', 'Your booking is saved. Complete the payment from your bookings to confirm it.');
            return;
          }
        }
      }

      // Prefer the gateway-returned identifiers from the checkout redirect
      // (Khalti appends the authoritative pidx; a future Stripe/Razorpay
      // hosted page would append payment_id + signature / payment_intent_id)
      // over the intent response.
      for (const k of ['pidx', 'payment_intent_id', 'order_id', 'payment_id', 'signature'] as const) {
        if (checkoutParams[k]) gatewayPayload[k] = checkoutParams[k];
      }

      const confirmRes = await confirmWithRetry(ref, {
        idempotency_key: `pay-${finalBooking.booking_id || ref}-${Date.now().toString(36)}`,
        gateway_payload: gatewayPayload,
      });

      // Step 5: Only a verified payment may land on the "confirmed / paid" screen
      if (!isPaymentVerified(confirmRes.status)) {
        setIsProcessing(false);
        Alert.alert(
          'Payment Not Verified',
          confirmRes.message || 'We could not verify your payment. Your booking is saved — retry payment from your bookings or contact support.',
        );
        return;
      }

      // Save to local context
      addBooking({
        id: finalBooking.booking_id || finalBooking.ref_number,
        hotelId: resolvedPropertyId,
        hotelName,
        hotelCity: finalBooking.property?.city || '',
        hotelCountry: finalBooking.property?.country || '',
        hotelImage: selectedRooms[0]?.image || '',
        checkIn,
        checkOut,
        roomTypeName: selectedRooms.map(r => r.name).join(', '),
        guests,
        totalPrice: finalTotal,
        ...(finalDiscount > 0 && finalBooking.coupon_code ? {
          discountApplied: { code: finalBooking.coupon_code, type: 'percentage' as const, amount: finalDiscount },
        } : {}),
      });

      // Navigate to confirmation
      router.replace({
        pathname: '/booking-confirmation',
        params: {
          bookingId: finalBooking.booking_id,
          confirmationCode: ref,
          hotelName,
          hotelImage: selectedRooms[0]?.image || '',
          hotelCity: finalBooking.property?.city || '',
          roomType: selectedRooms.map(r => r.name).join(', '),
          checkIn,
          checkOut,
          nights: String(nights),
          guests: String(guests),
          rooms: selectedRooms.map(r => `${r.name} x${r.quantity}`).join(', '),
          subtotal: String(serverSubtotal),
          tax: String(0),
          discount: String(finalDiscount),
          total: String(finalTotal),
          guestName: `${guestInfo.firstName} ${guestInfo.lastName}`.trim(),
          guestEmail: guestInfo.email,
          guestPhone: guestInfo.phone,
          guestCountry: guestInfo.country,
          bedTypes: selectedRooms.map(r => r.bedType).join(', '),
        },
      });
    } catch (error: any) {
      setIsProcessing(false);
      const msg = error?.message || 'An unexpected error occurred. Please try again.';
      Alert.alert('Booking Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Progress indicator ──
  // When a room was already picked on the hotel detail page we skip the room
  // step, so the header collapses to "Your details → Finish booking".
  const stepLabels = preselectMatched
    ? ['Your details', 'Finish booking']
    : ['Select rooms', 'Your details', 'Finish booking'];
  const displayStep = preselectMatched ? (step === 0 ? 0 : step - 1) : step;

  // ── Callbacks passed to step components ──────────
  const onFieldChange = (field: keyof GuestInfo, value: string) => setGuestInfo(p => ({ ...p, [field]: value }));
  const onClearError = (field: string) => setGuestErrors(p => ({ ...p, [field]: '' }));
  const onChangeRoom = () => { setPreselectMatched(false); setStep(0); };
  const onClearPromo = () => { setAppliedPromo(null); setPromoCode(''); };
  const onBack = () => {
    if (step - 1 === 0) setPreselectMatched(false);
    setStep((step - 1) as Step);
  };

  // ── Checkout modal handlers (resolve the pending payment promise) ──
  const handleCheckoutComplete = (params: Record<string, string>) => {
    checkoutResolverRef.current?.(true, params);
    checkoutResolverRef.current = null;
    setCheckout(null);
  };
  const handleCheckoutCancel = () => {
    checkoutResolverRef.current?.(false, {});
    checkoutResolverRef.current = null;
    setCheckout(null);
  };
  const handleSdkComplete = (params: Record<string, string>) => {
    sdkResolverRef.current?.(true, params);
    sdkResolverRef.current = null;
    setSdkCheckout(null);
  };
  const handleSdkCancel = (message?: string) => {
    sdkResolverRef.current?.(false, {}, message);
    sdkResolverRef.current = null;
    setSdkCheckout(null);
  };

  return {
    user, guestUser,
    openLogin, openRegister,
    step,
    currency,
    preselectMatched,
    stepLabels, displayStep,
    isLoading, roomsError, availableRooms, selectedRooms, nights,
    onRetry: fetchRooms,
    onToggleRoom: toggleRoom,
    onUpdateQuantity: updateQuantity,
    guestInfo, guestErrors,
    onFieldChange, onClearError, onChangeRoom,
    paymentMethod,
    onSelectPaymentMethod: setPaymentMethod,
    promoCode, onPromoCodeChange: setPromoCode,
    appliedPromo, onApplyPromo: handleApplyPromo, promoLoading, onClearPromo,
    promoDiscount, total, checkIn,
    isSubmitting, isProcessing,
    onBack, onNext: handleNext, onComplete: handleComplete,
    checkout, sdkCheckout,
    handleCheckoutComplete, handleCheckoutCancel,
    handleSdkComplete, handleSdkCancel,
    returnUrlPrefix,
  };
}
