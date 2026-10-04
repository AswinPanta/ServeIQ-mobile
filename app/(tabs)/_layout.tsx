import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform, StyleSheet, View } from "react-native";
import { SRS, SLATE, BG, TEXT } from '@/lib/constants/figma-tokens';
import { LiquidDropTabBar } from "@/components/LiquidDropTabBar";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: SRS.teal,
        tabBarInactiveTintColor: SLATE[400],
        headerShown: false,
        tabBarStyle: {
          display: 'none', // We render our own liquid drop bar
        },
      }}
      tabBar={(props) => {
        const { state, navigation } = props;
        const tabs = [
          { key: 'index', label: 'Home', icon: 'hotel' },
          { key: 'search', label: 'Search', icon: 'search' },
          { key: 'favorites', label: 'Favorites', icon: 'heart.fill' },
          { key: 'profile', label: 'Profile', icon: 'person.fill' },
        ];

        return (
          <LiquidDropTabBar
            tabs={tabs}
            activeIndex={state.index}
            onTabPress={(i) => {
              // Prevent navigation if tab is already active (avoids reload/remount)
              if (state.index === i) return;
              // Profile is a nested stack: rebuild the tab state so the tab always
              // lands on its hub instead of a stale pushed screen (notifications,
              // bookings, ...) left behind by an earlier visit or the home bell.
              const routes = state.routes.map((r, idx) => ({
                key: r.key,
                name: r.name,
                params: r.params,
                ...(idx === i && r.name === 'profile'
                  ? { state: { index: 0, routes: [{ name: 'index' }] } }
                  : null),
              }));
              navigation.reset({ index: i, routes });
            }}
          />
        );
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home" }}
      />
      <Tabs.Screen
        name="search"
        options={{ title: "Search" }}
      />
      <Tabs.Screen
        name="favorites"
        options={{ title: "Favorites" }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile" }}
      />
      <Tabs.Screen
        name="self-checkin"
        options={{ title: "Check-in", href: null }}
      />
      <Tabs.Screen
        name="dining-reservations"
        options={{ title: "Dining", href: null }}
      />
    </Tabs>
  );
}
