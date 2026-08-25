import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="about" />
      <Stack.Screen name="bookings" />
      <Stack.Screen name="favorites" />
      <Stack.Screen name="coupons" />
      <Stack.Screen name="reviews" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="security" />
    </Stack>
  );
}
