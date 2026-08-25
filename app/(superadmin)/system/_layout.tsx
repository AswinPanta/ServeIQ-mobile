import { Stack } from "expo-router";
import { SLATE } from '@/lib/constants/figma-tokens';

export default function SystemLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: SLATE[50] },
      }}
    >
      <Stack.Screen name="health" />
      <Stack.Screen name="audit-logs" />
      <Stack.Screen name="impersonate" />
    </Stack>
  );
}
