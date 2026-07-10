import { useSyncExternalStore } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

// Static rendering needs a stable value during SSR/hydration; useSyncExternalStore
// is the React 18+ idiom that avoids setState-in-effect while keeping the
// client and server snapshots in sync.
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const hasHydrated = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return "light";
}
