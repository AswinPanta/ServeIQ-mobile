import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { markEnd, markStart } from "@/lib/utils/perf";

interface PushNotificationState {
  expoPushToken: string | null;
  notification: unknown | null;
  error: string | null;
  loading: boolean;
}

type EventSubscription = { remove: () => void };

const isExpoGoAndroid =
  Constants.appOwnership === "expo" && Platform.OS === "android";

async function getExpoModules() {
  if (isExpoGoAndroid) return null;
  try {
    const Notifications = await import("expo-notifications");
    const Device = await import("expo-device");
    if (!Notifications.setNotificationHandler || typeof Device.isDevice === "undefined") {
      return null;
    }
    return { Notifications, Device };
  } catch {
    return null;
  }
}

export function usePushNotifications() {
  const router = useRouter();
  const [state, setState] = useState<PushNotificationState>({
    expoPushToken: null,
    notification: null,
    error: null,
    loading: true,
  });
  const notificationListener = useRef<EventSubscription | null>(null);
  const responseListener = useRef<EventSubscription | null>(null);

  useEffect(() => {
    let mounted = true;
    markStart('push: setup');

    (async () => {
      const modules = await getExpoModules();
      if (!modules) {
        markEnd('push: setup (no modules)');
        if (mounted) setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      const { Notifications, Device } = modules;

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      if (!Device.isDevice) {
        if (mounted) setState((prev) => ({ ...prev, loading: false, error: "Push notifications require a physical device" }));
        return;
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#16233A",
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: { allowAlert: true, allowBadge: true, allowSound: true },
        });
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        markEnd('push: setup (permission denied)');        if (mounted) setState((prev) => ({ ...prev, loading: false, error: "Push notification permission not granted" }));
        return;
      }

      try {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
        });

        markEnd('push: setup (token obtained)');
        if (mounted) {
          setState((prev) => ({ ...prev, expoPushToken: token.data, loading: false, error: null }));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error getting push token";
        if (mounted) setState((prev) => ({ ...prev, loading: false, error: message }));
      }

      notificationListener.current = Notifications.addNotificationReceivedListener((notification: unknown) => {
        if (mounted) setState((prev) => ({ ...prev, notification }));
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
        const data = response?.notification?.request?.content?.data;
        if (data?.screen) {
          router.push(data.screen as any);
        } else if (data?.bookingId) {
          router.push(`/booking-flow?id=${data.bookingId}` as any);
        } else {
          router.push("/notifications" as any);
        }
      });
    })();

    return () => {
      mounted = false;
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return state;
}
