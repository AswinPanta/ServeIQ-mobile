/**
 * Auth Stack Layout
 * Navigation for authentication screens
 */

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen
        name="register"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="otp-verify"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="splash"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="account-created"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="create-new-password"
        options={{
          presentation: 'card',
        }}
      />
    </Stack>
  );
}
