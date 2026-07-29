import "@/global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform, ActivityIndicator, View } from "react-native";
import { ThemeProvider } from "@/lib/theme-provider";

import { useFonts } from "expo-font";
import {
  RussoOne_400Regular,
} from "@expo-google-fonts/russo-one";
import {
  InknutAntiqua_400Regular,
} from "@expo-google-fonts/inknut-antiqua";
import {
  Itim_400Regular,
} from "@expo-google-fonts/itim";
import {
  AbhayaLibre_500Medium,
} from "@expo-google-fonts/abhaya-libre";
import {
  Calistoga_400Regular,
} from "@expo-google-fonts/calistoga";
import {
  Sora_700Bold,
} from "@expo-google-fonts/sora";
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Rect } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "@/lib/context/auth-context";
import { FavoritesProvider } from "@/lib/context/favorites-context";
import { ToastProvider } from "@/components/ui/toast";
import { NotificationProvider, useNotifications } from "@/lib/context/notification-context";
import { BookingProvider } from "@/lib/context/booking-context";
import { CouponProvider } from "@/lib/context/coupon-context";
import { PreferencesProvider } from "@/lib/context/preferences-context";
import { SearchProvider } from "@/lib/context/search-context";
import { CRMProvider } from "@/lib/context/crm-context";
import { AnalyticsProvider } from "@/lib/context/analytics-context";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useColors } from "@/hooks/use-colors";
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

// Suppress the InteractionManager deprecation warning from React Native dependencies
// (react-native-gesture-handler, react-native-screens, etc. use it internally)
const _origWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('InteractionManager has been deprecated')) return;
  _origWarn.apply(console, args);
};

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

function PushNotificationInit() {
  const { expoPushToken } = usePushNotifications();
  const { registerPushToken } = useNotifications();

  useEffect(() => {
    if (expoPushToken) {
      registerPushToken(expoPushToken);
    }
  }, [expoPushToken, registerPushToken]);

  return null;
}

/**
 * Root Navigation Component
 * Routes between auth and app screens based on authentication state
 */
function RootNavigator() {
  const { isLoading } = useAuth();
  const colors = useColors();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(host)" />
      <Stack.Screen name="(operations)" />
      <Stack.Screen name="(superadmin)" />
      <Stack.Screen name="search-results" options={{ presentation: "modal" }} />
      <Stack.Screen name="booking-flow" options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="booking-summary" options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="booking-confirmation" options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="guest-search-results" />
      <Stack.Screen name="room-select" />
      <Stack.Screen name="rate-breakdown" options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="destinations" />
      <Stack.Screen name="country/[code]" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="profile-edit" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="promotions" />
      <Stack.Screen name="post-stay-review" />
      <Stack.Screen name="restaurant-menu" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    RussoOne_400Regular,
    InknutAntiqua_400Regular,
    Itim_400Regular,
    AbhayaLibre_500Medium,
    Calistoga_400Regular,
    Sora_700Bold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Ensure minimum 8px padding for top and bottom on mobile
  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <ToastProvider>
          <FavoritesProvider>
            <NotificationProvider>
              <BookingProvider>
                <CouponProvider>
                  <PreferencesProvider>
                    <SearchProvider>
                      <CRMProvider>
                        <AnalyticsProvider>
                          <RootNavigator />
                        </AnalyticsProvider>
                      </CRMProvider>
                    </SearchProvider>
                  </PreferencesProvider>
                  <PushNotificationInit />
                  <StatusBar style="auto" />
                </CouponProvider>
              </BookingProvider>
            </NotificationProvider>
          </FavoritesProvider>
        </ToastProvider>
      </AuthProvider>
      </I18nextProvider>
    </GestureHandlerRootView>
  );

  if (!fontsLoaded) {
    return (
      <ThemeProvider>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
          <ActivityIndicator size="large" color="#1A3C5E" />
        </View>
      </ThemeProvider>
    );
  }

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              {content}
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
    </ThemeProvider>
  );
}
