import { Stack } from "expo-router";
import { useColors } from "@/hooks/use-colors";

export default function POSLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="table/[id]" />
      <Stack.Screen name="checkout" />
    </Stack>
  );
}
