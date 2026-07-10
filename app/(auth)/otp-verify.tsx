/**
 * OTP Verification Screen
 * Verify OTP sent to email/phone during login or registration
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/context/auth-context';
import { useColors } from '@/hooks/use-colors';
import { cn, safeGoBack } from '@/lib/utils';

export default function OTPVerifyScreen() {
  const colors = useColors();
  const { email = '' } = useLocalSearchParams<{ email: string; mode: string }>();
  const { verifyOTP, resendOTP, isLoading } = useAuth();

  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resendTimer, setResendTimer] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const otpInputRef = useRef<TextInput>(null);

  // Timer for resend OTP
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!otp) {
      newErrors.otp = 'OTP is required';
    } else if (!/^\d{6}$/.test(otp)) {
      newErrors.otp = 'OTP must be 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerifyOTP = async () => {
    if (!validateForm()) return;

    try {
      await verifyOTP(email, otp);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Verification Failed', error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleResendOTP = async () => {
    try {
      setResendLoading(true);
      await resendOTP(email);
      setResendTimer(60);
      setOtp('');
      Alert.alert('Success', 'OTP has been resent to your email');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  const handleOTPChange = (text: string) => {
    // Only allow digits
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 6) {
      setOtp(numericText);
      if (errors.otp) setErrors({ ...errors, otp: '' });
    }
  };

  return (
    <ScreenContainer containerClassName={cn('bg-background')} className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-between px-6 py-8">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-4xl font-bold text-foreground">Verify OTP</Text>
            <Text className="text-base text-muted">
              We&apos;ve sent a 6-digit code to {email}
            </Text>
          </View>

          {/* Form */}
          <View className="gap-6">
            {/* OTP Input */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Enter OTP</Text>
              <View
                className={cn(
                  'flex-row items-center justify-center px-4 py-4 rounded-lg border',
                  errors.otp ? 'border-error bg-error/5' : 'border-border bg-surface'
                )}
              >
                <TextInput
                  ref={otpInputRef}
                  placeholder="000000"
                  placeholderTextColor={colors.muted}
                  value={otp}
                  onChangeText={handleOTPChange}
                  editable={!isLoading}
                  className="flex-1 text-3xl font-bold text-center text-foreground tracking-widest"
                  keyboardType="number-pad"
                  maxLength={6}
                  selectTextOnFocus
                />
              </View>
              {errors.otp && <Text className="text-xs text-error">{errors.otp}</Text>}
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              onPress={handleVerifyOTP}
              disabled={isLoading || otp.length !== 6}
              className={cn(
                'flex-row items-center justify-center px-6 py-4 rounded-lg',
                isLoading || otp.length !== 6 ? 'bg-primary/70' : 'bg-primary'
              )}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-semibold text-white">Verify OTP</Text>
              )}
            </TouchableOpacity>

            {/* Resend OTP Section */}
            <View className="gap-2">
              <Text className="text-sm text-muted text-center">Didn&apos;t receive the code?</Text>
              <TouchableOpacity
                onPress={handleResendOTP}
                disabled={resendTimer > 0 || resendLoading}
                className="flex-row items-center justify-center"
              >
                {resendLoading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Text
                    className={cn(
                      'text-sm font-semibold',
                      resendTimer > 0 ? 'text-muted' : 'text-primary'
                    )}
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View className="flex-row items-center justify-center gap-2">
            <Text className="text-base text-muted">Wrong email?</Text>
            <TouchableOpacity disabled={isLoading} onPress={() => safeGoBack('/(auth)/login')}>
              <Text className="text-base font-semibold text-primary">Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
