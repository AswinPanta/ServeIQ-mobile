import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/context/auth-context';
import { useColors } from '@/hooks/use-colors';

const ACCENT = '#0D9488';

export default function OperationsLoginScreen() {
  const colors = useColors();
  const { login, demoLogin, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Min 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    try {
      await login(email, password, 'operations');
      router.replace('/(operations)');
    } catch (error) {
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleDemoLogin = async () => {
    await demoLogin('operations');
    router.replace('/(operations)');
  };

  return (
    <ScreenContainer containerClassName="bg-background" className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-between px-6 py-8">
          <View style={{ alignItems: 'center', marginTop: 40, marginBottom: 32 }}>
            <Image
              source={require('@/assets/images/logo1.png')}
              style={{ width: 80, height: 80, marginBottom: 16 }}
              resizeMode="contain"
            />
            <Text className="text-3xl font-bold text-foreground">Operations Login</Text>
            <Text className="text-base text-muted mt-2 text-center">Access hotel operations dashboard</Text>
          </View>

          <View className="gap-5">
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Email</Text>
              <View className={`flex-row items-center px-4 py-3 rounded-2xl border ${errors.email ? 'border-error bg-error/5' : 'border-border bg-surface'}`}>
                <TextInput
                  placeholder="your@email.com"
                  placeholderTextColor={colors.muted}
                  value={email}
                  onChangeText={(t) => { setEmail(t); if (errors.email) setErrors({ ...errors, email: '' }); }}
                  editable={!isLoading}
                  className="flex-1 text-base text-foreground"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {errors.email && <Text className="text-xs text-error ml-1">{errors.email}</Text>}
            </View>

            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Password</Text>
              <View className={`flex-row items-center px-4 py-3 rounded-2xl border ${errors.password ? 'border-error bg-error/5' : 'border-border bg-surface'}`}>
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={(t) => { setPassword(t); if (errors.password) setErrors({ ...errors, password: '' }); }}
                  editable={!isLoading}
                  secureTextEntry={!showPassword}
                  className="flex-1 text-base text-foreground"
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={isLoading}>
                  <Text className="text-sm font-semibold" style={{ color: ACCENT }}>{showPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password && <Text className="text-xs text-error ml-1">{errors.password}</Text>}
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              style={{
                paddingVertical: 16, borderRadius: 16, alignItems: 'center',
                backgroundColor: isLoading ? ACCENT + '70' : ACCENT,
                shadowColor: ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
              }}
              activeOpacity={0.85}
            >
              {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-base font-semibold text-white">Sign In</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDemoLogin}
              disabled={isLoading}
              style={{ paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, borderColor: ACCENT + '40', alignItems: 'center' }}
              activeOpacity={0.85}
            >
              <Text className="text-base font-semibold" style={{ color: ACCENT }}>Continue as Demo Operator</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
