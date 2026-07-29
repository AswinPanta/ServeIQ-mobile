/**
 * Ops Persistence — P0 write-through layer
 *
 * Stops silent data loss when the app is backgrounded/killed.
 * Each mutation writes through to AsyncStorage so state survives
 * app lifecycle events. Falls back to provided default on load failure.
 *
 * This is NOT a full offline/sync layer — it's the minimum viable
 * durability fix. SQLite + sync_queue is P1 once backend routers exist.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@stayeasy_ops_';

/** Keys for each persistable ops dataset */
export const OPS_STORAGE_KEYS = {
  rooms: (propertyId: string) => `${PREFIX}rooms_${propertyId}`,
  bookings: (propertyId: string) => `${PREFIX}bookings_${propertyId}`,
  hkTasks: `${PREFIX}hk_tasks`,
  sections: `${PREFIX}pos_sections`,
  cart: `${PREFIX}pos_cart`,
  tickets: `${PREFIX}pos_tickets`,
  completedOrders: `${PREFIX}pos_completed_orders`,
} as const;

/**
 * Load a persisted ops dataset. Returns `fallback` if nothing saved
 * or if parsing fails (corrupted data, first run, etc.).
 */
export async function loadOpsState<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as T;
      // Basic sanity check: must be an object/array, not null
      if (parsed !== null && parsed !== undefined) return parsed;
    }
  } catch {
    // Corrupted JSON or AsyncStorage error — fall back silently
  }
  return fallback;
}

/**
 * Persist an ops dataset to AsyncStorage. Fire-and-forget —
 * errors are swallowed because persistence is best-effort;
 * the in-memory state is always authoritative for the current session.
 */
export function persistOpsState<T>(key: string, data: T): void {
  AsyncStorage.setItem(key, JSON.stringify(data)).catch(() => {});
}

/**
 * Remove a persisted ops dataset (used when property is deleted,
 * or when we need to reset to fresh mock data).
 */
export function clearOpsState(key: string): void {
  AsyncStorage.removeItem(key).catch(() => {});
}
