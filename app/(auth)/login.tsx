/**
 * Login Screen
 * Email/phone login with OTP verification option
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/context/auth-context';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

export default function LoginScreen() {
  const colors = useColors();
  const { login, demoLogin, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'An error occurred');
    }
  };

  return (
    <ScreenContainer containerClassName={cn('bg-background')} className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-between px-6 py-8">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-4xl font-bold text-foreground">Welcome Back</Text>
            <Text className="text-base text-muted">Sign in to your account to continue</Text>
          </View>

          {/* Form */}
          <View className="gap-6">
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

            {/* Forgot Password Link */}
            <TouchableOpacity disabled={isLoading} onPress={() => Alert.alert('Feature Coming Soon', 'Password reset will be available soon')}>
              <Text className="text-sm font-semibold text-primary">Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 24,
                paddingVertical: 16,
                borderRadius: 8,
                backgroundColor: isLoading ? `${colors.primary}70` : colors.primary,
              }}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-semibold text-white">Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Demo Login Button */}
            <TouchableOpacity
              onPress={demoLogin}
              disabled={isLoading}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 24,
                paddingVertical: 16,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.primary,
                backgroundColor: 'transparent',
              }}
              activeOpacity={0.8}
            >
              <Text className="text-base font-semibold text-primary">Continue as Demo User</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="flex-row items-center justify-center gap-2">
            <Text className="text-base text-muted">Don't have an account?</Text>
            <TouchableOpacity disabled={isLoading} onPress={() => router.push('/(auth)/register')}>
              <Text className="text-base font-semibold text-primary">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
