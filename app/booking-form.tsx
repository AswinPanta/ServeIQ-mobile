/**
 * Booking Form Screen
 * Multi-step booking form for hotel reservation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

export default function BookingFormScreen() {
  const colors = useColors();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Step 1: Guest Details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2: Special Requests
  const [specialRequests, setSpecialRequests] = useState('');
  const [hasSpecialNeeds, setHasSpecialNeeds] = useState(false);

  // Step 3: Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'wallet'>('card');

  // Step 4: Review
  const bookingData = {
    hotel: 'Grand Hotel Kathmandu',
    room: 'Deluxe Room',
    checkIn: '2024-02-15',
    checkOut: '2024-02-18',
    nights: 3,
    guests: 2,
    totalPrice: 26400,
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!firstName || !lastName || !email || !phone) {
        Alert.alert('Missing Information', 'Please fill in all guest details');
        return;
      }
    }
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConfirmBooking = () => {
    Alert.alert('Booking Confirmed', 'Your booking has been confirmed!');
  };

  const renderStepIndicator = () => (
    <View className="px-6 py-4 gap-4">
      <View className="flex-row items-center justify-between">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View key={index} className="flex-1 items-center">
            <View
              className={cn(
                'w-10 h-10 rounded-full items-center justify-center mb-2',
                index + 1 <= currentStep ? 'bg-primary' : 'bg-surface border border-border'
              )}
            >
              <Text
                className={cn(
                  'font-bold',
                  index + 1 <= currentStep ? 'text-white' : 'text-muted'
                )}
              >
                {index + 1}
              </Text>
            </View>
            <Text className="text-xs text-muted text-center">
              {['Guest', 'Requests', 'Payment', 'Review'][index]}
            </Text>
          </View>
        ))}
      </View>
      {/* Progress Bar */}
      <View className="h-1 bg-surface rounded-full overflow-hidden">
        <View
          className="h-full bg-primary"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </View>
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View className="gap-4">
            <Text className="text-lg font-bold text-foreground">Guest Details</Text>
            <View className="gap-3">
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">First Name</Text>
                <TextInput
                  placeholder="Enter first name"
                  placeholderTextColor={colors.muted}
                  value={firstName}
                  onChangeText={setFirstName}
                  className="px-4 py-3 rounded-lg border border-border bg-surface text-foreground"
                />
              </View>
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Last Name</Text>
                <TextInput
                  placeholder="Enter last name"
                  placeholderTextColor={colors.muted}
                  value={lastName}
                  onChangeText={setLastName}
                  className="px-4 py-3 rounded-lg border border-border bg-surface text-foreground"
                />
              </View>
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Email</Text>
                <TextInput
                  placeholder="Enter email address"
                  placeholderTextColor={colors.muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  className="px-4 py-3 rounded-lg border border-border bg-surface text-foreground"
                />
              </View>
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Phone</Text>
                <TextInput
                  placeholder="Enter phone number"
                  placeholderTextColor={colors.muted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  className="px-4 py-3 rounded-lg border border-border bg-surface text-foreground"
                />
              </View>
            </View>
          </View>
        );

      case 2:
        return (
          <View className="gap-4">
            <Text className="text-lg font-bold text-foreground">Special Requests</Text>
            <View className="gap-3">
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  Any Special Requests?
                </Text>
                <TextInput
                  placeholder="E.g., High floor, late check-in, etc."
                  placeholderTextColor={colors.muted}
                  value={specialRequests}
                  onChangeText={setSpecialRequests}
                  multiline
                  numberOfLines={4}
                  className="px-4 py-3 rounded-lg border border-border bg-surface text-foreground"
                />
              </View>
              <TouchableOpacity
                onPress={() => setHasSpecialNeeds(!hasSpecialNeeds)}
                className="flex-row items-center gap-3 p-3 rounded-lg border border-border"
              >
                <View
                  className={cn(
                    'w-6 h-6 rounded border-2',
                    hasSpecialNeeds ? 'bg-primary border-primary' : 'border-border'
                  )}
                >
                  {hasSpecialNeeds && <Text className="text-white text-center">✓</Text>}
                </View>
                <Text className="text-sm text-foreground">I have special accessibility needs</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 3:
        return (
          <View className="gap-4">
            <Text className="text-lg font-bold text-foreground">Payment Method</Text>
            <View className="gap-3">
              {[
                { id: 'card', label: '💳 Credit/Debit Card' },
                { id: 'bank', label: '🏦 Bank Transfer' },
                { id: 'wallet', label: '💰 Digital Wallet' },
              ].map((method) => (
                <TouchableOpacity
                  key={method.id}
                  onPress={() => setPaymentMethod(method.id as any)}
                  className={cn(
                    'p-4 rounded-lg border-2 flex-row items-center gap-3',
                    paymentMethod === method.id
                      ? 'bg-primary/10 border-primary'
                      : 'border-border bg-surface'
                  )}
                >
                  <View
                    className={cn(
                      'w-6 h-6 rounded-full border-2',
                      paymentMethod === method.id
                        ? 'bg-primary border-primary'
                        : 'border-border'
                    )}
                  />
                  <Text className="text-base font-semibold text-foreground">{method.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 4:
        return (
          <View className="gap-4">
            <Text className="text-lg font-bold text-foreground">Review Booking</Text>
            <Card variant="default" padding="md" className="gap-3">
              <View className="gap-2">
                <Text className="text-sm text-muted">Hotel</Text>
                <Text className="text-base font-semibold text-foreground">
                  {bookingData.hotel}
                </Text>
              </View>
              <View className="h-px bg-border" />
              <View className="gap-2">
                <Text className="text-sm text-muted">Room Type</Text>
                <Text className="text-base font-semibold text-foreground">{bookingData.room}</Text>
              </View>
              <View className="h-px bg-border" />
              <View className="flex-row gap-4">
                <View className="flex-1 gap-2">
                  <Text className="text-sm text-muted">Check-in</Text>
                  <Text className="text-base font-semibold text-foreground">
                    {bookingData.checkIn}
                  </Text>
                </View>
                <View className="flex-1 gap-2">
                  <Text className="text-sm text-muted">Check-out</Text>
                  <Text className="text-base font-semibold text-foreground">
                    {bookingData.checkOut}
                  </Text>
                </View>
              </View>
              <View className="h-px bg-border" />
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-bold text-foreground">Total Price</Text>
                <Text className="text-lg font-bold text-primary">NPR {bookingData.totalPrice}</Text>
              </View>
            </Card>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ScreenContainer className="flex-1" containerClassName="bg-background">
      {renderStepIndicator()}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        className="px-6 py-6"
      >
        {renderStep()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View className="px-6 py-6 gap-3 border-t border-border">
        <View className="flex-row gap-3">
          {currentStep > 1 && (
            <Button
              onPress={handlePreviousStep}
              variant="secondary"
              size="lg"
              className="flex-1"
            >
              Back
            </Button>
          )}
          {currentStep < totalSteps && (
            <Button
              onPress={handleNextStep}
              variant="primary"
              size="lg"
              className={currentStep === 1 ? 'flex-1' : 'flex-1'}
            >
              Next
            </Button>
          )}
          {currentStep === totalSteps && (
            <Button
              onPress={handleConfirmBooking}
              variant="primary"
              size="lg"
              fullWidth
            >
              Confirm Booking
            </Button>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}
