import { Stack } from "expo-router";
import { GRAY } from "@/constants/portal-theme";

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: GRAY[50] },
      }}
    >
      <Stack.Screen name="roles" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
