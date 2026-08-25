import { Stack } from "expo-router";
import { SLATE } from '@/lib/constants/figma-tokens';

export default function CommerceLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: SLATE[50] },
      }}
    >
      <Stack.Screen name="subscriptions" />
      <Stack.Screen name="billing" />
      <Stack.Screen name="tenant-setup" />
      <Stack.Screen name="payment-gateway" />
      <Stack.Screen name="payment-config" />
      <Stack.Screen name="plans" />
    </Stack>
  );
}
