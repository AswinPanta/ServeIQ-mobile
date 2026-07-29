import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F8FAFC" },
      }}
    >
      <Stack.Screen name="roles" />
      <Stack.Screen name="edit-role" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
