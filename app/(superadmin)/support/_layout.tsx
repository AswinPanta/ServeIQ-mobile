import { Stack } from "expo-router";
import { SLATE } from '@/lib/constants/figma-tokens';

export default function SupportLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: SLATE[50] },
      }}
    >
      <Stack.Screen name="tickets" />
      <Stack.Screen name="announcements" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
