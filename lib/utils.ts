import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Combines class names using clsx and tailwind-merge.
 * This ensures Tailwind classes are properly merged without conflicts.
 *
 * Usage:
 * ```tsx
 * cn("px-4 py-2", isActive && "bg-primary", className)
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely navigates back if there's a screen in the history stack.
 * Falls back to replacing to a default route (or the provided fallback) if not.
 * Prevents the "GO_BACK was not handled by any navigator" error.
 *
 * Usage:
 * ```tsx
 * safeGoBack()              // falls back to '/'
 * safeGoBack('/(tabs)')     // falls back to tabs
 * ```
 */
export function safeGoBack(fallbackRoute?: string) {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace((fallbackRoute || '/') as any);
  }
}

/** ─── Guest Booking → Front Desk Bridge ────────────────────────────────────
 *
 * When a guest books via the guest portal, the booking is stored in the
 * guest-focused BookingContext. This bridge stores a front-desk-compatible
 * copy in AsyncStorage so the FrontDeskProvider can pick it up and show it
 * as an arriving guest.
 *
 * The key format: @serveiq_ops_bridge_bookings_{propertyId}
 * FrontDeskProvider checks for pending bridged bookings on mount and
 * loads them as arrivals.
 */

const BRIDGE_PREFIX = '@serveiq_ops_bridge_';
const BRIDGE_BOOKINGS_KEY = (propertyId: string) => `${BRIDGE_PREFIX}bookings_${propertyId}`;

export interface BridgedBooking {
  guest_name: string;
  email: string;
  phone: string;
  room_type: 'Standard' | 'Deluxe' | 'Suite';
  checkin: string;
  checkout: string;
  adults: number;
  children: number;
  special_requests?: string;
}

/**
 * Store a guest booking for the front desk to pick up.
 * Called from the guest booking flow after confirmation.
 */
export async function bridgeGuestBookingToFrontDesk(
  propertyId: string,
  booking: BridgedBooking
): Promise<void> {
  try {
    const key = BRIDGE_BOOKINGS_KEY(propertyId);
    const raw = await AsyncStorage.getItem(key);
    const existing: BridgedBooking[] = raw ? JSON.parse(raw) : [];
    existing.push(booking);
    await AsyncStorage.setItem(key, JSON.stringify(existing));
  } catch {
    // Best-effort bridge — guest booking still works in guest context
  }
}

/**
 * Load and clear pending bridged guest bookings for a property.
 * Called from FrontDeskProvider on mount to pick up new arrivals.
 */
export async function loadBridgedGuestBookings(
  propertyId: string
): Promise<BridgedBooking[]> {
  try {
    const key = BRIDGE_BOOKINGS_KEY(propertyId);
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const bookings: BridgedBooking[] = JSON.parse(raw);
      // Clear after loading to avoid duplicate imports
      await AsyncStorage.removeItem(key);
      return bookings;
    }
  } catch {
    // Silently fall back
  }
  return [];
}

/**
 * Default property ID used for guest bookings when no property is specified.
 * Maps to the first/largest mock property (Grand Himalaya Resort).
 */
export const DEFAULT_BRIDGE_PROPERTY_ID = 'prop-1';
