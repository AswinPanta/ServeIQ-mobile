import { Stack } from "expo-router";
import { GRAY } from "@/constants/portal-theme";

export default function CommerceLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: GRAY[50] },
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
