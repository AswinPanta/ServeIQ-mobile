import { Stack } from "expo-router";

export default function PlatformLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F8FAFC" },
      }}
    >
      <Stack.Screen name="feature-flags" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="exports" />
    </Stack>
  );
}
