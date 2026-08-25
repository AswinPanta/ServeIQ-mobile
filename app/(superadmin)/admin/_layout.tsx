import { Stack } from "expo-router";
import { SLATE } from '@/lib/constants/figma-tokens';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: SLATE[50] },
      }}
    >
      <Stack.Screen name="roles" />
      <Stack.Screen name="edit-role" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
