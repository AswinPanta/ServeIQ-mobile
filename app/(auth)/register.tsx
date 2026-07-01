/**
 * Register Screen
 * New user registration form with email, phone, name, and password
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/context/auth-context';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

export default function RegisterScreen() {
  const colors = useColors();
  const { register, isLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      await register(email, phone, name, password);
      // Navigate to OTP verification screen
      router.push({
        pathname: '/(auth)/otp-verify',
        params: { email, mode: 'register' },
      });
    } catch (error) {
      Alert.alert('Registration Failed', error instanceof Error ? error.message : 'An error occurred');
    }
  };

  return (
    <ScreenContainer containerClassName={cn('bg-background')} className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-between px-6 py-8">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-4xl font-bold text-foreground">Create Account</Text>
            <Text className="text-base text-muted">Join us to start booking your stay</Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            {/* Name Input */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Full Name</Text>
              <View
                className={cn(
                  'flex-row items-center px-4 py-3 rounded-lg border',
                  errors.name ? 'border-error bg-error/5' : 'border-border bg-surface'
                )}
              >
                <TextInput
                  placeholder="John Doe"
                  placeholderTextColor={colors.muted}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  editable={!isLoading}
                  className="flex-1 text-base text-foreground"
                />
              </View>
              {errors.name && <Text className="text-xs text-error">{errors.name}</Text>}
            </View>

            {/* Email Input */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Email Address</Text>
              <View
                className={cn(
                  'flex-row items-center px-4 py-3 rounded-lg border',
                  errors.email ? 'border-error bg-error/5' : 'border-border bg-surface'
                )}
              >
                <TextInput
                  placeholder="your@email.com"
                  placeholderTextColor={colors.muted}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  editable={!isLoading}
                  className="flex-1 text-base text-foreground"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {errors.email && <Text className="text-xs text-error">{errors.email}</Text>}
            </View>

            {/* Phone Input */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Phone Number</Text>
              <View
                className={cn(
                  'flex-row items-center px-4 py-3 rounded-lg border',
                  errors.phone ? 'border-error bg-error/5' : 'border-border bg-surface'
                )}
              >
                <TextInput
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor={colors.muted}
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    if (errors.phone) setErrors({ ...errors, phone: '' });
                  }}
                  editable={!isLoading}
                  className="flex-1 text-base text-foreground"
                  keyboardType="phone-pad"
                />
              </View>
              {errors.phone && <Text className="text-xs text-error">{errors.phone}</Text>}
            </View>

            {/* Password Input */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Password</Text>
              <View
                className={cn(
                  'flex-row items-center px-4 py-3 rounded-lg border',
                  errors.password ? 'border-error bg-error/5' : 'border-border bg-surface'
                )}
              >
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  editable={!isLoading}
                  secureTextEntry={!showPassword}
                  className="flex-1 text-base text-foreground"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  style={{ marginLeft: 8 }}
                >
                  <Text className="text-sm font-semibold text-primary">{showPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password && <Text className="text-xs text-error">{errors.password}</Text>}
            </View>

            {/* Confirm Password Input */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Confirm Password</Text>
              <View
                className={cn(
                  'flex-row items-center px-4 py-3 rounded-lg border',
                  errors.confirmPassword ? 'border-error bg-error/5' : 'border-border bg-surface'
                )}
              >
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor={colors.muted}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                  }}
                  editable={!isLoading}
                  secureTextEntry={!showConfirmPassword}
                  className="flex-1 text-base text-foreground"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                  style={{ marginLeft: 8 }}
                >
                  <Text className="text-sm font-semibold text-primary">
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && <Text className="text-xs text-error">{errors.confirmPassword}</Text>}
            </View>

            {/* Terms Checkbox */}
            <TouchableOpacity
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              disabled={isLoading}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: agreedToTerms ? colors.primary : 'transparent',
                  borderColor: agreedToTerms ? colors.primary : colors.border,
                }}
              >
                {agreedToTerms && <Text className="text-white font-bold text-xs">✓</Text>}
              </View>
              <Text className="text-sm text-muted flex-1">
                I agree to the{' '}
                <Text className="text-primary font-semibold">Terms and Conditions</Text>
              </Text>
            </TouchableOpacity>
            {errors.terms && <Text className="text-xs text-error">{errors.terms}</Text>}

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 24,
                paddingVertical: 16,
                borderRadius: 8,
                marginTop: 8,
                backgroundColor: isLoading ? `${colors.primary}70` : colors.primary,
              }}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-semibold text-white">Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="flex-row items-center justify-center gap-2">
            <Text className="text-base text-muted">Already have an account?</Text>
            <TouchableOpacity disabled={isLoading} onPress={() => router.back()}>
              <Text className="text-base font-semibold text-primary">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
