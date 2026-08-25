import { Stack } from "expo-router";
import { SLATE } from '@/lib/constants/figma-tokens';

export default function PlatformLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: SLATE[50] },
      }}
    >
      <Stack.Screen name="feature-flags" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="exports" />
    </Stack>
  );
}
