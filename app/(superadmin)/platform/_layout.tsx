import { Stack } from "expo-router";
import { GRAY } from "@/constants/portal-theme";

export default function PlatformLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: GRAY[50] },
      }}
    >
      <Stack.Screen name="feature-flags" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="exports" />
    </Stack>
  );
}
