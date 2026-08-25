import { Stack } from "expo-router";
import { SLATE } from '@/lib/constants/figma-tokens';

export default function TenantsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: SLATE[50] },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
