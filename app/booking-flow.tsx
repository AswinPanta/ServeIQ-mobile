import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { CheckoutTimer } from '@/components/feature/checkout-timer';
import { DiscountCodeInput } from '@/components/feature/discount-code-input';
import type { DiscountCode } from '@/lib/mock/discount-codes';

type BookingStep = 'rooms' | 'guests' | 'addons' | 'review' | 'payment';

interface RoomOption {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  capacity: number;
  amenities: string[];
  image: string;
  quantity: number;
}

interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  icon: string;
  selected: boolean;
}

function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 1;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function BookingFlowScreen() {
  const colors = useColors();
  const params = useLocalSearchParams();
  const hotelId = params.id as string;
  const hotelName = (params.hotelName as string) || 'Hotel';
  const checkInDate = (params.checkIn as string) || '';
  const checkOutDate = (params.checkOut as string) || '';
  const guestCount = parseInt((params.guests as string) || '1', 10);

  const nights = useMemo(() => calculateNights(checkInDate, checkOutDate), [checkInDate, checkOutDate]);

  const [currentStep, setCurrentStep] = useState<BookingStep>('rooms');
  const [selectedRooms, setSelectedRooms] = useState<RoomOption[]>([]);
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [addOns, setAddOns] = useState<AddOn[]>([
    {
      id: 'breakfast',
      name: 'Breakfast Buffet',
      description: 'Daily breakfast for all guests',
      price: 1500,
      currency: 'NPR',
      icon: '🍳',
      selected: false,
    },
    {
      id: 'airport-transfer',
      name: 'Airport Transfer',
      description: 'Round-trip airport pickup & drop',
      price: 3000,
      currency: 'NPR',
      icon: '🚗',
      selected: false,
    },
    {
      id: 'early-checkin',
      name: 'Early Check-in',
      description: 'Check in from 10:00 AM (subject to availability)',
      price: 1000,
      currency: 'NPR',
      icon: '⏰',
      selected: false,
    },
    {
      id: 'late-checkout',
      name: 'Late Check-out',
      description: 'Check out by 4:00 PM (subject to availability)',
      price: 1000,
      currency: 'NPR',
      icon: '🕐',
      selected: false,
    },
    {
      id: 'dinner',
      name: 'Dinner Package',
      description: 'Set dinner for all guests (per night)',
      price: 2500,
      currency: 'NPR',
      icon: '🍽️',
      selected: false,
    },
    {
      id: 'spa',
      name: 'Spa Voucher',
      description: '60-min massage & spa session',
      price: 4000,
      currency: 'NPR',
      icon: '💆',
      selected: false,
    },
  ]);
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet' | 'bank'>('card');
  const [timerExpired, setTimerExpired] = useState(false);
  const [discountCode, setDiscountCode] = useState<DiscountCode | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const AVAILABLE_ROOMS: RoomOption[] = [
    {
      id: '1',
      name: 'Standard Room',
      description: 'Comfortable room with modern amenities',
      price: 5000,
      currency: 'NPR',
      capacity: 2,
      amenities: ['WiFi', 'AC', 'TV', 'Bathroom'],
      image: 'https://via.placeholder.com/400x300?text=Standard+Room',
      quantity: 0,
    },
    {
      id: '2',
      name: 'Deluxe Room',
      description: 'Spacious room with premium amenities',
      price: 8000,
      currency: 'NPR',
      capacity: 2,
      amenities: ['WiFi', 'AC', 'TV', 'Bathroom', 'Mini Bar', 'Work Desk'],
      image: 'https://via.placeholder.com/400x300?text=Deluxe+Room',
      quantity: 0,
    },
    {
      id: '3',
      name: 'Suite',
      description: 'Luxurious suite with separate living area',
      price: 12000,
      currency: 'NPR',
      capacity: 4,
      amenities: ['WiFi', 'AC', 'TV', 'Bathroom', 'Mini Bar', 'Work Desk', 'Sofa', 'Balcony'],
      image: 'https://via.placeholder.com/400x300?text=Suite',
      quantity: 0,
    },
  ];

  const handleRoomQuantityChange = (roomId: string, change: number) => {
    setSelectedRooms((prev) => {
      const existing = prev.find((r) => r.id === roomId);
      if (existing) {
        const newQuantity = existing.quantity + change;
        if (newQuantity <= 0) {
          return prev.filter((r) => r.id !== roomId);
        }
        return prev.map((r) =>
          r.id === roomId ? { ...r, quantity: newQuantity } : r
        );
      } else if (change > 0) {
        const room = AVAILABLE_ROOMS.find((r) => r.id === roomId);
        return [...prev, { ...room!, quantity: 1 }];
      }
      return prev;
    });
  };

  const toggleAddOn = (addOnId: string) => {
    setAddOns((prev) =>
      prev.map((a) => (a.id === addOnId ? { ...a, selected: !a.selected } : a))
    );
  };

  const subtotal = useMemo(() => {
    const roomsTotal = selectedRooms.reduce((sum, room) => sum + room.price * room.quantity * nights, 0);
    const addOnsTotal = addOns
      .filter((a) => a.selected)
      .reduce((sum, a) => {
        if (a.id === 'dinner') return sum + a.price * nights;
        return sum + a.price;
      }, 0);
    return roomsTotal + addOnsTotal;
  }, [selectedRooms, addOns, nights]);

  const tax = useMemo(() => Math.round(subtotal * 0.13), [subtotal]);
  const totalBeforeDiscount = useMemo(() => subtotal + tax, [subtotal, tax]);
  const total = useMemo(() => Math.max(0, totalBeforeDiscount - discountAmount), [totalBeforeDiscount, discountAmount]);

  const handleNextStep = () => {
    if (currentStep === 'rooms') {
      if (selectedRooms.length === 0) {
        Alert.alert('Error', 'Please select at least one room');
        return;
      }
      setCurrentStep('guests');
    } else if (currentStep === 'guests') {
      if (!guestInfo.firstName || !guestInfo.lastName || !guestInfo.email || !guestInfo.phone) {
        Alert.alert('Error', 'Please fill in all guest details');
        return;
      }
      setCurrentStep('addons');
    } else if (currentStep === 'addons') {
      setCurrentStep('review');
    } else if (currentStep === 'review') {
      setCurrentStep('payment');
    }
  };

  const handlePreviousStep = () => {
    const steps: BookingStep[] = ['rooms', 'guests', 'addons', 'review', 'payment'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleCompleteBooking = () => {
    const bookingId = 'BK' + Date.now();
    router.push({
      pathname: '/booking-confirmation',
      params: {
        bookingId,
        hotelName,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights: String(nights),
        guests: String(guestCount),
        rooms: selectedRooms.map((r) => `${r.name} x${r.quantity}`).join(', '),
        total: String(total),
      },
    });
  };

  const steps: { key: BookingStep; label: string }[] = [
    { key: 'rooms', label: 'Rooms' },
    { key: 'guests', label: 'Guests' },
    { key: 'addons', label: 'Add-ons' },
    { key: 'review', label: 'Review' },
    { key: 'payment', label: 'Payment' },
  ];
  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const renderRoomSelection = () => (
    <View className="gap-4">
      <Text className="text-2xl font-bold text-foreground mb-2">Select Your Rooms</Text>

      {checkInDate && checkOutDate && (
        <View className="bg-primary/10 rounded-lg p-3 flex-row justify-between">
          <View>
            <Text className="text-xs text-muted">Check-in</Text>
            <Text className="text-sm font-semibold text-foreground">{checkInDate}</Text>
          </View>
          <View className="items-center">
            <Text className="text-xs text-muted">{nights} night{nights > 1 ? 's' : ''}</Text>
            <Text className="text-lg">→</Text>
          </View>
          <View className="items-end">
            <Text className="text-xs text-muted">Check-out</Text>
            <Text className="text-sm font-semibold text-foreground">{checkOutDate}</Text>
          </View>
        </View>
      )}

      {AVAILABLE_ROOMS.map((room) => (
        <View
          key={room.id}
          className="border border-border rounded-lg overflow-hidden bg-surface"
        >
          <Image
            source={{ uri: room.image }}
            className="w-full h-40 bg-surface"
          />

          <View className="p-4 gap-3">
            <View>
              <Text className="text-lg font-bold text-foreground">{room.name}</Text>
              <Text className="text-sm text-muted mt-1">{room.description}</Text>
            </View>

            <View className="flex-row flex-wrap gap-2">
              {room.amenities.map((amenity, idx) => (
                <View key={idx} className="bg-primary/10 rounded-full px-3 py-1">
                  <Text className="text-xs text-primary font-semibold">{amenity}</Text>
                </View>
              ))}
            </View>

            <View className="flex-row items-center justify-between pt-2 border-t border-border">
              <View>
                <Text className="text-sm text-muted">Per night</Text>
                <Text className="text-xl font-bold text-primary">
                  {room.currency} {room.price.toLocaleString()}
                </Text>
                {nights > 1 && (
                  <Text className="text-xs text-muted">
                    {nights} nights = {room.currency} {(room.price * nights).toLocaleString()}
                  </Text>
                )}
              </View>

              <View className="flex-row items-center gap-2 bg-surface border border-border rounded-lg p-1">
                <TouchableOpacity
                  onPress={() => handleRoomQuantityChange(room.id, -1)}
                  style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 4, backgroundColor: `${colors.primary}10` }}
                >
                  <Text className="text-lg font-bold text-primary">−</Text>
                </TouchableOpacity>
                <Text className="w-6 text-center font-bold text-foreground">
                  {selectedRooms.find((r) => r.id === room.id)?.quantity || 0}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRoomQuantityChange(room.id, 1)}
                  style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 4, backgroundColor: `${colors.primary}10` }}
                >
                  <Text className="text-lg font-bold text-primary">+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderGuestDetails = () => (
    <View className="gap-4">
      <Text className="text-2xl font-bold text-foreground mb-2">Guest Information</Text>

      <View className="gap-3">
        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">First Name *</Text>
          <TextInput
            placeholder="Enter first name"
            placeholderTextColor={colors.muted}
            value={guestInfo.firstName}
            onChangeText={(text) => setGuestInfo({ ...guestInfo, firstName: text })}
            className="px-4 py-3 rounded-lg border border-border bg-surface text-foreground"
          />
        </View>

        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">Last Name *</Text>
          <TextInput
            placeholder="Enter last name"
            placeholderTextColor={colors.muted}
            value={guestInfo.lastName}
            onChangeText={(text) => setGuestInfo({ ...guestInfo, lastName: text })}
            className="px-4 py-3 rounded-lg border border-border bg-surface text-foreground"
          />
        </View>

        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">Email *</Text>
          <TextInput
            placeholder="Enter email address"
            placeholderTextColor={colors.muted}
            value={guestInfo.email}
            onChangeText={(text) => setGuestInfo({ ...guestInfo, email: text })}
            keyboardType="email-address"
            className="px-4 py-3 rounded-lg border border-border bg-surface text-foreground"
          />
        </View>

        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">Phone Number *</Text>
          <TextInput
            placeholder="Enter phone number"
            placeholderTextColor={colors.muted}
            value={guestInfo.phone}
            onChangeText={(text) => setGuestInfo({ ...guestInfo, phone: text })}
            keyboardType="phone-pad"
            className="px-4 py-3 rounded-lg border border-border bg-surface text-foreground"
          />
        </View>
      </View>
    </View>
  );

  const renderAddOns = () => (
    <View className="gap-4">
      <Text className="text-2xl font-bold text-foreground mb-2">Enhance Your Stay</Text>
      <Text className="text-sm text-muted mb-2">
        Add extras to make your stay more comfortable (optional)
      </Text>

      <View className="gap-3">
        {addOns.map((addOn) => (
          <TouchableOpacity
            key={addOn.id}
            onPress={() => toggleAddOn(addOn.id)}
            style={{
              padding: 16,
              borderRadius: 8,
              borderWidth: 2,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderColor: addOn.selected ? colors.primary : colors.border,
              backgroundColor: addOn.selected ? `${colors.primary}10` : colors.surface,
            }}
          >
            <Text className="text-2xl">{addOn.icon}</Text>
            <View className="flex-1">
              <Text
                className={cn(
                  'font-semibold',
                  addOn.selected ? 'text-primary' : 'text-foreground'
                )}
              >
                {addOn.name}
              </Text>
              <Text className="text-xs text-muted mt-0.5">{addOn.description}</Text>
            </View>
            <View className="items-end">
              <Text
                className={cn(
                  'font-bold',
                  addOn.selected ? 'text-primary' : 'text-foreground'
                )}
              >
                {addOn.currency} {addOn.price.toLocaleString()}
              </Text>
              {addOn.id === 'dinner' && (
                <Text className="text-xs text-muted">per night</Text>
              )}
            </View>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 2,
                alignItems: 'center',
                justifyContent: 'center',
                borderColor: addOn.selected ? colors.primary : colors.border,
                backgroundColor: addOn.selected ? colors.primary : 'transparent',
              }}
            >
              {addOn.selected && <Text className="text-white font-bold text-xs">✓</Text>}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View>
        <Text className="text-sm font-semibold text-foreground mb-2">
          Special Requests (Optional)
        </Text>
        <TextInput
          placeholder="Any special requests..."
          placeholderTextColor={colors.muted}
          value={specialRequests}
          onChangeText={setSpecialRequests}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          className="px-4 py-3 rounded-lg border border-border bg-surface text-foreground"
        />
      </View>
    </View>
  );

  const renderReview = () => (
    <View className="gap-4">
      <Text className="text-2xl font-bold text-foreground mb-2">Review Your Booking</Text>

      <View className="bg-surface rounded-lg p-4 border border-border gap-2">
        <Text className="font-bold text-foreground">{hotelName}</Text>
        <View className="flex-row justify-between">
          <Text className="text-sm text-muted">Check-in</Text>
          <Text className="text-sm font-semibold text-foreground">{checkInDate}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-sm text-muted">Check-out</Text>
          <Text className="text-sm font-semibold text-foreground">{checkOutDate}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-sm text-muted">Duration</Text>
          <Text className="text-sm font-semibold text-foreground">{nights} night{nights > 1 ? 's' : ''}</Text>
        </View>
      </View>

      <View className="bg-surface rounded-lg p-4 border border-border gap-3">
        <Text className="font-bold text-foreground">Selected Rooms:</Text>
        {selectedRooms.map((room) => (
          <View key={room.id} className="flex-row justify-between items-center py-2 border-b border-border">
            <View>
              <Text className="font-semibold text-foreground">{room.name}</Text>
              <Text className="text-xs text-muted">
                {room.currency} {room.price.toLocaleString()} × {nights} nights × {room.quantity}
              </Text>
            </View>
            <Text className="font-bold text-primary">
              {room.currency} {(room.price * nights * room.quantity).toLocaleString()}
            </Text>
          </View>
        ))}
      </View>

      {addOns.filter((a) => a.selected).length > 0 && (
        <View className="bg-surface rounded-lg p-4 border border-border gap-3">
          <Text className="font-bold text-foreground">Add-ons:</Text>
          {addOns
            .filter((a) => a.selected)
            .map((addOn) => (
              <View key={addOn.id} className="flex-row justify-between items-center py-2 border-b border-border">
                <View className="flex-row items-center gap-2">
                  <Text>{addOn.icon}</Text>
                  <Text className="font-semibold text-foreground">{addOn.name}</Text>
                </View>
                <Text className="font-bold text-primary">
                  {addOn.currency} {(addOn.id === 'dinner' ? addOn.price * nights : addOn.price).toLocaleString()}
                </Text>
              </View>
            ))}
        </View>
      )}

      <View className="bg-surface rounded-lg p-4 border border-border gap-2">
        <Text className="font-bold text-foreground">Guest Information:</Text>
        <Text className="text-sm text-foreground">
          {guestInfo.firstName} {guestInfo.lastName}
        </Text>
        <Text className="text-sm text-muted">{guestInfo.email}</Text>
        <Text className="text-sm text-muted">{guestInfo.phone}</Text>
      </View>

      <DiscountCodeInput
        subtotal={subtotal}
        nights={nights}
        roomType={selectedRooms[0]?.name || 'standard'}
        onApply={(discount, amount) => {
          setDiscountCode(discount);
          setDiscountAmount(amount);
        }}
      />

      <View className="bg-primary/10 rounded-lg p-4 border border-primary/20 gap-2">
        <View className="flex-row justify-between">
          <Text className="text-foreground">Subtotal:</Text>
          <Text className="font-semibold text-foreground">
            NPR {subtotal.toLocaleString()}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-foreground">Taxes & Fees (13%):</Text>
          <Text className="font-semibold text-foreground">
            NPR {tax.toLocaleString()}
          </Text>
        </View>
        {discountAmount > 0 && (
          <View className="flex-row justify-between">
            <Text className="text-sm text-success">Discount ({discountCode?.code})</Text>
            <Text className="text-sm font-semibold text-success">
              - NPR {discountAmount.toLocaleString()}
            </Text>
          </View>
        )}
        <View className="flex-row justify-between border-t border-primary/20 pt-2">
          <Text className="font-bold text-foreground">Total:</Text>
          <Text className="font-bold text-primary text-lg">
            NPR {total.toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderPayment = () => (
    <View className="gap-4">
      <Text className="text-2xl font-bold text-foreground mb-2">Payment Method</Text>

      <View className="gap-3">
        {[
          { id: 'card', label: 'Credit/Debit Card', icon: '💳' },
          { id: 'wallet', label: 'Digital Wallet', icon: '📱' },
          { id: 'bank', label: 'Bank Transfer', icon: '🏦' },
        ].map((option) => (
          <TouchableOpacity
            key={option.id}
            onPress={() => setPaymentMethod(option.id as any)}
            style={{
              padding: 16,
              borderRadius: 8,
              borderWidth: 2,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderColor: paymentMethod === option.id ? colors.primary : colors.border,
              backgroundColor: paymentMethod === option.id ? `${colors.primary}10` : colors.surface,
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 2,
                alignItems: 'center',
                justifyContent: 'center',
                borderColor: paymentMethod === option.id ? colors.primary : colors.border,
                backgroundColor: paymentMethod === option.id ? colors.primary : 'transparent',
              }}
            >
              {paymentMethod === option.id && (
                <Text className="text-white font-bold">✓</Text>
              )}
            </View>
            <Text className="text-lg">{option.icon}</Text>
            <Text
              className={cn(
                'font-semibold',
                paymentMethod === option.id ? 'text-primary' : 'text-foreground'
              )}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {paymentMethod === 'card' && (
        <View className="gap-3 mt-4">
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Card Number</Text>
            <TextInput
              placeholder="1234 5678 9012 3456"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              className="px-4 py-3 rounded-lg border border-border bg-surface text-foreground"
            />
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground mb-2">Expiry</Text>
              <TextInput
                placeholder="MM/YY"
                placeholderTextColor={colors.muted}
                className="px-4 py-3 rounded-lg border border-border bg-surface text-foreground"
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground mb-2">CVV</Text>
              <TextInput
                placeholder="123"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                className="px-4 py-3 rounded-lg border border-border bg-surface text-foreground"
              />
            </View>
          </View>
        </View>
      )}

      <View className="bg-surface rounded-lg p-3 border border-border mt-2">
        <Text className="text-xs text-muted">
          By confirming your booking, you agree to our Terms & Conditions and Privacy Policy.
        </Text>
      </View>
    </View>
  );

  return (
    <ScreenContainer className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        className="flex-1"
      >
        <View className="px-6 py-4 border-b border-border flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-2xl">←</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">Booking</Text>
          <Text className="text-sm text-muted">
            {currentStepIndex + 1}/{steps.length}
          </Text>
        </View>

        <View className="px-6 py-4 gap-2">
          <View className="flex-row gap-1">
            {steps.map((_, idx) => (
              <View
                key={idx}
                className={cn(
                  'flex-1 h-1 rounded-full',
                  idx <= currentStepIndex ? 'bg-primary' : 'bg-border'
                )}
              />
            ))}
          </View>
          <Text className="text-xs text-muted text-center">
            Step {currentStepIndex + 1}: {steps[currentStepIndex].label}
          </Text>
        </View>

        <View className="px-6 py-6 flex-1">
          {!timerExpired && (
            <View style={{ marginBottom: 12 }}>
              <CheckoutTimer
                durationSeconds={600}
                onExpired={() => {
                  setTimerExpired(true);
                  Alert.alert(
                    'Session Expired',
                    'Your room reservation has expired. Please start a new search.',
                    [{ text: 'OK', onPress: () => router.back() }]
                  );
                }}
              />
            </View>
          )}
          {currentStep === 'rooms' && renderRoomSelection()}
          {currentStep === 'guests' && renderGuestDetails()}
          {currentStep === 'addons' && renderAddOns()}
          {currentStep === 'review' && renderReview()}
          {currentStep === 'payment' && renderPayment()}
        </View>

        <View className="px-6 py-6 gap-3 border-t border-border">
          <View className="flex-row gap-3">
            {currentStepIndex > 0 && (
              <TouchableOpacity
                onPress={handlePreviousStep}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
              >
                <Text className="font-semibold text-foreground">Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={
                currentStep === 'payment' ? handleCompleteBooking : handleNextStep
              }
              disabled={timerExpired}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: 'center',
                backgroundColor: currentStep === 'payment' ? colors.success : colors.primary,
                opacity: timerExpired ? 0.5 : 1,
              }}
            >
              <Text className="font-semibold text-white">
                {currentStep === 'payment' ? 'Complete Booking' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>

          {selectedRooms.length > 0 && (
            <View className="bg-primary/10 rounded-lg p-3 items-center">
              <Text className="text-sm text-muted">Total Price</Text>
              <Text className="text-2xl font-bold text-primary">
                NPR {total.toLocaleString()}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
