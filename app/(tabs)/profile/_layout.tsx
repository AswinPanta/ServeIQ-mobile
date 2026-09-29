import { Stack } from 'expo-router';
import { AuthGuard } from '@/components/common/AuthGuard';

export default function ProfileLayout() {
  return (
    <AuthGuard portal="guest">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="about" />
        <Stack.Screen name="bookings" />
        <Stack.Screen name="favorites" />
        <Stack.Screen name="coupons" />
        <Stack.Screen name="reviews" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="security" />
      </Stack>
    </AuthGuard>
  );
}
