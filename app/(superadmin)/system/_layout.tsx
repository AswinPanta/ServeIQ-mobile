import { Stack } from "expo-router";

export default function SystemLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F8FAFC" },
      }}
    >
      <Stack.Screen name="health" />
      <Stack.Screen name="audit-logs" />
      <Stack.Screen name="impersonate" />
    </Stack>
  );
}
